// dashboard.tsx — replace your existing file with this
// KEY CHANGES:
//  1. Imports aggregateAndStoreNotifications from notificationHelper
//  2. fetchNotifications() called on every dashboard load
//  3. unreadCount populated from real data
//  4. Bell icon navigates to /Dashboard/notifications

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  Modal,
  StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// ── Import the helper ──────────────────────────────────────
import {
  aggregateAndStoreNotifications,
  loadStoredNotifications,
  AppNotification,
} from "../utils/notificationHelper";

const PRIMARY = "#0047AB";

export default function DashboardScreen() {
  const { childId, childName, classname, sectionname } = useLocalSearchParams<{
    childId: string;
    childName: string;
    classname: string;
    sectionname: string;
  }>();

  const [years, setYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const modules = [
    { title: "Attendance",      icon: "📋", route: "/Dashboard/attendance" },
    { title: "Notice Board",    icon: "📢", route: "/Dashboard/noticeboard" },
    { title: "Exam",            icon: "📝", route: "/Dashboard/exam" },
    { title: "School Diary",    icon: "📓", route: "/Dashboard/schooldiary" },
    { title: "Insights",        icon: "📊", route: "/Dashboard/insight" },
    { title: "Fees",            icon: "💰", route: "/Dashboard/fees" },
    { title: "Message Teacher", icon: "💬", route: "/Dashboard/message" },
  ];

  // ── On mount: save child, fetch years, fetch notifications ──
  useEffect(() => {
    fetchYears();
    fetchAndCountNotifications();
  }, []);

  // ── Re-sync bell count every time dashboard comes into focus ──
  // Fires when user navigates back from notifications screen
  useFocusEffect(
    React.useCallback(() => {
      loadStoredNotifications().then((stored) => {
        setUnreadCount(stored.filter((n) => !n.read).length);
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

  // ── Aggregate notices + diary and compute unread count ────
  const fetchAndCountNotifications = async () => {
    try {
      const notifications: AppNotification[] = await aggregateAndStoreNotifications();
      const count = notifications.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error("Dashboard notification fetch error:", err);
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
        await AsyncStorage.setItem("selectedYearId", String(arr[0].id));
        await AsyncStorage.setItem("selectedYearLabel", arr[0].year ?? String(arr[0].id));
      }
    } catch (err) {
      console.error("Failed to fetch years:", err);
    }
  };

  const handleYearChange = async (yearId: number) => {
    setSelectedYearId(yearId);
    const y = years.find((yr) => yr.id === yearId);
    await AsyncStorage.setItem("selectedYearId", String(yearId));
    await AsyncStorage.setItem("selectedYearLabel", y?.year ?? String(yearId));
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "token", "user", "selectedChild", "selectedYearId",
            "selectedYearLabel", "aggregatedNotifications",
          ]);
          router.replace("/login");
        },
      },
    ]);
  };

  const handleSwitchChild = () => { setSidebarOpen(false); router.replace("/addchild"); };

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

  // ── Bell tap → notifications screen ───────────────────────
  const handleBellPress = () => {
    router.push({
      pathname: "/Dashboard/notifications",
      params: { childId, childName, classname, sectionname },
    });
  };

  const selectedYearLabel = years.find((y) => y.id === selectedYearId)?.year ?? "";

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── HEADER ── */}
      <View style={styles.header}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.schoolLabel}>School Aid</Text>
            <Text style={styles.subLabel}>Parent Portal</Text>
          </View>

          <View style={{ flex: 1 }} />

          {selectedYearLabel ? (
            <View style={styles.yearPill}>
              <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.9)" />
              <Text style={styles.yearPillText}>{selectedYearLabel}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setSidebarOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="menu-outline" size={22} color="#fff" />
          </TouchableOpacity>
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

          {/* ── Bell with real unread count ── */}
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

      {/* ── MODULE GRID ── */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {modules.map((mod, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.card}
            onPress={() => navigateTo(mod.route)}
            activeOpacity={0.85}
          >
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIcon}>{mod.icon}</Text>
            </View>
            <Text style={styles.cardText}>{mod.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── SIDEBAR DRAWER ── */}
      <Modal
        visible={sidebarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBg}
            onPress={() => setSidebarOpen(false)}
            activeOpacity={1}
          />
          <View style={styles.sidebar}>
            <View style={styles.sbHeader}>
              <View style={styles.sbLogoRow}>
                <View style={styles.sbLogoBox}>
                  <Image
                    source={require("../../assets/logo.png")}
                    style={styles.sbLogo}
                  />
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

              <TouchableOpacity style={styles.sbLogout} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color="#C62828" />
                <Text style={styles.sbLogoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Keep your existing styles unchanged below ──────────────
const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: "#F4F6FB" },
  header:          { backgroundColor: PRIMARY, paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, elevation: 8, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  topBar:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  topBarLeft:      { gap: 1 },
  schoolLabel:     { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  subLabel:        { fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  yearPill:        { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  yearPillText:    { fontSize: 11, color: "#fff", fontWeight: "700" },
  menuBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
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
  grid:            { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  card:            { width: "30%", backgroundColor: "#fff", borderRadius: 18, paddingVertical: 20, alignItems: "center", gap: 8, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardIconWrap:    { width: 50, height: 50, borderRadius: 25, backgroundColor: `${PRIMARY}10`, alignItems: "center", justifyContent: "center" },
  cardIcon:        { fontSize: 24 },
  cardText:        { fontSize: 11, fontWeight: "700", color: "#374151", textAlign: "center" },
  overlay:         { flex: 1, flexDirection: "row" },
  overlayBg:       { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sidebar:         { width: 290, backgroundColor: "#fff", height: "100%" },
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
  sbSection:       { paddingHorizontal: 16, paddingTop: 20 },
  sbSectionLabel:  { fontSize: 10, fontWeight: "800", color: "#9CA3AF", letterSpacing: 1, marginBottom: 10 },
  sbPickerBox:     { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden", backgroundColor: "#F9FAFB" },
  sbPicker:        { height: 48, color: PRIMARY },
  sbItem:          { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  sbItemIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sbItemLabel:     { flex: 1, fontSize: 14, fontWeight: "600", color: "#374151" },
  sbLogout:        { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 24, marginBottom: 32, backgroundColor: "#FEE2E2", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  sbLogoutText:    { fontSize: 14, fontWeight: "800", color: "#C62828" },
});