// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   SafeAreaView,
//   RefreshControl,
//   Alert,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { useTheme } from "../ThemeContext";

// // ── Mock notices — remove when API is ready ───────────
// const MOCK_NOTICES = [
//   {
//     id: 1,
//     category: "Exam",
//     class: "LKG",
//     section: "A",
//     message: "Unit test for all subjects will be held from 20th April to 25th April. Students are advised to prepare well and bring their stationery.",
//     date: "2026-04-15",
//     priority: "high",
//   },
//   {
//     id: 2,
//     category: "Holiday",
//     class: "All",
//     section: "All",
//     message: "School will remain closed on 14th April on account of Dr. Ambedkar Jayanti. Classes will resume on 15th April as usual.",
//     date: "2026-04-12",
//     priority: "medium",
//   },
//   {
//     id: 3,
//     category: "Fee",
//     class: "LKG",
//     section: "A",
//     message: "Last date for fee submission for the month of April is 10th April. Kindly submit fees on time to avoid late charges.",
//     date: "2026-04-08",
//     priority: "high",
//   },
//   {
//     id: 4,
//     category: "Event",
//     class: "All",
//     section: "All",
//     message: "Annual Sports Day will be held on 30th April. Parents are cordially invited to attend and cheer for their children.",
//     date: "2026-04-05",
//     priority: "low",
//   },
//   {
//     id: 5,
//     category: "General",
//     class: "LKG",
//     section: "A",
//     message: "Please ensure your child carries their diary every day. Important communications are sent through the diary regularly.",
//     date: "2026-04-01",
//     priority: "low",
//   },
// ];

// export default function StudentNoticeBoard() {
//   const router = useRouter();
//   const { theme } = useTheme();

//   const [notices, setNotices] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [childName, setChildName] = useState("Student");
//   const [childId, setChildId] = useState<number | null>(null);
//   const [filter, setFilter] = useState<string>("All");
//   const [childClass,   setChildClass]   = useState("—");
// const [childSection, setChildSection] = useState("—");

// const categories = [
//   "All",
//   ...Array.from(new Set(notices.map((n) => n.category).filter(Boolean))),
// ];
//   const priorityColor = (priority: string) => {
//     if (priority === "high") return "#dc2626";
//     if (priority === "medium") return "#d97706";
//     return "#16a34a";
//   };

//   const priorityBg = (priority: string) => {
//     if (priority === "high") return "#fee2e2";
//     if (priority === "medium") return "#fef3c7";
//     return "#dcfce7";
//   };

//   const categoryIcon = (category: string) => {
//     if (category === "Exam") return "📝";
//     if (category === "Holiday") return "🏖️";
//     if (category === "Fee") return "💰";
//     if (category === "Event") return "🎉";
//     return "📢";
//   };

//   const formatDate = (dateStr: string) => {
//     const date = new Date(dateStr);
//     return date.toLocaleDateString("en-IN", {
//       day: "numeric",
//       month: "short",
//       year: "numeric",
//     });
//   };

//   // ── Load child info ───────────────────────────────────
//   useEffect(() => {
//     loadChild();
//     fetchNotices();
//   }, []);

//   const loadChild = async () => {
//     const childRaw = await AsyncStorage.getItem("selectedChild");
//     const child = childRaw ? JSON.parse(childRaw) : null;
//     if (child) {
//       setChildName(child.name ?? "Student");
//       setChildId(child.id ?? null);
//       setChildClass(child.classname ?? "—");
//       setChildSection(child.sectionname ?? "—");
//     }
//   };

//   // ── Fetch notices ─────────────────────────────────────
// const fetchNotices = async () => {
//   try {
//     setLoading(true);

//     const token = await AsyncStorage.getItem("token");
//     const childRaw = await AsyncStorage.getItem("selectedChild");
//     const child = childRaw ? JSON.parse(childRaw) : null;

//     if (!token || !child?.id) {
//       Alert.alert("Error", "Missing token or student ID");
//       return;
//     }

//     const res = await fetch("https://connect.schoolaid.in/api/notices/student", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ student_id: child.id }),
//     });

//     const json = await res.json();
//     // API returns { data: [...] }
//     setNotices(Array.isArray(json.data) ? json.data : []);
//   } catch (err) {
//     Alert.alert("Error", "Could not fetch notices");
//   } finally {
//     setLoading(false);
//   }
// };


//   // ── Filter notices ────────────────────────────────────
//   const filteredNotices = filter === "All"
//     ? notices
//     : notices.filter((n) => n.category === filter);

