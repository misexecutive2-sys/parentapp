import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl } from "react-native";

import {
  aggregateAndStoreNotifications,
  loadStoredNotifications,
  clearNotificationData,
  AppNotification,
} from "../utils/notificationHelper";

const PRIMARY = "#0047AB";

const modules = [
  { title: "Attendance",      icon: "checkmark-circle-outline",     color: "#0047AB", bg: "#EEF3FF", route: "/Dashboard/attendance"  },
  { title: "Notice Board",    icon: "megaphone-outline",            color: "#7C3AED", bg: "#F5F3FF", route: "/Dashboard/noticeboard" },
  { title: "Exam",            icon: "document-text-outline",        color: "#059669", bg: "#ECFDF5", route: "/Dashboard/exam"        },
  { title: "School Diary",    icon: "book-outline",                 color: "#D97706", bg: "#FFFBEB", route: "/Dashboard/schooldiary" },
  { title: "Insights",        icon: "bar-chart-outline",            color: "#0891B2", bg: "#ECFEFF", route: "/Dashboard/insight"     },
  { title: "Fees",            icon: "wallet-outline",               color: "#DC2626", bg: "#FEF2F2", route: "/Dashboard/fees"        },
  { title: "Message Teacher", icon: "chatbubble-ellipses-outline",  color: "#059669", bg: "#ECFDF5", route: "/Dashboard/message"     },
];

export default function DashboardScreen() {
  const { childId, childName, classname, sectionname } = useLocalSearchParams<{
    childId: string;
    childName: string;
    classname: string;
    sectionname: string;
  }>();

  const [years,          setYears]          = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchYears();
    fetchAndCountNotifications();
  }, []);

useFocusEffect(
  React.useCallback(() => {
    // Only load stored if we already have fresh data (after first fetch)
    // Don't show stale count before fetch completes
    loadStoredNotifications().then((stored) => {
      const freshCount = stored.filter((n) => !n.read).length;
      setUnreadCount(freshCount);
    });
  }, [])
);

  useEffect(() => {
    if (childId && childName && classname && sectionname) {
      AsyncStorage.setItem(
        "selectedChild",
        JSON.stringify({ id: childId, name: childName, classname, sectionname })
      );
    }
  }, [childId, childName, classname, sectionname]);

const fetchAndCountNotifications = async () => {
  try {
    setUnreadCount(0); // reset before fetch so stale count never shows
    const notifications: AppNotification[] = await aggregateAndStoreNotifications();
    setUnreadCount(notifications.filter((n) => !n.read).length);
  } catch (err) {
    console.error("Dashboard notification fetch error:", err);
    setUnreadCount(0);
  }
};

  const fetchYears = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        "https://connect.schoolaid.in/api/app/financial-years",
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data ?? [];
      setYears(arr);
      if (arr.length > 0) {
        setSelectedYearId(arr[0].id);
        await AsyncStorage.setItem("selectedYearId",    String(arr[0].id));
        await AsyncStorage.setItem("selectedYearLabel", arr[0].year ?? String(arr[0].id));
      }
    } catch (err) {
      console.error("Failed to fetch years:", err);
    }
  };

const handleYearChange = async (yearId: number) => {
  setSelectedYearId(yearId);
  const y = years.find((yr) => yr.id === yearId);
  await AsyncStorage.setItem("selectedYearId",    String(yearId));
  await AsyncStorage.setItem("selectedYearLabel", y?.year ?? String(yearId));
  
  // Re-fetch notifications for the new year immediately
  await fetchAndCountNotifications();
};

  const handleLogout = () => {
    setSidebarOpen(false);
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes", style: "destructive",
        onPress: async () => {
          await clearNotificationData();
          await AsyncStorage.multiRemove([
            "token", "user", "selectedChild",
            "selectedYearId", "selectedYearLabel",
          ]);
          router.replace("/login");
        },
      },
    ]);
  };
