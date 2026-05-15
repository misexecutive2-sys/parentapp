import React, { useState, useCallback ,useEffect} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams, useFocusEffect  } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";



const BASE_URL = "https://connect.schoolaid.in";
const PRIMARY = "#0047AB";

interface ThreadItem {
  id: number;
  preview: string;
  createdAt: string;
  unreadCount?: number;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const getInitials = (name: string) => {
  const parts = (name ?? "").trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (name ?? "U").substring(0, 2).toUpperCase();
};

export default function ThreadListScreen() {
  const router = useRouter();
  const { childId, childName, classname, sectionname } = useLocalSearchParams<{
    childId: string;
    childName: string;
    classname: string;
    sectionname: string;
  }>();

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState("");

  // ── Fetch threads ──────────────────────────────────────────
const fetchThreads = useCallback(async (t: string): Promise<ThreadItem[]> => {
  try {
    const yearId = (await AsyncStorage.getItem("selectedYearId")) ?? "16";
    let serverThreads: ThreadItem[] = [];

    try {
      const res = await fetch(
        `${BASE_URL}/api/parent-notes/threads?student_id=${childId}`,
        {
          headers: {
            Authorization: `Bearer ${t}`,
            "Content-Type": "application/json",
            "x-academic-year-id": yearId,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        const list: any[] = data.data ?? data ?? [];

        // For each thread fetch its messages to get latest message + unread count
        const threadsWithDetails = await Promise.all(
          list.map(async (th: any) => {
            const threadId = Number(th.id ?? th.thread_id);
            try {
              const msgRes = await fetch(
                `${BASE_URL}/api/parent-notes/threads/${threadId}/messages`,
                {
                  headers: {
                    Authorization: `Bearer ${t}`,
                    "Content-Type": "application/json",
                    "x-academic-year-id": yearId,
                  },
                },
              );
              if (msgRes.ok) {
                const msgData = await msgRes.json();
                const msgs: any[] = msgData.data ?? msgData ?? [];

                // Sort messages by date
                msgs.sort(
                  (a, b) =>
                    new Date(a.created_at ?? a.createdAt).getTime() -
                    new Date(b.created_at ?? b.createdAt).getTime(),
                );

                const lastMsg = msgs[msgs.length - 1];

                // Count unread — messages from teacher that are not read
                const unreadCount = msgs.filter(
                  (m) => m.sender_type === "teacher" && !m.is_read,
                ).length;

                // Build preview text
                let preview = "Tap to view conversation";
                if (lastMsg) {
                  if (lastMsg.message || lastMsg.text) {
                    try {
                      preview = decodeURIComponent(
                        lastMsg.message ?? lastMsg.text ?? "",
                      );
                    } catch {
                      preview = lastMsg.message ?? lastMsg.text ?? "";
                    }
                  } else if (lastMsg.attachment_url) {
                    const ext =
                      lastMsg.attachment_name
                        ?.split(".")
                        .pop()
                        ?.toLowerCase() ?? "";
                    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
                      preview = "📷 Photo";
                    else if (ext === "mp4" || lastMsg.attachment_name?.includes("video_"))
                      preview = "🎥 Video";
                    else if (ext === "m4a" || lastMsg.attachment_name?.includes("voice_"))
                      preview = "🎙️ Voice note";
                    else preview = "📎 File";
                  }
                }

                return {
                  id: threadId,
                  preview,
                  // Use last message date for sorting (WhatsApp style)
                  createdAt: lastMsg
                    ? (lastMsg.created_at ?? lastMsg.createdAt ?? th.created_at ?? new Date().toISOString())
                    : (th.created_at ?? th.createdAt ?? new Date().toISOString()),
                  unreadCount,
                };
              }
            } catch {}

            // Fallback if message fetch fails
            return {
              id: threadId,
              preview: th.last_message ?? th.preview ?? "Tap to view conversation",
              createdAt: th.created_at ?? th.createdAt ?? new Date().toISOString(),
              unreadCount: th.unread_count ?? 0,
            };
          }),
        );

        serverThreads = threadsWithDetails;
      }
    } catch {}

    // Merge with local cache
    const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
    const localIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
    const serverIds = serverThreads.map((th) => th.id);
    const missingIds = localIds.filter((id) => !serverIds.includes(id));
    const previewsRaw = await AsyncStorage.getItem(`threadPreviews_${childId}`);
    const savedPreviews: Record<number, { preview: string; createdAt: string }> =
      previewsRaw ? JSON.parse(previewsRaw) : {};
    const missingThreads: ThreadItem[] = missingIds.map((id) => ({
      id,
      preview: savedPreviews[id]?.preview ?? "Tap to view conversation",
      createdAt: savedPreviews[id]?.createdAt ?? new Date().toISOString(),
    }));

    const allThreads = [...serverThreads, ...missingThreads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    await AsyncStorage.setItem(
      `allThreadIds_${childId}`,
      JSON.stringify(allThreads.map((th) => th.id)),
    );

    setThreads(allThreads);
    return allThreads;
  } catch {
    return [];
  }
}, [childId]);

  // ── Init ───────────────────────────────────────────────────
// Auto-poll every 10 seconds for new messages (WhatsApp style)

useEffect(() => {
  if (!token) return;
  const interval = setInterval(async () => {
    await fetchThreads(token);
  }, 10000);
  return () => clearInterval(interval);
}, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchThreads(token);
    setRefreshing(false);
  };

const openThread = (threadId: number) => {
  router.push({
    pathname: "/Dashboard/message/[threadId]",
    params: {
      threadId: String(threadId),
      childId,
      childName,
      classname,
      sectionname,
    },
  });
};

const startNewChat = () => {
  router.push({
    pathname: "/Dashboard/message/[threadId]",
    params: {
      threadId: "new",
      childId,
      childName,
      classname,
      sectionname,
    },
  });
};

  // ── Render thread row ──────────────────────────────────────
  // const renderThread = ({ item, index }: { item: ThreadItem; index: number }) => (
  //   <TouchableOpacity
  //     style={styles.threadRow}
  //     onPress={() => openThread(item.id)}
  //     activeOpacity={0.75}
  //   >
  //     {/* Avatar */}
  //     <View style={styles.avatar}>
  //       <Ionicons name="chatbubble-ellipses" size={22} color={PRIMARY} />
  //     </View>

  //     {/* Content */}
  //     <View style={{ flex: 1, minWidth: 0 }}>
  //       <View style={styles.threadTop}>
  //         <Text style={styles.threadTitle}>
  //           Conversation {threads.length - index}
  //         </Text>
  //         <Text style={styles.threadDate}>{formatDate(item.createdAt)}</Text>
  //       </View>
  //       <View style={styles.threadBottom}>
  //         <Text style={styles.threadPreview} numberOfLines={1}>
  //           {item.preview || "Tap to view conversation"}
  //         </Text>
  //         {!!item.unreadCount && item.unreadCount > 0 && (
  //           <View style={styles.unreadBadge}>
  //             <Text style={styles.unreadText}>{item.unreadCount}</Text>
  //           </View>
  //         )}
  //       </View>
  //     </View>

  //     <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginLeft: 8 }} />
  //   </TouchableOpacity>
  // );

  const renderThread = ({ item, index }: { item: ThreadItem; index: number }) => (
  <TouchableOpacity
    style={styles.threadRow}
    onPress={() => {
      console.log("🔴 TAPPED thread id:", item.id);
      console.log("🔴 childId:", childId);
      console.log("🔴 childName:", childName);
      openThread(item.id);
    }}
    activeOpacity={0.75}
  >
    {/* Avatar */}
    <View style={styles.avatar}>
      <Ionicons name="chatbubble-ellipses" size={22} color={PRIMARY} />
    </View>

    {/* Content */}
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={styles.threadTop}>
        <Text style={styles.threadTitle}>
          Conversation {threads.length - index}
        </Text>
        <Text style={styles.threadDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.threadBottom}>
        <Text style={styles.threadPreview} numberOfLines={1}>
          {item.preview || "Tap to view conversation"}
        </Text>
        {!!item.unreadCount && item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </View>

    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginLeft: 8 }} />
  </TouchableOpacity>
);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{getInitials(childName ?? "")}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{childName}</Text>
            <Text style={styles.headerSub}>
              {classname}{sectionname ? ` · ${sectionname}` : ""}
            </Text>
          </View>
        </View>
        {/* New chat button */}
        <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Conversations label */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Conversations</Text>
        {threads.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{threads.length}</Text>
          </View>
        )}
      </View>

      {/* Thread list */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderThread}
          contentContainerStyle={threads.length === 0 ? { flex: 1 } : { padding: 14, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={48} color={PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>
                Tap the + button to start your first conversation with the teacher
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={startNewChat}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.startBtnText}>Start New Conversation</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating + button (when threads exist) */}
      {threads.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={startNewChat} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F4FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerAvatarText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  headerName: { color: "#fff", fontSize: 15, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 11 },
  newChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionLabelText: { fontSize: 13, fontWeight: "700", color: "#6B7280", flex: 1 },
  countBadge: {
    backgroundColor: "#EEF3FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: { fontSize: 12, fontWeight: "700", color: PRIMARY },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: PRIMARY, fontSize: 14, fontWeight: "600" },
  threadRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8EFFA",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  threadTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  threadTitle: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  threadDate: { fontSize: 11, color: "#9CA3AF" },
  threadBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  threadPreview: { fontSize: 13, color: "#6B7280", flex: 1 },
  unreadBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 12,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  emptySub: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 20,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
    elevation: 3,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});