//   // ── Logout ────────────────────────────────────────────
//   const handleLogout = () =>
//     Alert.alert("Logout", "Do you really want to logout?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Yes",
//         style: "destructive",
//         onPress: async () => {
//           await AsyncStorage.removeItem("token");
//           await AsyncStorage.removeItem("selectedChild");
//           await AsyncStorage.removeItem("selectedYearId");
//           await AsyncStorage.removeItem("selectedYearLabel");
//           router.replace("/login");
//         },
//       },
//     ], { cancelable: true });

//   return (
//     <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>

//       {/* ══ HEADER ══ */}
// <View style={[styles.headerTop, { backgroundColor: theme.primary }]}>
//   <View style={styles.headerTopRow}>
//     <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//       <Text style={styles.backArrow}>↩</Text>
//     </TouchableOpacity>
//     <Text style={styles.headerTitle} numberOfLines={1}>Welcome, {childName}</Text>
//     <View style={styles.backBtn} />
//   </View>
//   <Text style={styles.childSubtitle}>
//     Class : {childClass} · Section : {childSection}
//   </Text>
//   <View style={styles.actions}>
//     <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/addchild")}>
//       <Text style={styles.actionText}>Switch Child</Text>
//     </TouchableOpacity>
//     <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
//       <Text style={styles.actionText}>Logout</Text>
//     </TouchableOpacity>
//   </View>
// </View>

//       {/* ══ BODY ══ */}
//       <ScrollView
//         contentContainerStyle={{ paddingBottom: 40 }}
//         refreshControl={
//           <RefreshControl
//             refreshing={loading}
//             onRefresh={fetchNotices}
//             colors={[theme.primary]}
//             tintColor={theme.primary}
//           />
//         }
//       >
//         {/* ── Page Title ── */}
//         <View style={styles.pageTitleRow}>
//           <Text style={[styles.pageTitle, { color: theme.primary }]}>
//             📢 Notice Board
//           </Text>
//           <Text style={styles.noticeCount}>
//             {filteredNotices.length} notice{filteredNotices.length !== 1 ? "s" : ""}
//           </Text>
//         </View>

//         {/* ── Category Filter Chips ── */}
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.chipsRow}
//         >
//           {categories.map((cat) => (
//             <TouchableOpacity
//               key={cat}
//               style={[
//                 styles.chip,
//                 filter === cat
//                   ? { backgroundColor: theme.primary }
//                   : { backgroundColor: "#fff", borderColor: theme.primary },
//               ]}
//               onPress={() => setFilter(cat)}
//               activeOpacity={0.8}
//             >
//               <Text
//                 style={[
//                   styles.chipText,
//                   { color: filter === cat ? "#fff" : theme.primary },
//                 ]}
//               >
//                 {cat}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* ── Loading ── */}
//         {loading ? (
//           <View style={styles.centered}>
//             <ActivityIndicator size="large" color={theme.primary} />
//             <Text style={{ marginTop: 12, color: theme.text }}>
//               Loading notices…
//             </Text>
//           </View>
//         ) : filteredNotices.length === 0 ? (
//           /* ── Empty State ── */
//           <View style={styles.emptyCard}>
//             <Text style={styles.emptyIcon}>📭</Text>
//             <Text style={[styles.emptyTitle, { color: theme.primary }]}>
//               No Notices
//             </Text>
//             <Text style={[styles.emptySubtext, { color: theme.text }]}>
//               No notices found for this category.{"\n"}
//               Pull down to refresh.
//             </Text>
//           </View>
//         ) : (
//           /* ── Notice Cards ── */
//           filteredNotices.map((notice) => (
//             <View style={styles.noticeCard} key={notice.id}>

//               {/* Card Top Row */}
//               <View style={styles.cardTopRow}>
//                 <View style={styles.cardLeft}>
//                   <Text style={styles.categoryIcon}>
//                     {categoryIcon(notice.category)}
//                   </Text>
//                   <Text style={[styles.categoryText, { color: theme.primary }]}>
//                     {notice.category}
//                   </Text>
//                 </View>
//                 <View style={[
//                   styles.priorityBadge,
//                   { backgroundColor: priorityBg(notice.priority) }
//                 ]}>
//                   <Text style={[
//                     styles.priorityText,
//                     { color: priorityColor(notice.priority) }
//                   ]}>
//                     {notice.priority === "high"
//                       ? "⚠️ High"
//                       : notice.priority === "medium"
//                       ? "🔔 Medium"
//                       : "✅ Low"}
//                   </Text>
//                 </View>
//               </View>

//               {/* Class & Section */}
//               <Text style={styles.classText}>
//                 Class {notice.class} · Section {notice.section}
//               </Text>

//               {/* Divider */}
//               <View style={styles.divider} />

