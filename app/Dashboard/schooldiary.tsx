// app/Dashboard/SchoolDiary.tsx
// Student Side — School Diary (Enhanced)

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

const BASE_URL = "https://connect.schoolaid.in";
const COMPLETED_KEY = "completedHomework";

// ── Types ─────────────────────────────────────
type NotificationType = "homework" | "comment";

interface Attachment {
  filename: string;
  url: string;
}

interface Notification {
  id: string;
  type: NotificationType;
  // title: string;
  body: string;
  subject: string;
  dueDate?: string;
  attachment?: Attachment | null;
  createdAt: string;
  read: boolean;
}

type Priority = "overdue" | "urgent" | "soon" | "planned";

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

const getDaysLeft = (dueDate?: string): number | null => {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
};

const getPriority = (daysLeft: number | null): Priority => {
  if (daysLeft === null) return "planned";
  if (daysLeft < 0)  return "overdue";
  if (daysLeft <= 1) return "urgent";
  if (daysLeft <= 3) return "soon";
  return "planned";
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: string }> = {
  overdue: { label: "Overdue",  color: "#DC2626", bg: "#FEF2F2", icon: "🚨" },
  urgent:  { label: "Urgent",   color: "#EA580C", bg: "#FFF7ED", icon: "🔴" },
  soon:    { label: "Due Soon", color: "#D97706", bg: "#FFFBEB", icon: "🟡" },
  planned: { label: "Planned",  color: "#059669", bg: "#F0FDF4", icon: "🟢" },
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
//  PROGRESS SUMMARY CARD
// ════════════════════════════════════════════
const ProgressSummary = ({
  total,
  completed,
  overdue,
  primaryColor,
}: {
  total: number;
  completed: number;
  overdue: number;
  primaryColor: string;
}) => {
  const progress = total > 0 ? completed / total : 0;
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const percentage = Math.round(progress * 100);

  const getMessage = () => {
    if (total === 0)        return { text: "No homework assigned 🎉",        color: "#059669" };
    if (percentage === 100) return { text: "All done! Great work! 🏆",       color: "#059669" };
    if (percentage >= 70)   return { text: "Almost there, keep going! 💪",   color: "#D97706" };
    if (percentage >= 30)   return { text: "Good progress, stay focused 📖", color: primaryColor };
    return                         { text: "Let's get started! 🚀",           color: "#DC2626" };
  };

  const msg = getMessage();

  return (
    <View style={progressStyles.card}>
      <View style={progressStyles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={progressStyles.title}>HOMEWORK PROGRESS</Text>
          <Text style={[progressStyles.message, { color: msg.color }]}>{msg.text}</Text>
        </View>
        <View style={[progressStyles.percentCircle, { borderColor: primaryColor }]}>
          <Text style={[progressStyles.percentText, { color: primaryColor }]}>{percentage}%</Text>
        </View>
      </View>

      <View style={progressStyles.barBg}>
        <Animated.View
          style={[
            progressStyles.barFill,
            {
              backgroundColor: primaryColor,
              width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
      </View>

      <View style={progressStyles.statsRow}>
        <View style={progressStyles.statItem}>
          <Text style={progressStyles.statValue}>{total}</Text>
          <Text style={progressStyles.statLabel}>Total</Text>
        </View>
        <View style={progressStyles.statDivider} />
        <View style={progressStyles.statItem}>
          <Text style={[progressStyles.statValue, { color: "#059669" }]}>{completed}</Text>
          <Text style={progressStyles.statLabel}>Done</Text>
        </View>
        <View style={progressStyles.statDivider} />
        <View style={progressStyles.statItem}>
          <Text style={[progressStyles.statValue, { color: "#6B7280" }]}>{total - completed}</Text>
          <Text style={progressStyles.statLabel}>Pending</Text>
        </View>
        <View style={progressStyles.statDivider} />
        <View style={progressStyles.statItem}>
          <Text style={[progressStyles.statValue, { color: "#DC2626" }]}>{overdue}</Text>
          <Text style={progressStyles.statLabel}>Overdue</Text>
        </View>
      </View>
    </View>
  );
};

const progressStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F4FF",
  },
  topRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title:         { fontSize: 11, fontWeight: "800", color: "#9CA3AF", marginBottom: 4, letterSpacing: 1 },
  message:       { fontSize: 15, fontWeight: "800" },
  percentCircle: {
    width: 54, height: 54, borderRadius: 27, borderWidth: 3,
    alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFF",
  },
  percentText: { fontSize: 14, fontWeight: "900" },
  barBg:       { height: 8, backgroundColor: "#F3F4F6", borderRadius: 99, overflow: "hidden", marginBottom: 16 },
  barFill:     { height: "100%", borderRadius: 99 },
  statsRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statItem:    { flex: 1, alignItems: "center" },
  statValue:   { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabel:   { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "#F3F4F6" },
});

// ════════════════════════════════════════════
//  HOMEWORK CARD
//  ✅ Completion toggle is ONLY here — never on CommentCard
// ════════════════════════════════════════════
// HomeworkCard component
// const HomeworkCard = ({
//   item,
//   onRead,
//   isCompleted,
//   onToggleComplete,
//   showToggle,   // 👈 new prop
// }: {
//   item: Notification;
//   onRead: (id: string) => void;
//   isCompleted: boolean;
//   onToggleComplete: (id: string) => void;
//   showToggle: boolean;   // 👈 new prop
// }) => {
//   const [expanded, setExpanded] = useState(false);
//   const checkAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
//   const color     = getSubjectColor(item.subject);
//   const daysLeft  = getDaysLeft(item.dueDate);
//   const priority  = getPriority(daysLeft);
//   const pConfig   = PRIORITY_CONFIG[priority];

//   const handleToggle = () => {
//     if (item.type !== "homework") return;
//     const toValue = isCompleted ? 0 : 1;
//     Animated.spring(checkAnim, { toValue, useNativeDriver: true, tension: 80, friction: 6 }).start();
//     onToggleComplete(item.id);
//   };

//   const handleCardPress = () => {
//     setExpanded(!expanded);
//     if (!item.read) onRead(item.id);
//   };

//   const checkScale = checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.35, 1] });

//   return (
//     <TouchableOpacity
//       onPress={handleCardPress}
//       activeOpacity={0.92}
//       style={[styles.card, !item.read && !isCompleted && styles.cardUnread, isCompleted && styles.cardCompleted]}
//     >
//       <View style={[styles.cardAccent, { backgroundColor: isCompleted ? "#A7F3D0" : color }]} />

//       <View style={styles.cardContent}>
//         {/* Title + Completion toggle */}
//         <View style={styles.titleRow}>
//           <Text
//             style={[styles.cardTitle, isCompleted && styles.cardTitleCompleted]}
//             numberOfLines={expanded ? undefined : 2}
//           >
//             {item.title}
//           </Text>

//           {/* ✅ Checkbox only if showToggle is true */}
//           {showToggle && (
//             <TouchableOpacity
//               onPress={handleToggle}
//               activeOpacity={0.8}
//               style={[styles.checkBtn, isCompleted && styles.checkBtnDone]}
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//             >
//               <Animated.Text
//                 style={[
//                   styles.checkIcon,
//                   { transform: [{ scale: checkScale }] },
//                   !isCompleted && styles.checkIconEmpty,
//                 ]}
//               >
//                 {isCompleted ? "✓" : ""}
//               </Animated.Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

const HomeworkCard = ({
  item,
  onRead,
  isCompleted,
  onToggleComplete,
  showToggle,
}: {
  item: Notification;
  onRead: (id: string) => void;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  showToggle: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const checkAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const color    = getSubjectColor(item.subject);
  const daysLeft = getDaysLeft(item.dueDate);
  const priority = getPriority(daysLeft);
  const pConfig  = PRIORITY_CONFIG[priority];

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: isCompleted ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 6,
    }).start();
  }, [isCompleted]);

  const handleToggle = () => {
    if (item.type !== "homework") return;
    onToggleComplete(item.id);
  };

  const handleCardPress = () => {
    setExpanded(!expanded);
    if (!item.read) onRead(item.id);
  };

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.35, 1],
  });

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      activeOpacity={0.92}
      style={[
        styles.card,
        !item.read && !isCompleted && styles.cardUnread,
        isCompleted && styles.cardCompleted,
      ]}
    >
      <View style={[styles.cardAccent, { backgroundColor: isCompleted ? "#A7F3D0" : color }]} />

      <View style={styles.cardContent}>

        {/* ── Row 1: Subject pill + priority badge + unread dot + time ── */}
        <View style={styles.cardTopRow}>
          <View style={[styles.subjectPill, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.subjectPillText, { color }]}>
              📚 {item.subject}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.priorityBadge, { backgroundColor: pConfig.bg }]}>
              <Text style={[styles.priorityText, { color: pConfig.color }]}>
                {pConfig.icon} {pConfig.label}
              </Text>
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
            <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>

        {/* ── Row 2: Title + optional toggle ── */}
        <View style={styles.titleRow}>
          {/* <Text
            style={[styles.cardTitle, isCompleted && styles.cardTitleCompleted]}
            numberOfLines={expanded ? undefined : 2}
          >
            {item.title}
          </Text> */}

          {showToggle && (
            <TouchableOpacity
              onPress={handleToggle}
              activeOpacity={0.8}
              style={[styles.checkBtn, isCompleted && styles.checkBtnDone]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.Text
                style={[
                  styles.checkIcon,
                  { transform: [{ scale: checkScale }] },
                  !isCompleted && styles.checkIconEmpty,
                ]}
              >
                {isCompleted ? "✓" : ""}
              </Animated.Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Row 3: Due date ── */}
        {item.dueDate && (
          <View style={styles.dueDateRow}>
            <Text style={styles.dueDateText}>
              📅 Due: {formatDate(item.dueDate)}
            </Text>
            <Text
              style={[
                styles.daysLeftText,
                { color: pConfig.color },
              ]}
            >
              {daysLeft === null
                ? ""
                : daysLeft < 0
                ? `${Math.abs(daysLeft)}d overdue`
                : daysLeft === 0
                ? "Due today!"
                : `${daysLeft}d left`}
            </Text>
          </View>
        )}

        {/* ── Expanded: body + attachment ── */}
        {expanded && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />
            {item.body ? (
              <Text style={styles.homeworkBody}>{item.body}</Text>
            ) : null}
            {isCompleted && (
              <Text style={styles.completedMsg}>✅ Marked as completed</Text>
            )}
            {item.attachment && (
              <TouchableOpacity
                style={styles.attachmentBtn}
                onPress={() => Linking.openURL(item.attachment!.url)}
                activeOpacity={0.8}
              >
                <Text style={styles.attachmentIcon}>📎</Text>
                <Text style={styles.attachmentText} numberOfLines={1}>
                  {item.attachment.filename}
                </Text>
                <Text style={styles.attachmentDownload}>Download</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Expand hint ── */}
        <View style={styles.bottomRow}>
          <Text style={[styles.expandHint, { color: color }]}>
            {expanded ? "▲ Show less" : "▼ Show more"}
          </Text>
        </View>

      </View>
    </TouchableOpacity>
  );
};

// ════════════════════════════════════════════
//  COMMENT CARD
//  ❌ NO completion toggle here — comments cannot be marked done
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
        {/* <Text style={styles.cardTitle}>{item.title}</Text> */}
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

  const [childName,    setChildName]    = useState<string>("Student");
  const [childClass,   setChildClass]   = useState<string>("");
  const [childSection, setChildSection] = useState<string>("");
  const [studentId,    setStudentId]    = useState<string>("");
  const [token,        setToken]        = useState<string>("");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [completedIds,  setCompletedIds]  = useState<Set<string>>(new Set());
  const [loading,       setLoading]       = useState<boolean>(true);
  const [refreshing,    setRefreshing]    = useState<boolean>(false);
  const [activeTab,     setActiveTab]     = useState<"all" | "homework" | "comments">("all");

  const unreadCount   = notifications.filter((n) => !n.read).length;
  const homeworkItems = notifications.filter((n) => n.type === "homework");
  const totalHw       = homeworkItems.length;
  const completedHw   = homeworkItems.filter((n) => completedIds.has(n.id)).length;
  const overdueHw     = homeworkItems.filter((n) => {
    const d = getDaysLeft(n.dueDate);
    return d !== null && d < 0 && !completedIds.has(n.id);
  }).length;
  const cmnCount = notifications.filter((n) => n.type === "comment").length;

  // ── Load data ─────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        if (savedToken) setToken(savedToken);

        const childStr = await AsyncStorage.getItem("selectedChild");
        if (childStr) {
          const child = JSON.parse(childStr);
          setChildName(child.name            || "Student");
          setChildClass(child.classname       || "");
          setChildSection(child.sectionname   || "");
          setStudentId(child.id?.toString()   || "");
        }

        const saved = await AsyncStorage.getItem(COMPLETED_KEY);
        if (saved) setCompletedIds(new Set(JSON.parse(saved)));
      } catch (err) {
        console.error("Load error:", err);
      }
    };
    load();
  }, []);

  // ── Toggle completion — HOMEWORK ONLY ─────
  const handleToggleComplete = useCallback(
    async (id: string) => {
      // Extra safety: only allow toggling if this id belongs to a homework item
      const item = notifications.find((n) => n.id === id);
      if (!item || item.type !== "homework") return;

      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify([...next])).catch(console.error);
        return next;
      });
    },
    [notifications],
  );

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
            await AsyncStorage.multiRemove([
              "token",
              "selectedChild",
              "selectedYearId",
              "selectedYearLabel",
            ]);
            router.replace("/login");
          },
        },
      ],
      { cancelable: true },
    );

  // ── Fetch ─────────────────────────────────
  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!studentId || !token) return;
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/diary/student/${studentId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.status === 401) {
          Alert.alert("Session Expired", "Please log in again.");
          await AsyncStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        const rawList: any[] = data.success
          ? data.data
          : Array.isArray(data)
          ? data
          : [];

        setNotifications((prev) => {
          const readIds = new Set(prev.filter((n) => n.read).map((n) => n.id));
          return rawList.map((n: any) => ({
            id:         String(n.id ?? n._id ?? Math.random()),
            type:       n.type === "comment" ? "comment" : "homework",
            title:      n.title      ?? n.homework_title ?? "Untitled",
            body:       n.body       ?? n.description    ?? n.comment ?? "",
            subject:    n.subject    ?? n.subject_name   ?? "General",
            dueDate:    n.dueDate    ?? n.due_date        ?? null,
            attachment: n.attachment ?? null,
            createdAt:  n.createdAt  ?? n.created_at     ?? new Date().toISOString(),
            read:       readIds.has(String(n.id ?? n._id)),
          }));
        });
      } catch (err) {
        console.error("fetchNotifications error:", err);
        if (!silent) Alert.alert("Error", "Could not connect to server.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [studentId, token],
  );

  useEffect(() => {
    if (studentId && token) {
      fetchNotifications();
      const interval = setInterval(() => fetchNotifications(true), 30000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, studentId, token]);

  const onRefresh   = () => { setRefreshing(true); fetchNotifications(); };
  const markAsRead  = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const filtered =
    activeTab === "all"
      ? notifications
      : activeTab === "homework"
      ? notifications.filter((n) => n.type === "homework")
      : notifications.filter((n) => n.type === "comment");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>

      {/* HEADER */}
      <View style={[styles.headerTop, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>↩</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Welcome, {childName}
          </Text>
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

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: "#4F46E520" }]}>
          <Text style={[styles.statNum, { color: "#4F46E5" }]}>{totalHw}</Text>
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

      {/* TABS */}
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
              {tab === "all"
                ? "All"
                : tab === "homework"
                ? "📚 Homework"
                : "💬 Comments"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {unreadCount > 0 && (
        <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn} activeOpacity={0.7}>
          <Text style={[styles.markAllText, { color: theme.primary }]}>✓ Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading diary...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
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
          {/* Progress card — only for homework tab or all tab when homework exists */}
          {(activeTab === "homework" || activeTab === "all") && totalHw > 0 && (
            <ProgressSummary
              total={totalHw}
              completed={completedHw}
              overdue={overdueHw}
              primaryColor={theme.primary}
            />
          )}

          <View style={{ paddingHorizontal: 16 }}>
            {filtered.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              filtered.map((item) =>
                // ✅ HomeworkCard gets completion props
                // ❌ CommentCard gets NO completion props whatsoever
                item.type === "homework" ? (
                 <HomeworkCard
                  key={item.id}
                  item={item}
                  onRead={markAsRead}
                  isCompleted={completedIds.has(item.id)}
                  onToggleComplete={handleToggleComplete}
                  showToggle={activeTab === "homework"}   // 👈 only show toggle in Homework tab
                />

                ) : (
                  <CommentCard
                    key={item.id}
                    item={item}
                    onRead={markAsRead}
                  />
                ),
              )
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════
const styles = StyleSheet.create({
  safe:          { flex: 1 },
  headerTop:     { paddingTop: 50, paddingBottom: 28, paddingHorizontal: 16, alignItems: "center" },
  headerTopRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 10 },
  backBtn:       { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backArrow:     { color: "#fff", fontSize: 26, fontWeight: "bold" },
  headerTitle:   { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
  childSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", marginBottom: 14 },
  actions:       { flexDirection: "row", gap: 10 },
  actionButton:  { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10 },
  actionText:    { color: "#0047AB", fontSize: 13, fontWeight: "700" },

  statsRow:  { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  statCard:  { flex: 1, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statNum:   { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 2, fontWeight: "600" },

  tabsRow:      { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  tab:          { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center", backgroundColor: "#F3F4F6" },
  tabActive:    { elevation: 3, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6 },
  tabText:      { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  tabTextActive: { color: "#fff" },

  markAllBtn:  { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 6 },
  markAllText: { fontSize: 12, fontWeight: "700" },

  card:          { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: "#F0F0F0" },
  cardUnread:    { borderColor: "#E0E7FF", backgroundColor: "#FAFBFF" },
  cardCompleted: { backgroundColor: "#F9FFF9", borderColor: "#D1FAE5", opacity: 0.85 },
  cardAccent:    { width: 5 },
  cardContent:   { flex: 1, padding: 14 },
  cardTopRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },

  subjectPill:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  subjectPillText: { fontSize: 11, fontWeight: "700" },
  priorityBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText:    { fontSize: 10, fontWeight: "800" },
  unreadDot:       { width: 8, height: 8, borderRadius: 4 },
  timeAgo:         { fontSize: 11, color: "#9CA3AF" },

  titleRow:           { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  cardTitle:          { flex: 1, fontSize: 15, fontWeight: "800", color: "#111827" },
  cardTitleCompleted: { color: "#9CA3AF", textDecorationLine: "line-through" },

  checkBtn:      { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB", marginTop: 1, flexShrink: 0 },
  checkBtnDone:  { backgroundColor: "#059669", borderColor: "#059669" },
  checkIcon:     { fontSize: 15, fontWeight: "900", color: "#fff" },
  checkIconEmpty:{ color: "transparent" },

  dueDateRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  dueDateText: { fontSize: 12, color: "#6B7280" },
  daysLeftText:{ fontSize: 12, fontWeight: "700" },

  expandedSection: { marginTop: 8 },
  divider:         { height: 1, backgroundColor: "#F3F4F6", marginBottom: 10 },
  homeworkBody:    { fontSize: 14, color: "#374151", lineHeight: 22, marginBottom: 12 },

  bottomRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  expandHint: { fontSize: 11, fontWeight: "700" },

  completedMsg: { fontSize: 12, color: "#059669", fontWeight: "600", marginTop: 6, fontStyle: "italic" },

  attachmentBtn:     { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  attachmentIcon:    { fontSize: 18 },
  attachmentText:    { flex: 1, fontSize: 13, color: "#374151", fontWeight: "600" },
  attachmentDownload:{ fontSize: 12, color: "#4F46E5", fontWeight: "700" },

  commentBubble: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginTop: 4, borderLeftWidth: 3, borderLeftColor: "#4F46E5" },
  teacherLabel:  { fontSize: 11, fontWeight: "700", color: "#6B7280", marginBottom: 6 },
  commentText:   { fontSize: 14, color: "#374151", lineHeight: 22 },

  emptyWrapper:  { alignItems: "center", paddingTop: 80 },
  emptyEmoji:    { fontSize: 64, marginBottom: 16 },
  emptyTitle:    { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 32, lineHeight: 22 },

  loadingWrapper: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:    { fontSize: 14, fontWeight: "600" },
});