const onRefresh = async () => {
  setRefreshing(true);
  await fetchAndCountNotifications();
  setRefreshing(false);
};

  const handleSwitchChild = () => {
    setSidebarOpen(false);
    router.replace("/addchild");
  };

  const getInitials = (name: string) => {
    const parts = (name ?? "").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name ?? "S").substring(0, 2).toUpperCase();
  };

  const navigateTo = (route: string) => {
    router.push({
      pathname: route,
      params: { yearId: selectedYearId, childId, childName, classname, sectionname },
    });
  };

  const handleBellPress = () => {
    router.push({
      pathname: "/Dashboard/notifications",
      params: { childId, childName, classname, sectionname },
    });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const selectedYearLabel = years.find((y) => y.id === selectedYearId)?.year ?? "";

  return (
    // ✅ KEY FIX: SafeAreaView with edges={['top']} + backgroundColor = PRIMARY
    // This makes the status bar area blue instead of white
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── HEADER ─────────────────────────────────────────── */}
<View style={styles.header}>

  {/* Top bar */}
  <View style={styles.topBar}>

    {/* Left side - Menu + Year */}
    <View style={styles.topBarLeft}>
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => setSidebarOpen(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="menu-outline" size={22} color="#fff" />
      </TouchableOpacity>

      {selectedYearLabel && (
        <View style={styles.yearPill}>
          <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.9)" />
          <Text style={styles.yearPillText}>{selectedYearLabel}</Text>
        </View>
      )}
    </View>

    {/* Right side - School Aid */}
    <View style={styles.topBarRight}>
      <Text style={styles.schoolLabel}>School Aid</Text>
      <Text style={styles.subLabel}>Parent Portal</Text>
    </View>

  </View>

  {/* Child card */}
  <View style={styles.childCard}>
    <View style={styles.childAvatarWrap}>
      <View style={styles.childAvatar}>
        <Text style={styles.childAvatarText}>{getInitials(childName ?? "")}</Text>
      </View>
      <View style={styles.onlineDot} />
    </View>

    <View style={styles.childInfo}>
      <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
      <Text style={styles.childName} numberOfLines={1} ellipsizeMode="tail">
        {childName}
      </Text>
      <View style={styles.badgeRow}>
        <View style={styles.infoBadge}>
          <Ionicons name="school-outline" size={10} color={PRIMARY} />
          <Text style={styles.infoBadgeText}>Class {classname}</Text>
        </View>
        <Text style={styles.badgeDot}>·</Text>
        <View style={styles.infoBadge}>
          <Ionicons name="layers-outline" size={10} color={PRIMARY} />
          <Text style={styles.infoBadgeText}>Sec {sectionname}</Text>
        </View>
      </View>
    </View>

    {/* Bell */}
    <TouchableOpacity
      style={styles.notifBtn}
      onPress={handleBellPress}
      activeOpacity={0.8}
    >
      <Ionicons name="notifications-outline" size={18} color={PRIMARY} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  </View>

</View>

      {/* ── MODULE LIST ────────────────────────────────────── */}
 <ScrollView
  contentContainerStyle={styles.grid}
  showsVerticalScrollIndicator={false}
  style={styles.scrollBg}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[PRIMARY]}        // Android spinner color
      tintColor={PRIMARY}       // iOS spinner color
      progressBackgroundColor="#fff"
    />
  }