//               {/* Message */}
//               <Text style={[styles.message, { color: theme.text }]}>
//                 {notice.message}
//               </Text>

//               {/* Date */}
//               <Text style={styles.dateText}>
//                 🗓 {formatDate(notice.date)}
//               </Text>

//             </View>
//           ))
//         )}

//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1 },
//   centered: { alignItems: "center", justifyContent: "center", padding: 40 },

//   // Header
//   headerTop: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, alignItems: "center" },
//   headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 },
//   backBtn: { width: 36, padding: 4 },
//   backArrow: { color: "#fff", fontSize: 24, fontWeight: "bold" },
//   headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
//   childSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", marginBottom: 16 },
//   actions: { flexDirection: "row", gap: 12 },
//   actionButton: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
//   actionText: { fontWeight: "700", fontSize: 14, color: "#0047AB" },

//   // Page title
//   pageTitleRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginHorizontal: 16,
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   pageTitle: { fontSize: 20, fontWeight: "800" },
//   noticeCount: { fontSize: 13, color: "#888" },

//   // Filter chips
//   chipsRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
//   chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
//   chipText: { fontSize: 13, fontWeight: "600" },

//   // Notice card
//   noticeCard: {
//     backgroundColor: "#fff",
//     marginHorizontal: 16,
//     marginBottom: 12,
//     padding: 16,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: "#E0E6F0",
//   },
//   cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
//   cardLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
//   categoryIcon: { fontSize: 18 },
//   categoryText: { fontSize: 15, fontWeight: "700" },
//   priorityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
//   priorityText: { fontSize: 11, fontWeight: "700" },
//   classText: { fontSize: 12, color: "#888", marginBottom: 10 },
//   divider: { height: 0.5, backgroundColor: "#E0E6F0", marginBottom: 10 },
//   message: { fontSize: 14, lineHeight: 22, marginBottom: 10 },
//   dateText: { fontSize: 12, color: "#aaa" },

//   // Empty
//   emptyCard: {
//     backgroundColor: "#fff",
//     marginHorizontal: 16,
//     marginTop: 16,
//     padding: 40,
//     borderRadius: 16,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E0E6F0",
//   },
//   emptyIcon: { fontSize: 48, marginBottom: 12 },
//   emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
//   emptySubtext: { fontSize: 13, textAlign: "center", opacity: 0.7, lineHeight: 20 },
// });

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";

const BASE_URL = "https://connect.schoolaid.in";

