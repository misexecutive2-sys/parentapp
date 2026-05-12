import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Modal, TextInput, RefreshControl
} from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "https://connect.schoolaid.in";

type AttendanceStatus = "P" | "A" | "L" | "H" | null;
type FilterType = "P" | "A" | "L" | "H" | null;

interface DayAttendance { date: string; status: AttendanceStatus; }
interface LeaveComment {
  id: number;
  leave_id: number;
  comment: string;
  comment_by: string;
  created_at: string;
}
interface LeaveRecord {
  id: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  applied_at: string;
  student_id?: string;
  student_name?: string;
  comments?: LeaveComment[];
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PRIMARY = "#0047AB";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDisplay(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
    const [y, m, d] = dateStr.split("-");
    return `${d} ${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}

function normalizeStatus(status: string): string {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
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

// ── Trend Chart Component ─────────────────────────────────────────────────────

function AttendanceTrendChart({ calendarData, currentMonth, currentYear }: {
  calendarData: DayAttendance[];
  currentMonth: number;
  currentYear: number;
}) {
  const sorted = [...calendarData]
    .filter(d => d.status !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < 2) {
    return (
      <View style={tStyles.wrap}>
        <View style={tStyles.header}>
          <Text style={tStyles.title}>Attendance Trend</Text>
          <Text style={tStyles.sub}>{MONTHS[currentMonth]} {currentYear}</Text>
        </View>
        <View style={tStyles.empty}>
          <Text style={tStyles.emptyTxt}>Not enough data to show trend</Text>
        </View>
      </View>
    );
  }

  const W = 300, H = 100, PX = 12, PY = 14;
  const innerW = W - PX * 2;
  const innerH = H - PY * 2;

  // Build running attendance % per day
  let rP = 0, rW = 0;
  const points = sorted.map((d, i) => {
    if (d.status !== "H") rW++;
    if (d.status === "P") rP++;
    const pct = rW > 0 ? rP / rW : 0;
    const x = PX + (i / Math.max(sorted.length - 1, 1)) * innerW;
    const y = PY + (1 - pct) * innerH;
    return { x, y, pct, date: d.date, status: d.status };
  });

  // Smooth cubic bezier path
  const linePath = points.map((p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = points[i - 1];
    const cpX = ((prev.x + p.x) / 2).toFixed(1);
    return `C ${cpX} ${prev.y.toFixed(1)} ${cpX} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(H - PY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(H - PY).toFixed(1)} Z`;

  const lastPct = points[points.length - 1]?.pct ?? 0;
  const lineColor = lastPct >= 0.75 ? "#16a34a" : lastPct >= 0.5 ? "#f59e0b" : "#dc2626";
  const statusLabel = lastPct >= 0.75 ? "Good" : lastPct >= 0.5 ? "Average" : "Low";

  // Guide lines at 75% and 50%
  const guide75Y = (PY + (1 - 0.75) * innerH).toFixed(1);
  const guide50Y = (PY + (1 - 0.5) * innerH).toFixed(1);

  // Only show dots at first, last, and key turning points
  const keyPoints = points.filter((p, i) => {
    if (i === 0 || i === points.length - 1) return true;
    const prev = points[i - 1];
    const next = points[i + 1];
    const isPeak = p.pct > prev.pct && p.pct > next.pct;
    const isDip = p.pct < prev.pct && p.pct < next.pct;
    return isPeak || isDip;
  });

  return (
    <View style={tStyles.wrap}>
      {/* Header */}
      <View style={tStyles.header}>
        <View>
          <Text style={tStyles.title}>Attendance Trend</Text>
          <Text style={tStyles.sub}>{MONTHS[currentMonth]} {currentYear}</Text>
        </View>
        <View style={[tStyles.badge, { backgroundColor: lineColor + "18", borderColor: lineColor + "50" }]}>
          <Text style={[tStyles.badgePct, { color: lineColor }]}>{(lastPct * 100).toFixed(1)}%</Text>
          <Text style={[tStyles.badgeLabel, { color: lineColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* SVG Chart */}
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.20" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* 75% guide */}
        <Path
          d={`M ${PX} ${guide75Y} L ${W - PX} ${guide75Y}`}
          stroke="#E2E8F0"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* 50% guide */}
        <Path
          d={`M ${PX} ${guide50Y} L ${W - PX} ${guide50Y}`}
          stroke="#E2E8F0"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Area fill under curve */}
        <Path d={areaPath} fill="url(#trendGrad)" />

        {/* Trend line */}
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Key point dots */}
        {keyPoints.map((p, i) => (
          <Circle
            key={`kp-${i}`}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#fff"
            stroke={lineColor}
            strokeWidth="2"
          />
        ))}
      </Svg>

      {/* X-axis labels */}
      <View style={tStyles.xRow}>
        <Text style={tStyles.xLabel}>{sorted[0]?.date.slice(8)} {MONTHS_SHORT[currentMonth]}</Text>
        <Text style={tStyles.xLabel}>{sorted[Math.floor(sorted.length / 2)]?.date.slice(8)} {MONTHS_SHORT[currentMonth]}</Text>
        <Text style={tStyles.xLabel}>{sorted[sorted.length - 1]?.date.slice(8)} {MONTHS_SHORT[currentMonth]}</Text>
      </View>

      {/* Y-axis legend */}
      <View style={tStyles.yLegend}>
        <View style={tStyles.yItem}>
          <View style={[tStyles.yDash, { backgroundColor: "#E2E8F0" }]} />
          <Text style={tStyles.yLabel}>75%</Text>
        </View>
        <View style={tStyles.yItem}>
          <View style={[tStyles.yDash, { backgroundColor: "#E2E8F0" }]} />
          <Text style={tStyles.yLabel}>50%</Text>
        </View>
      </View>
    </View>
  );
}

const tStyles = StyleSheet.create({
  wrap: {
    width: "100%", backgroundColor: "#fff", borderRadius: 14,
    padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#E8EEF8",
  },
  header: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 10,
  },
  title: { fontSize: 13, fontWeight: "800", color: "#1A1A2E" },
  sub: { fontSize: 10, color: "#aaa", marginTop: 2 },
  badge: {
    alignItems: "center", paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  badgePct: { fontSize: 13, fontWeight: "800" },
  badgeLabel: { fontSize: 9, fontWeight: "600", marginTop: 1 },
  xRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 12, marginTop: 4,
  },
  xLabel: { fontSize: 9, color: "#bbb", fontWeight: "600" },
  yLegend: {
    flexDirection: "row", gap: 12, marginTop: 8,
    paddingHorizontal: 4,
  },
  yItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  yDash: { width: 14, height: 1.5 },
  yLabel: { fontSize: 9, color: "#bbb", fontWeight: "600" },
  empty: {
    height: 80, alignItems: "center", justifyContent: "center",
    backgroundColor: "#F8FAFF", borderRadius: 10,
  },
  emptyTxt: { fontSize: 12, color: "#bbb" },
});

// ── CalendarPicker ────────────────────────────────────────────────────────────

interface CalendarPickerProps {
  fromDate: string;
  toDate: string;
  onFromChange: (d: string) => void;
  onToChange: (d: string) => void;
}

function CalendarPicker({ fromDate, toDate, onFromChange, onToChange }: CalendarPickerProps) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [pickStep, setPickStep] = useState<0 | 1>(0);

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

  const todayStr = now.toISOString().split("T")[0];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
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
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isFrom = dateStr === fromDate;
          const isTo = dateStr === toDate;
          const isInRange = inRange(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <TouchableOpacity
              key={dateStr}
              style={[cp.cell, isInRange && cp.cellInRange, (isFrom || isTo) && cp.cellSelected]}
              onPress={() => handleDayPress(dateStr)}
              activeOpacity={0.7}
            >
              <Text style={[
                cp.cellTxt,
                isInRange && cp.cellTxtInRange,
                (isFrom || isTo) && cp.cellTxtSelected,
                isToday && !isFrom && !isTo && cp.cellTxtToday,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={cp.selRow}>
        <View style={[cp.selBox, fromDate ? cp.selBoxFilled : null]}>
          <Text style={cp.selLabel}>From</Text>
          <Text style={[cp.selValue, !fromDate && cp.selPlaceholder]}>
            {fromDate ? fmtDisplay(fromDate) : "Not selected"}
          </Text>
        </View>
        <Text style={cp.selArrow}>→</Text>
        <View style={[cp.selBox, toDate ? cp.selBoxFilled : null]}>
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
  wrap: { backgroundColor: "#F0F4FF", borderRadius: 14, padding: 12, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  navBtn: { padding: 6 },
  navTxt: { fontSize: 24, color: PRIMARY, fontWeight: "700" },
  monthTxt: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 10, gap: 6 },
  stepLine: { flex: 1, height: 1, backgroundColor: "#BFDBFE", maxWidth: 40 },
  stepPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: "#E0EAFF", borderWidth: 1, borderColor: "#BFDBFE" },
  stepPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  stepTxt: { fontSize: 11, fontWeight: "700", color: "#6B9BEB" },
  stepTxtActive: { color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayHdr: { width: "14.28%", textAlign: "center", fontSize: 10, fontWeight: "700", color: PRIMARY, paddingBottom: 4 },
  cell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  cellSelected: { backgroundColor: PRIMARY, borderRadius: 6 },
  cellInRange: { backgroundColor: "#DBEAFE", borderRadius: 0 },
  cellTxt: { fontSize: 12, color: "#1A1A2E" },
  cellTxtSelected: { color: "#fff", fontWeight: "700" },
  cellTxtInRange: { color: PRIMARY, fontWeight: "600" },
  cellTxtToday: { fontWeight: "800", color: PRIMARY },
  selRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, gap: 8 },
  selBox: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#BFDBFE" },
  selBoxFilled: { borderColor: PRIMARY, borderWidth: 1.5 },
  selLabel: { fontSize: 10, color: "#888", fontWeight: "600", marginBottom: 2 },
  selValue: { fontSize: 13, fontWeight: "700", color: PRIMARY },
  selPlaceholder: { color: "#aaa", fontWeight: "400" },
  selArrow: { fontSize: 18, color: "#aaa" },
});

// ─────────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────────
export default function AttendanceScreen() {
  const router = useRouter();
  const now = new Date();
  const { theme } = useTheme();

  const [childName, setChildName] = useState("Student");
  const [childClass, setChildClass] = useState("—");
  const [childSection, setChildSection] = useState("—");
  const [studentId, setStudentId] = useState("");
  const [authToken, setAuthToken] = useState("");

  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [calendarData, setCalendarData] = useState<DayAttendance[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [loading, setLoading] = useState(false);

  const [activeModal, setActiveModal] = useState<"monthly" | "session" | "apply" | "history" | null>(null);

  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [tappedDate, setTappedDate] = useState<string | null>(null);
  const [tappedLeave, setTappedLeave] = useState<LeaveRecord | null>(null);

  const leaveDatesSet = new Set<string>(
    leaveRecords.flatMap(r => datesBetween(r.from_date, r.to_date))
  );
  const leaveDateMap = new Map<string, LeaveRecord>();
  leaveRecords.forEach(r => {
    datesBetween(r.from_date, r.to_date).forEach(d => leaveDateMap.set(d, r));
  });

  // ── Fetch calendar ────────────────────────────────────────────────────────

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setActiveFilter(null);
    try {
      const token = await AsyncStorage.getItem("token");
      const yearId = await AsyncStorage.getItem("selectedYearId");
      const childStr = await AsyncStorage.getItem("selectedChild");
      if (!childStr || !token) return;

      const child = JSON.parse(childStr);
      const sid = child.id ?? child.student_id ?? child.studentId ?? "";

      if (!sid) { setCalendarData([]); return; }

      const res = await fetch(
        `${API_BASE}/api/attendance/monthly/${sid}?month=${currentMonth + 1}&year=${currentYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-academic-year": yearId ?? "16",
            Accept: "application/json",
          },
        }
      );

      const data = await res.json();

      let rawRecords: any[] = [];
      if (Array.isArray(data)) rawRecords = data;
      else if (Array.isArray(data.attendance)) rawRecords = data.attendance;
      else if (Array.isArray(data.data)) rawRecords = data.data;
      else if (Array.isArray(data.records)) rawRecords = data.records;

      const statusMap: Record<string, AttendanceStatus> = {
        present: "P", absent: "A", leave: "L", holiday: "H",
        p: "P", a: "A", l: "L", h: "H",
      };

      const records: DayAttendance[] = rawRecords.map((r: any) => ({
        date: r.date ? r.date.split("T")[0] : "",
        status: statusMap[String(r.status).toLowerCase()] ?? null,
      }));

      setCalendarData(records);
    } catch (error: any) {
      Alert.alert("Error", `Failed to load calendar: ${error.message}`);
      setCalendarData([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  // ── Fetch leave history ───────────────────────────────────────────────────

  const fetchLeaveHistory = useCallback(async (sid: string, token: string) => {
    if (!sid || !token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaves/student?student_id=${sid}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-academic-year-id": await AsyncStorage.getItem("selectedYearId") ?? "16" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const records = Array.isArray(data) ? data
        : Array.isArray(data.leaves) ? data.leaves
        : Array.isArray(data.data) ? data.data
        : Array.isArray(data.records) ? data.records
        : Array.isArray(data.result) ? data.result : [];
      setLeaveRecords(records);
    } catch (error: any) {
      console.error("Failed to fetch leave history:", error);
      setLeaveRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const bootstrap = async () => {
      let sid = "";
      let token = "";
      try { token = (await AsyncStorage.getItem("token")) ?? ""; } catch {}
      try {
        const raw = await AsyncStorage.getItem("selectedChild");
        if (raw) {
          const c = JSON.parse(raw);
          setChildName(c.name ?? "Student");
          setChildClass(c.classname ?? "—");
          setChildSection(c.sectionname ?? "—");
          sid = c.id ?? c.student_id ?? c.studentId ?? c.studentID
            ?? c.userId ?? c.user_id ?? c.admissionNo ?? "";
        }
      } catch {}
      if (!sid && token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
          const lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
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
          sid = payload.student_id ?? payload.id ?? payload.userId ?? payload.user_id ?? payload.admissionNo ?? "";
        } catch {}
      }
      if (sid) setStudentId(sid);
      if (token) setAuthToken(token);
      if (sid && token) fetchLeaveHistory(sid, token);
      fetchCalendar();
    };
    bootstrap();
  }, []);

  useEffect(() => { fetchCalendar(); }, [currentMonth, currentYear]);

  // ── Apply leave ───────────────────────────────────────────────────────────

  const handleApplyLeave = async () => {
    if (!leaveFrom) return Alert.alert("Error", "Please select a start date.");
    if (!leaveTo) return Alert.alert("Error", "Please select an end date.");
    if (!leaveReason.trim()) return Alert.alert("Error", "Please enter a reason.");
    if (!studentId) return Alert.alert("Error", "Student ID not found. Please re-login.");
    if (!authToken) return Alert.alert("Error", "Auth token not found. Please re-login.");

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/leaves/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` , "x-academic-year-id": await AsyncStorage.getItem("selectedYearId") ?? "16"  },
        body: JSON.stringify({
          student_id: Number(studentId),
          from_date: leaveFrom,
          to_date: leaveTo,
          reason: leaveReason.trim(),
        }),
      });
      const result = await response.json();
      if (response.ok && (result.success || result.message || result.msg || result.leave_id)) {
        await fetchLeaveHistory(studentId, authToken);
        setLeaveFrom(""); setLeaveTo(""); setLeaveReason("");
        setActiveModal(null);
        Alert.alert("✅ Success", `Leave applied from ${fmtDisplay(leaveFrom)} to ${fmtDisplay(leaveTo)}`);
      } else {
        Alert.alert("Error", result.errors ? result.errors.join(", ") : result.message ?? "Failed to apply leave");
      }
    } catch (error: any) {
      Alert.alert("Error", `Network error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel leave ──────────────────────────────────────────────────────────

  const handleCancelLeave = (leaveId: string) => {
    Alert.alert("Cancel Leave", "Are you sure you want to cancel this leave application?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel", style: "destructive",
        onPress: async () => {
          setCancelling(leaveId);
          try {
            const response = await fetch(`${API_BASE}/api/leaves/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}`, "x-academic-year-id": await AsyncStorage.getItem("selectedYearId") ?? "16" },
              body: JSON.stringify({ leave_id: Number(leaveId), status: "Cancelled" }),
            });
            const result = await response.json();
            if (response.ok && (result.success || result.message || result.msg)) {
              setLeaveRecords(prev => prev.map(r => r.id === leaveId ? { ...r, status: "Cancelled" } : r));
              await fetchLeaveHistory(studentId, authToken);
              Alert.alert("✅ Done", "Leave application has been cancelled.");
            } else {
              Alert.alert("Error", result.message ?? result.errors?.join(", ") ?? "Failed to cancel leave.");
            }
          } catch (error: any) {
            Alert.alert("Error", `Network error: ${error.message}`);
          } finally {
            setCancelling(null);
          }
        },
      },
    ]);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () =>
    Alert.alert("Logout", "Do you really want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes", style: "destructive", onPress: async () => {
          await AsyncStorage.multiRemove(["token", "selectedChild", "selectedYearId", "selectedYearLabel"]);
          router.replace("/login");
        },
      },
    ], { cancelable: true });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
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
      default: return { bg: "#fff", border: "#E0E6F0", text: "#1A1A2E" };
    }
  };

  const getLeaveStatusStyle = (status: LeaveRecord["status"]) => {
    const s = normalizeStatus(status);
    if (s === "Cancelled") return { bg: "#f3f4f6", text: "#6b7280", icon: "🚫" };
    return { bg: "#fef9c3", text: "#ca8a04", icon: "🕐" };
  };

  const handleCalendarDayPress = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (tappedDate === dateStr) { setTappedDate(null); setTappedLeave(null); return; }
    setTappedDate(dateStr);
    setTappedLeave(leaveDateMap.get(dateStr) ?? null);
  };

  // ── Derived stats ─────────────────────────────────────────────────────────

  const presentDays = calendarData.filter(d => d.status === "P");
  const absentDays = calendarData.filter(d => d.status === "A");
  const leaveDays = calendarData.filter(d => d.status === "L");
  const holidayDays = calendarData.filter(d => d.status === "H");
  const workingDays = calendarData.filter(d => d.status !== "H").length;
  const percentage = workingDays > 0 ? ((presentDays.length / workingDays) * 100).toFixed(1) : "0.0";

  const monthlyDetail = {
    present: presentDays.length,
    absent: absentDays.length,
    leave: leaveDays.length,
    holidays: holidayDays.length,
    percentage: Number(percentage),
  };

  const sessionData = calendarData
    .filter(d => d.status !== "H" && d.status !== null)
    .flatMap(d => [
      { date: d.date, session: "Morning", status: d.status },
      { date: d.date, session: "Afternoon", status: d.status },
    ])
    .sort((a, b) => b.date.localeCompare(a.date));

  // ── Calendar renderer ─────────────────────────────────────────────────────

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
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
            const status = getStatusForDate(day);
            const isToday = isThisMonth && day === now.getDate();
            const isFiltered = activeFilter !== null && status !== activeFilter;
            const s = getDayStyle(status);
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isLocalL = leaveDatesSet.has(dateStr);
            const isTapped = tappedDate === dateStr;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.calendarCell,
                  { backgroundColor: isFiltered ? "#f9f9f9" : s.bg, borderColor: isFiltered ? "#eee" : s.border },
                  isToday && !isFiltered && styles.todayCell,
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

        {tappedDate && (() => {
          const status = calendarData.find(d => d.date === tappedDate)?.status
            ?? (leaveDatesSet.has(tappedDate) ? "L" : null);
          const s = getDayStyle(status);
          const statusLabels: Record<string, string> = { P: "Present", A: "Absent", L: "Leave", H: "Holiday" };
          return (
            <View style={styles.dayInfoPanel}>
              <View style={styles.dayInfoHeader}>
                <Text style={styles.dayInfoDate}>{fmtDisplay(tappedDate)}</Text>
                {status && (
                  <View style={[styles.dayInfoBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
                    <Text style={[styles.dayInfoBadgeText, { color: s.text }]}>{statusLabels[status] ?? status}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => { setTappedDate(null); setTappedLeave(null); }} style={styles.dayInfoClose}>
                  <Text style={styles.dayInfoCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>
              {tappedLeave ? (
                <View style={styles.dayInfoBody}>
                  <Text style={styles.dayInfoReasonLabel}>Reason</Text>
                  <Text style={styles.dayInfoReason}>{tappedLeave.reason}</Text>
                  <View style={styles.dayInfoMeta}>
                    <Text style={styles.dayInfoMetaTxt}>{fmtDisplay(tappedLeave.from_date)} → {fmtDisplay(tappedLeave.to_date)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.dayInfoEmpty}>
                  {status === "P" ? "Attended school on this day."
                    : status === "A" ? "Absent on this day."
                    : status === "H" ? "School holiday."
                    : "No details available for this day."}
                </Text>
              )}
            </View>
          );
        })()}
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={[styles.headerTop, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>⬅</Text>
          </TouchableOpacity>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.avatarInitials}>{getInitials(childName)}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{childName}</Text>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>{childClass} {childSection && `· ${childSection}`}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>↪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        //
        {/* style={{ flex: 1 }} */}
          refreshControl={
            <RefreshControl
              refreshing={loading}          // your loading state
              onRefresh={fetchCalendar}     // function to call when pulled down
              colors={["#0047AB"]}          // spinner color (Android)
              tintColor="#0047AB"           // spinner color (iOS)
            />
          }
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={styles.navArrow}>{"<<"}</Text></TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={styles.navArrow}>{">>"}</Text></TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {loading ? <ActivityIndicator size="large" color={PRIMARY} /> : renderCalendar()}
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
            onPress={() => { fetchLeaveHistory(studentId, authToken); setActiveModal("history"); }}
            activeOpacity={0.85}
          >
            <Text style={styles.actionCardIcon}>{"📋"}</Text>
            <Text style={styles.actionCardText}>{"Leave\nHistory"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Monthly Modal ── */}
      <Modal visible={activeModal === "monthly"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalTitle}>📊 Monthly Details</Text>
            <Text style={styles.modalSubtitle}>{MONTHS[currentMonth]} {currentYear}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }} contentContainerStyle={{ paddingBottom: 20 }}>

              {/* Stats grid — Present, Absent, Holidays, Percentage only */}
              <View style={styles.monthlyGrid}>
                {[
                  { label: "Present",    value: monthlyDetail.present,          color: "#16a34a", bg: "#dcfce7" },
                  { label: "Absent",     value: monthlyDetail.absent,           color: "#dc2626", bg: "#fee2e2" },
                  { label: "Holidays",   value: monthlyDetail.holidays,         color: "#9ca3af", bg: "#f3f4f6" },
                  { label: "Percentage", value: monthlyDetail.percentage + "%", color: "#7c3aed", bg: "#f5f3ff" },
                ].map(item => (
                  <View key={item.label} style={[styles.monthlyCell, { backgroundColor: item.bg, borderColor: item.color + "40" }]}>
                    <Text style={[styles.monthlyCellNum, { color: item.color }]}>{item.value}</Text>
                    <Text style={styles.monthlyCellLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* Trend line chart */}
              <AttendanceTrendChart
                calendarData={calendarData}
                currentMonth={currentMonth}
                currentYear={currentYear}
              />

              {/* Leave section */}
              {leaveRecords.length > 0 && (() => {
                const activeLeaves = leaveRecords.filter(r => normalizeStatus(r.status) !== "Cancelled");
                if (activeLeaves.length === 0) return null;
                return (
                  <View style={styles.monthlyLeaveSection}>
                    <View style={styles.monthlyLeaveSectionHeader}>
                      <Text style={styles.monthlyLeaveSectionTitle}>📋 Active Leaves</Text>
                      <View style={styles.monthlyLeaveCount}>
                        <Text style={styles.monthlyLeaveCountTxt}>{activeLeaves.length}</Text>
                      </View>
                    </View>
                    {activeLeaves.map(leave => {
                      const s = getLeaveStatusStyle(leave.status);
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
                            <Text style={styles.monthlyLeaveStatusTxt}>{s.icon}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Session Modal ── */}
      <Modal visible={activeModal === "session"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalTitle}>🕐 Session Wise Attendance</Text>
            <Text style={styles.modalSubtitle}>{MONTHS[currentMonth]} {currentYear}</Text>
            {sessionData.length > 0 ? (
              <ScrollView style={{ width: "100%", marginTop: 10 }} showsVerticalScrollIndicator={false}>
                {sessionData.map((item, i) => {
                  const s = getDayStyle(item.status);
                  return (
                    <View key={i} style={styles.sessionRow}>
                      <Text style={styles.sessionDate}>{item.date}</Text>
                      <Text style={styles.sessionName}>{item.session}</Text>
                      <View style={[styles.sessionBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
                        <Text style={[styles.sessionBadgeText, { color: s.text }]}>{item.status}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={{ color: "#888", marginTop: 20 }}>No session data available.</Text>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Apply Leave Modal ── */}
      <Modal visible={activeModal === "apply"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={[styles.modalSheet, { maxHeight: "94%" }]}>
            <View style={styles.modalDragHandle} />
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
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }} keyboardShouldPersistTaps="handled">
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
              <Text style={styles.sectionLabel}>📅 Select Dates</Text>
              <CalendarPicker fromDate={leaveFrom} toDate={leaveTo} onFromChange={setLeaveFrom} onToChange={setLeaveTo} />
              {leaveFrom && leaveTo && (
                <View style={styles.dayCountPill}>
                  <Text style={styles.dayCountTxt}>
                    🗓 {datesBetween(leaveFrom, leaveTo).length} day{datesBetween(leaveFrom, leaveTo).length !== 1 ? "s" : ""} selected
                  </Text>
                </View>
              )}
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
              <TouchableOpacity
                style={[styles.submitLeaveBtn, (!leaveFrom || !leaveTo || !leaveReason.trim() || submitting) && styles.submitLeaveBtnDisabled]}
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
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Leave History Modal ── */}
      <Modal visible={activeModal === "history"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActiveModal(null)} />
          <View style={styles.historySheet}>
            <View style={styles.modalDragHandle} />
            <View style={styles.historyModalHeader}>
              <Text style={styles.historyModalTitle}>📋 Leave History</Text>
              <TouchableOpacity onPress={() => fetchLeaveHistory(studentId, authToken)} style={styles.historyRefreshBtn} activeOpacity={0.7}>
                <Text style={styles.historyRefreshTxt}>↻ Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.applyModalClose} activeOpacity={0.7}>
                <Text style={styles.applyModalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {leaveRecords.length > 0 && (
              <View style={styles.historySummaryRow}>
                {[
                  { label: "Total",     count: leaveRecords.length, color: PRIMARY, bg: "#EFF6FF" },
                  { label: "Pending",   count: leaveRecords.filter(r => normalizeStatus(r.status) !== "Cancelled").length, color: "#ca8a04", bg: "#fef9c3" },
                  { label: "Cancelled", count: leaveRecords.filter(r => normalizeStatus(r.status) === "Cancelled").length, color: "#6b7280", bg: "#f3f4f6" },
                ].map(s => (
                  <View key={s.label} style={[styles.historySummaryPill, { backgroundColor: s.bg }]}>
                    <Text style={[styles.historySummaryCount, { color: s.color }]}>{s.count}</Text>
                    <Text style={[styles.historySummaryLabel, { color: s.color }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {historyLoading ? (
              <View style={styles.historyLoadingWrap}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.historyLoadingTxt}>Loading leave records...</Text>
              </View>
            ) : leaveRecords.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyIcon}>📭</Text>
                <Text style={styles.historyEmptyTitle}>No leave applications yet</Text>
                <Text style={styles.historyEmptySubtitle}>Your submitted leave requests will appear here</Text>
              </View>
            ) : (
              <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
                {leaveRecords.map((item) => {
                  const s = getLeaveStatusStyle(item.status);
                  const days = datesBetween(item.from_date, item.to_date).length;
                  const isCancellingThis = cancelling === item.id;
                  return (
                    <View key={item.id} style={styles.historyCard}>
                      <View style={[styles.historyCardAccent, { backgroundColor: s.text }]} />
                      <View style={{ flex: 1, paddingLeft: 12 }}>
                        <View style={styles.historyCardDateRow}>
                          <Text style={styles.historyCardDates}>
                            {fmtDisplay(item.from_date)}
                            {item.from_date !== item.to_date ? ` → ${fmtDisplay(item.to_date)}` : ""}
                          </Text>
                          <View style={styles.historyCardDaysBadge}>
                            <Text style={styles.historyCardDaysTxt}>{days}d</Text>
                          </View>
                        </View>
                        <Text style={styles.historyCardReason}>{item.reason}</Text>
                        <View style={styles.historyCardMeta}>
                          <Text style={styles.historyCardApplied}>
                            Applied {new Date(item.applied_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </Text>
                          <View style={[styles.historyCardStatus, { backgroundColor: s.bg }]}>
                            <Text style={styles.historyCardStatusIcon}>{s.icon}</Text>
                            <Text style={[styles.historyCardStatusTxt, { color: s.text }]}>{item.status}</Text>
                          </View>
                        </View>
                        {normalizeStatus(item.status) !== "Cancelled" && (
                          <TouchableOpacity
                            style={styles.cancelLeaveBtn}
                            onPress={() => handleCancelLeave(item.id)}
                            disabled={isCancellingThis}
                            activeOpacity={0.6}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            {isCancellingThis
                              ? <ActivityIndicator size="small" color="#DC2626" />
                              : <Text style={styles.cancelLeaveBtnText}>✕ Cancel Application</Text>
                            }
                          </TouchableOpacity>
                        )}
                        {item.comments && item.comments.length > 0 && (
                          <View style={styles.commentsWrap}>
                            <View style={styles.commentsDivider} />
                            {item.comments.map(c => (
                              <View key={c.id} style={styles.commentBubble}>
                                <View style={styles.commentHeader}>
                                  <View style={styles.commentAvatarWrap}>
                                    <Text style={styles.commentAvatarTxt}>{c.comment_by.charAt(0).toUpperCase()}</Text>
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
                })}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.historyCloseBtn} onPress={() => setActiveModal(null)} activeOpacity={0.7}>
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

  headerTop: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  backArrow: { color: "#fff", fontSize: 22, fontWeight: "600" },
  avatarContainer: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, justifyContent: "center" },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  avatarInitials: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerTextContainer: { alignItems: "flex-start" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 4 },
  classBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  classBadgeText: { color: "rgba(255,255,255,0.95)", fontSize: 11, fontWeight: "600" },
  logoutBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  logoutIcon: { color: "#fff", fontSize: 20, fontWeight: "600" },

  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 22, color: "#0047AB", fontWeight: "800" },
  monthLabel: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },

  calendarCard: { backgroundColor: "#fff", marginHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: "#E0E6F0", padding: 10 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayHeader: { width: "14.28%", textAlign: "center", fontSize: 11, fontWeight: "700", color: "#0047AB", paddingBottom: 6 },
  calendarCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#E0E6F0", marginBottom: 3 },
  calendarDayText: { fontSize: 12, fontWeight: "600" },
  todayCell: { borderWidth: 2.5, borderColor: "#0047AB" },
  todayText: { fontWeight: "800" },
  tappedCell: { borderWidth: 2.5, borderColor: "#7c3aed" },
  leaveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#ca8a04", position: "absolute", bottom: 3 },

  dayInfoPanel: { marginTop: 8, backgroundColor: "#F8FAFF", borderRadius: 10, borderWidth: 1, borderColor: "#BFDBFE", padding: 8 },
  dayInfoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 },
  dayInfoDate: { fontSize: 12, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  dayInfoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  dayInfoBadgeText: { fontSize: 10, fontWeight: "700" },
  dayInfoClose: { padding: 4 },
  dayInfoCloseTxt: { fontSize: 13, color: "#aaa", fontWeight: "700" },
  dayInfoBody: { gap: 2 },
  dayInfoReasonLabel: { fontSize: 9, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  dayInfoReason: { fontSize: 12, fontWeight: "600", color: "#1A1A2E", lineHeight: 16 },
  dayInfoMeta: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 6 },
  dayInfoMetaTxt: { fontSize: 10, color: "#888", flex: 1 },
  dayInfoEmpty: { fontSize: 11, color: "#888", fontStyle: "italic" },

  legendRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 6, gap: 6 },
  leaveDotLegend: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ca8a04" },
  legendTxt: { fontSize: 11, color: "#888" },
  percentageBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginTop: 10, gap: 8 },
  percentageLabel: { fontSize: 12, fontWeight: "700", color: "#555", width: 80 },
  progressBg: { flex: 1, height: 8, backgroundColor: "#E0E6F0", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#16a34a", borderRadius: 4 },
  percentageValue: { fontSize: 13, fontWeight: "800", color: "#16a34a", width: 44, textAlign: "right" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 12, marginTop: 14, gap: 10 },
  actionCard: { width: "47.5%", borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  actionCardIcon: { fontSize: 26, marginBottom: 6 },
  actionCardText: { fontSize: 13, fontWeight: "700", color: "#fff", textAlign: "center", lineHeight: 18 },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34, maxHeight: "85%", alignItems: "center" },
  modalDragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E6F0", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0047AB", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: "#888", marginBottom: 12 },

  monthlyGrid: { flexDirection: "row", flexWrap: "wrap", width: "100%", gap: 10, marginBottom: 14 },
  monthlyCell: { width: "47%", backgroundColor: "#F5F7FA", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#E0E6F0" },
  monthlyCellNum: { fontSize: 22, fontWeight: "800" },
  monthlyCellLabel: { fontSize: 11, color: "#888", fontWeight: "600", marginTop: 2 },

  sessionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#E0E6F0", gap: 10 },
  sessionDate: { fontSize: 12, color: "#555", flex: 1 },
  sessionName: { fontSize: 13, fontWeight: "600", color: "#1A1A2E", flex: 1 },
  sessionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  sessionBadgeText: { fontSize: 12, fontWeight: "700" },

  applyModalHeader: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 16, gap: 10 },
  applyModalIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  applyModalIcon: { fontSize: 22 },
  applyModalTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A2E" },
  applyModalSub: { fontSize: 11, color: "#888", marginTop: 1 },
  applyModalClose: { padding: 8, marginLeft: "auto" },
  applyModalCloseTxt: { fontSize: 18, color: "#aaa", fontWeight: "700" },
  studentChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "#BFDBFE", gap: 8, width: "100%" },
  studentChipIcon: { fontSize: 16 },
  studentChipText: { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  studentChipIdPill: { backgroundColor: "#fff", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#BFDBFE" },
  studentChipId: { fontSize: 11, color: "#0047AB", fontWeight: "700" },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#0047AB", marginBottom: 6, alignSelf: "flex-start", width: "100%" },
  dayCountPill: { alignSelf: "center", backgroundColor: "#EFF6FF", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  dayCountTxt: { fontSize: 13, fontWeight: "700", color: "#0047AB" },
  input: { width: "100%", backgroundColor: "#F5F7FA", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1A1A2E", borderWidth: 1, borderColor: "#E0E6F0" },
  inputMultiline: { height: 80, textAlignVertical: "top" },
  submitLeaveBtn: { width: "100%", backgroundColor: "#0047AB", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16, flexDirection: "row", justifyContent: "center" },
  submitLeaveBtnDisabled: { backgroundColor: "#94a3b8", opacity: 0.7 },
  submitLeaveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  closeBtn: { marginTop: 12, paddingVertical: 8, alignItems: "center" },
  closeBtnText: { fontSize: 14, color: "#888", fontWeight: "600" },

  historySheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34, height: "88%", flexDirection: "column" },
  historyScroll: { flex: 1, width: "100%", marginTop: 6 },
  historyLoadingWrap: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const },
  historyLoadingTxt: { fontSize: 13, color: "#888", marginTop: 8 },
  historyCloseBtn: { paddingVertical: 12, alignItems: "center" as const, borderTopWidth: 1, borderTopColor: "#F0F0F0", marginTop: 4 },

  historyModalHeader: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 12, gap: 6 },
  historyModalTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A2E", flex: 1 },
  historyRefreshBtn: { backgroundColor: "#EFF6FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#BFDBFE" },
  historyRefreshTxt: { fontSize: 12, fontWeight: "700", color: "#0047AB" },
  historySummaryRow: { flexDirection: "row", width: "100%", gap: 6, marginBottom: 10 },
  historySummaryPill: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  historySummaryCount: { fontSize: 18, fontWeight: "800" },
  historySummaryLabel: { fontSize: 9, fontWeight: "700", marginTop: 1 },
  historyEmpty: { alignItems: "center", paddingVertical: 30 },
  historyEmptyIcon: { fontSize: 40, marginBottom: 10 },
  historyEmptyTitle: { fontSize: 15, fontWeight: "700", color: "#555", marginBottom: 4 },
  historyEmptySubtitle: { fontSize: 12, color: "#aaa", textAlign: "center" },

  historyCard: { flexDirection: "row", backgroundColor: "#FAFBFF", borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E0E6F0", overflow: "hidden", paddingVertical: 12, paddingRight: 12 },
  historyCardAccent: { width: 4, borderRadius: 2, alignSelf: "stretch" },
  historyCardDateRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 },
  historyCardDates: { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  historyCardDaysBadge: { backgroundColor: "#E0E6F0", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  historyCardDaysTxt: { fontSize: 11, fontWeight: "700", color: "#555" },
  historyCardReason: { fontSize: 13, color: "#444", marginBottom: 6, lineHeight: 18 },
  historyCardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyCardApplied: { fontSize: 11, color: "#aaa", flex: 1 },
  historyCardStatus: { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  historyCardStatusIcon: { fontSize: 11 },
  historyCardStatusTxt: { fontSize: 11, fontWeight: "700" },

  cancelLeaveBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1.5, borderColor: "#DC2626", backgroundColor: "#FEF2F2", alignSelf: "flex-start", alignItems: "center", justifyContent: "center", minWidth: 150, minHeight: 36 },
  cancelLeaveBtnText: { fontSize: 12, fontWeight: "700", color: "#DC2626" },

  commentsWrap: { marginTop: 10 },
  commentsDivider: { height: 1, backgroundColor: "#E0E6F0", marginBottom: 8 },
  commentBubble: { backgroundColor: "#F0F4FF", borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: "#DBEAFE" },
  commentHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
  commentAvatarWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#0047AB", alignItems: "center", justifyContent: "center" },
  commentAvatarTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },
  commentBy: { fontSize: 12, fontWeight: "700", color: "#1A1A2E", textTransform: "capitalize" },
  commentTime: { fontSize: 10, color: "#aaa", marginTop: 1 },
  commentIcon: { fontSize: 14 },
  commentText: { fontSize: 13, color: "#374151", lineHeight: 19, fontStyle: "italic" },

  monthlyLeaveSection: { width: "100%", marginTop: 4, marginBottom: 4 },
  monthlyLeaveSectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  monthlyLeaveSectionTitle: { fontSize: 13, fontWeight: "800", color: "#1A1A2E", flex: 1 },
  monthlyLeaveCount: { backgroundColor: "#0047AB", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  monthlyLeaveCountTxt: { fontSize: 11, fontWeight: "800", color: "#fff" },
  monthlyLeaveCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FAFBFF", borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: "#E0E6F0", overflow: "hidden", paddingVertical: 10, paddingRight: 10 },
  monthlyLeaveAccent: { width: 4, alignSelf: "stretch" },
  monthlyLeaveDateRow: { flexDirection: "row", alignItems: "center", marginBottom: 2, gap: 6 },
  monthlyLeaveDates: { fontSize: 12, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  monthlyLeaveDays: { fontSize: 10, fontWeight: "700", color: "#888", backgroundColor: "#E0E6F0", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  monthlyLeaveReason: { fontSize: 12, color: "#555", lineHeight: 16 },
  monthlyLeaveComment: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  monthlyLeaveCommentIcon: { fontSize: 10 },
  monthlyLeaveCommentTxt: { fontSize: 11, color: "#6B7280", fontStyle: "italic", flex: 1 },
  monthlyLeaveStatusBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  monthlyLeaveStatusTxt: { fontSize: 14 },
});