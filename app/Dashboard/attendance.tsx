// app/Dashboard/attendance.tsx
// STUDENT SIDE — view attendance, apply leave, view leave history

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, ActivityIndicator, Modal, TextInput, FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";

const API_BASE = "https://endurable-even-distant.ngrok-free.dev";

type AttendanceStatus = "P" | "A" | "L" | "H" | null;
type FilterType = "P" | "A" | "L" | "H" | null;

interface DayAttendance { date: string; status: AttendanceStatus; }
interface LeaveRecord { id: number; from_date: string; to_date: string; reason: string; status: "Pending" | "Approved" | "Rejected"; }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PRIMARY = "#0047AB";

export default function AttendanceScreen() {
  const router = useRouter();
  const now = new Date();

  const [childName,    setChildName]    = useState("Student");
  const [childClass,   setChildClass]   = useState("—");
  const [childSection, setChildSection] = useState("—");
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear());
  const [calendarData, setCalendarData] = useState<DayAttendance[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [loading,      setLoading]      = useState(false);
  const [activeModal,  setActiveModal]  = useState<"monthly" | "session" | "apply" | "history" | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);
  const [leaveFrom,    setLeaveFrom]    = useState("");
  const [leaveTo,      setLeaveTo]      = useState("");
  const [leaveReason,  setLeaveReason]  = useState("");
  const [applyLoading, setApplyLoading] = useState(false);

  const loadChild = async () => {
    try {
      const raw = await AsyncStorage.getItem("selectedChild");
      if (raw) {
        const c = JSON.parse(raw);
        setChildName(c.name ?? "Student");
        setChildClass(c.classname ?? "—");
        setChildSection(c.sectionname ?? "—");
      }
    } catch {}
  };

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setActiveFilter(null);
    try {
      const res  = await fetch(`${API_BASE}/attendance_calendar`);
      const data = await res.json();
      setCalendarData(data);
    } catch {
      Alert.alert("Error", "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => { loadChild(); fetchCalendar(); }, [fetchCalendar]);

  const fetchLeaveHistory = async () => {
    try {
      const res  = await fetch(`${API_BASE}/attendance_leave_history`);
      const data = await res.json();
      setLeaveHistory(data);
    } catch { Alert.alert("Error", "Failed to load leave history."); }
  };

  // ── All stats derived from calendarData — no separate API needed ──
  const presentDays  = calendarData.filter((d) => d.status === "P");
  const absentDays   = calendarData.filter((d) => d.status === "A");
  const leaveDays    = calendarData.filter((d) => d.status === "L");
  const holidayDays  = calendarData.filter((d) => d.status === "H");
  const workingDays  = calendarData.filter((d) => d.status !== "H").length;
  const percentage   = workingDays > 0 ? ((presentDays.length / workingDays) * 100).toFixed(1) : "0.0";

  const monthlyDetail = {
    total_days: calendarData.length,
    present:    presentDays.length,
    absent:     absentDays.length,
    leave:      leaveDays.length,
    holidays:   holidayDays.length,
    percentage: Number(percentage),
  };

  // Session data: each school day = Morning + Afternoon
  const sessionData = calendarData
    .filter((d) => d.status !== "H" && d.status !== null)
    .flatMap((d) => [
      { date: d.date, session: "Morning",   status: d.status },
      { date: d.date, session: "Afternoon", status: d.status },
    ])
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleFilterCard = (filter: FilterType) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
  };

  const handleApplyLeave = async () => {
    if (!leaveFrom || !leaveTo || !leaveReason.trim()) return Alert.alert("Error", "Please fill in all fields.");
    setApplyLoading(true);
    try {
      const res = await fetch(`${API_BASE}/attendance_leave_history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_date: leaveFrom, to_date: leaveTo, reason: leaveReason, status: "Pending" }),
      });
      if (!res.ok) throw new Error("Failed");
      Alert.alert("Success", "Leave application submitted!", [{ text: "OK", onPress: () => setActiveModal(null) }]);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to apply leave.");
    } finally { setApplyLoading(false); }
  };

  const handleLogout = () =>
    Alert.alert("Logout", "Do you really want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: async () => {
        await AsyncStorage.multiRemove(["token","selectedChild","selectedYearId","selectedYearLabel"]);
        router.replace("/login");
      }},
    ], { cancelable: true });

  const getDaysInMonth     = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m: number, y: number) => new Date(y, m, 1).getDay();

  const getStatusForDate = (day: number): AttendanceStatus => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarData.find((d) => d.date === dateStr)?.status ?? null;
  };

  const getDayStyle = (status: AttendanceStatus) => {
    switch (status) {
      case "P": return { bg: "#dcfce7", border: "#16a34a", text: "#16a34a" };
      case "A": return { bg: "#fee2e2", border: "#dc2626", text: "#dc2626" };
      case "L": return { bg: "#fef9c3", border: "#ca8a04", text: "#ca8a04" };
      case "H": return { bg: "#f3f4f6", border: "#9ca3af", text: "#9ca3af" };
      default:  return { bg: "#fff",    border: "#E0E6F0", text: "#1A1A2E" };
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const getLeaveStatusStyle = (status: LeaveRecord["status"]) => {
    if (status === "Approved") return { bg: "#dcfce7", text: "#16a34a" };
    if (status === "Rejected") return { bg: "#fee2e2", text: "#dc2626" };
    return { bg: "#fef9c3", text: "#ca8a04" };
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay    = getFirstDayOfMonth(currentMonth, currentYear);
    const isThisMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    return (
      <View style={styles.calendarGrid}>
        {DAYS.map((d) => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={styles.calendarCell} />;
          const status     = getStatusForDate(day);
          const isToday    = isThisMonth && day === now.getDate();
          const isFiltered = activeFilter !== null && status !== activeFilter;
          const s          = getDayStyle(status);
          return (
            <View key={day} style={[
              styles.calendarCell,
              { backgroundColor: isFiltered ? "#f9f9f9" : s.bg, borderColor: isFiltered ? "#eee" : s.border },
              isToday && !isFiltered && styles.todayCell,
              isFiltered && { opacity: 0.25 },
            ]}>
              <Text style={[
                styles.calendarDayText,
                { color: isFiltered ? "#ccc" : s.text },
                isToday && !isFiltered && styles.todayText,
              ]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const filterCards = [
    { label: "Present", status: "P" as FilterType, count: presentDays.length,  color: "#16a34a", bg: "#dcfce7" },
    { label: "Absent",  status: "A" as FilterType, count: absentDays.length,   color: "#dc2626", bg: "#fee2e2" },
    { label: "Leave",   status: "L" as FilterType, count: leaveDays.length,    color: "#ca8a04", bg: "#fef9c3" },
    { label: "Holiday", status: "H" as FilterType, count: holidayDays.length,  color: "#9ca3af", bg: "#f3f4f6" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.headerTop, { backgroundColor: PRIMARY }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Welcome, {childName}</Text>
          <View style={styles.backBtn} />
        </View>
        <Text style={styles.childSubtitle}>Class {childClass} {"\u00B7"} Section {childSection}</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/addchild")}>
            <Text style={styles.headerBtnText}>Switch Child</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
            <Text style={styles.headerBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={styles.navArrow}>{"<<"}</Text></TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={styles.navArrow}>{">>"}</Text></TouchableOpacity>
        </View>

        {!loading && calendarData.length > 0 && (
          <View style={styles.filterRow}>
            {filterCards.map((card) => {
              const isActive = activeFilter === card.status;
              return (
                <TouchableOpacity
                  key={card.label}
                  style={[styles.filterCard, { backgroundColor: card.bg, borderColor: card.color, borderWidth: isActive ? 2.5 : 1.5 }]}
                  onPress={() => handleFilterCard(card.status)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterCount, { color: card.color }]}>{card.count}</Text>
                  <Text style={[styles.filterLabel, { color: card.color }]}>{card.label}</Text>
                  {isActive && <View style={[styles.filterActiveDot, { backgroundColor: card.color }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeFilter && (
          <TouchableOpacity style={styles.filterBanner} onPress={() => setActiveFilter(null)}>
            <Text style={styles.filterBannerText}>
              {"Showing: " + filterCards.find(f => f.status === activeFilter)?.label + " days   Tap to clear X"}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.calendarCard}>
          {loading
            ? <ActivityIndicator size="large" color={PRIMARY} style={{ padding: 40 }} />
            : renderCalendar()
          }
        </View>

        {!loading && calendarData.length > 0 && (
          <View style={styles.percentageBar}>
            <Text style={styles.percentageLabel}>Attendance</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: (Math.min(Number(percentage), 100) + "%") as any }]} />
            </View>
            <Text style={styles.percentageValue}>{percentage}%</Text>
          </View>
        )}

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: PRIMARY }]} onPress={() => setActiveModal("monthly")} activeOpacity={0.85}>
            <Text style={styles.actionCardIcon}>{"📊"}</Text>
            <Text style={styles.actionCardText}>{"Monthly\nDetails"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: "#0e7490" }]} onPress={() => setActiveModal("session")} activeOpacity={0.85}>
            <Text style={styles.actionCardIcon}>{"🕐"}</Text>
            <Text style={styles.actionCardText}>{"Session\nWise"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: "#fff", borderWidth: 1.5, borderColor: PRIMARY }]} onPress={() => { setLeaveFrom(""); setLeaveTo(""); setLeaveReason(""); setActiveModal("apply"); }} activeOpacity={0.85}>
            <Text style={styles.actionCardIcon}>{"📝"}</Text>
            <Text style={[styles.actionCardText, { color: PRIMARY }]}>{"Apply\nLeave"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: "#ca8a04" }]} onPress={async () => { setLeaveHistory([]); setActiveModal("history"); await fetchLeaveHistory(); }} activeOpacity={0.85}>
            <Text style={styles.actionCardIcon}>{"📋"}</Text>
            <Text style={styles.actionCardText}>{"Leave\nHistory"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Monthly Modal */}
      <Modal visible={activeModal === "monthly"} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{"📊 Monthly Details"}</Text>
            <Text style={styles.modalSubtitle}>{MONTHS[currentMonth] + " " + currentYear}</Text>
            <View style={styles.monthlyGrid}>
              {[
                { label: "Total Days", value: monthlyDetail.total_days,       color: PRIMARY   },
                { label: "Present",    value: monthlyDetail.present,          color: "#16a34a" },
                { label: "Absent",     value: monthlyDetail.absent,           color: "#dc2626" },
                { label: "Leave",      value: monthlyDetail.leave,            color: "#ca8a04" },
                { label: "Holidays",   value: monthlyDetail.holidays,         color: "#9ca3af" },
                { label: "Percentage", value: monthlyDetail.percentage + "%", color: "#7c3aed" },
              ].map((item) => (
                <View key={item.label} style={styles.monthlyCell}>
                  <Text style={[styles.monthlyCellNum, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.monthlyCellLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Session Modal */}
      <Modal visible={activeModal === "session"} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>{"🕐 Session Wise Attendance"}</Text>
            <Text style={styles.modalSubtitle}>{MONTHS[currentMonth] + " " + currentYear}</Text>
            {sessionData.length > 0 ? (
              <FlatList
                data={sessionData}
                keyExtractor={(_, i) => i.toString()}
                style={{ width: "100%", marginTop: 10 }}
                renderItem={({ item }) => {
                  const s = getDayStyle(item.status);
                  return (
                    <View style={styles.sessionRow}>
                      <Text style={styles.sessionDate}>{item.date}</Text>
                      <Text style={styles.sessionName}>{item.session}</Text>
                      <View style={[styles.sessionBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
                        <Text style={[styles.sessionBadgeText, { color: s.text }]}>{item.status}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            ) : (
              <Text style={{ color: "#888", marginTop: 20 }}>No session data available.</Text>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Apply Leave Modal */}
      <Modal visible={activeModal === "apply"} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{"📝 Apply Leave"}</Text>
            <Text style={styles.modalSubtitle}>Fill in the details below</Text>
            <Text style={styles.inputLabel}>From Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="e.g. 2026-04-25" placeholderTextColor="#aaa" value={leaveFrom} onChangeText={setLeaveFrom} />
            <Text style={styles.inputLabel}>To Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="e.g. 2026-04-26" placeholderTextColor="#aaa" value={leaveTo} onChangeText={setLeaveTo} />
            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Enter reason..." placeholderTextColor="#aaa" value={leaveReason} onChangeText={setLeaveReason} multiline numberOfLines={3} />
            <TouchableOpacity style={[styles.submitLeaveBtn, applyLoading && { opacity: 0.7 }]} onPress={handleApplyLeave} disabled={applyLoading} activeOpacity={0.85}>
              {applyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitLeaveBtnText}>Submit Application</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Leave History Modal */}
      <Modal visible={activeModal === "history"} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>{"📋 Leave History"}</Text>
            {leaveHistory.length > 0 ? (
              <FlatList
                data={leaveHistory}
                keyExtractor={(item) => item.id.toString()}
                style={{ width: "100%", marginTop: 10 }}
                renderItem={({ item }) => {
                  const s = getLeaveStatusStyle(item.status);
                  return (
                    <View style={styles.historyRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyDates}>{item.from_date + " to " + item.to_date}</Text>
                        <Text style={styles.historyReason}>{item.reason}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: s.text }]}>{item.status}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            ) : (
              <ActivityIndicator color={PRIMARY} style={{ margin: 20 }} />
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA" },
  headerTop: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, alignItems: "center" },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 },
  backBtn: { width: 36, padding: 4 },
  backArrow: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
  childSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", marginBottom: 16 },
  headerBtns: { flexDirection: "row", gap: 12 },
  headerBtn: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10 },
  headerBtnText: { fontWeight: "700", fontSize: 13, color: "#0047AB" },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 22, color: "#0047AB", fontWeight: "800" },
  monthLabel: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  filterRow: { flexDirection: "row", marginHorizontal: 12, marginBottom: 10, gap: 8 },
  filterCard: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", position: "relative" },
  filterCount: { fontSize: 20, fontWeight: "800" },
  filterLabel: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  filterActiveDot: { width: 6, height: 6, borderRadius: 3, position: "absolute", bottom: 6 },
  filterBanner: { marginHorizontal: 12, marginBottom: 8, backgroundColor: "#EFF6FF", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  filterBannerText: { color: "#1D4ED8", fontSize: 12, fontWeight: "600", textAlign: "center" },
  calendarCard: { backgroundColor: "#fff", marginHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#E0E6F0", padding: 10 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayHeader: { width: "14.28%", textAlign: "center", fontSize: 11, fontWeight: "700", color: "#0047AB", paddingBottom: 6 },
  calendarCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#E0E6F0", marginBottom: 3 },
  calendarDayText: { fontSize: 12, fontWeight: "600" },
  todayCell: { borderWidth: 2.5, borderColor: "#0047AB" },
  todayText: { fontWeight: "800" },
  percentageBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginTop: 10, gap: 8 },
  percentageLabel: { fontSize: 12, fontWeight: "700", color: "#555", width: 80 },
  progressBg: { flex: 1, height: 8, backgroundColor: "#E0E6F0", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#16a34a", borderRadius: 4 },
  percentageValue: { fontSize: 13, fontWeight: "800", color: "#16a34a", width: 44, textAlign: "right" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 12, marginTop: 14, gap: 10 },
  actionCard: { width: "47.5%", borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  actionCardIcon: { fontSize: 26, marginBottom: 6 },
  actionCardText: { fontSize: 13, fontWeight: "700", color: "#fff", textAlign: "center", lineHeight: 18 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 16 },
  modalCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0047AB", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: "#888", marginBottom: 16 },
  monthlyGrid: { flexDirection: "row", flexWrap: "wrap", width: "100%", gap: 10, marginBottom: 16 },
  monthlyCell: { width: "30%", backgroundColor: "#F5F7FA", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#E0E6F0" },
  monthlyCellNum: { fontSize: 22, fontWeight: "800" },
  monthlyCellLabel: { fontSize: 11, color: "#888", fontWeight: "600", marginTop: 2 },
  sessionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#E0E6F0", gap: 10 },
  sessionDate: { fontSize: 12, color: "#555", flex: 1 },
  sessionName: { fontSize: 13, fontWeight: "600", color: "#1A1A2E", flex: 1 },
  sessionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  sessionBadgeText: { fontSize: 12, fontWeight: "700" },
  historyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#E0E6F0", width: "100%", gap: 10 },
  historyDates: { fontSize: 12, color: "#555", marginBottom: 2 },
  historyReason: { fontSize: 13, fontWeight: "600", color: "#1A1A2E" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  inputLabel: { alignSelf: "flex-start", fontSize: 12, fontWeight: "700", color: "#0047AB", marginBottom: 4, marginTop: 10 },
  input: { width: "100%", backgroundColor: "#F5F7FA", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1A1A2E", borderWidth: 1, borderColor: "#E0E6F0" },
  inputMultiline: { height: 80, textAlignVertical: "top" },
  submitLeaveBtn: { width: "100%", backgroundColor: "#0047AB", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  submitLeaveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  closeBtn: { marginTop: 12, paddingVertical: 8 },
  closeBtnText: { fontSize: 14, color: "#888", fontWeight: "600" },
});