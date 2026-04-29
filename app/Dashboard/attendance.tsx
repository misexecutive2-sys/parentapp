import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, ActivityIndicator, Modal, TextInput, FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const API_BASE = "https://endurable-even-distant.ngrok-free.dev";

type AttendanceStatus = "P" | "A" | "L" | "H" | null;
type FilterType       = "P" | "A" | "L" | "H" | null;

interface DayAttendance { date: string; status: AttendanceStatus; }
interface LeaveRecord {
  id:           string;
  from_date:    string;
  to_date:      string;
  reason:       string;
  status:       "Pending" | "Approved" | "Rejected";
  applied_at:   string;
  student_id?:  string;
  student_name?: string;
}

const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS         = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PRIMARY      = "#0047AB";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDisplay(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d} ${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
}

function datesBetween(from: string, to: string): string[] {
  if (!from || !to) return [];
  const result: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    result.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// ── CalendarPicker ────────────────────────────────────────────────────────────

interface CalendarPickerProps {
  fromDate:     string;
  toDate:       string;
  onFromChange: (d: string) => void;
  onToChange:   (d: string) => void;
}

function CalendarPicker({ fromDate, toDate, onFromChange, onToChange }: CalendarPickerProps) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [pickStep,  setPickStep]  = useState<0 | 1>(0);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayPress = (dateStr: string) => {
    if (pickStep === 0) {
      onFromChange(dateStr);
      onToChange("");
      setPickStep(1);
    } else {
      if (dateStr < fromDate) {
        onFromChange(dateStr);
        onToChange(fromDate);
      } else {
        onToChange(dateStr);
      }
      setPickStep(0);
    }
  };

  const todayStr    = now.toISOString().split("T")[0];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={cp.wrap}>
      <View style={cp.header}>
        <TouchableOpacity onPress={prevMonth} style={cp.navBtn}>
          <Text style={cp.navTxt}>{"‹"}</Text>
        </TouchableOpacity>
        <Text style={cp.monthTxt}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={cp.navBtn}>
          <Text style={cp.navTxt}>{"›"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={cp.hint}>
        {pickStep === 0 ? "Tap to set start date" : "Tap to set end date"}
      </Text>

      <View style={cp.grid}>
        {DAYS.map(d => <Text key={d} style={cp.dayHdr}>{d}</Text>)}
        {cells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={cp.cell} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isFrom  = dateStr === fromDate;
          const isTo    = dateStr === toDate;
          const isToday = dateStr === todayStr;
          return (
            <TouchableOpacity
              key={dateStr}
              style={[cp.cell, (isFrom || isTo) && cp.cellSelected]}
              onPress={() => handleDayPress(dateStr)}
              activeOpacity={0.7}
            >
              <Text style={[
                cp.cellTxt,
                (isFrom || isTo)            && cp.cellTxtSelected,
                isToday && !isFrom && !isTo && cp.cellTxtToday,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={cp.selRow}>
        <View style={cp.selBox}>
          <Text style={cp.selLabel}>From</Text>
          <Text style={[cp.selValue, !fromDate && cp.selPlaceholder]}>
            {fromDate ? fmtDisplay(fromDate) : "Not selected"}
          </Text>
        </View>
        <Text style={cp.selArrow}>→</Text>
        <View style={cp.selBox}>
          <Text style={cp.selLabel}>To</Text>
          <Text style={[cp.selValue, !toDate && cp.selPlaceholder]}>
            {toDate ? fmtDisplay(toDate) : "Not selected"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const cp = StyleSheet.create({
  wrap:            { backgroundColor: "#F0F4FF", borderRadius: 14, padding: 12, marginBottom: 12 },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  navBtn:          { padding: 6 },
  navTxt:          { fontSize: 24, color: PRIMARY, fontWeight: "700" },
  monthTxt:        { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  hint:            { fontSize: 11, color: "#888", textAlign: "center", marginBottom: 6 },
  grid:            { flexDirection: "row", flexWrap: "wrap" },
  dayHdr:          { width: "14.28%", textAlign: "center", fontSize: 10, fontWeight: "700", color: PRIMARY, paddingBottom: 4 },
  cell:            { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  cellSelected:    { backgroundColor: PRIMARY, borderRadius: 6 },
  cellTxt:         { fontSize: 12, color: "#1A1A2E" },
  cellTxtSelected: { color: "#fff", fontWeight: "700" },
  cellTxtToday:    { fontWeight: "800", color: PRIMARY },
  selRow:          { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, gap: 8 },
  selBox:          { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#BFDBFE" },
  selLabel:        { fontSize: 10, color: "#888", fontWeight: "600", marginBottom: 2 },
  selValue:        { fontSize: 13, fontWeight: "700", color: PRIMARY },
  selPlaceholder:  { color: "#aaa", fontWeight: "400" },
  selArrow:        { fontSize: 18, color: "#aaa" },
});

// ─────────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────────
export default function AttendanceScreen() {
  const router = useRouter();
  const now    = new Date();

  const [childName,    setChildName]    = useState("Student");
  const [childClass,   setChildClass]   = useState("—");
  const [childSection, setChildSection] = useState("—");
  const [studentId,    setStudentId]    = useState("");
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear());
  const [calendarData, setCalendarData] = useState<DayAttendance[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [loading,      setLoading]      = useState(false);
  const [activeModal,  setActiveModal]  = useState<"monthly" | "session" | "apply" | "history" | null>(null);

  // ── Leave state ──
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [leaveFrom,    setLeaveFrom]    = useState("");
  const [leaveTo,      setLeaveTo]      = useState("");
  const [leaveReason,  setLeaveReason]  = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  // ── Tapped day info ──
  const [tappedDate,  setTappedDate]  = useState<string | null>(null);
  const [tappedLeave, setTappedLeave] = useState<LeaveRecord | null>(null);

  const leaveDatesSet = new Set<string>(
    leaveRecords.flatMap(r => datesBetween(r.from_date, r.to_date))
  );

  const leaveDateMap = new Map<string, LeaveRecord>();
  leaveRecords.forEach(r => {
    datesBetween(r.from_date, r.to_date).forEach(d => leaveDateMap.set(d, r));
  });

  // ── Data fetchers ─────────────────────────────────────────────────────────

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setActiveFilter(null);
    try {
      const res = await fetch(`${API_BASE}/attendance_calendar`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const data = JSON.parse(text);
      setCalendarData(data);
    } catch (error: any) {
      console.error("Failed to fetch calendar:", error);
      Alert.alert("Error", `Failed to load calendar: ${error.message}`);
      setCalendarData([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  const fetchLeaveHistory = useCallback(async (sid: string) => {
    if (!sid) return;
    try {
      const res = await fetch(
        `${API_BASE}/attendance_leave_history?student_id=${sid}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeaveRecords(data);
    } catch (error: any) {
      console.error("Failed to fetch leave history:", error);
      setLeaveRecords([]);
    }
  }, []);

  // ── Bootstrap: load child info + student ID ───────────────────────────────

  useEffect(() => {
    const bootstrap = async () => {
      let sid = "";

      // DEBUG: dump every AsyncStorage key so we know exactly what's stored
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        console.log("=== AsyncStorage keys ===", allKeys);
        for (const key of allKeys) {
          const val = await AsyncStorage.getItem(key);
          console.log(`  [${key}]:`, val?.substring(0, 300));
        }
      } catch (e) {
        console.log("AsyncStorage debug error:", e);
      }

      // 1. Try selectedChild in AsyncStorage
      try {
        const raw = await AsyncStorage.getItem("selectedChild");
        console.log("selectedChild raw:", raw);
        if (raw) {
          const c = JSON.parse(raw);
          console.log("selectedChild object:", JSON.stringify(c));
          setChildName(c.name ?? "Student");
          setChildClass(c.classname ?? "—");
          setChildSection(c.sectionname ?? "—");
          // Try every common field name for the student id
          sid = c.id ?? c.student_id ?? c.studentId ?? c.studentID
              ?? c.userId ?? c.user_id ?? c.admissionNo ?? "";
          console.log("sid from selectedChild:", sid);
        }
      } catch (e) {
        console.log("selectedChild error:", e);
      }

      // 2. Fallback: decode JWT token
      if (!sid) {
        try {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            const base64Url = token.split(".")[1];
            const base64  = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const padded  = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
            const lookup  = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            let binary = "";
            for (let i = 0; i < padded.length; i += 4) {
              const a = lookup.indexOf(padded[i]);
              const b = lookup.indexOf(padded[i + 1]);
              const c = lookup.indexOf(padded[i + 2]);
              const d = lookup.indexOf(padded[i + 3]);
              binary += String.fromCharCode((a << 2) | (b >> 4));
              if (padded[i + 2] !== "=") binary += String.fromCharCode(((b & 15) << 4) | (c >> 2));
              if (padded[i + 3] !== "=") binary += String.fromCharCode(((c & 3) << 6) | d);
            }
            const payload = JSON.parse(
              decodeURIComponent(
                binary.split("").map(ch => "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2)).join("")
              )
            );
            console.log("JWT payload:", JSON.stringify(payload));
            sid = payload.student_id ?? payload.id ?? payload.userId
                ?? payload.user_id ?? payload.admissionNo ?? "";
            console.log("sid from JWT:", sid);
          }
        } catch (e) {
          console.log("JWT decode error:", e);
        }
      }

      console.log("=== Final studentId:", sid || "NOT FOUND ⚠️", "===");

      if (sid) {
        setStudentId(sid);
        fetchLeaveHistory(sid);
      }

      fetchCalendar();
    };

    bootstrap();
  }, []); // runs once on mount

  // Re-fetch calendar when month/year changes
  useEffect(() => {
    fetchCalendar();
  }, [currentMonth, currentYear]);

  // ── Apply leave ───────────────────────────────────────────────────────────

  const handleApplyLeave = async () => {
    if (!leaveFrom)          return Alert.alert("Error", "Please select a start date.");
    if (!leaveTo)            return Alert.alert("Error", "Please select an end date.");
    if (!leaveReason.trim()) return Alert.alert("Error", "Please enter a reason.");
    if (!studentId)          return Alert.alert("Error", "Student ID not found. Please re-login.");

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/attendance_leave_history`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id:   studentId,
          student_name: childName,
          from_date:    leaveFrom,
          to_date:      leaveTo,
          reason:       leaveReason.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await fetchLeaveHistory(studentId);
        setLeaveFrom("");
        setLeaveTo("");
        setLeaveReason("");
        setActiveModal(null);
        Alert.alert("Success", `Leave applied from ${fmtDisplay(leaveFrom)} to ${fmtDisplay(leaveTo)}`);
      } else {
        const errorMsg = result.errors ? result.errors.join(", ") : "Failed to apply leave";
        Alert.alert("Error", errorMsg);
      }
    } catch (error: any) {
      console.error("Error applying leave:", error);
      Alert.alert("Error", `Network error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const presentDays = calendarData.filter(d => d.status === "P");
  const absentDays  = calendarData.filter(d => d.status === "A");
  const leaveDays   = calendarData.filter(d => d.status === "L");
  const holidayDays = calendarData.filter(d => d.status === "H");
  const workingDays = calendarData.filter(d => d.status !== "H").length;
  const percentage  = workingDays > 0 ? ((presentDays.length / workingDays) * 100).toFixed(1) : "0.0";

  const monthlyDetail = {
    total_days: calendarData.length,
    present:    presentDays.length,
    absent:     absentDays.length,
    leave:      leaveDays.length,
    holidays:   holidayDays.length,
    percentage: Number(percentage),
  };

  const sessionData = calendarData
    .filter(d => d.status !== "H" && d.status !== null)
    .flatMap(d => [
      { date: d.date, session: "Morning",   status: d.status },
      { date: d.date, session: "Afternoon", status: d.status },
    ])
    .sort((a, b) => b.date.localeCompare(a.date));

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleFilterCard = (filter: FilterType) =>
    setActiveFilter(prev => prev === filter ? null : filter);

  const handleLogout = () =>
    Alert.alert("Logout", "Do you really want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes", style: "destructive", onPress: async () => {
          await AsyncStorage.multiRemove(["token", "selectedChild", "selectedYearId", "selectedYearLabel"]);
          router.replace("/login");
        }
      },
    ], { cancelable: true });

  const getDaysInMonth     = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m: number, y: number) => new Date(y, m, 1).getDay();

  const getStatusForDate = (day: number): AttendanceStatus => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (leaveDatesSet.has(dateStr)) return "L";
    return calendarData.find(d => d.date === dateStr)?.status ?? null;
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
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const getLeaveStatusStyle = (status: LeaveRecord["status"]) => {
    if (status === "Approved") return { bg: "#dcfce7", text: "#16a34a" };
    if (status === "Rejected") return { bg: "#fee2e2", text: "#dc2626" };
    return { bg: "#fef9c3", text: "#ca8a04" };
  };

  const handleCalendarDayPress = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (tappedDate === dateStr) {
      setTappedDate(null);
      setTappedLeave(null);
      return;
    }
    setTappedDate(dateStr);
    setTappedLeave(leaveDateMap.get(dateStr) ?? null);
  };

  // ── Calendar renderer ─────────────────────────────────────────────────────

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay    = getFirstDayOfMonth(currentMonth, currentYear);
    const isThisMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
      <View>
        <View style={styles.calendarGrid}>
          {DAYS.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
          {cells.map((day, idx) => {
            if (!day) return <View key={`e-${idx}`} style={styles.calendarCell} />;
            const status     = getStatusForDate(day);
            const isToday    = isThisMonth && day === now.getDate();
            const isFiltered = activeFilter !== null && status !== activeFilter;
            const s          = getDayStyle(status);
            const dateStr    = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isLocalL   = leaveDatesSet.has(dateStr);
            const isTapped   = tappedDate === dateStr;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.calendarCell,
                  { backgroundColor: isFiltered ? "#f9f9f9" : s.bg, borderColor: isFiltered ? "#eee" : s.border },
                  isToday  && !isFiltered && styles.todayCell,
                  isTapped && !isFiltered && styles.tappedCell,
                  isFiltered && { opacity: 0.25 },
                ]}
                onPress={() => handleCalendarDayPress(day)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.calendarDayText,
                  { color: isFiltered ? "#ccc" : s.text },
                  isToday && !isFiltered && styles.todayText,
                ]}>
                  {day}
                </Text>
                {isLocalL && !isFiltered && <View style={styles.leaveDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tapped day info panel */}
        {tappedDate && (() => {
          const status = calendarData.find(d => d.date === tappedDate)?.status
                         ?? (leaveDatesSet.has(tappedDate) ? "L" : null);
          const s      = getDayStyle(status);
          const statusLabels: Record<string, string> = { P: "Present", A: "Absent", L: "Leave", H: "Holiday" };

          return (
            <View style={styles.dayInfoPanel}>
              <View style={styles.dayInfoHeader}>
                <Text style={styles.dayInfoDate}>{fmtDisplay(tappedDate)}</Text>
                {status && (
                  <View style={[styles.dayInfoBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
                    <Text style={[styles.dayInfoBadgeText, { color: s.text }]}>
                      {statusLabels[status] ?? status}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => { setTappedDate(null); setTappedLeave(null); }}
                  style={styles.dayInfoClose}
                >
                  <Text style={styles.dayInfoCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              {tappedLeave ? (
                <View style={styles.dayInfoBody}>
                  <Text style={styles.dayInfoReasonLabel}>Reason</Text>
                  <Text style={styles.dayInfoReason}>{tappedLeave.reason}</Text>
                  <View style={styles.dayInfoMeta}>
                    <Text style={styles.dayInfoMetaTxt}>
                      {fmtDisplay(tappedLeave.from_date)} → {fmtDisplay(tappedLeave.to_date)}
                    </Text>
                    <View style={[styles.dayInfoStatusBadge, { backgroundColor: getLeaveStatusStyle(tappedLeave.status).bg }]}>
                      <Text style={[styles.dayInfoStatusTxt, { color: getLeaveStatusStyle(tappedLeave.status).text }]}>
                        {tappedLeave.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={styles.dayInfoEmpty}>
                  {status === "P" ? "Attended school on this day." :
                   status === "A" ? "Absent on this day." :
                   status === "H" ? "School holiday." :
                   "No details available for this day."}
                </Text>
              )}
            </View>
          );
        })()}
      </View>
    );
  };

  const filterCards = [
    { label: "Present", status: "P" as FilterType, count: presentDays.length,  color: "#16a34a", bg: "#dcfce7" },
    { label: "Absent",  status: "A" as FilterType, count: absentDays.length,   color: "#dc2626", bg: "#fee2e2" },
    { label: "Leave",   status: "L" as FilterType, count: leaveRecords.length, color: "#ca8a04", bg: "#fef9c3" },
    { label: "Holiday", status: "H" as FilterType, count: holidayDays.length,  color: "#9ca3af", bg: "#f3f4f6" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={[styles.headerTop, { backgroundColor: PRIMARY }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{"↩"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Welcome, {childName}</Text>
          <View style={styles.backBtn} />
        </View>
        <Text style={styles.childSubtitle}>Class : {childClass} {"\u00B7"} Section : {childSection}</Text>
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
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={styles.navArrow}>{"<<"}</Text></TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={styles.navArrow}>{">>"}</Text></TouchableOpacity>
        </View>

        {/* Filter cards */}
        {!loading && (
          <View style={styles.filterRow}>
            {filterCards.map(card => {
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
              {"Showing: " + filterCards.find(f => f.status === activeFilter)?.label + " days   Tap to clear ✕"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Main calendar */}
        <View style={styles.calendarCard}>
          {loading
            ? <ActivityIndicator size="large" color={PRIMARY} style={{ padding: 40 }} />
            : renderCalendar()
          }
        </View>

        {leaveRecords.length > 0 && (
          <View style={styles.legendRow}>
            <View style={styles.leaveDotLegend} />
            <Text style={styles.legendTxt}>Applied leave (tap a leave day to see reason)</Text>
          </View>
        )}

        {/* Progress bar */}
        {!loading && (
          <View style={styles.percentageBar}>
            <Text style={styles.percentageLabel}>Attendance</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.min(Number(percentage), 100)}%` as any }]} />
            </View>
            <Text style={styles.percentageValue}>{percentage}%</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: PRIMARY }]} onPress={() => setActiveModal("monthly")} activeOpacity={0.85}>
            <Text style={styles.actionCardIcon}>{"📊"}</Text>
            <Text style={styles.actionCardText}>{"Monthly\nDetails"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: "#0e7490" }]} onPress={() => setActiveModal("session")} activeOpacity={0.85}>
            <Text style={styles.actionCardIcon}>{"🕐"}</Text>
            <Text style={styles.actionCardText}>{"Session\nWise"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#fff", borderWidth: 1.5, borderColor: PRIMARY }]}
            onPress={() => { setLeaveFrom(""); setLeaveTo(""); setLeaveReason(""); setActiveModal("apply"); }}
            activeOpacity={0.85}
          >
            <Text style={styles.actionCardIcon}>{"📝"}</Text>
            <Text style={[styles.actionCardText, { color: PRIMARY }]}>{"Apply\nLeave"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#ca8a04" }]}
            onPress={() => setActiveModal("history")}
            activeOpacity={0.85}
          >
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
              ].map(item => (
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
          <View style={[styles.modalCard, { maxHeight: "92%" }]}>
            <Text style={styles.modalTitle}>{"📝 Apply Leave"}</Text>
            <Text style={styles.modalSubtitle}>Pick dates then enter reason</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
              <CalendarPicker
                fromDate={leaveFrom}
                toDate={leaveTo}
                onFromChange={setLeaveFrom}
                onToChange={setLeaveTo}
              />
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Enter reason for leave..."
                placeholderTextColor="#aaa"
                value={leaveReason}
                onChangeText={setLeaveReason}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.submitLeaveBtn, submitting && styles.submitLeaveBtnDisabled]}
                onPress={handleApplyLeave}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.submitLeaveBtnText}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Leave History Modal */}
      <Modal visible={activeModal === "history"} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>{"📋 Leave History"}</Text>
            {leaveRecords.length === 0 ? (
              <Text style={{ color: "#888", marginTop: 20, marginBottom: 12 }}>No leave applications yet.</Text>
            ) : (
              <FlatList
                data={leaveRecords}
                keyExtractor={item => item.id}
                style={{ width: "100%", marginTop: 10 }}
                renderItem={({ item }) => {
                  const s = getLeaveStatusStyle(item.status);
                  return (
                    <View style={styles.historyRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyDates}>
                          {fmtDisplay(item.from_date)} → {fmtDisplay(item.to_date)}
                        </Text>
                        <Text style={styles.historyReason}>{item.reason}</Text>
                        <Text style={styles.historyApplied}>
                          Applied: {new Date(item.applied_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: s.text }]}>{item.status}</Text>
                      </View>
                    </View>
                  );
                }}
              />
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
  safe:              { flex: 1, backgroundColor: "#F5F7FA" },
  headerTop:         { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, alignItems: "center" },
  headerTopRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 },
  backBtn:           { width: 36, padding: 4 },
  backArrow:         { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerTitle:       { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
  childSubtitle:     { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", marginBottom: 16 },
  headerBtns:        { flexDirection: "row", gap: 12 },
  headerBtn:         { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10 },
  headerBtnText:     { fontWeight: "700", fontSize: 13, color: "#0047AB" },
  monthNav:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  navBtn:            { padding: 8 },
  navArrow:          { fontSize: 22, color: "#0047AB", fontWeight: "800" },
  monthLabel:        { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  filterRow:         { flexDirection: "row", marginHorizontal: 12, marginBottom: 10, gap: 8 },
  filterCard:        { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", position: "relative" },
  filterCount:       { fontSize: 20, fontWeight: "800" },
  filterLabel:       { fontSize: 10, fontWeight: "700", marginTop: 2 },
  filterActiveDot:   { width: 6, height: 6, borderRadius: 3, position: "absolute", bottom: 6 },
  filterBanner:      { marginHorizontal: 12, marginBottom: 8, backgroundColor: "#EFF6FF", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  filterBannerText:  { color: "#1D4ED8", fontSize: 12, fontWeight: "600", textAlign: "center" },
  calendarCard:      { backgroundColor: "#fff", marginHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#E0E6F0", padding: 10 },
  calendarGrid:      { flexDirection: "row", flexWrap: "wrap" },
  dayHeader:         { width: "14.28%", textAlign: "center", fontSize: 11, fontWeight: "700", color: "#0047AB", paddingBottom: 6 },
  calendarCell:      { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#E0E6F0", marginBottom: 3 },
  calendarDayText:   { fontSize: 12, fontWeight: "600" },
  todayCell:         { borderWidth: 2.5, borderColor: "#0047AB" },
  todayText:         { fontWeight: "800" },
  tappedCell:        { borderWidth: 2.5, borderColor: "#7c3aed" },
  leaveDot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: "#ca8a04", position: "absolute", bottom: 3 },
  dayInfoPanel:      { marginTop: 10, backgroundColor: "#F8FAFF", borderRadius: 12, borderWidth: 1, borderColor: "#BFDBFE", padding: 12 },
  dayInfoHeader:     { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  dayInfoDate:       { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  dayInfoBadge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  dayInfoBadgeText:  { fontSize: 11, fontWeight: "700" },
  dayInfoClose:      { padding: 4 },
  dayInfoCloseTxt:   { fontSize: 14, color: "#aaa", fontWeight: "700" },
  dayInfoBody:       { gap: 6 },
  dayInfoReasonLabel:{ fontSize: 10, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  dayInfoReason:     { fontSize: 14, fontWeight: "600", color: "#1A1A2E", lineHeight: 20 },
  dayInfoMeta:       { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
  dayInfoMetaTxt:    { fontSize: 11, color: "#888", flex: 1 },
  dayInfoStatusBadge:{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  dayInfoStatusTxt:  { fontSize: 11, fontWeight: "700" },
  dayInfoEmpty:      { fontSize: 13, color: "#888", fontStyle: "italic" },
  legendRow:         { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 6, gap: 6 },
  leaveDotLegend:    { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ca8a04" },
  legendTxt:         { fontSize: 11, color: "#888" },
  percentageBar:     { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginTop: 10, gap: 8 },
  percentageLabel:   { fontSize: 12, fontWeight: "700", color: "#555", width: 80 },
  progressBg:        { flex: 1, height: 8, backgroundColor: "#E0E6F0", borderRadius: 4, overflow: "hidden" },
  progressFill:      { height: 8, backgroundColor: "#16a34a", borderRadius: 4 },
  percentageValue:   { fontSize: 13, fontWeight: "800", color: "#16a34a", width: 44, textAlign: "right" },
  actionsGrid:       { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 12, marginTop: 14, gap: 10 },
  actionCard:        { width: "47.5%", borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  actionCardIcon:    { fontSize: 26, marginBottom: 6 },
  actionCardText:    { fontSize: 13, fontWeight: "700", color: "#fff", textAlign: "center", lineHeight: 18 },
  modalBg:           { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 16 },
  modalCard:         { backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  modalTitle:        { fontSize: 18, fontWeight: "800", color: "#0047AB", marginBottom: 4 },
  modalSubtitle:     { fontSize: 13, color: "#888", marginBottom: 12 },
  monthlyGrid:       { flexDirection: "row", flexWrap: "wrap", width: "100%", gap: 10, marginBottom: 16 },
  monthlyCell:       { width: "30%", backgroundColor: "#F5F7FA", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#E0E6F0" },
  monthlyCellNum:    { fontSize: 22, fontWeight: "800" },
  monthlyCellLabel:  { fontSize: 11, color: "#888", fontWeight: "600", marginTop: 2 },
  sessionRow:        { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#E0E6F0", gap: 10 },
  sessionDate:       { fontSize: 12, color: "#555", flex: 1 },
  sessionName:       { fontSize: 13, fontWeight: "600", color: "#1A1A2E", flex: 1 },
  sessionBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  sessionBadgeText:  { fontSize: 12, fontWeight: "700" },
  historyRow:        { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#E0E6F0", width: "100%", gap: 10 },
  historyDates:      { fontSize: 12, color: "#555", marginBottom: 2 },
  historyReason:     { fontSize: 13, fontWeight: "600", color: "#1A1A2E" },
  historyApplied:    { fontSize: 11, color: "#aaa", marginTop: 2 },
  statusBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText:   { fontSize: 12, fontWeight: "700" },
  inputLabel:        { alignSelf: "flex-start", fontSize: 12, fontWeight: "700", color: "#0047AB", marginBottom: 4, marginTop: 4 },
  input:             { width: "100%", backgroundColor: "#F5F7FA", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1A1A2E", borderWidth: 1, borderColor: "#E0E6F0" },
  inputMultiline:    { height: 80, textAlignVertical: "top" },
  submitLeaveBtn:    { width: "100%", backgroundColor: "#0047AB", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  submitLeaveBtnDisabled: { backgroundColor: "#ccc", opacity: 0.7 },
  submitLeaveBtnText:{ color: "#fff", fontSize: 15, fontWeight: "700" },
  closeBtn:          { marginTop: 12, paddingVertical: 8, alignItems: "center" },
  closeBtnText:      { fontSize: 14, color: "#888", fontWeight: "600" },
});