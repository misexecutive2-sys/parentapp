import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = "https://connect.schoolaid.in";
const PRIMARY = "#0047AB";

interface ThreadItem {
  id: number;
  preview: string;
  createdAt: string;
  unreadCount: number;
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

const isUnread = (msg: any): boolean => {
  if (msg.sender_type !== "teacher") return false;
  const readValue =
    msg.is_read ?? msg.isRead ?? msg.read ?? msg.read_at ?? msg.readAt ?? null;
  if (readValue === null || readValue === undefined) return false;
  if (typeof readValue === "boolean") return !readValue;
  if (typeof readValue === "string") return readValue === "0" || readValue === "false" || readValue === "";
  if (typeof readValue === "number") return readValue === 0;
  return false;
};

const getMsgTimestamp = (msg: any): string =>
  msg.created_at ?? msg.createdAt ?? msg.timestamp ?? new Date(0).toISOString();

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

  const tokenRef = useRef("");
  // Track whether we've done the first load so polls don't show a spinner
  const initialLoadDone = useRef(false);

  // ── Fetch threads ───────────────────────────────────────────
  const fetchThreads = useCallback(async (t: string, showLoader = false) => {
    if (!t) return;
    // Only show the full-screen loader on first load, not on background polls
    if (showLoader) setLoading(true);
    try {
      const yearId = (await AsyncStorage.getItem("selectedYearId")) ?? "16";

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

      if (!res.ok) return;

      const data = await res.json();
      const list: any[] = data.data ?? data ?? [];

      const settled = await Promise.allSettled(
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

            if (!msgRes.ok) throw new Error("msg fetch failed");

            const msgData = await msgRes.json();
            const msgs: any[] = msgData.data ?? msgData ?? [];

            msgs.sort(
              (a, b) =>
                new Date(getMsgTimestamp(a)).getTime() -
                new Date(getMsgTimestamp(b)).getTime(),
            );

            const lastMsg = msgs[msgs.length - 1];
            const unreadCount = msgs.filter(isUnread).length;

            let preview = "Tap to view conversation";
            if (lastMsg) {
              if (lastMsg.message || lastMsg.text || lastMsg.body) {
                const raw = lastMsg.message ?? lastMsg.text ?? lastMsg.body ?? "";
                try {
                  preview = decodeURIComponent(raw);
                } catch {
                  preview = raw;
                }
              } else if (lastMsg.attachment_url) {
                const ext =
                  (lastMsg.attachment_name ?? lastMsg.attachment_url)
                    .split(".")
                    .pop()
                    ?.toLowerCase() ?? "";
                if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) preview = "📷 Photo";
                else if (ext === "mp4" || lastMsg.attachment_name?.includes("video_")) preview = "🎥 Video";
                else if (ext === "m4a" || lastMsg.attachment_name?.includes("voice_")) preview = "🎙️ Voice note";
                else preview = "📎 File";
              }
            }

            // Use last message timestamp so the thread bubbles up when someone replies
            const lastActivityAt = lastMsg
              ? getMsgTimestamp(lastMsg)
              : (th.updated_at ?? th.updatedAt ?? th.created_at ?? th.createdAt ?? new Date().toISOString());

            return {
              id: threadId,
              preview,
              createdAt: lastActivityAt,
              unreadCount,
            } as ThreadItem;
          } catch {
            return {
              id: threadId,
              preview: th.last_message ?? th.preview ?? "Tap to view conversation",
              createdAt: th.updated_at ?? th.updatedAt ?? th.created_at ?? th.createdAt ?? new Date().toISOString(),
              unreadCount: Number(th.unread_count ?? 0),
            } as ThreadItem;
          }
        }),
      );

      const serverThreads: ThreadItem[] = settled
        .filter((r): r is PromiseFulfilledResult<ThreadItem> => r.status === "fulfilled")
        .map((r) => r.value);

      // Sort: most recently active thread first
      serverThreads.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setThreads(serverThreads);

      await AsyncStorage.setItem(
        `allThreadIds_${childId}`,
        JSON.stringify(serverThreads.map((th) => th.id)),
      );
    } catch (err) {
      console.error("fetchThreads error:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [childId]);

  // ── Init on screen focus ────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const init = async () => {
        const t = await AsyncStorage.getItem("token");
        if (!t || cancelled) return;
        tokenRef.current = t;

        if (!initialLoadDone.current) {
          // First ever load — show the spinner
          await fetchThreads(t, true);
          if (!cancelled) initialLoadDone.current = true;
        } else {
          // Coming back from a chat — silently refresh so the updated thread
          // bubbles to the top without showing a loading screen
          fetchThreads(t, false);
        }
      };

      init();
      return () => { cancelled = true; };
    }, [fetchThreads]),
  );

  // ── Auto-poll every 10 s ────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokenRef.current) fetchThreads(tokenRef.current, false);
    }, 10_000);
    return () => clearInterval(interval);
  }, [fetchThreads]);

  // ── Pull-to-refresh ─────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchThreads(tokenRef.current, false);
    setRefreshing(false);
  };

  // ── Navigation ──────────────────────────────────────────────
  const openThread = (threadId: number) => {
    router.push({
      pathname: "/Dashboard/message/[threadId]",
      params: { threadId: String(threadId), childId, childName, classname, sectionname },
    });
  };

  const startNewChat = () => {
    router.push({
      pathname: "/Dashboard/message/[threadId]",
      params: { threadId: "new", childId, childName, classname, sectionname },
    });
  };

  // ── Render one thread row ───────────────────────────────────
  const renderThread = ({ item, index }: { item: ThreadItem; index: number }) => (
    <TouchableOpacity
      style={styles.threadRow}
      onPress={() => openThread(item.id)}
      activeOpacity={0.75}
    >
      <View style={styles.avatar}>
        <Ionicons name="chatbubble-ellipses" size={22} color={PRIMARY} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.threadTop}>
          <Text style={[styles.threadTitle, item.unreadCount > 0 && styles.threadTitleBold]}>
            Conversation {threads.length - index}
          </Text>
          <Text style={styles.threadDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.threadBottom}>
          <Text
            style={[styles.threadPreview, item.unreadCount > 0 && styles.threadPreviewBold]}
            numberOfLines={1}
          >
            {item.preview || "Tap to view conversation"}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );

  // ── JSX ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

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
        <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Conversations</Text>
        {threads.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{threads.length}</Text>
          </View>
        )}
      </View>

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
          contentContainerStyle={
            threads.length === 0 ? { flex: 1 } : { padding: 14, gap: 10 }
          }
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
  threadTitle: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  threadTitleBold: { fontWeight: "800" },
  threadDate: { fontSize: 11, color: "#9CA3AF" },
  threadBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  threadPreview: { fontSize: 13, color: "#6B7280", flex: 1 },
  threadPreviewBold: { color: "#111827", fontWeight: "700" },
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