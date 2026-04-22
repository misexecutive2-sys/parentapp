// app/Dashboard/SchoolDiary.tsx
// Student Side — School Diary

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";

const BASE_URL = "https://staging.schoolaid.in";

// ── Types ─────────────────────────────────────
type NotificationType = "homework" | "comment";

interface Attachment {
  filename: string;
  url: string;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  subject: string;
  dueDate?: string;
  attachment?: Attachment | null;
  createdAt: string;
  read: boolean;
}

// ── Helpers ───────────────────────────────────
const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const subjectColors: Record<string, string> = {
  Mathematics: "#4F46E5",
  Science:     "#059669",
  English:     "#DC2626",
  History:     "#D97706",
  Geography:   "#0891B2",
  Hindi:       "#7C3AED",
  default:     "#6366F1",
};

const getSubjectColor = (subject: string) =>
  subjectColors[subject] || subjectColors.default;

// ════════════════════════════════════════════
//  NOTIFICATION BADGE
// ════════════════════════════════════════════
const NotificationBadge = ({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) => {
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count > 0) {
      Animated.sequence([
        Animated.spring(bounce, { toValue: 1.4, useNativeDriver: true }),
        Animated.spring(bounce, { toValue: 1,   useNativeDriver: true }),
      ]).start();
    }
  }, [count]);

//   return (
//     <TouchableOpacity onPress={onPress} style={styles.bellWrapper} activeOpacity={0.7}>
//       <Text style={styles.bellIcon}>🔔</Text>
//       {count > 0 && (
//         <Animated.View style={[styles.badge, { transform: [{ scale: bounce }] }]}>
//           <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
//         </Animated.View>
//       )}
//     </TouchableOpacity>
//   );
};

