import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,

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
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
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
  // headerTop: { 

  //   paddingTop: 50, 
  //   paddingBottom: 20, 
  //   paddingHorizontal: 16,
  //   borderBottomLeftRadius: 24,
  //   borderBottomRightRadius: 24,
  //   elevation: 4,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 8,
  // },
  // headerTopRow: { 
  //   flexDirection: "row", 
  //   alignItems: "center", 
  //   justifyContent: "space-between", 
  //   width: "100%" 
  // },
  // backBtn: { 
  //   width: 40, 
  //   height: 40, 
  //   alignItems: "center", 
  //   justifyContent: "center",
  //   borderRadius: 20,
  //   backgroundColor: 'rgba(255,255,255,0.15)',
  // },
  // backArrow: { 
  //   color: "#fff", 
  //   fontSize: 22, 
  //   fontWeight: "600" 
  // },
  
  // // New avatar styles
  // avatarContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 12,
  //   flex: 1,
  //   justifyContent: "center",
  // },
  // avatarCircle: {
  //   width: 48,
  //   height: 48,
  //   borderRadius: 24,
  //   alignItems: "center",
  //   justifyContent: "center",
  //   borderWidth: 2,
  //   borderColor: "rgba(255,255,255,0.3)",
  // },
  // avatarInitials: {
  //   color: "#fff",
  //   fontSize: 18,
  //   fontWeight: "800",
  // },
  // headerTextContainer: {
  //   alignItems: "flex-start",
  // },
  // headerTitle: { 
  //   color: "#fff", 
  //   fontSize: 18, 
  //   fontWeight: "800",
  //   marginBottom: 4,
  // },
  // classBadge: {
  //   backgroundColor: "rgba(255,255,255,0.2)",
  //   paddingHorizontal: 8,
  //   paddingVertical: 2,
  //   borderRadius: 12,
  // },
  // classBadgeText: {
  //   color: "rgba(255,255,255,0.95)",
  //   fontSize: 11,
  //   fontWeight: "600",
  // },
  //   logoutBtn: {
  //   width: 40,
  //   height: 40,
  //   alignItems: "center",
  //   justifyContent: "center",
  //   borderRadius: 20,
  //   backgroundColor: 'rgba(255,255,255,0.15)',
  // },
  // logoutIcon: {
  //   color: "#fff",
  //   fontSize: 20,
  //   fontWeight: "600",
  // },
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