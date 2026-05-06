import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, ActivityIndicator, Modal, TextInput, FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";

const API_BASE = "https://connect.schoolaid.in";


type AttendanceStatus = "P" | "A" | "L" | "H" | null;
type FilterType       = "P" | "A" | "L" | "H" | null;

interface DayAttendance { date: string; status: AttendanceStatus; }
interface LeaveComment {
  id:         number;
  leave_id:   number;
  comment:    string;
  comment_by: string;
  created_at: string;
}
interface LeaveRecord {
  id:           string;
  from_date:    string;
  to_date:      string;
  reason:       string;
  status:       "Pending" | "Approved" | "Rejected";
  applied_at:   string;
  student_id?:  string;
  student_name?: string;
  comments?:    LeaveComment[];
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

  const inRange = (dateStr: string) => {
    if (!fromDate || !toDate) return false;
    return dateStr > fromDate && dateStr < toDate;
  };

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

      <View style={cp.stepRow}>
        <View style={[cp.stepPill, pickStep === 0 && cp.stepPillActive]}>
          <Text style={[cp.stepTxt, pickStep === 0 && cp.stepTxtActive]}>1. From</Text>
        </View>
        <View style={cp.stepLine} />
        <View style={[cp.stepPill, pickStep === 1 && cp.stepPillActive]}>
          <Text style={[cp.stepTxt, pickStep === 1 && cp.stepTxtActive]}>2. To</Text>
        </View>
      </View>