>
        <Text style={styles.gridLabel}>Quick Access</Text>
        <View style={styles.gridWrap}>
          {modules.map((mod, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.card}
              onPress={() => navigateTo(mod.route)}
              activeOpacity={0.82}
            >
              <View style={[styles.cardAccent, { backgroundColor: mod.color }]} />
              <View style={[styles.cardIconWrap, { backgroundColor: mod.bg }]}>
                <Ionicons name={mod.icon as any} size={26} color={mod.color} />
              </View>
              <Text style={styles.cardText}>{mod.title}</Text>
              <View style={[styles.cardArrow, { backgroundColor: mod.bg }]}>
                <Ionicons name="chevron-forward-outline" size={13} color={mod.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── SIDEBAR ────────────────────────────────────────── */}
<Modal
  visible={sidebarOpen}
  transparent
  animationType="slide"
  onRequestClose={() => setSidebarOpen(false)}
>
  <View style={styles.overlay}>

    {/* Sidebar - LEFT */}
    <View style={styles.sidebar}>

      {/* Sidebar header */}
      <View style={styles.sbHeader}>
        <View style={styles.sbLogoRow}>
          <View style={styles.sbLogoBox}>
            <Image source={require("../../assets/logo.png")} style={styles.sbLogo} />
          </View>
          <Text style={styles.sbBrandName}>School Aid</Text>
          <TouchableOpacity
            style={styles.sbClose}
            onPress={() => setSidebarOpen(false)}
          >
            <Ionicons name="close-outline" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        <View style={styles.sbDivider} />

        <View style={styles.sbChildRow}>
          <View style={styles.sbAvatarCircle}>
            <Text style={styles.sbAvatarText}>{getInitials(childName ?? "")}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sbName} numberOfLines={1}>{childName}</Text>
            <Text style={styles.sbMeta}>Class {classname} · Sec {sectionname}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Year picker */}
        <View style={styles.sbSection}>
          <Text style={styles.sbSectionLabel}>ACADEMIC YEAR</Text>
          {years.length > 0 && (
            <View style={styles.sbPickerBox}>
              <Picker
                selectedValue={selectedYearId}
                onValueChange={(val) => handleYearChange(val)}
                style={styles.sbPicker}
                dropdownIconColor={PRIMARY}
                mode="dropdown"
              >
                {years.map((yr) => (
                  <Picker.Item
                    key={yr.id}
                    label={yr.year ?? String(yr.id)}
                    value={yr.id}
                    color={PRIMARY}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Quick links */}
        <View style={styles.sbSection}>
          <Text style={styles.sbSectionLabel}>QUICK LINKS</Text>

          <TouchableOpacity
            style={styles.sbItem}
            onPress={() => { setSidebarOpen(false); navigateTo("/Dashboard/message"); }}
          >
            <View style={[styles.sbItemIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#1565C0" />
            </View>
            <Text style={styles.sbItemLabel}>Message Teacher</Text>
            <Ionicons name="chevron-forward-outline" size={15} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sbItem}
            onPress={() => { setSidebarOpen(false); router.push("/Dashboard/setting"); }}
          >
            <View style={[styles.sbItemIcon, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="settings-outline" size={16} color="#6A1B9A" />
            </View>
            <Text style={styles.sbItemLabel}>Settings</Text>
            <Ionicons name="chevron-forward-outline" size={15} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sbItem} onPress={handleSwitchChild}>
            <View style={[styles.sbItemIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="people-outline" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.sbItemLabel}>Switch Child</Text>
            <Ionicons name="chevron-forward-outline" size={15} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.sbLogout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#C62828" />
          <Text style={styles.sbLogoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>

    {/* Tap to close - RIGHT */}
    <TouchableOpacity
      style={styles.overlayBg}
      onPress={() => setSidebarOpen(false)}
      activeOpacity={1}
    />

  </View>
</Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ✅ FIX: backgroundColor PRIMARY so status bar notch area is blue
  safe:            { flex: 1, backgroundColor: PRIMARY },
  scrollBg:        { flex: 1, backgroundColor: PRIMARY },

  // Header
  header:          { backgroundColor: PRIMARY, paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, elevation: 8, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
topBar:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
topBarLeft:  { flexDirection: "row", alignItems: "center", gap: 8 },
topBarRight: { alignItems: "flex-end" },
  schoolLabel:     { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  subLabel:        { fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  yearPill:        { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  yearPillText:    { fontSize: 11, color: "#fff", fontWeight: "700" },
  menuBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },

  // Child card
  childCard:       { flexDirection: "row", alignItems: "center", marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 12, gap: 12, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  childAvatarWrap: { position: "relative" },
  childAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: `${PRIMARY}18`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: `${PRIMARY}30` },
  childAvatarText: { fontSize: 17, fontWeight: "800", color: PRIMARY },
  onlineDot:       { position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E", borderWidth: 2, borderColor: "#fff" },
  childInfo:       { flex: 1, gap: 2 },
  greetingText:    { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  childName:       { fontSize: 15, fontWeight: "800", color: "#1F2937" },
  badgeRow:        { flexDirection: "row", alignItems: "center", gap: 4 },
  infoBadge:       { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: `${PRIMARY}10`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  infoBadgeText:   { fontSize: 10, fontWeight: "600", color: PRIMARY },
  badgeDot:        { fontSize: 10, color: "#D1D5DB" },
  notifBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: `${PRIMARY}10`, alignItems: "center", justifyContent: "center", position: "relative" },
  badge:           { position: "absolute", top: -4, right: -4, backgroundColor: "#EF4444", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 2, borderColor: "#fff" },
  badgeText:       { fontSize: 9, color: "#fff", fontWeight: "900" },

  // Module grid
  grid:            { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  gridLabel:       { fontSize: 12, fontWeight: "800", color: "#9CA3AF", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 },
  gridWrap:        { gap: 10 },
  card:            { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 18, paddingVertical: 18, paddingHorizontal: 16, gap: 14, elevation: 3, shadowColor: "#0047AB", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, borderWidth: 1, borderColor: "#EEF2FB", overflow: "hidden" },
  cardAccent:      { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  cardIconWrap:    { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardText:        { flex: 1, fontSize: 15, fontWeight: "700", color: "#1F2937" },
  cardArrow:       { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  // Sidebar
overlay: {
  flex: 1,
  flexDirection: "row",
  backgroundColor: "rgba(0,0,0,0.4)",
},
sidebar: {
  width: 300,
  height: "100%",
  backgroundColor: "#fff",
  shadowColor: "#000",
  shadowOffset: { width: 2, height: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
  elevation: 15,
},
overlayBg: {
  flex: 1,  // dark area on the right, tap to close
},
  sbHeader:        { backgroundColor: PRIMARY, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16 },
  sbLogoRow:       { flexDirection: "row", alignItems: "center", gap: 10 },
  sbLogoBox:       { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  sbLogo:          { width: 30, height: 30, resizeMode: "contain" },
  sbBrandName:     { flex: 1, fontSize: 16, fontWeight: "800", color: "#fff" },
  sbClose:         { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  sbDivider:       { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 14 },
  sbChildRow:      { flexDirection: "row", alignItems: "center", gap: 12 },
  sbAvatarCircle:  { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  sbAvatarText:    { fontSize: 16, fontWeight: "800", color: "#fff" },
  sbName:          { fontSize: 14, fontWeight: "800", color: "#fff" },
  sbMeta:          { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  sbSection:       { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  sbSectionLabel:  { fontSize: 10, fontWeight: "700", color: "#9CA3AF", letterSpacing: 1, marginBottom: 10, paddingBottom: 4 },
  sbPickerBox:     { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden", backgroundColor: "#F9FAFB" },
  sbPicker:        { height: 50, color: PRIMARY },
  sbItem:          { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  sbItemIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sbItemLabel:     { flex: 1, fontSize: 14, fontWeight: "600", color: "#374151" },
  sbLogout:        { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 24, marginBottom: 32, backgroundColor: "#FEE2E2", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  sbLogoutText:    { fontSize: 14, fontWeight: "800", color: "#C62828" },

});