export default function StudentNoticeBoard() {
  const router = useRouter();
  const { theme } = useTheme();

  const [notices, setNotices]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [childName, setChildName]   = useState("Student");
  const [childClass, setChildClass] = useState("—");
  const [childSection, setChildSection] = useState("—");

  useEffect(() => {
    loadChild();
    fetchNotices();
  }, []);

  const loadChild = async () => {
    const childRaw = await AsyncStorage.getItem("selectedChild");
    const child = childRaw ? JSON.parse(childRaw) : null;
    if (child) {
      setChildName(child.name ?? "Student");
      setChildClass(child.classname ?? "—");
      setChildSection(child.sectionname ?? "—");
    }
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);

      // ── DEBUG: dump all AsyncStorage values ──
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("\n========== NOTICE DEBUG ==========");
      console.log("AsyncStorage keys:", allKeys);
      for (const key of allKeys) {
        const val = await AsyncStorage.getItem(key);
        console.log(`  [${key}]:`, val?.substring(0, 200));
      }

      const token    = await AsyncStorage.getItem("token");
      const childRaw = await AsyncStorage.getItem("selectedChild");
      const child    = childRaw ? JSON.parse(childRaw) : null;

      console.log("\n── Request ──");
      console.log("URL    :", `${BASE_URL}/api/notices/student`);
      console.log("Token  :", token ? `${token.substring(0, 40)}...` : "MISSING ⚠️");
      console.log("Child  :", JSON.stringify(child));

      if (!token) {
        Alert.alert("Error", "Not logged in — token missing");
        return;
      }

      const requestHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      console.log("Headers:", JSON.stringify(requestHeaders));

      const res = await fetch(`${BASE_URL}/api/notices/student?student_id=${child?.id}`, {
        method: "GET",
        headers: requestHeaders,
      });

      console.log("\n── Response ──");
      console.log("Status :", res.status, res.statusText ?? "");
      
      // Log all response headers
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => { resHeaders[key] = val; });
      console.log("Res Headers:", JSON.stringify(resHeaders));

      const rawText = await res.text();
      console.log("Raw body:", rawText.substring(0, 500));
      console.log("===================================\n");

      // Safe JSON parse
      let json: any = {};
      try {
        json = JSON.parse(rawText);
      } catch {
        console.error("❌ Response is not valid JSON:", rawText);
        Alert.alert("Error", `Server returned non-JSON response (status ${res.status})`);
        return;
      }

      if (!res.ok) {
        console.error(`❌ HTTP ${res.status}:`, JSON.stringify(json));
        Alert.alert("Server Error", json.msg ?? json.message ?? `HTTP ${res.status}`);
        return;
      }

      setNotices(Array.isArray(json.data) ? json.data : []);
      console.log(`✅ Loaded ${Array.isArray(json.data) ? json.data.length : 0} notices`);
    } catch (err: any) {
      console.error("❌ Fetch error:", err?.message ?? err);
      Alert.alert("Error", `Network error: ${err?.message ?? "Unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  const openAttachment = (fileUrl: string) => {
    // fileUrl may be relative like "/uploads/..." — prefix with base URL
    const full = fileUrl.startsWith("http") ? fileUrl : `${BASE_URL}${fileUrl}`;
    Linking.openURL(full).catch(() =>
      Alert.alert("Error", "Could not open attachment")
    );
  };
    const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
    const handleLogout = () =>
    Alert.alert("Logout", "Do you really want to logout?", [
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
    ], { cancelable: true });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
 <View style={[styles.headerTop, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          
          {/* Avatar Circle with Initials */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.avatarInitials}>{getInitials(childName)}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{childName}</Text>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>
                  {childClass} {childSection && `· ${childSection}`}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>↪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchNotices}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <Text style={[styles.pageTitle, { color: theme.primary }]}>
          📢 Notice Board
        </Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: 12, color: theme.text }}>
              Loading notices…
            </Text>
          </View>
        ) : notices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyTitle, { color: theme.primary }]}>
              No Notices
            </Text>
            <Text style={{ color: "#aaa", marginTop: 6, fontSize: 13 }}>
              You're all caught up!
            </Text>
          </View>
        ) : (
          notices.map((notice) => (
            <View style={styles.noticeCard} key={notice.id}>
              {/* Unread dot */}
              <View style={styles.noticeHeader}>
                <Text style={[styles.categoryText, { color: theme.primary, flex: 1 }]}>
                  {notice.title}
                </Text>
                {notice.is_read === 0 && (
                  <View style={styles.unreadDot} />
                )}
              </View>

              <View style={styles.divider} />

              <Text style={[styles.message, { color: theme.text }]}>
                {notice.message}
              </Text>

              {/* Attachment */}
              {notice.file_url ? (
                <TouchableOpacity
                  style={styles.attachmentBtn}
                  onPress={() => openAttachment(notice.file_url)}
                >
                  <Text style={[styles.attachmentText, { color: theme.primary }]}>
                    📎 View Attachment
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Meta row */}
              <View style={styles.metaRow}>
                <Text style={styles.dateText}>
                  🗓 {formatDate(notice.created_at)}
                </Text>
                {notice.class_name ? (
                  <Text style={styles.classBadge}>
                    Class {notice.class_name}
                    {notice.section_name ? ` - ${notice.section_name}` : ""}
                  </Text>
                ) : (
                  <Text style={styles.classBadge}>All Students</Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1 },
  centered:       { alignItems: "center", justifyContent: "center", padding: 40 },
  headerTop: { 
    paddingTop: 50, 
    paddingBottom: 20, 
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTopRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    width: "100%" 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  backArrow: { 
    color: "#fff", 
    fontSize: 22, 
    fontWeight: "600" 
  },
  
  // New avatar styles
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    justifyContent: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  headerTextContainer: {
    alignItems: "flex-start",
  },
  headerTitle: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "800",
    marginBottom: 4,
  },
  classBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  classBadgeText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 11,
    fontWeight: "600",
  },
    logoutBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  logoutIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  pageTitle:      { fontSize: 20, fontWeight: "800", margin: 16 },
  noticeCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  noticeHeader:   { flexDirection: "row", alignItems: "center" },
  categoryText:   { fontSize: 15, fontWeight: "700" },
  unreadDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: "#dc2626" },
  divider:        { height: 0.5, backgroundColor: "#E0E6F0", marginVertical: 10 },
  message:        { fontSize: 14, lineHeight: 22 },
  attachmentBtn:  { marginTop: 10, paddingVertical: 6 },
  attachmentText: { fontSize: 13, fontWeight: "600" },
  metaRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  dateText:       { fontSize: 12, color: "#aaa" },
  // classBadge:     { fontSize: 11, color: "#888", backgroundColor: "#F0F4FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  emptyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E6F0",
  },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
});