// ════════════════════════════════════════════
//  HOMEWORK CARD
// ════════════════════════════════════════════
const HomeworkCard = ({
  item,
  onRead,
}: {
  item: Notification;
  onRead: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const color = getSubjectColor(item.subject);

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.spring(anim, { toValue, useNativeDriver: false }).start();
    if (!item.read) onRead(item.id);
  };

  const daysLeft = item.dueDate
    ? Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / 86400000)
    : null;

  const dueBadgeColor =
    daysLeft === null ? "#6B7280"
    : daysLeft < 0    ? "#DC2626"
    : daysLeft <= 2   ? "#D97706"
    : "#059669";

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.92}
      style={[styles.card, !item.read && styles.cardUnread]}
    >
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <View style={[styles.subjectPill, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.subjectPillText, { color }]}>📚 {item.subject}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
            <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        {item.dueDate && (
          <View style={styles.dueDateRow}>
            <View style={[styles.dueBadge, { backgroundColor: `${dueBadgeColor}18` }]}>
              <Text style={[styles.dueBadgeText, { color: dueBadgeColor }]}>
                {daysLeft === null
                  ? "No due date"
                  : daysLeft < 0
                  ? `Overdue by ${Math.abs(daysLeft)} day(s)`
                  : daysLeft === 0
                  ? "Due Today!"
                  : `Due in ${daysLeft} day(s)`}
              </Text>
            </View>
            <Text style={styles.dueDateText}>📅 {formatDate(item.dueDate)}</Text>
          </View>
        )}

        {expanded && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />
            <Text style={styles.homeworkBody}>{item.body}</Text>
            {item.attachment && (
              <TouchableOpacity
                style={styles.attachmentBtn}
                onPress={() => Linking.openURL(`${BASE_URL}${item.attachment!.url}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.attachmentIcon}>📎</Text>
                <Text style={styles.attachmentText}>{item.attachment.filename}</Text>
                <Text style={styles.attachmentDownload}>Download</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={[styles.expandHint, { color }]}>
          {expanded ? "▲ Show less" : "▼ Tap to view details"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ════════════════════════════════════════════
//  COMMENT CARD
// ════════════════════════════════════════════
const CommentCard = ({
  item,
  onRead,
}: {
  item: Notification;
  onRead: (id: string) => void;
}) => {
  const color = getSubjectColor(item.subject);

  return (
    <TouchableOpacity
      onPress={() => { if (!item.read) onRead(item.id); }}
      activeOpacity={0.92}
      style={[styles.card, !item.read && styles.cardUnread]}
    >
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <View style={[styles.subjectPill, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.subjectPillText, { color }]}>💬 {item.subject}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
            <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        <View style={styles.commentBubble}>
          <Text style={styles.teacherLabel}>🧑‍🏫 Teacher's Comment</Text>
          <Text style={styles.commentText}>{item.body}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ════════════════════════════════════════════
//  EMPTY STATE
// ════════════════════════════════════════════
const EmptyState = ({ tab }: { tab: "homework" | "comments" | "all" }) => (
  <View style={styles.emptyWrapper}>
    <Text style={styles.emptyEmoji}>
      {tab === "homework" ? "📭" : tab === "comments" ? "💭" : "🎉"}
    </Text>
    <Text style={styles.emptyTitle}>
      {tab === "homework"
        ? "No Homework Yet"
        : tab === "comments"
        ? "No Comments Yet"
        : "You're all caught up!"}
    </Text>
    <Text style={styles.emptySubtitle}>
      {tab === "homework"
        ? "Your teacher hasn't assigned any homework yet."
        : tab === "comments"
        ? "No teacher comments for you yet."
        : "Pull down to refresh and check for new updates."}
    </Text>
  </View>
);

// ════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════
export default function SchoolDiaryScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  // ── Child info ────────────────────────────
  const [childName,    setChildName]    = useState<string>("Student");
  const [childClass,   setChildClass]   = useState<string>("");
  const [childSection, setChildSection] = useState<string>("");
  const [studentId,    setStudentId]    = useState<string>("");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState<boolean>(true);
  const [refreshing,    setRefreshing]    = useState<boolean>(false);
  const [activeTab,     setActiveTab]     = useState<"all" | "homework" | "comments">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Load child data from AsyncStorage ─────
useEffect(() => {
  const loadChildData = async () => {
    const childStr = await AsyncStorage.getItem("selectedChild");
    if (childStr) {
      const child = JSON.parse(childStr);
      console.log("Loaded child data:", child); 
      setChildName(child.name || "Student");
      setChildClass(child.classname || "");
      setChildSection(child.sectionname || "");
    //   setStudentId(child.id?.toString() || "");
    }
  };
  loadChildData();
}, []);


  // ── Logout ────────────────────────────────
  const handleLogout = () =>
    Alert.alert(
      "Logout",
      "Do you really want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("selectedChild");
            await AsyncStorage.removeItem("selectedYearId");
            await AsyncStorage.removeItem("selectedYearLabel");
            router.replace("/login");
          },
        },
      ],
      { cancelable: true }
    );

  // ── Fetch notifications ───────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/diary/student/notifications?studentId=${studentId}&class=${childClass}&section=${childSection}`
      );
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => {
          const readIds = new Set(prev.filter((n) => n.read).map((n) => n.id));
          return data.data.map((n: Notification) => ({
            ...n,
            read: readIds.has(n.id),
          }));
        });
      }
    } catch {
      if (!silent) Alert.alert("Error", "Could not connect to server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId, childClass, childSection]);

  useEffect(() => {
    if (childClass && childSection) {
      fetchNotifications();
      const interval = setInterval(() => fetchNotifications(true), 30000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, childClass, childSection]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // ── Filter by tab ─────────────────────────
  const filtered =
    activeTab === "all"
      ? notifications
      : activeTab === "homework"
      ? notifications.filter((n) => n.type === "homework")
      : notifications.filter((n) => n.type === "comment");

  const hwCount  = notifications.filter((n) => n.type === "homework").length;
  const cmnCount = notifications.filter((n) => n.type === "comment").length;

  // ── Render ────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>

      {/* ══ HEADER ══ */}
      <View style={[styles.headerTop, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>↩</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Welcome, {childName}
          </Text>
          {/* <NotificationBadge count={unreadCount} onPress={markAllRead} /> */}
        </View>

        <Text style={styles.childSubtitle}>
          {childClass ? `Class : ${childClass}` : ""}
          {childClass && childSection ? " · " : ""}
          {childSection ? `Section : ${childSection}` : ""}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/addchild")}
          >
            <Text style={styles.actionText}>Switch Child</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Text style={styles.actionText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══ STATS ROW ══ */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: "#4F46E520" }]}>
          <Text style={[styles.statNum, { color: "#4F46E5" }]}>{hwCount}</Text>
          <Text style={styles.statLabel}>Homework</Text>
        </View>
        <View style={[styles.statCard, { borderColor: "#05966920" }]}>
          <Text style={[styles.statNum, { color: "#059669" }]}>{cmnCount}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
        <View style={[styles.statCard, { borderColor: "#DC262620" }]}>
          <Text style={[styles.statNum, { color: "#DC2626" }]}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>

      {/* ══ TABS ══ */}
      <View style={styles.tabsRow}>
        {(["all", "homework", "comments"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && [styles.tabActive, { backgroundColor: theme.primary }],
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "all" ? "All" : tab === "homework" ? "📚 Homework" : "💬 Comments"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mark all read */}
      {unreadCount > 0 && (
        <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn} activeOpacity={0.7}>
          <Text style={[styles.markAllText, { color: theme.primary }]}>✓ Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* ══ CONTENT ══ */}
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading diary...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {filtered.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            filtered.map((item) =>
              item.type === "homework" ? (
                <HomeworkCard key={item.id} item={item} onRead={markAsRead} />
              ) : (
                <CommentCard key={item.id} item={item} onRead={markAsRead} />
              )
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  headerTop: {
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backArrow: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
  childSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", marginBottom: 14 },
  actions: { flexDirection: "row", gap: 10 },
  actionButton: {
   backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10
  },
  actionText: { color: "#0047AB", fontSize: 13, fontWeight: "700" },

  // Bell
  bellWrapper: { padding: 4, position: "relative" },
  bellIcon:    { fontSize: 24 },
  badge: {
    position: "absolute",
    top: -2, right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20, height: 20,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 12, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statNum:   { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 2, fontWeight: "600" },

  // Tabs
  tabsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center", backgroundColor: "#F3F4F6" },
  tabActive:     { elevation: 3, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6 },
  tabText:       { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  tabTextActive: { color: "#fff" },

  // Mark all
  markAllBtn:  { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 6 },
  markAllText: { fontSize: 12, fontWeight: "700" },

  // Card
  card: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, marginBottom: 12,
    overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12,
    elevation: 3, borderWidth: 1, borderColor: "#F0F0F0",
  },
  cardUnread:  { borderColor: "#E0E7FF", backgroundColor: "#FAFBFF" },
  cardAccent:  { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardTopRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  subjectPill:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  subjectPillText: { fontSize: 11, fontWeight: "700" },
  unreadDot:       { width: 8, height: 8, borderRadius: 4 },
  timeAgo:         { fontSize: 11, color: "#9CA3AF" },
  cardTitle:       { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 8 },

  // Due date
  dueDateRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  dueBadge:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dueBadgeText: { fontSize: 11, fontWeight: "700" },
  dueDateText:  { fontSize: 12, color: "#6B7280" },

  // Expanded
  expandedSection: { marginTop: 8 },
  divider:         { height: 1, backgroundColor: "#F3F4F6", marginBottom: 10 },
  homeworkBody:    { fontSize: 14, color: "#374151", lineHeight: 22, marginBottom: 12 },
  expandHint:      { fontSize: 11, fontWeight: "700", marginTop: 8, textAlign: "right" },

  // Attachment
  attachmentBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB",
    borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: "#E5E7EB",
  },
  attachmentIcon:     { fontSize: 18 },
  attachmentText:     { flex: 1, fontSize: 13, color: "#374151", fontWeight: "600" },
  attachmentDownload: { fontSize: 12, color: "#4F46E5", fontWeight: "700" },

  // Comment
  commentBubble: {
    backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12,
    marginTop: 4, borderLeftWidth: 3, borderLeftColor: "#4F46E5",
  },
  teacherLabel: { fontSize: 11, fontWeight: "700", color: "#6B7280", marginBottom: 6 },
  commentText:  { fontSize: 14, color: "#374151", lineHeight: 22 },

  // Empty
  emptyWrapper:  { alignItems: "center", paddingTop: 80 },
  emptyEmoji:    { fontSize: 64, marginBottom: 16 },
  emptyTitle:    { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 32, lineHeight: 22 },

  // Loading
  loadingWrapper: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:    { fontSize: 14, fontWeight: "600" },
});