      <View style={cp.grid}>
        {DAYS.map(d => <Text key={d} style={cp.dayHdr}>{d}</Text>)}
        {cells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={cp.cell} />;
          const dateStr   = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isFrom    = dateStr === fromDate;
          const isTo      = dateStr === toDate;
          const isInRange = inRange(dateStr);
          const isToday   = dateStr === todayStr;
          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                cp.cell,
                isInRange && cp.cellInRange,
                (isFrom || isTo) && cp.cellSelected,
              ]}
              onPress={() => handleDayPress(dateStr)}
              activeOpacity={0.7}
            >
              <Text style={[
                cp.cellTxt,
                isInRange                       && cp.cellTxtInRange,
                (isFrom || isTo)                && cp.cellTxtSelected,
                isToday && !isFrom && !isTo      && cp.cellTxtToday,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={cp.selRow}>
        <View style={[cp.selBox, fromDate && cp.selBoxFilled]}>
          <Text style={cp.selLabel}>From</Text>
          <Text style={[cp.selValue, !fromDate && cp.selPlaceholder]}>
            {fromDate ? fmtDisplay(fromDate) : "Not selected"}
          </Text>
        </View>
        <Text style={cp.selArrow}>→</Text>
        <View style={[cp.selBox, toDate && cp.selBoxFilled]}>
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
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  navBtn:          { padding: 6 },
  navTxt:          { fontSize: 24, color: PRIMARY, fontWeight: "700" },
  monthTxt:        { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  stepRow:         { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 10, gap: 6 },
  stepLine:        { flex: 1, height: 1, backgroundColor: "#BFDBFE", maxWidth: 40 },
  stepPill:        { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: "#E0EAFF", borderWidth: 1, borderColor: "#BFDBFE" },
  stepPillActive:  { backgroundColor: PRIMARY, borderColor: PRIMARY },
  stepTxt:         { fontSize: 11, fontWeight: "700", color: "#6B9BEB" },
  stepTxtActive:   { color: "#fff" },
  grid:            { flexDirection: "row", flexWrap: "wrap" },
  dayHdr:          { width: "14.28%", textAlign: "center", fontSize: 10, fontWeight: "700", color: PRIMARY, paddingBottom: 4 },
  cell:            { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  cellSelected:    { backgroundColor: PRIMARY, borderRadius: 6 },
  cellInRange:     { backgroundColor: "#DBEAFE", borderRadius: 0 },
  cellTxt:         { fontSize: 12, color: "#1A1A2E" },
  cellTxtSelected: { color: "#fff", fontWeight: "700" },
  cellTxtInRange:  { color: PRIMARY, fontWeight: "600" },
  cellTxtToday:    { fontWeight: "800", color: PRIMARY },
  selRow:          { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, gap: 8 },
  selBox:          { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#BFDBFE" },
  selBoxFilled:    { borderColor: PRIMARY, borderWidth: 1.5 },
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
  const {theme} = useTheme();

  const [childName,    setChildName]    = useState("Student");
  const [childClass,   setChildClass]   = useState("—");
  const [childSection, setChildSection] = useState("—");
  const [studentId,    setStudentId]    = useState("");
  const [authToken,    setAuthToken]    = useState("");
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear());
  const [calendarData, setCalendarData] = useState<DayAttendance[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [loading,      setLoading]      = useState(false);
  const [activeModal,  setActiveModal]  = useState<"monthly" | "session" | "apply" | "history" | null>(null);

  // ── Leave state ──
  const [leaveRecords,  setLeaveRecords]  = useState<LeaveRecord[]>([]);
  const [leaveFrom,     setLeaveFrom]     = useState("");
  const [leaveTo,       setLeaveTo]       = useState("");
  const [leaveReason,   setLeaveReason]   = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [historyLoading,setHistoryLoading]= useState(false);

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
    const token = await AsyncStorage.getItem("token");
    const yearId = await AsyncStorage.getItem("selectedYearId");
    const childStr = await AsyncStorage.getItem("selectedChild");
    if (!childStr || !token) return;

const child = JSON.parse(childStr);
let classId = child.class_id;
let sectionId = child.section_id;


    console.log("class_id:", classId, "section_id:", sectionId);

if (!classId || !sectionId) {
  const yearId = await AsyncStorage.getItem("selectedYearId");
  const examRes = await fetch(`${API_BASE}/api/app/student-exams`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-academic-year": yearId ?? "16",
    },
    body: JSON.stringify({ student_id: child.id }),
  });
  const examData = await examRes.json();
  classId = examData.class_id;
  sectionId = examData.section_id;

  // Save back so next time it's available directly
  await AsyncStorage.setItem("selectedChild", JSON.stringify({
    ...child, class_id: classId, section_id: sectionId,
  }));
}

if (!classId || !sectionId) {
  console.warn("Still missing class_id or section_id");
  setCalendarData([]);
  return;
}
    const month = currentMonth + 1;
    const year = currentYear;

    const res = await fetch(
      `${API_BASE}/api/attendance/monthly?class_id=${classId}&section_id=${sectionId}&month=${month}&year=${year}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await res.json();
    console.log("Monthly response:", JSON.stringify(data, null, 2));

    const list = Array.isArray(data) ? data
      : Array.isArray(data.students) ? data.students
      : Array.isArray(data.data) ? data.data : [];

    const studentRecord = list.find(
      (s: any) => String(s.id) === String(child.id) ||
                  String(s.student_id) === String(child.id)
    );

    console.log("Student record:", JSON.stringify(studentRecord, null, 2));

    const records: DayAttendance[] = (
      studentRecord?.attendance ??
      studentRecord?.records ??
      []
    ).map((r: any) => ({
      date: r.date,
      status: r.status as AttendanceStatus,
    }));

    setCalendarData(records);
  } catch (error: any) {
    console.error("Failed to fetch calendar:", error);
    Alert.alert("Error", `Failed to load calendar: ${error.message}`);
    setCalendarData([]);
  } finally {
    setLoading(false);
  }
}, [currentMonth, currentYear]);

  // ── Fetch leave history using correct API ─────────────────────────────────
  const fetchLeaveHistory = useCallback(async (sid: string, token: string) => {
    if (!sid || !token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/leaves/student?student_id=${sid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('Leave history raw response:', JSON.stringify(data));
      // Handle all common API response shapes
      const records = Array.isArray(data) ? data
        : Array.isArray(data.leaves)  ? data.leaves
        : Array.isArray(data.data)    ? data.data
        : Array.isArray(data.records) ? data.records
        : Array.isArray(data.result)  ? data.result
        : [];
      console.log('Parsed leave records:', records.length);
      setLeaveRecords(records);
    } catch (error: any) {
      console.error("Failed to fetch leave history:", error);
      setLeaveRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Bootstrap: load child info + student ID ───────────────────────────────

  useEffect(() => {
    const bootstrap = async () => {
      let sid   = "";
      let token = "";

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

      // 1. Get token
      try {
        token = (await AsyncStorage.getItem("token")) ?? "";
        console.log("token:", token ? token.substring(0, 40) + "…" : "NOT FOUND");
      } catch (e) {
        console.log("token read error:", e);
      }

      // 2. Try selectedChild in AsyncStorage
      try {
        const raw = await AsyncStorage.getItem("selectedChild");
        if (raw) {
          const c = JSON.parse(raw);
          setChildName(c.name ?? "Student");
          setChildClass(c.classname ?? "—");
          setChildSection(c.sectionname ?? "—");
          sid = c.id ?? c.student_id ?? c.studentId ?? c.studentID
              ?? c.userId ?? c.user_id ?? c.admissionNo ?? "";
          console.log("sid from selectedChild:", sid);
        }
      } catch (e) {
        console.log("selectedChild error:", e);
      }

      // 3. Fallback: decode JWT token
      if (!sid && token) {
        try {
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
        } catch (e) {
          console.log("JWT decode error:", e);
        }
      }

      console.log("=== Final studentId:", sid || "NOT FOUND ⚠️", "===");

      if (sid)   setStudentId(sid);
      if (token) setAuthToken(token);

      if (sid && token) fetchLeaveHistory(sid, token);

      fetchCalendar();
    };

    bootstrap();
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth, currentYear]);

  // ── Apply leave using correct API ─────────────────────────────────────────

  const handleApplyLeave = async () => {
    if (!leaveFrom)          return Alert.alert("Error", "Please select a start date.");
    if (!leaveTo)            return Alert.alert("Error", "Please select an end date.");
    if (!leaveReason.trim()) return Alert.alert("Error", "Please enter a reason.");
    if (!studentId)          return Alert.alert("Error", "Student ID not found. Please re-login.");
    if (!authToken)          return Alert.alert("Error", "Auth token not found. Please re-login.");

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/leaves/apply`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          student_id: Number(studentId),
          from_date:  leaveFrom,
          to_date:    leaveTo,
          reason:     leaveReason.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && (result.success || result.message || result.msg || result.leave_id)) {
        await fetchLeaveHistory(studentId, authToken);
        setLeaveFrom("");
        setLeaveTo("");
        setLeaveReason("");
        setActiveModal(null);
        Alert.alert("✅ Success", `Leave applied from ${fmtDisplay(leaveFrom)} to ${fmtDisplay(leaveTo)}`);
      } else {
        const errorMsg = result.errors
          ? result.errors.join(", ")
          : result.message ?? "Failed to apply leave";
        Alert.alert("Error", errorMsg);
      }
    } catch (error: any) {
      console.error("Error applying leave:", error);
      Alert.alert("Error", `Network error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

    const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
    if (status === "Approved") return { bg: "#dcfce7", text: "#16a34a", icon: "✅" };
    if (status === "Rejected") return { bg: "#fee2e2", text: "#dc2626", icon: "❌" };
    return { bg: "#fef9c3", text: "#ca8a04", icon: "🕐" };
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



  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={styles.navArrow}>{"<<"}</Text></TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={styles.navArrow}>{">>"}</Text></TouchableOpacity>
        </View>

        {/* Summary cards */}
        {/* {!loading && (
          <View style={styles.summaryRow}>
            {[
              { label: "Present", count: presentDays.length,  color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
              { label: "Absent",  count: absentDays.length,   color: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
              { label: "Leave",   count: leaveRecords.length, color: "#ca8a04", bg: "#fef9c3", border: "#fde68a" },
              { label: "Holiday", count: holidayDays.length,  color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
            ].map(card => (
              <View key={card.label} style={[styles.summaryCard, { backgroundColor: card.bg, borderColor: card.border }]}>
                <Text style={[styles.summaryCount, { color: card.color }]}>{card.count}</Text>
                <Text style={[styles.summaryLabel, { color: card.color }]}>{card.label}</Text>
              </View>
            ))}
          </View>
        )} */}

        {/* Main calendar */}
        <View style={styles.calendarCard}>
          {loading
            ? <ActivityIndicator size="large" color={PRIMARY}  />
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
            onPress={() => {
              fetchLeaveHistory(studentId, authToken);
              setActiveModal("history");
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.actionCardIcon}>{"📋"}</Text>
            <Text style={styles.actionCardText}>{"Leave\nHistory"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Monthly Modal ── */}
      <Modal visible={activeModal === "monthly"} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { maxHeight: "90%" }]}>
            <Text style={styles.modalTitle}>{"📊 Monthly Details"}</Text>
            <Text style={styles.modalSubtitle}>{MONTHS[currentMonth] + " " + currentYear}</Text>

            {/* Attendance stats grid */}
            <View style={styles.monthlyGrid}>
              {[
                { label: "Total Days", value: monthlyDetail.total_days,       color: PRIMARY,   bg: "#EFF6FF" },
                { label: "Present",    value: monthlyDetail.present,          color: "#16a34a", bg: "#dcfce7" },
                { label: "Absent",     value: monthlyDetail.absent,           color: "#dc2626", bg: "#fee2e2" },
                { label: "Leave",      value: monthlyDetail.leave,            color: "#ca8a04", bg: "#fef9c3" },
                { label: "Holidays",   value: monthlyDetail.holidays,         color: "#9ca3af", bg: "#f3f4f6" },
                { label: "Percentage", value: monthlyDetail.percentage + "%", color: "#7c3aed", bg: "#f5f3ff" },
              ].map(item => (
                <View key={item.label} style={[styles.monthlyCell, { backgroundColor: item.bg, borderColor: item.color + "40" }]}>
                  <Text style={[styles.monthlyCellNum, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.monthlyCellLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Active / Pending leaves section */}
            {leaveRecords.length > 0 && (() => {
              const activeLeaves = leaveRecords.filter(r => r.status === "Pending" || r.status === "Approved");
              if (activeLeaves.length === 0) return null;
              return (
                <View style={styles.monthlyLeaveSection}>
                  <View style={styles.monthlyLeaveSectionHeader}>
                    <Text style={styles.monthlyLeaveSectionTitle}>📋 Active Leaves</Text>
                    <View style={styles.monthlyLeaveCount}>
                      <Text style={styles.monthlyLeaveCountTxt}>{activeLeaves.length}</Text>
                    </View>
                  </View>
                  <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {activeLeaves.map(leave => {
                      const s    = getLeaveStatusStyle(leave.status);
                      const days = datesBetween(leave.from_date, leave.to_date).length;
                      return (
                        <View key={leave.id} style={styles.monthlyLeaveCard}>
                          <View style={[styles.monthlyLeaveAccent, { backgroundColor: s.text }]} />
                          <View style={{ flex: 1, paddingLeft: 10 }}>
                            <View style={styles.monthlyLeaveDateRow}>
                              <Text style={styles.monthlyLeaveDates}>
                                {fmtDisplay(leave.from_date)}
                                {leave.from_date !== leave.to_date ? ` → ${fmtDisplay(leave.to_date)}` : ""}
                              </Text>
                              <Text style={styles.monthlyLeaveDays}>{days}d</Text>
                            </View>
                            <Text style={styles.monthlyLeaveReason} numberOfLines={1}>{leave.reason}</Text>
                            {leave.comments && leave.comments.length > 0 && (
                              <View style={styles.monthlyLeaveComment}>
                                <Text style={styles.monthlyLeaveCommentIcon}>💬</Text>
                                <Text style={styles.monthlyLeaveCommentTxt} numberOfLines={1}>
                                  {leave.comments[leave.comments.length - 1].comment}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={[styles.monthlyLeaveStatusBadge, { backgroundColor: s.bg }]}>
                            <Text style={[styles.monthlyLeaveStatusTxt, { color: s.text }]}>{s.icon}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })()}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Session Modal ── */}
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

      {/* ── Apply Leave Modal (redesigned) ── */}
      <Modal visible={activeModal === "apply"} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { maxHeight: "94%" }]}>
            {/* Modal Header */}
            <View style={styles.applyModalHeader}>
              <View style={styles.applyModalIconWrap}>
                <Text style={styles.applyModalIcon}>📝</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.applyModalTitle}>Apply Leave</Text>
                <Text style={styles.applyModalSub}>Select date range and provide reason</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.applyModalClose}>
                <Text style={styles.applyModalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
              {/* Student chip */}
              {studentId ? (
                <View style={styles.studentChip}>
                  <Text style={styles.studentChipIcon}>🎓</Text>
                  <Text style={styles.studentChipText}>{childName}</Text>
                  <View style={styles.studentChipIdPill}>
                    <Text style={styles.studentChipId}>ID: {studentId}</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.studentChip, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
                  <Text style={styles.studentChipIcon}>⚠️</Text>
                  <Text style={[styles.studentChipText, { color: "#DC2626" }]}>Student ID not found. Please re-login.</Text>
                </View>
              )}

              {/* Calendar picker */}
              <Text style={styles.sectionLabel}>📅 Select Dates</Text>
              <CalendarPicker
                fromDate={leaveFrom}
                toDate={leaveTo}
                onFromChange={setLeaveFrom}
                onToChange={setLeaveTo}
              />

              {/* Days count pill */}
              {leaveFrom && leaveTo && (
                <View style={styles.dayCountPill}>
                  <Text style={styles.dayCountTxt}>
                    🗓 {datesBetween(leaveFrom, leaveTo).length} day{datesBetween(leaveFrom, leaveTo).length !== 1 ? "s" : ""} selected
                  </Text>
                </View>
              )}

              {/* Reason input */}
              <Text style={styles.sectionLabel}>✏️ Reason for Leave</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="e.g. Out of station, medical appointment, family function..."
                placeholderTextColor="#aaa"
                value={leaveReason}
                onChangeText={setLeaveReason}
                multiline
                numberOfLines={3}
              />

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitLeaveBtn,
                  (!leaveFrom || !leaveTo || !leaveReason.trim() || submitting) && styles.submitLeaveBtnDisabled,
                ]}
                onPress={handleApplyLeave}
                disabled={!leaveFrom || !leaveTo || !leaveReason.trim() || submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitLeaveBtnText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitLeaveBtnText}>Submit Application</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Leave History Modal (redesigned) ── */}
      <Modal visible={activeModal === "history"} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { maxHeight: "85%" }]}>
            {/* Header */}
            <View style={styles.historyModalHeader}>
              <Text style={styles.historyModalTitle}>📋 Leave History</Text>
              <TouchableOpacity onPress={() => fetchLeaveHistory(studentId, authToken)} style={styles.historyRefreshBtn}>
                <Text style={styles.historyRefreshTxt}>↻ Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.applyModalClose}>
                <Text style={styles.applyModalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Summary pills */}
            {leaveRecords.length > 0 && (
              <View style={styles.historySummaryRow}>
                {[
                  { label: "Total",    count: leaveRecords.length,                                        color: PRIMARY,   bg: "#EFF6FF" },
                  { label: "Pending",  count: leaveRecords.filter(r => r.status === "Pending").length,   color: "#ca8a04", bg: "#fef9c3" },
                  { label: "Approved", count: leaveRecords.filter(r => r.status === "Approved").length,  color: "#16a34a", bg: "#dcfce7" },
                  { label: "Rejected", count: leaveRecords.filter(r => r.status === "Rejected").length,  color: "#dc2626", bg: "#fee2e2" },
                ].map(s => (
                  <View key={s.label} style={[styles.historySummaryPill, { backgroundColor: s.bg }]}>
                    <Text style={[styles.historySummaryCount, { color: s.color }]}>{s.count}</Text>
                    <Text style={[styles.historySummaryLabel, { color: s.color }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {historyLoading ? (
              <ActivityIndicator size="large" color={PRIMARY} style={{ marginVertical: 30 }} />
            ) : leaveRecords.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyIcon}>📭</Text>
                <Text style={styles.historyEmptyTitle}>No leave applications yet</Text>
                <Text style={styles.historyEmptySubtitle}>Your submitted leave requests will appear here</Text>
              </View>
            ) : (
              <FlatList
                data={leaveRecords}
                keyExtractor={item => item.id}
                style={{ width: "100%", marginTop: 6 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const s    = getLeaveStatusStyle(item.status);
                  const days = datesBetween(item.from_date, item.to_date).length;
                  return (
                    <View style={styles.historyCard}>
                      {/* Left accent */}
                      <View style={[styles.historyCardAccent, { backgroundColor: s.text }]} />
                      <View style={{ flex: 1, paddingLeft: 12 }}>
                        {/* Date row */}
                        <View style={styles.historyCardDateRow}>
                          <Text style={styles.historyCardDates}>
                            {fmtDisplay(item.from_date)}
                            {item.from_date !== item.to_date ? ` → ${fmtDisplay(item.to_date)}` : ""}
                          </Text>
                          <View style={styles.historyCardDaysBadge}>
                            <Text style={styles.historyCardDaysTxt}>{days}d</Text>
                          </View>
                        </View>
                        {/* Reason */}
                        <Text style={styles.historyCardReason}>{item.reason}</Text>
                        {/* Meta */}
                        <View style={styles.historyCardMeta}>
                          <Text style={styles.historyCardApplied}>
                            Applied {new Date(item.applied_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </Text>
                          <View style={[styles.historyCardStatus, { backgroundColor: s.bg }]}>
                            <Text style={styles.historyCardStatusIcon}>{s.icon}</Text>
                            <Text style={[styles.historyCardStatusTxt, { color: s.text }]}>{item.status}</Text>
                          </View>
                        </View>
                        {/* Teacher comments */}
                        {item.comments && item.comments.length > 0 && (
                          <View style={styles.commentsWrap}>
                            <View style={styles.commentsDivider} />
                            {item.comments.map(c => (
                              <View key={c.id} style={styles.commentBubble}>
                                <View style={styles.commentHeader}>
                                  <View style={styles.commentAvatarWrap}>
                                    <Text style={styles.commentAvatarTxt}>
                                      {c.comment_by.charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.commentBy}>{c.comment_by}</Text>
                                    <Text style={styles.commentTime}>
                                      {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                      {" · "}
                                      {new Date(c.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                    </Text>
                                  </View>
                                  <Text style={styles.commentIcon}>💬</Text>
                                </View>
                                <Text style={styles.commentText}>{c.comment}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                }}
              />
            )}

            <TouchableOpacity style={[styles.closeBtn, { marginTop: 8 }]} onPress={() => setActiveModal(null)}>
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
  calendarCard:      { backgroundColor: "#fff", marginHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: "#E0E6F0", padding: 10 },
  calendarGrid:      { flexDirection: "row", flexWrap: "wrap" },
  dayHeader:         { width: "14.28%", textAlign: "center", fontSize: 11, fontWeight: "700", color: "#0047AB", paddingBottom: 6 },
  calendarCell:      { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#E0E6F0", marginBottom: 3 },
  calendarDayText:   { fontSize: 12, fontWeight: "600" },
  todayCell:         { borderWidth: 2.5, borderColor: "#0047AB" },
  todayText:         { fontWeight: "800" },
  tappedCell:        { borderWidth: 2.5, borderColor: "#7c3aed" },
  leaveDot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: "#ca8a04", position: "absolute", bottom: 3 },
  // dayInfoPanel:      { marginTop: 10, backgroundColor: "#F8FAFF", borderRadius: 12, borderWidth: 1, borderColor: "#BFDBFE", padding: 12 },
  // dayInfoHeader:     { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  // dayInfoDate:       { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  // dayInfoBadge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  // dayInfoBadgeText:  { fontSize: 11, fontWeight: "700" },
  // dayInfoClose:      { padding: 4 },
  // dayInfoCloseTxt:   { fontSize: 14, color: "#aaa", fontWeight: "700" },
  // dayInfoBody:       { gap: 2 },
  // dayInfoReasonLabel:{ fontSize: 10, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  // dayInfoReason:     { fontSize: 14, fontWeight: "600", color: "#1A1A2E", lineHeight: 20 },
  // dayInfoMeta:       { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
  // dayInfoMetaTxt:    { fontSize: 11, color: "#888", flex: 1 },
  // dayInfoStatusBadge:{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  // dayInfoStatusTxt:  { fontSize: 11, fontWeight: "700" },
  // dayInfoEmpty:      { fontSize: 13, color: "#888", fontStyle: "italic" },
dayInfoPanel:      { marginTop: 8, backgroundColor: "#F8FAFF", borderRadius: 10, borderWidth: 1, borderColor: "#BFDBFE", padding: 8 },
dayInfoHeader:     { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 },
dayInfoDate:       { fontSize: 12, fontWeight: "700", color: "#1A1A2E", flex: 1 },
dayInfoBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
dayInfoBadgeText:  { fontSize: 10, fontWeight: "700" },
dayInfoClose:      { padding: 2 },
dayInfoCloseTxt:   { fontSize: 13, color: "#aaa", fontWeight: "700" },
dayInfoBody:       { gap: 2 },
dayInfoReasonLabel:{ fontSize: 9, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
dayInfoReason:     { fontSize: 12, fontWeight: "600", color: "#1A1A2E", lineHeight: 16 },
dayInfoMeta:       { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 6 },
dayInfoMetaTxt:    { fontSize: 10, color: "#888", flex: 1 },
// dayInfoStatusBadge:{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
dayInfoStatusTxt:  { fontSize: 10, fontWeight: "700" },
dayInfoEmpty:      { fontSize: 11, color: "#888", fontStyle: "italic" },

  summaryRow:        { flexDirection: "row", marginHorizontal: 12, marginBottom: 10, gap: 8 },
  summaryCard:       { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: "center", borderWidth: 1.5 },
  summaryCount:      { fontSize: 20, fontWeight: "800" },
  summaryLabel:      { fontSize: 10, fontWeight: "700", marginTop: 2 },
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
  inputLabel:        { alignSelf: "flex-start", fontSize: 12, fontWeight: "700", color: "#0047AB", marginBottom: 4, marginTop: 4 },
  input:             { width: "100%", backgroundColor: "#F5F7FA", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1A1A2E", borderWidth: 1, borderColor: "#E0E6F0" },
  inputMultiline:    { height: 80, textAlignVertical: "top" },
  submitLeaveBtn:    { width: "100%", backgroundColor: "#0047AB", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16, flexDirection: "row", justifyContent: "center" },
  submitLeaveBtnDisabled: { backgroundColor: "#94a3b8", opacity: 0.7 },
  submitLeaveBtnText:{ color: "#fff", fontSize: 15, fontWeight: "700" },
  closeBtn:          { marginTop: 12, paddingVertical: 8, alignItems: "center" },
  closeBtnText:      { fontSize: 14, color: "#888", fontWeight: "600" },

  // ── Apply Leave Modal ──
  applyModalHeader:  { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 16, gap: 10 },
  applyModalIconWrap:{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  applyModalIcon:    { fontSize: 22 },
  applyModalTitle:   { fontSize: 17, fontWeight: "800", color: "#1A1A2E" },
  applyModalSub:     { fontSize: 11, color: "#888", marginTop: 1 },
  applyModalClose:   { padding: 6, marginLeft: "auto" },
  applyModalCloseTxt:{ fontSize: 16, color: "#aaa", fontWeight: "700" },
  studentChip:       { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "#BFDBFE", gap: 8, width: "100%" },
  studentChipIcon:   { fontSize: 16 },
  studentChipText:   { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  studentChipIdPill: { backgroundColor: "#fff", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#BFDBFE" },
  studentChipId:     { fontSize: 11, color: "#0047AB", fontWeight: "700" },
  sectionLabel:      { fontSize: 12, fontWeight: "700", color: "#0047AB", marginBottom: 6, alignSelf: "flex-start", width: "100%" },
  dayCountPill:      { alignSelf: "center", backgroundColor: "#EFF6FF", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  dayCountTxt:       { fontSize: 13, fontWeight: "700", color: "#0047AB" },

  // ── Leave History Modal ──
  historyModalHeader:{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 12, gap: 6 },
  historyModalTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A2E", flex: 1 },
  historyRefreshBtn: { backgroundColor: "#EFF6FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#BFDBFE" },
  historyRefreshTxt: { fontSize: 12, fontWeight: "700", color: "#0047AB" },
  historySummaryRow: { flexDirection: "row", width: "100%", gap: 6, marginBottom: 10 },
  historySummaryPill:{ flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  historySummaryCount:{ fontSize: 18, fontWeight: "800" },
  historySummaryLabel:{ fontSize: 9, fontWeight: "700", marginTop: 1 },
  historyEmpty:      { alignItems: "center", paddingVertical: 30 },
  historyEmptyIcon:  { fontSize: 40, marginBottom: 10 },
  historyEmptyTitle: { fontSize: 15, fontWeight: "700", color: "#555", marginBottom: 4 },
  historyEmptySubtitle:{ fontSize: 12, color: "#aaa", textAlign: "center" },
  historyCard:       { flexDirection: "row", backgroundColor: "#FAFBFF", borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: "#E0E6F0", overflow: "hidden", paddingVertical: 12, paddingRight: 12 },
  historyCardAccent: { width: 4, borderRadius: 2, alignSelf: "stretch" },
  historyCardDateRow:{ flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 },
  historyCardDates:  { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  historyCardDaysBadge:{ backgroundColor: "#E0E6F0", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  historyCardDaysTxt:{ fontSize: 11, fontWeight: "700", color: "#555" },
  historyCardReason: { fontSize: 13, color: "#444", marginBottom: 6, lineHeight: 18 },
  historyCardMeta:   { flexDirection: "row", alignItems: "center", gap: 8 },
  historyCardApplied:{ fontSize: 11, color: "#aaa", flex: 1 },
  historyCardStatus: { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  historyCardStatusIcon:{ fontSize: 11 },
  historyCardStatusTxt:{ fontSize: 11, fontWeight: "700" },
  // ── Teacher comments ──
  commentsWrap:       { marginTop: 10 },
  commentsDivider:    { height: 1, backgroundColor: "#E0E6F0", marginBottom: 8 },
  commentBubble:      { backgroundColor: "#F0F4FF", borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: "#DBEAFE" },
  commentHeader:      { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
  commentAvatarWrap:  { width: 28, height: 28, borderRadius: 14, backgroundColor: "#0047AB", alignItems: "center", justifyContent: "center" },
  commentAvatarTxt:   { fontSize: 13, fontWeight: "800", color: "#fff" },
  commentBy:          { fontSize: 12, fontWeight: "700", color: "#1A1A2E", textTransform: "capitalize" },
  commentTime:        { fontSize: 10, color: "#aaa", marginTop: 1 },
  commentIcon:        { fontSize: 14 },
  commentText:        { fontSize: 13, color: "#374151", lineHeight: 19, fontStyle: "italic" },

  // ── Monthly leave section ──
  monthlyLeaveSection:      { width: "100%", marginTop: 4, marginBottom: 4 },
  monthlyLeaveSectionHeader:{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  monthlyLeaveSectionTitle: { fontSize: 13, fontWeight: "800", color: "#1A1A2E", flex: 1 },
  monthlyLeaveCount:        { backgroundColor: "#0047AB", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  monthlyLeaveCountTxt:     { fontSize: 11, fontWeight: "800", color: "#fff" },
  monthlyLeaveCard:         { flexDirection: "row", alignItems: "center", backgroundColor: "#FAFBFF", borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: "#E0E6F0", overflow: "hidden", paddingVertical: 10, paddingRight: 10 },
  monthlyLeaveAccent:       { width: 4, alignSelf: "stretch" },
  monthlyLeaveDateRow:      { flexDirection: "row", alignItems: "center", marginBottom: 2, gap: 6 },
  monthlyLeaveDates:        { fontSize: 12, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  monthlyLeaveDays:         { fontSize: 10, fontWeight: "700", color: "#888", backgroundColor: "#E0E6F0", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  monthlyLeaveReason:       { fontSize: 12, color: "#555", lineHeight: 16 },
  monthlyLeaveComment:      { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  monthlyLeaveCommentIcon:  { fontSize: 10 },
  monthlyLeaveCommentTxt:   { fontSize: 11, color: "#6B7280", fontStyle: "italic", flex: 1 },
  monthlyLeaveStatusBadge:  { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  monthlyLeaveStatusTxt:    { fontSize: 14 },
});




//----------------------------------   teacher side attendance screen (in progress)   ----------------------------------//
// import React, { useState, useEffect } from 'react';
// import {
//   View, Text, StyleSheet, TouchableOpacity,
//   ScrollView, Modal, ActivityIndicator, Alert,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = 'https://connect.schoolaid.in';

// const apiFetch = async (path: string, options: RequestInit = {}) => {
//   const token = await AsyncStorage.getItem('token');
//   return fetch(`${API_URL}/api${path}`, {
//     ...options,
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//       ...(options.headers ?? {}),
//     },
//   });
// };

// type TabType = 'Daily' | 'Session' | 'Monthly';

// const SESSIONS = Array.from({ length: 12 }, (_, i) => ({
//   id: i + 1,
//   label: `Session ${i + 1}`,
// }));

// const MONTHS = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December',
// ];

// const currentYear = new Date().getFullYear();
// const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

// export default function Attendance() {
//   const router = useRouter();

//   const [activeTab, setActiveTab] = useState<TabType>('Daily');

//   // ── Dropdown data ──
//   const [classes, setClasses] = useState<any[]>([]);
//   const [sections, setSections] = useState<any[]>([]);
//   const [subjects, setSubjects] = useState<any[]>([]);

//   // ── Selected values ──
//   const [selectedClass, setSelectedClass] = useState<any>(null);
//   const [selectedSection, setSelectedSection] = useState<any>(null);
//   const [selectedSubject, setSelectedSubject] = useState<any>(null);
//   const [selectedSession, setSelectedSession] = useState<any>(null);
//   const [selectedDate, setSelectedDate] = useState(new Date());

//   // ── Completed sessions ──
//   const [completedSessions, setCompletedSessions] = useState<Record<string, Set<number>>>({});

//   // ── Dropdown open/close ──
//   const [classDropOpen, setClassDropOpen] = useState(false);
//   const [sectionDropOpen, setSectionDropOpen] = useState(false);
//   const [subjectDropOpen, setSubjectDropOpen] = useState(false);
//   const [sessionDropOpen, setSessionDropOpen] = useState(false);

//   // ── Monthly specific ──
//   const [monthlyClass, setMonthlyClass] = useState<any>(null);
//   const [monthlySection, setMonthlySection] = useState<any>(null);
//   const [monthlySections, setMonthlySections] = useState<any[]>([]);
//   const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
//   const [monthlyYear, setMonthlyYear] = useState(currentYear);
//   const [monthlyClassDropOpen, setMonthlyClassDropOpen] = useState(false);
//   const [monthlySectionDropOpen, setMonthlySectionDropOpen] = useState(false);
//   const [monthlyMonthDropOpen, setMonthlyMonthDropOpen] = useState(false);
//   const [monthlyYearDropOpen, setMonthlyYearDropOpen] = useState(false);

//   // ── Attendance marking ──
//   const [students, setStudents] = useState<any[]>([]);
//   const [attendance, setAttendance] = useState<Record<number, 'P' | 'A' | 'L'>>({});
//   const [checkedRows, setCheckedRows] = useState<Record<number, boolean>>({});
//   const [allChecked, setAllChecked] = useState(false);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [studentsLoading, setStudentsLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   // ── Monthly data ──
//   const [monthlyData, setMonthlyData] = useState<any[]>([]);
//   const [monthlyLoading, setMonthlyLoading] = useState(false);

//   const dateStr = selectedDate
//     .toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
//     .replace(/\//g, '-');

//   const completedKey = `${selectedClass?.id}_${selectedSection?.id}_${selectedSubject?.id}_${selectedDate.toISOString().split('T')[0]}`;

//   // ── On mount: fetch classes only (subjects fetched after class selected) ──
//   useEffect(() => {
//     fetchClasses();
//   }, []);

//   // ── 1. Fetch all classes ──
//   const fetchClasses = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       if (!token) { Alert.alert('Error', 'Not logged in.'); return; }

//       const r = await fetch(`${API_URL}/api/classes`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const raw = await r.text();
//       if (raw.startsWith('<')) { console.warn('fetchClasses: got HTML response'); return; }
//       const d = JSON.parse(raw);

//       let classList: any[] = [];
//       if (Array.isArray(d)) classList = d;
//       else if (Array.isArray(d.class)) classList = d.class;
//       else if (Array.isArray(d.classes)) classList = d.classes;
//       else if (Array.isArray(d.data)) classList = d.data;

//       classList.sort((a, b) => (a.class_order ?? 0) - (b.class_order ?? 0));
//       setClasses(classList);
//     } catch (err: any) {
//       console.error('fetchClasses ERROR:', err?.message);
//       Alert.alert('Error', 'Failed to load classes.');
//     }
//   };

//   // ── 2. Fetch sections for a given classId ──
//   const fetchSections = async (classId: number): Promise<any[]> => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const r = await fetch(`${API_URL}/api/sections/${classId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const raw = await r.text();
//       if (raw.startsWith('<')) return [];
//       const d = JSON.parse(raw);
//       let list: any[] = [];
//       if (Array.isArray(d)) list = d;
//       else if (Array.isArray(d.sections)) list = d.sections;
//       else if (Array.isArray(d.section)) list = d.section;
//       else if (Array.isArray(d.data)) list = d.data;
//       return list;
//     } catch (e) {
//       console.warn('fetchSections error:', e);
//       return [];
//     }
//   };

//   // ── 3. Fetch subjects for a given classId (passed directly — no AsyncStorage needed) ──
//   const fetchSubjects = async (classId: number) => {
//     try {
//       const token = await AsyncStorage.getItem('token');

//       console.log('Fetching subjects for class_id:', classId);
//       console.log('Full URL:', `${API_URL}/api/sched-subjects/${classId}`);

//       const r = await fetch(`${API_URL}/api/sched-subjects/${classId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       console.log('Response status:', r.status);
//       const raw = await r.text();
//       console.log('Raw response:', raw);

//       if (raw.startsWith('<')) return;
//       const d = JSON.parse(raw);

//       let list: any[] = [];
//       if (Array.isArray(d)) list = d;
//       else if (Array.isArray(d.subjects)) list = d.subjects;
//       else if (Array.isArray(d.data)) list = d.data;

//       setSubjects(list);
//     } catch (e) {
//       console.warn('fetchSubjects error:', e);
//     }
//   };

//   // ── 4. Handle class selection (Daily/Session tabs) ──
//   // Fetches sections AND subjects using the selected class id directly
//   const handleClassSelect = async (item: any) => {
//     setSelectedClass(item);
//     setSelectedSection(null);
//     setSelectedSubject(null);   // reset subject too
//     setSelectedSession(null);
//     setStudents([]);
//     setAttendance({});
//     setSections([]);
//     setSubjects([]);            // clear old subjects while loading

//     // Fetch sections and subjects in parallel using item.id directly ✅
//     const [sectionList] = await Promise.all([
//       fetchSections(item.id),
//       fetchSubjects(item.id),   // ✅ pass classId directly — no AsyncStorage null issue
//     ]);
//     setSections(sectionList);
//   };

//   // ── 5. Handle class selection (Monthly tab) ──
//   const handleMonthlyClassSelect = async (item: any) => {
//     setMonthlyClass(item);
//     setMonthlySection(null);
//     setMonthlyData([]);
//     setMonthlySections([]);
//     const list = await fetchSections(item.id);
//     setMonthlySections(list);
//   };

//   // ── Load students ──
//   const loadStudents = async () => {
//     if (!selectedClass || !selectedSection) {
//       Alert.alert('Select', 'Please select class and section first.');
//       return;
//     }
//     if (activeTab === 'Session' && !selectedSubject) {
//       Alert.alert('Select', 'Please select a subject first.');
//       return;
//     }
//     if (activeTab === 'Session' && !selectedSession) {
//       Alert.alert('Select', 'Please select a session first.');
//       return;
//     }
//     setStudentsLoading(true);
//     setAttendance({});
//     setCheckedRows({});
//     setStudents([]);
//     try {
//       const res = await apiFetch(`/students?class_id=${selectedClass.id}&section_id=${selectedSection.id}`);
//       const raw = await res.text();
//       const data = JSON.parse(raw);
//       const list = Array.isArray(data) ? data : data.data ?? data.students ?? [];
//       setStudents(list);
//       const def: Record<number, 'P' | 'A' | 'L'> = {};
//       const chk: Record<number, boolean> = {};
//       list.forEach((s: any) => { def[s.id] = 'P'; chk[s.id] = true; });
//       setAttendance(def);
//       setCheckedRows(chk);
//       setAllChecked(true);
//     } catch (e) {
//       console.error('loadStudents error:', e);
//       Alert.alert('Error', 'Failed to load students.');
//     } finally {
//       setStudentsLoading(false);
//     }
//   };

//   // ── Submit attendance ──
//   const handleSubmit = async () => {
//     if (!selectedClass || !selectedSection) return;
//     const payload = students.map(s => ({ student_id: s.id, status: attendance[s.id] ?? 'A' }));
//     setSubmitting(true);
//     try {
//       const endpoint = activeTab === 'Daily' ? '/attendance/daily' : '/attendance/session';
//       const body: any = {
//         class_id: Number(selectedClass.id),
//         section_id: Number(selectedSection.id),
//         date: selectedDate.toISOString().split('T')[0],
//         students: payload,
//       };
//       if (activeTab === 'Session') {
//         body.subject_id = Number(selectedSubject.id);
//         body.session = selectedSession.id;
//       }
//       const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
//       const data = await res.json();
//       if (res.ok) {
//         Alert.alert('Success', 'Attendance submitted!');
//         if (activeTab === 'Session') {
//           setCompletedSessions(prev => {
//             const existing = new Set(prev[completedKey] ?? []);
//             existing.add(selectedSession.id);
//             return { ...prev, [completedKey]: existing };
//           });
//         }
//         setAttendance({});
//         setStudents([]);
//         setSelectedSession(null);
//       } else {
//         Alert.alert('Error', data.msg || 'Submission failed.');
//       }
//     } catch {
//       Alert.alert('Error', 'Network error. Try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ── Fetch monthly ──
// const fetchMonthly = async () => {
//   if (!monthlyClass || !monthlySection) {
//     Alert.alert('Select', 'Please select class and section first.');
//     return;
//   }
//   setMonthlyLoading(true);
//   setMonthlyData([]);
//   try {
//     const token = await AsyncStorage.getItem('token');
//     const res = await fetch(
//       `${API_URL}/api/attendance/monthly?class_id=${monthlyClass.id}&section_id=${monthlySection.id}&month=${monthlyMonth}&year=${monthlyYear}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: 'application/json',
//         },
//       }
//     );
//     const data = await res.json();
//     console.log('Monthly response:', JSON.stringify(data, null, 2));

//     const list = Array.isArray(data) ? data
//       : Array.isArray(data.students) ? data.students
//       : Array.isArray(data.data) ? data.data
//       : Array.isArray(data.attendance) ? data.attendance : [];

//     setMonthlyData(list);
//     if (list.length === 0) Alert.alert('No Data', 'No attendance records found for this period.');
//   } catch (err: any) {
//     Alert.alert('Error', `Failed to load monthly data: ${err.message}`);
//   } finally {
//     setMonthlyLoading(false);
//   }
// };
//   const toggleAttendance = (id: number, status: 'P' | 'A' | 'L') =>
//     setAttendance(prev => ({ ...prev, [id]: status }));

//   const toggleAllChecked = () => {
//     const next = !allChecked;
//     setAllChecked(next);
//     const chk: Record<number, boolean> = {};
//     students.forEach(s => { chk[s.id] = next; });
//     setCheckedRows(chk);
//   };

//   const closeAllDropdowns = () => {
//     setClassDropOpen(false);
//     setSectionDropOpen(false);
//     setSubjectDropOpen(false);
//     setSessionDropOpen(false);
//     setMonthlyClassDropOpen(false);
//     setMonthlySectionDropOpen(false);
//     setMonthlyMonthDropOpen(false);
//     setMonthlyYearDropOpen(false);
//   };

//   const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
//   const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
//   const calendarDays = () => {
//     const y = selectedDate.getFullYear(), m = selectedDate.getMonth();
//     const days: (number | null)[] = [];
//     for (let i = 0; i < getFirstDay(y, m); i++) days.push(null);
//     for (let i = 1; i <= getDaysInMonth(y, m); i++) days.push(i);
//     return days;
//   };

//   const presentCount = Object.values(attendance).filter(v => v === 'P').length;
//   const absentCount  = Object.values(attendance).filter(v => v === 'A').length;
//   const leaveCount   = Object.values(attendance).filter(v => v === 'L').length;

//   // ── Reusable Dropdown ──
//   const Dropdown = ({
//     label, value, open, onToggle, options, onSelect, displayKey, placeholder, disabled,
//   }: {
//     label: string; value: any; open: boolean; onToggle: () => void;
//     options: any[]; onSelect: (item: any) => void; displayKey: string;
//     placeholder?: string; disabled?: boolean;
//   }) => (
//     <View style={styles.dropWrap}>
//       <Text style={styles.dropLabel}>{label}</Text>
//       <TouchableOpacity
//         style={[styles.dropBtn, open && styles.dropBtnOpen, disabled && styles.dropBtnDisabled]}
//         onPress={disabled ? undefined : onToggle}
//         activeOpacity={disabled ? 1 : 0.8}
//       >
//         <Text style={[styles.dropBtnText, !value && styles.dropPlaceholder, disabled && styles.dropBtnTextDisabled]}>
//           {value
//             ? (typeof value[displayKey] === 'string' ? value[displayKey] : value.label ?? value[displayKey])
//             : (placeholder ?? `Select ${label}`)}
//         </Text>
//         {!disabled && <Text style={styles.dropArrow}>{open ? '▲' : '▼'}</Text>}
//         {disabled && <Text style={styles.dropArrow}>🔒</Text>}
//       </TouchableOpacity>
//       {open && !disabled && (
//         <View style={styles.dropList}>
//           <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true} style={{ maxHeight: 300 }}>
//             {options.length === 0
//               ? <Text style={styles.dropEmpty}>No options available</Text>
//               : options.map((item, i) => (
//                 <TouchableOpacity
//                   key={item.id ?? i}
//                   style={[styles.dropItem, value?.id === item.id && styles.dropItemActive]}
//                   onPress={() => { onSelect(item); onToggle(); }}
//                 >
//                   <Text style={[styles.dropItemText, value?.id === item.id && styles.dropItemTextActive]}>
//                     {item[displayKey] ?? item.label}
//                   </Text>
//                 </TouchableOpacity>
//               ))
//             }
//           </ScrollView>
//         </View>
//       )}
//     </View>
//   );

//   // ── Session dropdown with disable logic ──
//   const SessionDropdown = () => {
//     const completedSet = completedSessions[completedKey] ?? new Set();
//     return (
//       <View style={styles.dropWrap}>
//         <Text style={styles.dropLabel}>SESSION (PERIOD)</Text>
//         <TouchableOpacity
//           style={[styles.dropBtn, sessionDropOpen && styles.dropBtnOpen]}
//           onPress={() => { const n = !sessionDropOpen; closeAllDropdowns(); setSessionDropOpen(n); }}
//           activeOpacity={0.8}
//         >
//           <Text style={[styles.dropBtnText, !selectedSession && styles.dropPlaceholder]}>
//             {selectedSession ? selectedSession.label : 'Select Session'}
//           </Text>
//           <Text style={styles.dropArrow}>{sessionDropOpen ? '▲' : '▼'}</Text>
//         </TouchableOpacity>
//         {sessionDropOpen && (
//           <View style={styles.dropList}>
//             <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true} style={{ maxHeight: 300 }}>
//               {SESSIONS.map((ses) => {
//                 const isDone = completedSet.has(ses.id);
//                 return (
//                   <TouchableOpacity
//                     key={ses.id}
//                     style={[
//                       styles.dropItem,
//                       selectedSession?.id === ses.id && styles.dropItemActive,
//                       isDone && styles.dropItemDisabled,
//                     ]}
//                     onPress={() => {
//                       if (isDone) return;
//                       setSelectedSession(ses);
//                       setSessionDropOpen(false);
//                       setStudents([]);
//                       setAttendance({});
//                     }}
//                     activeOpacity={isDone ? 1 : 0.7}
//                   >
//                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <Text style={[
//                         styles.dropItemText,
//                         selectedSession?.id === ses.id && styles.dropItemTextActive,
//                         isDone && styles.dropItemTextDisabled,
//                       ]}>
//                         {ses.label}
//                       </Text>
//                       {isDone && (
//                         <View style={styles.doneBadge}>
//                           <Text style={styles.doneBadgeText}>✓ Done</Text>
//                         </View>
//                       )}
//                     </View>
//                   </TouchableOpacity>
//                 );
//               })}
//             </ScrollView>
//           </View>
//         )}
//       </View>
//     );
//   };

//   // ── Daily filter card ──
//   const renderDailyFilters = () => (
//     <View style={[styles.filterCard, { zIndex: 100 }]}>
//       <View style={{ flexDirection: 'row', gap: 10 }}>
//         <View style={{ flex: 1, zIndex: 40 }}>
//           <Dropdown
//             label="CLASS" value={selectedClass} open={classDropOpen}
//             onToggle={() => { const n = !classDropOpen; closeAllDropdowns(); setClassDropOpen(n); }}
//             options={classes}
//             onSelect={item => { handleClassSelect(item); closeAllDropdowns(); }}
//             displayKey="class_name"
//           />
//         </View>
//         <View style={{ flex: 1, zIndex: 30 }}>
//           <Dropdown
//             label="SECTION" value={selectedSection} open={sectionDropOpen}
//             onToggle={() => {
//               if (!selectedClass) { Alert.alert('Select Class', 'Please select a class first.'); return; }
//               const n = !sectionDropOpen; closeAllDropdowns(); setSectionDropOpen(n);
//             }}
//             options={sections}
//             onSelect={item => { setSelectedSection(item); setStudents([]); }}
//             displayKey="section_name"
//             disabled={!selectedClass}
//             placeholder={!selectedClass ? 'Select Class First' : 'Select Section'}
//           />
//         </View>
//       </View>
//       <View style={[styles.filterRow2, { zIndex: 20 }]}>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.dropLabel}>DATE</Text>
//           <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCalendar(true)}>
//             <Text style={styles.dateBtnText}>📅  {dateStr}</Text>
//           </TouchableOpacity>
//         </View>
//         <View style={{ justifyContent: 'flex-end' }}>
//           <TouchableOpacity style={styles.loadBtn} onPress={loadStudents}>
//             <Text style={styles.loadBtnText}>⟳  Load Students</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );

//   // ── Session filter card ──
//   const renderSessionFilters = () => (
//     <View style={[styles.filterCard, { zIndex: 100 }]}>
//       <View style={{ flexDirection: 'row', gap: 10 }}>
//         <View style={{ flex: 1, zIndex: 50 }}>
//           <Dropdown
//             label="CLASS" value={selectedClass} open={classDropOpen}
//             onToggle={() => { const n = !classDropOpen; closeAllDropdowns(); setClassDropOpen(n); }}
//             options={classes}
//             onSelect={item => { handleClassSelect(item); closeAllDropdowns(); setSelectedSession(null); }}
//             displayKey="class_name"
//           />
//         </View>
//         <View style={{ flex: 1, zIndex: 40 }}>
//           <Dropdown
//             label="SECTION" value={selectedSection} open={sectionDropOpen}
//             onToggle={() => {
//               if (!selectedClass) { Alert.alert('Select Class', 'Please select a class first.'); return; }
//               const n = !sectionDropOpen; closeAllDropdowns(); setSectionDropOpen(n);
//             }}
//             options={sections}
//             onSelect={item => { setSelectedSection(item); setStudents([]); setSelectedSession(null); }}
//             displayKey="section_name"
//             disabled={!selectedClass}
//             placeholder={!selectedClass ? 'Select Class First' : 'Select Section'}
//           />
//         </View>
//       </View>
//       <View style={{ zIndex: 30, marginTop: 10 }}>
//         {/* Subject dropdown — populated automatically when class is selected ✅ */}
//         <Dropdown
//           label="SUBJECT" value={selectedSubject} open={subjectDropOpen}
//           onToggle={() => {
//             if (!selectedClass) { Alert.alert('Select Class', 'Please select a class first.'); return; }
//             const n = !subjectDropOpen; closeAllDropdowns(); setSubjectDropOpen(n);
//           }}
//           options={subjects}
//           onSelect={item => { setSelectedSubject(item); setStudents([]); setSelectedSession(null); }}
//           displayKey="subject_name"
//           placeholder={!selectedClass ? 'Select Class First' : subjects.length === 0 ? 'No Subjects Found' : 'Select Subject'}
//           disabled={!selectedClass}
//         />
//       </View>
//       <View style={{ zIndex: 20, marginTop: 10 }}>
//         <SessionDropdown />
//       </View>
//       <View style={[styles.filterRow2, { zIndex: 10 }]}>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.dropLabel}>DATE</Text>
//           <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCalendar(true)}>
//             <Text style={styles.dateBtnText}>📅  {dateStr}</Text>
//           </TouchableOpacity>
//         </View>
//         <View style={{ justifyContent: 'flex-end' }}>
//           <TouchableOpacity style={styles.loadBtn} onPress={loadStudents}>
//             <Text style={styles.loadBtnText}>⟳  Load Students</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );

//   // ── Student table ──
//   const renderStudentTable = () => (
//     <>
//       <View style={styles.statsRow}>
//         <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
//           <Text style={[styles.statNum, { color: '#2E7D32' }]}>{presentCount}</Text>
//           <Text style={styles.statLabel}>Present</Text>
//         </View>
//         <View style={[styles.statBox, { backgroundColor: '#FFEBEE' }]}>
//           <Text style={[styles.statNum, { color: '#C62828' }]}>{absentCount}</Text>
//           <Text style={styles.statLabel}>Absent</Text>
//         </View>
//         <View style={[styles.statBox, { backgroundColor: '#FFF8E1' }]}>
//           <Text style={[styles.statNum, { color: '#F57F17' }]}>{leaveCount}</Text>
//           <Text style={styles.statLabel}>Leave</Text>
//         </View>
//         <View style={[styles.statBox, { backgroundColor: '#EEF2FF' }]}>
//           <Text style={[styles.statNum, { color: PRIMARY }]}>{students.length}</Text>
//           <Text style={styles.statLabel}>Total</Text>
//         </View>
//       </View>

//       <View style={styles.tableContainer}>
//         <View style={styles.tableHeader}>
//           <TouchableOpacity style={styles.checkboxCell} onPress={toggleAllChecked}>
//             <View style={[styles.checkbox, allChecked && styles.checkboxChecked]}>
//               {allChecked && <Text style={styles.checkmark}>✓</Text>}
//             </View>
//           </TouchableOpacity>
//           <Text style={[styles.tableHeaderText, styles.rollCell]}>ROLL NO</Text>
//           <Text style={[styles.tableHeaderText, styles.nameCell]}>STUDENT NAME</Text>
//           <View style={styles.palHeaderCell}>
//             <View style={[styles.palDot, { backgroundColor: '#4CAF50' }]} /><Text style={styles.palHeaderLabel}>P</Text>
//             <View style={[styles.palDot, { backgroundColor: '#F44336', marginLeft: 8 }]} /><Text style={styles.palHeaderLabel}>A</Text>
//             <View style={[styles.palDot, { backgroundColor: '#FFC107', marginLeft: 8 }]} /><Text style={styles.palHeaderLabel}>L</Text>
//           </View>
//         </View>

//         {students.map((student, index) => (
//           <View key={student.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
//             <TouchableOpacity
//               style={styles.checkboxCell}
//               onPress={() => setCheckedRows(prev => ({ ...prev, [student.id]: !prev[student.id] }))}
//             >
//               <View style={[styles.checkbox, checkedRows[student.id] && styles.checkboxChecked]}>
//                 {checkedRows[student.id] && <Text style={styles.checkmark}>✓</Text>}
//               </View>
//             </TouchableOpacity>
//             <Text style={[styles.tableCell, styles.rollCell]}>{index + 1}</Text>
//             <Text style={[styles.tableCell, styles.nameCell]} numberOfLines={1}>
//               {student.student_firstname ?? student.name}
//             </Text>
//             <View style={styles.palCell}>
//               {(['P', 'A', 'L'] as const).map(status => (
//                 <TouchableOpacity key={status} style={styles.radioRow} onPress={() => toggleAttendance(student.id, status)}>
//                   <View style={[
//                     styles.radioOuter,
//                     attendance[student.id] === status && status === 'P' && styles.radioOuterP,
//                     attendance[student.id] === status && status === 'A' && styles.radioOuterA,
//                     attendance[student.id] === status && status === 'L' && styles.radioOuterL,
//                   ]}>
//                     {attendance[student.id] === status && <View style={styles.radioInner} />}
//                   </View>
//                   <Text style={[
//                     styles.radioLabel,
//                     attendance[student.id] === status && status === 'P' && { color: '#2E7D32' },
//                     attendance[student.id] === status && status === 'A' && { color: '#C62828' },
//                     attendance[student.id] === status && status === 'L' && { color: '#F57F17' },
//                   ]}>{status}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
//         ))}
//       </View>

//       <TouchableOpacity
//         style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
//         onPress={handleSubmit}
//         disabled={submitting}
//       >
//         {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Attendance</Text>}
//       </TouchableOpacity>
//     </>
//   );

//   // ── Daily / Session Tab ──
//   const renderDailySession = () => (
//     <>
//       {activeTab === 'Daily' ? renderDailyFilters() : renderSessionFilters()}
//       {studentsLoading ? (
//         <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
//       ) : students.length === 0 ? (
//         <View style={styles.empty}>
//           <Text style={styles.emptyIcon}>👥</Text>
//           <Text style={styles.emptyText}>
//             {activeTab === 'Session'
//               ? 'Select class, section, subject & session,\nthen tap Load Students'
//               : 'Select class, section & date,\nthen tap Load Students'}
//           </Text>
//         </View>
//       ) : renderStudentTable()}
//     </>
//   );

//   // ── Monthly Tab ──
//   const renderMonthly = () => {
//     const daysInMonth = getDaysInMonth(monthlyYear, monthlyMonth - 1);
//     const dayNums = Array.from({ length: daysInMonth }, (_, i) => i + 1);

//     return (
//       <>
//         <View style={[styles.filterCard, { zIndex: 100 }]}>
//           <View style={{ flexDirection: 'row', gap: 10 }}>
//             <View style={{ flex: 1, zIndex: 40 }}>
//               <Dropdown
//                 label="CLASS" value={monthlyClass} open={monthlyClassDropOpen}
//                 onToggle={() => { const n = !monthlyClassDropOpen; closeAllDropdowns(); setMonthlyClassDropOpen(n); }}
//                 options={classes}
//                 onSelect={item => { handleMonthlyClassSelect(item); closeAllDropdowns(); }}
//                 displayKey="class_name"
//               />
//             </View>
//             <View style={{ flex: 1, zIndex: 30 }}>
//               <Dropdown
//                 label="SECTION" value={monthlySection} open={monthlySectionDropOpen}
//                 onToggle={() => {
//                   if (!monthlyClass) { Alert.alert('Select Class', 'Please select a class first.'); return; }
//                   const n = !monthlySectionDropOpen; closeAllDropdowns(); setMonthlySectionDropOpen(n);
//                 }}
//                 options={monthlySections}
//                 onSelect={item => { setMonthlySection(item); setMonthlyData([]); }}
//                 displayKey="section_name"
//                 disabled={!monthlyClass}
//                 placeholder={!monthlyClass ? 'Select Class First' : 'Select Section'}
//               />
//             </View>
//           </View>
//           <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
//             <View style={{ flex: 1, zIndex: 20 }}>
//               <Text style={styles.dropLabel}>MONTH</Text>
//               <TouchableOpacity
//                 style={[styles.dropBtn, monthlyMonthDropOpen && styles.dropBtnOpen]}
//                 onPress={() => { const n = !monthlyMonthDropOpen; closeAllDropdowns(); setMonthlyMonthDropOpen(n); }}
//               >
//                 <Text style={styles.dropBtnText}>{MONTHS[monthlyMonth - 1]}</Text>
//                 <Text style={styles.dropArrow}>{monthlyMonthDropOpen ? '▲' : '▼'}</Text>
//               </TouchableOpacity>
//               {monthlyMonthDropOpen && (
//                 <View style={styles.dropList}>
//                   <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
//                     {MONTHS.map((m, i) => (
//                       <TouchableOpacity
//                         key={i}
//                         style={[styles.dropItem, monthlyMonth === i + 1 && styles.dropItemActive]}
//                         onPress={() => { setMonthlyMonth(i + 1); setMonthlyMonthDropOpen(false); setMonthlyData([]); }}
//                       >
//                         <Text style={[styles.dropItemText, monthlyMonth === i + 1 && styles.dropItemTextActive]}>{m}</Text>
//                       </TouchableOpacity>
//                     ))}
//                   </ScrollView>
//                 </View>
//               )}
//             </View>
//             <View style={{ flex: 1, zIndex: 10 }}>
//               <Text style={styles.dropLabel}>YEAR</Text>
//               <TouchableOpacity
//                 style={[styles.dropBtn, monthlyYearDropOpen && styles.dropBtnOpen]}
//                 onPress={() => { const n = !monthlyYearDropOpen; closeAllDropdowns(); setMonthlyYearDropOpen(n); }}
//               >
//                 <Text style={styles.dropBtnText}>{monthlyYear}</Text>
//                 <Text style={styles.dropArrow}>{monthlyYearDropOpen ? '▲' : '▼'}</Text>
//               </TouchableOpacity>
//               {monthlyYearDropOpen && (
//                 <View style={styles.dropList}>
//                   <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }}>
//                     {YEARS.map(y => (
//                       <TouchableOpacity
//                         key={y}
//                         style={[styles.dropItem, monthlyYear === y && styles.dropItemActive]}
//                         onPress={() => { setMonthlyYear(y); setMonthlyYearDropOpen(false); setMonthlyData([]); }}
//                       >
//                         <Text style={[styles.dropItemText, monthlyYear === y && styles.dropItemTextActive]}>{y}</Text>
//                       </TouchableOpacity>
//                     ))}
//                   </ScrollView>
//                 </View>
//               )}
//             </View>
//           </View>
//           <TouchableOpacity style={[styles.loadBtnFull, { marginTop: 10 }]} onPress={fetchMonthly}>
//             <Text style={styles.loadBtnText}>⟳  Load Monthly Data</Text>
//           </TouchableOpacity>
//         </View>

//         {monthlyLoading ? (
//           <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
//         ) : monthlyData.length === 0 ? (
//           <View style={styles.empty}>
//             <Text style={styles.emptyIcon}>📊</Text>
//             <Text style={styles.emptyText}>Select class, section, month & year,{'\n'}then tap Load Monthly Data</Text>
//           </View>
//         ) : (
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <View>
//               <View style={styles.tblHead}>
//                 <Text style={[styles.tblName, styles.tblHeadText]}>Student</Text>
//                 {dayNums.map(d => <Text key={d} style={[styles.tblDay, styles.tblHeadText]}>{d}</Text>)}
//                 <Text style={[styles.tblPct, styles.tblHeadText]}>%</Text>
//               </View>
//               {monthlyData.map((student: any, idx: number) => {
//                 const rec: Record<number, string> = {};
//                 (student.attendance ?? student.records ?? []).forEach((r: any) => {
//                   rec[new Date(r.date).getDate()] = r.status;
//                 });
//                 const present = Object.values(rec).filter(s => s === 'P').length;
//                 const pct = Math.round((present / daysInMonth) * 100);
//                 return (
//                   <View key={student.id ?? idx} style={[styles.tblRow, idx % 2 === 1 && styles.tblRowAlt]}>
//                     <Text style={styles.tblName} numberOfLines={1}>
//                       {student.student_firstname ?? student.name ?? `Student ${idx + 1}`}
//                     </Text>
//                     {dayNums.map(d => {
//                       const s = rec[d];
//                       return (
//                         <View key={d} style={styles.tblDay}>
//                           <Text style={[styles.tblDayText, s === 'P' && styles.tblP, s === 'A' && styles.tblA, s === 'L' && styles.tblL]}>
//                             {s ?? '·'}
//                           </Text>
//                         </View>
//                       );
//                     })}
//                     <Text style={[styles.tblPct, pct >= 75 ? styles.tblPctGood : styles.tblPctBad]}>{pct}%</Text>
//                   </View>
//                 );
//               })}
//             </View>
//           </ScrollView>
//         )}
//       </>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//           <Text style={styles.backIcon}>←</Text>
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Attendance</Text>
//         <View style={{ width: 32 }} />
//       </View>

//       <View style={styles.tabBar}>
//         {(['Daily', 'Session', 'Monthly'] as TabType[]).map(tab => (
//           <TouchableOpacity
//             key={tab}
//             style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
//             onPress={() => {
//               setActiveTab(tab);
//               setStudents([]);
//               setAttendance({});
//               setSelectedSession(null);
//             }}
//           >
//             <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
//               {tab === 'Daily' ? '📋 ' : tab === 'Session' ? '🗓 ' : '📊 '}{tab}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <ScrollView
//         contentContainerStyle={styles.scroll}
//         showsVerticalScrollIndicator={false}
//         keyboardShouldPersistTaps="handled"
//       >
//         {activeTab === 'Daily' && renderDailySession()}
//         {activeTab === 'Session' && renderDailySession()}
//         {activeTab === 'Monthly' && renderMonthly()}
//       </ScrollView>

//       {/* Calendar Modal */}
//       <Modal visible={showCalendar} transparent animationType="slide">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalBox}>
//             <View style={styles.modalHeader}>
//               <TouchableOpacity onPress={() => {
//                 const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d);
//               }}>
//                 <Text style={styles.navArrow}>‹</Text>
//               </TouchableOpacity>
//               <Text style={styles.modalMonth}>
//                 {selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
//               </Text>
//               <TouchableOpacity onPress={() => {
//                 const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d);
//               }}>
//                 <Text style={styles.navArrow}>›</Text>
//               </TouchableOpacity>
//             </View>
//             <View style={styles.calGrid}>
//               {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
//                 <Text key={d} style={styles.calDayLabel}>{d}</Text>
//               ))}
//               {calendarDays().map((day, i) => (
//                 <TouchableOpacity
//                   key={i}
//                   style={[styles.calDay, day === selectedDate.getDate() && styles.calDayActive]}
//                   onPress={() => {
//                     if (day) {
//                       const d = new Date(selectedDate); d.setDate(day);
//                       setSelectedDate(d); setShowCalendar(false);
//                     }
//                   }}
//                 >
//                   <Text style={[styles.calDayText, day === selectedDate.getDate() && styles.calDayTextActive]}>
//                     {day || ''}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//             <TouchableOpacity style={styles.calCloseBtn} onPress={() => setShowCalendar(false)}>
//               <Text style={styles.calCloseBtnText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const PRIMARY = '#0047AB';

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: '#F0F2F8' },
//   scroll: { paddingHorizontal: 14, paddingBottom: 48, paddingTop: 12 },
//   header: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14,
//   },
//   backBtn: { padding: 4, width: 32 },
//   backIcon: { fontSize: 22, color: '#fff', fontWeight: '700' },
//   headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
//   tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
//   tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
//   tabItemActive: { borderBottomColor: PRIMARY },
//   tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
//   tabTextActive: { color: PRIMARY },
//   filterCard: {
//     backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
//   },
//   filterRow2: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-end' },
//   dateBtn: {
//     flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
//     borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 11,
//   },
//   dateBtnText: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
//   loadBtn: { backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
//   loadBtnFull: { backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, alignItems: 'center' },
//   loadBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
//   dropWrap: { marginTop: 0 },
//   dropLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
//   dropBtn: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1.5,
//     borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 11,
//   },
//   dropBtnOpen: { borderColor: PRIMARY, backgroundColor: '#EEF2FF' },
//   dropBtnDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', opacity: 0.6 },
//   dropBtnText: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
//   dropBtnTextDisabled: { color: '#9CA3AF' },
//   dropPlaceholder: { color: '#9CA3AF', fontWeight: '400' },
//   dropArrow: { fontSize: 10, color: '#9CA3AF' },
//   dropList: {
//     backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB',
//     marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1, shadowRadius: 8, elevation: 8, position: 'absolute',
//     top: 64, left: 0, right: 0, zIndex: 999,
//   },
//   dropItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
//   dropItemActive: { backgroundColor: '#EEF2FF' },
//   dropItemDisabled: { backgroundColor: '#F9FAFB', opacity: 0.5 },
//   dropItemText: { fontSize: 14, color: '#374151', fontWeight: '500' },
//   dropItemTextActive: { color: PRIMARY, fontWeight: '700' },
//   dropItemTextDisabled: { color: '#9CA3AF' },
//   dropEmpty: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 14 },
//   doneBadge: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
//   doneBadgeText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
//   statsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
//   statBox: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
//   statNum: { fontSize: 18, fontWeight: '800' },
//   statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2, fontWeight: '600' },
//   tableContainer: {
//     backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
//     borderWidth: 1, borderColor: '#E5E7EB',
//   },
//   tableHeader: {
//     flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFF',
//     borderBottomWidth: 1.5, borderBottomColor: '#E5E7EB', paddingVertical: 10, paddingHorizontal: 10,
//   },
//   tableHeaderText: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3 },
//   tableRow: {
//     flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
//     paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
//   },
//   tableRowAlt: { backgroundColor: '#FAFBFF' },
//   tableCell: { fontSize: 13, color: '#1A1A2E', fontWeight: '500' },
//   checkboxCell: { width: 36, alignItems: 'center' },
//   rollCell: { width: 52, textAlign: 'center' },
//   nameCell: { flex: 1, paddingRight: 8 },
//   palCell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   palHeaderCell: { flexDirection: 'row', alignItems: 'center' },
//   palDot: { width: 8, height: 8, borderRadius: 4 },
//   palHeaderLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginLeft: 2 },
//   checkbox: {
//     width: 18, height: 18, borderRadius: 4, borderWidth: 2,
//     borderColor: '#D1D5DB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
//   },
//   checkboxChecked: { backgroundColor: PRIMARY, borderColor: PRIMARY },
//   checkmark: { color: '#fff', fontSize: 11, fontWeight: '800' },
//   radioRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
//   radioOuter: {
//     width: 18, height: 18, borderRadius: 9, borderWidth: 2,
//     borderColor: '#D1D5DB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
//   },
//   radioOuterP: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' },
//   radioOuterA: { borderColor: '#F44336', backgroundColor: '#FFEBEE' },
//   radioOuterL: { borderColor: '#FFC107', backgroundColor: '#FFF8E1' },
//   radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
//   radioLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
//   submitBtn: {
//     backgroundColor: PRIMARY, borderRadius: 12, height: 50,
//     alignItems: 'center', justifyContent: 'center', marginTop: 16,
//     shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
//   },
//   submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
//   empty: { alignItems: 'center', marginTop: 60 },
//   emptyIcon: { fontSize: 44, marginBottom: 10 },
//   emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
//   tblHead: { flexDirection: 'row', backgroundColor: PRIMARY, borderRadius: 8, marginBottom: 2 },
//   tblRow: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 1 },
//   tblRowAlt: { backgroundColor: '#F8FAFF' },
//   tblHeadText: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
//   tblName: { width: 110, paddingHorizontal: 8, paddingVertical: 8, fontSize: 12, fontWeight: '600', color: '#1A1A2E' },
//   tblDay: { width: 26, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
//   tblDayText: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', fontWeight: '600' },
//   tblP: { color: '#2E7D32', fontWeight: '800' },
//   tblA: { color: '#C62828', fontWeight: '800' },
//   tblL: { color: '#F57F17', fontWeight: '800' },
//   tblPct: { width: 38, paddingVertical: 8, textAlign: 'center', fontSize: 11, fontWeight: '700' },
//   tblPctGood: { color: '#2E7D32' },
//   tblPctBad: { color: '#C62828' },
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
//   modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
//   modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
//   modalMonth: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
//   navArrow: { fontSize: 28, color: PRIMARY, paddingHorizontal: 12 },
//   calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
//   calDayLabel: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 8 },
//   calDay: { width: '14.28%', alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
//   calDayActive: { backgroundColor: PRIMARY },
//   calDayText: { fontSize: 14, color: '#1A1A2E' },
//   calDayTextActive: { color: '#fff', fontWeight: '700' },
//   calCloseBtn: { marginTop: 16, alignItems: 'center', padding: 14, backgroundColor: '#F5F6FA', borderRadius: 12 },
//   calCloseBtnText: { fontSize: 15, fontWeight: '700', color: PRIMARY },
// });