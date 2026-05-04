// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View, Text, StyleSheet, TouchableOpacity, ScrollView,
//   SafeAreaView, Alert, ActivityIndicator, Modal, TextInput, FlatList,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";

// const API_BASE = "https://connect.schoolaid.in";

// type AttendanceStatus = "P" | "A" | "L" | "H" | null;
// type FilterType       = "P" | "A" | "L" | "H" | null;

// interface DayAttendance { date: string; status: AttendanceStatus; }
// interface LeaveComment {
//   id:         number;
//   leave_id:   number;
//   comment:    string;
//   comment_by: string;
//   created_at: string;
// }
// interface LeaveRecord {
//   id:           string;
//   from_date:    string;
//   to_date:      string;
//   reason:       string;
//   status:       "Pending" | "Approved" | "Rejected";
//   applied_at:   string;
//   student_id?:  string;
//   student_name?: string;
//   comments?:    LeaveComment[];
// }

// const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// const DAYS         = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
// const PRIMARY      = "#0047AB";

// // ── Helpers ───────────────────────────────────────────────────────────────────

// function fmtDisplay(dateStr: string): string {
//   if (!dateStr) return "—";
//   const [y, m, d] = dateStr.split("-");
//   return `${d} ${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
// }

// function datesBetween(from: string, to: string): string[] {
//   if (!from || !to) return [];
//   const result: string[] = [];
//   const cur = new Date(from);
//   const end = new Date(to);
//   while (cur <= end) {
//     result.push(cur.toISOString().split("T")[0]);
//     cur.setDate(cur.getDate() + 1);
//   }
//   return result;
// }

// // ── CalendarPicker ────────────────────────────────────────────────────────────

// interface CalendarPickerProps {
//   fromDate:     string;
//   toDate:       string;
//   onFromChange: (d: string) => void;
//   onToChange:   (d: string) => void;
// }

// function CalendarPicker({ fromDate, toDate, onFromChange, onToChange }: CalendarPickerProps) {
//   const now = new Date();
//   const [viewMonth, setViewMonth] = useState(now.getMonth());
//   const [viewYear,  setViewYear]  = useState(now.getFullYear());
//   const [pickStep,  setPickStep]  = useState<0 | 1>(0);

//   const prevMonth = () => {
//     if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
//     else setViewMonth(m => m - 1);
//   };
//   const nextMonth = () => {
//     if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
//     else setViewMonth(m => m + 1);
//   };

//   const handleDayPress = (dateStr: string) => {
//     if (pickStep === 0) {
//       onFromChange(dateStr);
//       onToChange("");
//       setPickStep(1);
//     } else {
//       if (dateStr < fromDate) {
//         onFromChange(dateStr);
//         onToChange(fromDate);
//       } else {
//         onToChange(dateStr);
//       }
//       setPickStep(0);
//     }
//   };

//   const todayStr    = now.toISOString().split("T")[0];
//   const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
//   const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
//   const cells: (number | null)[] = [
//     ...Array(firstDay).fill(null),
//     ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
//   ];

//   const inRange = (dateStr: string) => {
//     if (!fromDate || !toDate) return false;
//     return dateStr > fromDate && dateStr < toDate;
//   };

//   return (
//     <View style={cp.wrap}>
//       <View style={cp.header}>
//         <TouchableOpacity onPress={prevMonth} style={cp.navBtn}>
//           <Text style={cp.navTxt}>{"‹"}</Text>
//         </TouchableOpacity>
//         <Text style={cp.monthTxt}>{MONTHS[viewMonth]} {viewYear}</Text>
//         <TouchableOpacity onPress={nextMonth} style={cp.navBtn}>
//           <Text style={cp.navTxt}>{"›"}</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={cp.stepRow}>
//         <View style={[cp.stepPill, pickStep === 0 && cp.stepPillActive]}>
//           <Text style={[cp.stepTxt, pickStep === 0 && cp.stepTxtActive]}>1. From</Text>
//         </View>
//         <View style={cp.stepLine} />
//         <View style={[cp.stepPill, pickStep === 1 && cp.stepPillActive]}>
//           <Text style={[cp.stepTxt, pickStep === 1 && cp.stepTxtActive]}>2. To</Text>
//         </View>
//       </View>

//       <View style={cp.grid}>
//         {DAYS.map(d => <Text key={d} style={cp.dayHdr}>{d}</Text>)}
//         {cells.map((day, idx) => {
//           if (!day) return <View key={`empty-${idx}`} style={cp.cell} />;
//           const dateStr   = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
//           const isFrom    = dateStr === fromDate;
//           const isTo      = dateStr === toDate;
//           const isInRange = inRange(dateStr);
//           const isToday   = dateStr === todayStr;
//           return (
//             <TouchableOpacity
//               key={dateStr}
//               style={[
//                 cp.cell,
//                 isInRange && cp.cellInRange,
//                 (isFrom || isTo) && cp.cellSelected,
//               ]}
//               onPress={() => handleDayPress(dateStr)}
//               activeOpacity={0.7}
//             >
//               <Text style={[
//                 cp.cellTxt,
//                 isInRange                       && cp.cellTxtInRange,
//                 (isFrom || isTo)                && cp.cellTxtSelected,
//                 isToday && !isFrom && !isTo      && cp.cellTxtToday,
//               ]}>
//                 {day}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       <View style={cp.selRow}>
//         <View style={[cp.selBox, fromDate && cp.selBoxFilled]}>
//           <Text style={cp.selLabel}>From</Text>
//           <Text style={[cp.selValue, !fromDate && cp.selPlaceholder]}>
//             {fromDate ? fmtDisplay(fromDate) : "Not selected"}
//           </Text>
//         </View>
//         <Text style={cp.selArrow}>→</Text>
//         <View style={[cp.selBox, toDate && cp.selBoxFilled]}>
//           <Text style={cp.selLabel}>To</Text>
//           <Text style={[cp.selValue, !toDate && cp.selPlaceholder]}>
//             {toDate ? fmtDisplay(toDate) : "Not selected"}
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// }

// const cp = StyleSheet.create({
//   wrap:            { backgroundColor: "#F0F4FF", borderRadius: 14, padding: 12, marginBottom: 12 },
//   header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
//   navBtn:          { padding: 6 },
//   navTxt:          { fontSize: 24, color: PRIMARY, fontWeight: "700" },
//   monthTxt:        { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
//   stepRow:         { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 10, gap: 6 },
//   stepLine:        { flex: 1, height: 1, backgroundColor: "#BFDBFE", maxWidth: 40 },
//   stepPill:        { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: "#E0EAFF", borderWidth: 1, borderColor: "#BFDBFE" },
//   stepPillActive:  { backgroundColor: PRIMARY, borderColor: PRIMARY },
//   stepTxt:         { fontSize: 11, fontWeight: "700", color: "#6B9BEB" },
//   stepTxtActive:   { color: "#fff" },
//   grid:            { flexDirection: "row", flexWrap: "wrap" },
//   dayHdr:          { width: "14.28%", textAlign: "center", fontSize: 10, fontWeight: "700", color: PRIMARY, paddingBottom: 4 },
//   cell:            { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 6 },
//   cellSelected:    { backgroundColor: PRIMARY, borderRadius: 6 },
//   cellInRange:     { backgroundColor: "#DBEAFE", borderRadius: 0 },
//   cellTxt:         { fontSize: 12, color: "#1A1A2E" },
//   cellTxtSelected: { color: "#fff", fontWeight: "700" },
//   cellTxtInRange:  { color: PRIMARY, fontWeight: "600" },
//   cellTxtToday:    { fontWeight: "800", color: PRIMARY },
//   selRow:          { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, gap: 8 },
//   selBox:          { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#BFDBFE" },
//   selBoxFilled:    { borderColor: PRIMARY, borderWidth: 1.5 },
//   selLabel:        { fontSize: 10, color: "#888", fontWeight: "600", marginBottom: 2 },
//   selValue:        { fontSize: 13, fontWeight: "700", color: PRIMARY },
//   selPlaceholder:  { color: "#aaa", fontWeight: "400" },
//   selArrow:        { fontSize: 18, color: "#aaa" },
// });

// // ─────────────────────────────────────────────────────────────
// //  Main Screen
// // ─────────────────────────────────────────────────────────────
// export default function AttendanceScreen() {
//   const router = useRouter();
//   const now    = new Date();

//   const [childName,    setChildName]    = useState("Student");
//   const [childClass,   setChildClass]   = useState("—");
//   const [childSection, setChildSection] = useState("—");
//   const [studentId,    setStudentId]    = useState("");
//   const [authToken,    setAuthToken]    = useState("");
//   const [currentMonth, setCurrentMonth] = useState(now.getMonth());
//   const [currentYear,  setCurrentYear]  = useState(now.getFullYear());
//   const [calendarData, setCalendarData] = useState<DayAttendance[]>([]);
//   const [activeFilter, setActiveFilter] = useState<FilterType>(null);
//   const [loading,      setLoading]      = useState(false);
//   const [activeModal,  setActiveModal]  = useState<"monthly" | "session" | "apply" | "history" | null>(null);

//   // ── Leave state ──
//   const [leaveRecords,  setLeaveRecords]  = useState<LeaveRecord[]>([]);
//   const [leaveFrom,     setLeaveFrom]     = useState("");
//   const [leaveTo,       setLeaveTo]       = useState("");
//   const [leaveReason,   setLeaveReason]   = useState("");
//   const [submitting,    setSubmitting]    = useState(false);
//   const [historyLoading,setHistoryLoading]= useState(false);

//   // ── Tapped day info ──
//   const [tappedDate,  setTappedDate]  = useState<string | null>(null);
//   const [tappedLeave, setTappedLeave] = useState<LeaveRecord | null>(null);

//   const leaveDatesSet = new Set<string>(
//     leaveRecords.flatMap(r => datesBetween(r.from_date, r.to_date))
//   );

//   const leaveDateMap = new Map<string, LeaveRecord>();
//   leaveRecords.forEach(r => {
//     datesBetween(r.from_date, r.to_date).forEach(d => leaveDateMap.set(d, r));
//   });

//   // ── Data fetchers ─────────────────────────────────────────────────────────

//   const fetchCalendar = useCallback(async () => {
//     setLoading(true);
//     setActiveFilter(null);
//     try {
//       const res = await fetch(`${API_BASE}/attendance_calendar`, {
//         method: "GET",
//         headers: { "Content-Type": "application/json" },
//       });
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const text = await res.text();
//       const data = JSON.parse(text);
//       setCalendarData(data);
//     } catch (error: any) {
//       console.error("Failed to fetch calendar:", error);
//       Alert.alert("Error", `Failed to load calendar: ${error.message}`);
//       setCalendarData([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentMonth, currentYear]);

//   // ── Fetch leave history using correct API ─────────────────────────────────
//   const fetchLeaveHistory = useCallback(async (sid: string, token: string) => {
//     if (!sid || !token) return;
//     setHistoryLoading(true);
//     try {
//       const res = await fetch(
//         `${API_BASE}/api/leaves/student?student_id=${sid}`,
//         {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${token}`,
//           },
//         }
//       );
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const data = await res.json();
//       console.log('Leave history raw response:', JSON.stringify(data));
//       // Handle all common API response shapes
//       const records = Array.isArray(data) ? data
//         : Array.isArray(data.leaves)  ? data.leaves
//         : Array.isArray(data.data)    ? data.data
//         : Array.isArray(data.records) ? data.records
//         : Array.isArray(data.result)  ? data.result
//         : [];
//       console.log('Parsed leave records:', records.length);
//       setLeaveRecords(records);
//     } catch (error: any) {
//       console.error("Failed to fetch leave history:", error);
//       setLeaveRecords([]);
//     } finally {
//       setHistoryLoading(false);
//     }
//   }, []);

//   // ── Bootstrap: load child info + student ID ───────────────────────────────

//   useEffect(() => {
//     const bootstrap = async () => {
//       let sid   = "";
//       let token = "";

//       try {
//         const allKeys = await AsyncStorage.getAllKeys();
//         console.log("=== AsyncStorage keys ===", allKeys);
//         for (const key of allKeys) {
//           const val = await AsyncStorage.getItem(key);
//           console.log(`  [${key}]:`, val?.substring(0, 300));
//         }
//       } catch (e) {
//         console.log("AsyncStorage debug error:", e);
//       }

//       // 1. Get token
//       try {
//         token = (await AsyncStorage.getItem("token")) ?? "";
//         console.log("token:", token ? token.substring(0, 40) + "…" : "NOT FOUND");
//       } catch (e) {
//         console.log("token read error:", e);
//       }

//       // 2. Try selectedChild in AsyncStorage
//       try {
//         const raw = await AsyncStorage.getItem("selectedChild");
//         if (raw) {
//           const c = JSON.parse(raw);
//           setChildName(c.name ?? "Student");
//           setChildClass(c.classname ?? "—");
//           setChildSection(c.sectionname ?? "—");
//           sid = c.id ?? c.student_id ?? c.studentId ?? c.studentID
//               ?? c.userId ?? c.user_id ?? c.admissionNo ?? "";
//           console.log("sid from selectedChild:", sid);
//         }
//       } catch (e) {
//         console.log("selectedChild error:", e);
//       }

//       // 3. Fallback: decode JWT token
//       if (!sid && token) {
//         try {
//           const base64Url = token.split(".")[1];
//           const base64  = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//           const padded  = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
//           const lookup  = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
//           let binary = "";
//           for (let i = 0; i < padded.length; i += 4) {
//             const a = lookup.indexOf(padded[i]);
//             const b = lookup.indexOf(padded[i + 1]);
//             const c = lookup.indexOf(padded[i + 2]);
//             const d = lookup.indexOf(padded[i + 3]);
//             binary += String.fromCharCode((a << 2) | (b >> 4));
//             if (padded[i + 2] !== "=") binary += String.fromCharCode(((b & 15) << 4) | (c >> 2));
//             if (padded[i + 3] !== "=") binary += String.fromCharCode(((c & 3) << 6) | d);
//           }
//           const payload = JSON.parse(
//             decodeURIComponent(
//               binary.split("").map(ch => "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2)).join("")
//             )
//           );
//           console.log("JWT payload:", JSON.stringify(payload));
//           sid = payload.student_id ?? payload.id ?? payload.userId
//               ?? payload.user_id ?? payload.admissionNo ?? "";
//           console.log("sid from JWT:", sid);
//         } catch (e) {
//           console.log("JWT decode error:", e);
//         }
//       }

//       console.log("=== Final studentId:", sid || "NOT FOUND ⚠️", "===");

//       if (sid)   setStudentId(sid);
//       if (token) setAuthToken(token);

//       if (sid && token) fetchLeaveHistory(sid, token);

//       fetchCalendar();
//     };

//     bootstrap();
//   }, []);

//   useEffect(() => {
//     fetchCalendar();
//   }, [currentMonth, currentYear]);

//   // ── Apply leave using correct API ─────────────────────────────────────────

//   const handleApplyLeave = async () => {
//     if (!leaveFrom)          return Alert.alert("Error", "Please select a start date.");
//     if (!leaveTo)            return Alert.alert("Error", "Please select an end date.");
//     if (!leaveReason.trim()) return Alert.alert("Error", "Please enter a reason.");
//     if (!studentId)          return Alert.alert("Error", "Student ID not found. Please re-login.");
//     if (!authToken)          return Alert.alert("Error", "Auth token not found. Please re-login.");

//     setSubmitting(true);
//     try {
//       const response = await fetch(`${API_BASE}/api/leaves/apply`, {
//         method:  "POST",
//         headers: {
//           "Content-Type":  "application/json",
//           "Authorization": `Bearer ${authToken}`,
//         },
//         body: JSON.stringify({
//           student_id: Number(studentId),
//           from_date:  leaveFrom,
//           to_date:    leaveTo,
//           reason:     leaveReason.trim(),
//         }),
//       });

//       const result = await response.json();

//       if (response.ok && (result.success || result.message || result.msg || result.leave_id)) {
//         await fetchLeaveHistory(studentId, authToken);
//         setLeaveFrom("");
//         setLeaveTo("");
//         setLeaveReason("");
//         setActiveModal(null);
//         Alert.alert("✅ Success", `Leave applied from ${fmtDisplay(leaveFrom)} to ${fmtDisplay(leaveTo)}`);
//       } else {
//         const errorMsg = result.errors
//           ? result.errors.join(", ")
//           : result.message ?? "Failed to apply leave";
//         Alert.alert("Error", errorMsg);
//       }
//     } catch (error: any) {
//       console.error("Error applying leave:", error);
//       Alert.alert("Error", `Network error: ${error.message}`);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ── Stats ─────────────────────────────────────────────────────────────────

//   const presentDays = calendarData.filter(d => d.status === "P");
//   const absentDays  = calendarData.filter(d => d.status === "A");
//   const leaveDays   = calendarData.filter(d => d.status === "L");
//   const holidayDays = calendarData.filter(d => d.status === "H");
//   const workingDays = calendarData.filter(d => d.status !== "H").length;
//   const percentage  = workingDays > 0 ? ((presentDays.length / workingDays) * 100).toFixed(1) : "0.0";

//   const monthlyDetail = {
//     total_days: calendarData.length,
//     present:    presentDays.length,
//     absent:     absentDays.length,
//     leave:      leaveDays.length,
//     holidays:   holidayDays.length,
//     percentage: Number(percentage),
//   };

//   const sessionData = calendarData
//     .filter(d => d.status !== "H" && d.status !== null)
//     .flatMap(d => [
//       { date: d.date, session: "Morning",   status: d.status },
//       { date: d.date, session: "Afternoon", status: d.status },
//     ])
//     .sort((a, b) => b.date.localeCompare(a.date));

//   // ── Helpers ───────────────────────────────────────────────────────────────

//   const handleFilterCard = (filter: FilterType) =>
//     setActiveFilter(prev => prev === filter ? null : filter);

//   const handleLogout = () =>
//     Alert.alert("Logout", "Do you really want to logout?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Yes", style: "destructive", onPress: async () => {
//           await AsyncStorage.multiRemove(["token", "selectedChild", "selectedYearId", "selectedYearLabel"]);
//           router.replace("/login");
//         }
//       },
//     ], { cancelable: true });

//   const getDaysInMonth     = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
//   const getFirstDayOfMonth = (m: number, y: number) => new Date(y, m, 1).getDay();

//   const getStatusForDate = (day: number): AttendanceStatus => {
//     const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
//     if (leaveDatesSet.has(dateStr)) return "L";
//     return calendarData.find(d => d.date === dateStr)?.status ?? null;
//   };

//   const getDayStyle = (status: AttendanceStatus) => {
//     switch (status) {
//       case "P": return { bg: "#dcfce7", border: "#16a34a", text: "#16a34a" };
//       case "A": return { bg: "#fee2e2", border: "#dc2626", text: "#dc2626" };
//       case "L": return { bg: "#fef9c3", border: "#ca8a04", text: "#ca8a04" };
//       case "H": return { bg: "#f3f4f6", border: "#9ca3af", text: "#9ca3af" };
//       default:  return { bg: "#fff",    border: "#E0E6F0", text: "#1A1A2E" };
//     }
//   };

//   const prevMonth = () => {
//     if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
//     else setCurrentMonth(m => m - 1);
//   };
//   const nextMonth = () => {
//     if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
//     else setCurrentMonth(m => m + 1);
//   };

//   const getLeaveStatusStyle = (status: LeaveRecord["status"]) => {
//     if (status === "Approved") return { bg: "#dcfce7", text: "#16a34a", icon: "✅" };
//     if (status === "Rejected") return { bg: "#fee2e2", text: "#dc2626", icon: "❌" };
//     return { bg: "#fef9c3", text: "#ca8a04", icon: "🕐" };
//   };

//   const handleCalendarDayPress = (day: number) => {
//     const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
//     if (tappedDate === dateStr) {
//       setTappedDate(null);
//       setTappedLeave(null);
//       return;
//     }
//     setTappedDate(dateStr);
//     setTappedLeave(leaveDateMap.get(dateStr) ?? null);
//   };

//   // ── Calendar renderer ─────────────────────────────────────────────────────

//   const renderCalendar = () => {
//     const daysInMonth = getDaysInMonth(currentMonth, currentYear);
//     const firstDay    = getFirstDayOfMonth(currentMonth, currentYear);
//     const isThisMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();
//     const cells: (number | null)[] = [
//       ...Array(firstDay).fill(null),
//       ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
//     ];

//     return (
//       <View>
//         <View style={styles.calendarGrid}>
//           {DAYS.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
//           {cells.map((day, idx) => {
//             if (!day) return <View key={`e-${idx}`} style={styles.calendarCell} />;
//             const status     = getStatusForDate(day);
//             const isToday    = isThisMonth && day === now.getDate();
//             const isFiltered = activeFilter !== null && status !== activeFilter;
//             const s          = getDayStyle(status);
//             const dateStr    = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
//             const isLocalL   = leaveDatesSet.has(dateStr);
//             const isTapped   = tappedDate === dateStr;

//             return (
//               <TouchableOpacity
//                 key={day}
//                 style={[
//                   styles.calendarCell,
//                   { backgroundColor: isFiltered ? "#f9f9f9" : s.bg, borderColor: isFiltered ? "#eee" : s.border },
//                   isToday  && !isFiltered && styles.todayCell,
//                   isTapped && !isFiltered && styles.tappedCell,
//                   isFiltered && { opacity: 0.25 },
//                 ]}
//                 onPress={() => handleCalendarDayPress(day)}
//                 activeOpacity={0.7}
//               >
//                 <Text style={[
//                   styles.calendarDayText,
//                   { color: isFiltered ? "#ccc" : s.text },
//                   isToday && !isFiltered && styles.todayText,
//                 ]}>
//                   {day}
//                 </Text>
//                 {isLocalL && !isFiltered && <View style={styles.leaveDot} />}
//               </TouchableOpacity>
//             );
//           })}
//         </View>

//         {/* Tapped day info panel */}
//         {tappedDate && (() => {
//           const status = calendarData.find(d => d.date === tappedDate)?.status
//                          ?? (leaveDatesSet.has(tappedDate) ? "L" : null);
//           const s      = getDayStyle(status);
//           const statusLabels: Record<string, string> = { P: "Present", A: "Absent", L: "Leave", H: "Holiday" };

//           return (
//             <View style={styles.dayInfoPanel}>
//               <View style={styles.dayInfoHeader}>
//                 <Text style={styles.dayInfoDate}>{fmtDisplay(tappedDate)}</Text>
//                 {status && (
//                   <View style={[styles.dayInfoBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
//                     <Text style={[styles.dayInfoBadgeText, { color: s.text }]}>
//                       {statusLabels[status] ?? status}
//                     </Text>
//                   </View>
//                 )}
//                 <TouchableOpacity
//                   onPress={() => { setTappedDate(null); setTappedLeave(null); }}
//                   style={styles.dayInfoClose}
//                 >
//                   <Text style={styles.dayInfoCloseTxt}>✕</Text>
//                 </TouchableOpacity>
//               </View>

//               {tappedLeave ? (
//                 <View style={styles.dayInfoBody}>
//                   <Text style={styles.dayInfoReasonLabel}>Reason</Text>
//                   <Text style={styles.dayInfoReason}>{tappedLeave.reason}</Text>
//                   <View style={styles.dayInfoMeta}>
//                     <Text style={styles.dayInfoMetaTxt}>
//                       {fmtDisplay(tappedLeave.from_date)} → {fmtDisplay(tappedLeave.to_date)}
//                     </Text>
//                     <View style={[styles.dayInfoStatusBadge, { backgroundColor: getLeaveStatusStyle(tappedLeave.status).bg }]}>
//                       <Text style={[styles.dayInfoStatusTxt, { color: getLeaveStatusStyle(tappedLeave.status).text }]}>
//                         {tappedLeave.status}
//                       </Text>
//                     </View>
//                   </View>
//                 </View>
//               ) : (
//                 <Text style={styles.dayInfoEmpty}>
//                   {status === "P" ? "Attended school on this day." :
//                    status === "A" ? "Absent on this day." :
//                    status === "H" ? "School holiday." :
//                    "No details available for this day."}
//                 </Text>
//               )}
//             </View>
//           );
//         })()}
//       </View>
//     );
//   };



//   // ── Render ────────────────────────────────────────────────────────────────

//   return (
//     <SafeAreaView style={styles.safe}>
//       {/* Header */}
//       <View style={[styles.headerTop, { backgroundColor: PRIMARY }]}>
//         <View style={styles.headerTopRow}>
//           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//             <Text style={styles.backArrow}>{"↩"}</Text>
//           </TouchableOpacity>
//           <Text style={styles.headerTitle} numberOfLines={1}>Welcome, {childName}</Text>
//           <View style={styles.backBtn} />
//         </View>
//         <Text style={styles.childSubtitle}>Class : {childClass} {"\u00B7"} Section : {childSection}</Text>
//         <View style={styles.headerBtns}>
//           <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/addchild")}>
//             <Text style={styles.headerBtnText}>Switch Child</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
//             <Text style={styles.headerBtnText}>Logout</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
//         {/* Month nav */}
//         <View style={styles.monthNav}>
//           <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={styles.navArrow}>{"<<"}</Text></TouchableOpacity>
//           <Text style={styles.monthLabel}>{MONTHS[currentMonth]} {currentYear}</Text>
//           <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={styles.navArrow}>{">>"}</Text></TouchableOpacity>
//         </View>



//         {/* Main calendar */}
//         <View style={styles.calendarCard}>
//           {loading
//             ? <ActivityIndicator size="large" color={PRIMARY} style={{ padding: 40 }} />
//             : renderCalendar()
//           }
//         </View>

//         {leaveRecords.length > 0 && (
//           <View style={styles.legendRow}>
//             <View style={styles.leaveDotLegend} />
//             <Text style={styles.legendTxt}>Applied leave (tap a leave day to see reason)</Text>
//           </View>
//         )}

//         {/* Progress bar */}
//         {!loading && (
//           <View style={styles.percentageBar}>
//             <Text style={styles.percentageLabel}>Attendance</Text>
//             <View style={styles.progressBg}>
//               <View style={[styles.progressFill, { width: `${Math.min(Number(percentage), 100)}%` as any }]} />
//             </View>
//             <Text style={styles.percentageValue}>{percentage}%</Text>
//           </View>
//         )}

//         {/* Action buttons */}
//         <View style={styles.actionsGrid}>
//           <TouchableOpacity style={[styles.actionCard, { backgroundColor: PRIMARY }]} onPress={() => setActiveModal("monthly")} activeOpacity={0.85}>
//             <Text style={styles.actionCardIcon}>{"📊"}</Text>
//             <Text style={styles.actionCardText}>{"Monthly\nDetails"}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={[styles.actionCard, { backgroundColor: "#0e7490" }]} onPress={() => setActiveModal("session")} activeOpacity={0.85}>
//             <Text style={styles.actionCardIcon}>{"🕐"}</Text>
//             <Text style={styles.actionCardText}>{"Session\nWise"}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.actionCard, { backgroundColor: "#fff", borderWidth: 1.5, borderColor: PRIMARY }]}
//             onPress={() => { setLeaveFrom(""); setLeaveTo(""); setLeaveReason(""); setActiveModal("apply"); }}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.actionCardIcon}>{"📝"}</Text>
//             <Text style={[styles.actionCardText, { color: PRIMARY }]}>{"Apply\nLeave"}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.actionCard, { backgroundColor: "#ca8a04" }]}
//             onPress={() => {
//               fetchLeaveHistory(studentId, authToken);
//               setActiveModal("history");
//             }}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.actionCardIcon}>{"📋"}</Text>
//             <Text style={styles.actionCardText}>{"Leave\nHistory"}</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>

//       {/* ── Monthly Modal ── */}
//       <Modal visible={activeModal === "monthly"} animationType="slide" transparent>
//         <View style={styles.modalBg}>
//           <View style={[styles.modalCard, { maxHeight: "90%" }]}>
//             <Text style={styles.modalTitle}>{"📊 Monthly Details"}</Text>
//             <Text style={styles.modalSubtitle}>{MONTHS[currentMonth] + " " + currentYear}</Text>

//             {/* Attendance stats grid */}
//             <View style={styles.monthlyGrid}>
//               {[
//                 { label: "Total Days", value: monthlyDetail.total_days,       color: PRIMARY,   bg: "#EFF6FF" },
//                 { label: "Present",    value: monthlyDetail.present,          color: "#16a34a", bg: "#dcfce7" },
//                 { label: "Absent",     value: monthlyDetail.absent,           color: "#dc2626", bg: "#fee2e2" },
//                 { label: "Leave",      value: monthlyDetail.leave,            color: "#ca8a04", bg: "#fef9c3" },
//                 { label: "Holidays",   value: monthlyDetail.holidays,         color: "#9ca3af", bg: "#f3f4f6" },
//                 { label: "Percentage", value: monthlyDetail.percentage + "%", color: "#7c3aed", bg: "#f5f3ff" },
//               ].map(item => (
//                 <View key={item.label} style={[styles.monthlyCell, { backgroundColor: item.bg, borderColor: item.color + "40" }]}>
//                   <Text style={[styles.monthlyCellNum, { color: item.color }]}>{item.value}</Text>
//                   <Text style={styles.monthlyCellLabel}>{item.label}</Text>
//                 </View>
//               ))}
//             </View>

//             {/* Active / Pending leaves section */}
//             {leaveRecords.length > 0 && (() => {
//               const activeLeaves = leaveRecords.filter(r => r.status === "Pending" || r.status === "Approved");
//               if (activeLeaves.length === 0) return null;
//               return (
//                 <View style={styles.monthlyLeaveSection}>
//                   <View style={styles.monthlyLeaveSectionHeader}>
//                     <Text style={styles.monthlyLeaveSectionTitle}>📋 Active Leaves</Text>
//                     <View style={styles.monthlyLeaveCount}>
//                       <Text style={styles.monthlyLeaveCountTxt}>{activeLeaves.length}</Text>
//                     </View>
//                   </View>
//                   <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
//                     {activeLeaves.map(leave => {
//                       const s    = getLeaveStatusStyle(leave.status);
//                       const days = datesBetween(leave.from_date, leave.to_date).length;
//                       return (
//                         <View key={leave.id} style={styles.monthlyLeaveCard}>
//                           <View style={[styles.monthlyLeaveAccent, { backgroundColor: s.text }]} />
//                           <View style={{ flex: 1, paddingLeft: 10 }}>
//                             <View style={styles.monthlyLeaveDateRow}>
//                               <Text style={styles.monthlyLeaveDates}>
//                                 {fmtDisplay(leave.from_date)}
//                                 {leave.from_date !== leave.to_date ? ` → ${fmtDisplay(leave.to_date)}` : ""}
//                               </Text>
//                               <Text style={styles.monthlyLeaveDays}>{days}d</Text>
//                             </View>
//                             <Text style={styles.monthlyLeaveReason} numberOfLines={1}>{leave.reason}</Text>
//                             {leave.comments && leave.comments.length > 0 && (
//                               <View style={styles.monthlyLeaveComment}>
//                                 <Text style={styles.monthlyLeaveCommentIcon}>💬</Text>
//                                 <Text style={styles.monthlyLeaveCommentTxt} numberOfLines={1}>
//                                   {leave.comments[leave.comments.length - 1].comment}
//                                 </Text>
//                               </View>
//                             )}
//                           </View>
//                           <View style={[styles.monthlyLeaveStatusBadge, { backgroundColor: s.bg }]}>
//                             <Text style={[styles.monthlyLeaveStatusTxt, { color: s.text }]}>{s.icon}</Text>
//                           </View>
//                         </View>
//                       );
//                     })}
//                   </ScrollView>
//                 </View>
//               );
//             })()}

//             <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
//               <Text style={styles.closeBtnText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ── Session Modal ── */}
//       <Modal visible={activeModal === "session"} animationType="slide" transparent>
//         <View style={styles.modalBg}>
//           <View style={[styles.modalCard, { maxHeight: "80%" }]}>
//             <Text style={styles.modalTitle}>{"🕐 Session Wise Attendance"}</Text>
//             <Text style={styles.modalSubtitle}>{MONTHS[currentMonth] + " " + currentYear}</Text>
//             {sessionData.length > 0 ? (
//               <FlatList
//                 data={sessionData}
//                 keyExtractor={(_, i) => i.toString()}
//                 style={{ width: "100%", marginTop: 10 }}
//                 renderItem={({ item }) => {
//                   const s = getDayStyle(item.status);
//                   return (
//                     <View style={styles.sessionRow}>
//                       <Text style={styles.sessionDate}>{item.date}</Text>
//                       <Text style={styles.sessionName}>{item.session}</Text>
//                       <View style={[styles.sessionBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
//                         <Text style={[styles.sessionBadgeText, { color: s.text }]}>{item.status}</Text>
//                       </View>
//                     </View>
//                   );
//                 }}
//               />
//             ) : (
//               <Text style={{ color: "#888", marginTop: 20 }}>No session data available.</Text>
//             )}
//             <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
//               <Text style={styles.closeBtnText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ── Apply Leave Modal (redesigned) ── */}
//       <Modal visible={activeModal === "apply"} animationType="slide" transparent>
//         <View style={styles.modalBg}>
//           <View style={[styles.modalCard, { maxHeight: "94%" }]}>
//             {/* Modal Header */}
//             <View style={styles.applyModalHeader}>
//               <View style={styles.applyModalIconWrap}>
//                 <Text style={styles.applyModalIcon}>📝</Text>
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Text style={styles.applyModalTitle}>Apply Leave</Text>
//                 <Text style={styles.applyModalSub}>Select date range and provide reason</Text>
//               </View>
//               <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.applyModalClose}>
//                 <Text style={styles.applyModalCloseTxt}>✕</Text>
//               </TouchableOpacity>
//             </View>

//             <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
//               {/* Student chip */}
//               {studentId ? (
//                 <View style={styles.studentChip}>
//                   <Text style={styles.studentChipIcon}>🎓</Text>
//                   <Text style={styles.studentChipText}>{childName}</Text>
//                   <View style={styles.studentChipIdPill}>
//                     <Text style={styles.studentChipId}>ID: {studentId}</Text>
//                   </View>
//                 </View>
//               ) : (
//                 <View style={[styles.studentChip, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
//                   <Text style={styles.studentChipIcon}>⚠️</Text>
//                   <Text style={[styles.studentChipText, { color: "#DC2626" }]}>Student ID not found. Please re-login.</Text>
//                 </View>
//               )}

//               {/* Calendar picker */}
//               <Text style={styles.sectionLabel}>📅 Select Dates</Text>
//               <CalendarPicker
//                 fromDate={leaveFrom}
//                 toDate={leaveTo}
//                 onFromChange={setLeaveFrom}
//                 onToChange={setLeaveTo}
//               />

//               {/* Days count pill */}
//               {leaveFrom && leaveTo && (
//                 <View style={styles.dayCountPill}>
//                   <Text style={styles.dayCountTxt}>
//                     🗓 {datesBetween(leaveFrom, leaveTo).length} day{datesBetween(leaveFrom, leaveTo).length !== 1 ? "s" : ""} selected
//                   </Text>
//                 </View>
//               )}

//               {/* Reason input */}
//               <Text style={styles.sectionLabel}>✏️ Reason for Leave</Text>
//               <TextInput
//                 style={[styles.input, styles.inputMultiline]}
//                 placeholder="e.g. Out of station, medical appointment, family function..."
//                 placeholderTextColor="#aaa"
//                 value={leaveReason}
//                 onChangeText={setLeaveReason}
//                 multiline
//                 numberOfLines={3}
//               />

//               {/* Submit */}
//               <TouchableOpacity
//                 style={[
//                   styles.submitLeaveBtn,
//                   (!leaveFrom || !leaveTo || !leaveReason.trim() || submitting) && styles.submitLeaveBtnDisabled,
//                 ]}
//                 onPress={handleApplyLeave}
//                 disabled={!leaveFrom || !leaveTo || !leaveReason.trim() || submitting}
//                 activeOpacity={0.85}
//               >
//                 {submitting ? (
//                   <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
//                     <ActivityIndicator size="small" color="#fff" />
//                     <Text style={styles.submitLeaveBtnText}>Submitting...</Text>
//                   </View>
//                 ) : (
//                   <Text style={styles.submitLeaveBtnText}>Submit Application</Text>
//                 )}
//               </TouchableOpacity>

//               <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
//                 <Text style={styles.closeBtnText}>Cancel</Text>
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ── Leave History Modal (redesigned) ── */}
//       <Modal visible={activeModal === "history"} animationType="slide" transparent>
//         <View style={styles.modalBg}>
//           <View style={[styles.modalCard, { maxHeight: "85%" }]}>
//             {/* Header */}
//             <View style={styles.historyModalHeader}>
//               <Text style={styles.historyModalTitle}>📋 Leave History</Text>
//               <TouchableOpacity onPress={() => fetchLeaveHistory(studentId, authToken)} style={styles.historyRefreshBtn}>
//                 <Text style={styles.historyRefreshTxt}>↻ Refresh</Text>
//               </TouchableOpacity>
//               <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.applyModalClose}>
//                 <Text style={styles.applyModalCloseTxt}>✕</Text>
//               </TouchableOpacity>
//             </View>

//             {/* Summary pills */}
//             {leaveRecords.length > 0 && (
//               <View style={styles.historySummaryRow}>
//                 {[
//                   { label: "Total",    count: leaveRecords.length,                                        color: PRIMARY,   bg: "#EFF6FF" },
//                   { label: "Pending",  count: leaveRecords.filter(r => r.status === "Pending").length,   color: "#ca8a04", bg: "#fef9c3" },
//                   { label: "Approved", count: leaveRecords.filter(r => r.status === "Approved").length,  color: "#16a34a", bg: "#dcfce7" },
//                   { label: "Rejected", count: leaveRecords.filter(r => r.status === "Rejected").length,  color: "#dc2626", bg: "#fee2e2" },
//                 ].map(s => (
//                   <View key={s.label} style={[styles.historySummaryPill, { backgroundColor: s.bg }]}>
//                     <Text style={[styles.historySummaryCount, { color: s.color }]}>{s.count}</Text>
//                     <Text style={[styles.historySummaryLabel, { color: s.color }]}>{s.label}</Text>
//                   </View>
//                 ))}
//               </View>
//             )}

//             {historyLoading ? (
//               <ActivityIndicator size="large" color={PRIMARY} style={{ marginVertical: 30 }} />
//             ) : leaveRecords.length === 0 ? (
//               <View style={styles.historyEmpty}>
//                 <Text style={styles.historyEmptyIcon}>📭</Text>
//                 <Text style={styles.historyEmptyTitle}>No leave applications yet</Text>
//                 <Text style={styles.historyEmptySubtitle}>Your submitted leave requests will appear here</Text>
//               </View>
//             ) : (
//               <FlatList
//                 data={leaveRecords}
//                 keyExtractor={item => item.id}
//                 style={{ width: "100%", marginTop: 6 }}
//                 showsVerticalScrollIndicator={false}
//                 renderItem={({ item }) => {
//                   const s    = getLeaveStatusStyle(item.status);
//                   const days = datesBetween(item.from_date, item.to_date).length;
//                   return (
//                     <View style={styles.historyCard}>
//                       {/* Left accent */}
//                       <View style={[styles.historyCardAccent, { backgroundColor: s.text }]} />
//                       <View style={{ flex: 1, paddingLeft: 12 }}>
//                         {/* Date row */}
//                         <View style={styles.historyCardDateRow}>
//                           <Text style={styles.historyCardDates}>
//                             {fmtDisplay(item.from_date)}
//                             {item.from_date !== item.to_date ? ` → ${fmtDisplay(item.to_date)}` : ""}
//                           </Text>
//                           <View style={styles.historyCardDaysBadge}>
//                             <Text style={styles.historyCardDaysTxt}>{days}d</Text>
//                           </View>
//                         </View>
//                         {/* Reason */}
//                         <Text style={styles.historyCardReason}>{item.reason}</Text>
//                         {/* Meta */}
//                         <View style={styles.historyCardMeta}>
//                           <Text style={styles.historyCardApplied}>
//                             Applied {new Date(item.applied_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
//                           </Text>
//                           <View style={[styles.historyCardStatus, { backgroundColor: s.bg }]}>
//                             <Text style={styles.historyCardStatusIcon}>{s.icon}</Text>
//                             <Text style={[styles.historyCardStatusTxt, { color: s.text }]}>{item.status}</Text>
//                           </View>
//                         </View>
//                         {/* Teacher comments */}
//                         {item.comments && item.comments.length > 0 && (
//                           <View style={styles.commentsWrap}>
//                             <View style={styles.commentsDivider} />
//                             {item.comments.map(c => (
//                               <View key={c.id} style={styles.commentBubble}>
//                                 <View style={styles.commentHeader}>
//                                   <View style={styles.commentAvatarWrap}>
//                                     <Text style={styles.commentAvatarTxt}>
//                                       {c.comment_by.charAt(0).toUpperCase()}
//                                     </Text>
//                                   </View>
//                                   <View style={{ flex: 1 }}>
//                                     <Text style={styles.commentBy}>{c.comment_by}</Text>
//                                     <Text style={styles.commentTime}>
//                                       {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
//                                       {" · "}
//                                       {new Date(c.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
//                                     </Text>
//                                   </View>
//                                   <Text style={styles.commentIcon}>💬</Text>
//                                 </View>
//                                 <Text style={styles.commentText}>{c.comment}</Text>
//                               </View>
//                             ))}
//                           </View>
//                         )}
//                       </View>
//                     </View>
//                   );
//                 }}
//               />
//             )}

//             <TouchableOpacity style={[styles.closeBtn, { marginTop: 8 }]} onPress={() => setActiveModal(null)}>
//               <Text style={styles.closeBtnText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe:              { flex: 1, backgroundColor: "#F5F7FA" },
//   headerTop:         { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, alignItems: "center" },
//   headerTopRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 },
//   backBtn:           { width: 36, padding: 4 },
//   backArrow:         { color: "#fff", fontSize: 24, fontWeight: "bold" },
//   headerTitle:       { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
//   childSubtitle:     { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", marginBottom: 16 },
//   headerBtns:        { flexDirection: "row", gap: 12 },
//   headerBtn:         { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10 },
//   headerBtnText:     { fontWeight: "700", fontSize: 13, color: "#0047AB" },
//   monthNav:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
//   navBtn:            { padding: 8 },
//   navArrow:          { fontSize: 22, color: "#0047AB", fontWeight: "800" },
//   monthLabel:        { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
//   filterRow:         { flexDirection: "row", marginHorizontal: 12, marginBottom: 10, gap: 8 },
//   filterCard:        { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", position: "relative" },
//   filterCount:       { fontSize: 20, fontWeight: "800" },
//   filterLabel:       { fontSize: 10, fontWeight: "700", marginTop: 2 },
//   filterActiveDot:   { width: 6, height: 6, borderRadius: 3, position: "absolute", bottom: 6 },
//   filterBanner:      { marginHorizontal: 12, marginBottom: 8, backgroundColor: "#EFF6FF", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#BFDBFE" },
//   filterBannerText:  { color: "#1D4ED8", fontSize: 12, fontWeight: "600", textAlign: "center" },
//   calendarCard:      { backgroundColor: "#fff", marginHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#E0E6F0", padding: 10 },
//   calendarGrid:      { flexDirection: "row", flexWrap: "wrap" },
//   dayHeader:         { width: "14.28%", textAlign: "center", fontSize: 11, fontWeight: "700", color: "#0047AB", paddingBottom: 6 },
//   calendarCell:      { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#E0E6F0", marginBottom: 3 },
//   calendarDayText:   { fontSize: 12, fontWeight: "600" },
//   todayCell:         { borderWidth: 2.5, borderColor: "#0047AB" },
//   todayText:         { fontWeight: "800" },
//   tappedCell:        { borderWidth: 2.5, borderColor: "#7c3aed" },
//   leaveDot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: "#ca8a04", position: "absolute", bottom: 3 },
//   dayInfoPanel:      { marginTop: 10, backgroundColor: "#F8FAFF", borderRadius: 12, borderWidth: 1, borderColor: "#BFDBFE", padding: 12 },
//   dayInfoHeader:     { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
//   dayInfoDate:       { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flex: 1 },
//   dayInfoBadge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
//   dayInfoBadgeText:  { fontSize: 11, fontWeight: "700" },
//   dayInfoClose:      { padding: 4 },
//   dayInfoCloseTxt:   { fontSize: 14, color: "#aaa", fontWeight: "700" },
//   dayInfoBody:       { gap: 6 },
//   dayInfoReasonLabel:{ fontSize: 10, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
//   dayInfoReason:     { fontSize: 14, fontWeight: "600", color: "#1A1A2E", lineHeight: 20 },
//   dayInfoMeta:       { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
//   dayInfoMetaTxt:    { fontSize: 11, color: "#888", flex: 1 },
//   dayInfoStatusBadge:{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
//   dayInfoStatusTxt:  { fontSize: 11, fontWeight: "700" },
//   dayInfoEmpty:      { fontSize: 13, color: "#888", fontStyle: "italic" },
//   legendRow:         { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 6, gap: 6 },
//   leaveDotLegend:    { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ca8a04" },
//   legendTxt:         { fontSize: 11, color: "#888" },
//   percentageBar:     { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginTop: 10, gap: 8 },
//   percentageLabel:   { fontSize: 12, fontWeight: "700", color: "#555", width: 80 },
//   progressBg:        { flex: 1, height: 8, backgroundColor: "#E0E6F0", borderRadius: 4, overflow: "hidden" },
//   progressFill:      { height: 8, backgroundColor: "#16a34a", borderRadius: 4 },
//   percentageValue:   { fontSize: 13, fontWeight: "800", color: "#16a34a", width: 44, textAlign: "right" },
//   actionsGrid:       { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 12, marginTop: 14, gap: 10 },
//   actionCard:        { width: "47.5%", borderRadius: 14, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
//   actionCardIcon:    { fontSize: 26, marginBottom: 6 },
//   actionCardText:    { fontSize: 13, fontWeight: "700", color: "#fff", textAlign: "center", lineHeight: 18 },
//   modalBg:           { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 16 },
//   modalCard:         { backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
//   modalTitle:        { fontSize: 18, fontWeight: "800", color: "#0047AB", marginBottom: 4 },
//   modalSubtitle:     { fontSize: 13, color: "#888", marginBottom: 12 },
//   monthlyGrid:       { flexDirection: "row", flexWrap: "wrap", width: "100%", gap: 10, marginBottom: 16 },
//   monthlyCell:       { width: "30%", backgroundColor: "#F5F7FA", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#E0E6F0" },
//   monthlyCellNum:    { fontSize: 22, fontWeight: "800" },
//   monthlyCellLabel:  { fontSize: 11, color: "#888", fontWeight: "600", marginTop: 2 },
//   sessionRow:        { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#E0E6F0", gap: 10 },
//   sessionDate:       { fontSize: 12, color: "#555", flex: 1 },
//   sessionName:       { fontSize: 13, fontWeight: "600", color: "#1A1A2E", flex: 1 },
//   sessionBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
//   sessionBadgeText:  { fontSize: 12, fontWeight: "700" },
//   inputLabel:        { alignSelf: "flex-start", fontSize: 12, fontWeight: "700", color: "#0047AB", marginBottom: 4, marginTop: 4 },
//   input:             { width: "100%", backgroundColor: "#F5F7FA", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1A1A2E", borderWidth: 1, borderColor: "#E0E6F0" },
//   inputMultiline:    { height: 80, textAlignVertical: "top" },
//   submitLeaveBtn:    { width: "100%", backgroundColor: "#0047AB", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16, flexDirection: "row", justifyContent: "center" },
//   submitLeaveBtnDisabled: { backgroundColor: "#94a3b8", opacity: 0.7 },
//   submitLeaveBtnText:{ color: "#fff", fontSize: 15, fontWeight: "700" },
//   closeBtn:          { marginTop: 12, paddingVertical: 8, alignItems: "center" },
//   closeBtnText:      { fontSize: 14, color: "#888", fontWeight: "600" },

//   // ── Apply Leave Modal ──
//   applyModalHeader:  { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 16, gap: 10 },
//   applyModalIconWrap:{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
//   applyModalIcon:    { fontSize: 22 },
//   applyModalTitle:   { fontSize: 17, fontWeight: "800", color: "#1A1A2E" },
//   applyModalSub:     { fontSize: 11, color: "#888", marginTop: 1 },
//   applyModalClose:   { padding: 6, marginLeft: "auto" },
//   applyModalCloseTxt:{ fontSize: 16, color: "#aaa", fontWeight: "700" },
//   studentChip:       { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "#BFDBFE", gap: 8, width: "100%" },
//   studentChipIcon:   { fontSize: 16 },
//   studentChipText:   { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flex: 1 },
//   studentChipIdPill: { backgroundColor: "#fff", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#BFDBFE" },
//   studentChipId:     { fontSize: 11, color: "#0047AB", fontWeight: "700" },
//   sectionLabel:      { fontSize: 12, fontWeight: "700", color: "#0047AB", marginBottom: 6, alignSelf: "flex-start", width: "100%" },
//   dayCountPill:      { alignSelf: "center", backgroundColor: "#EFF6FF", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12, borderWidth: 1, borderColor: "#BFDBFE" },
//   dayCountTxt:       { fontSize: 13, fontWeight: "700", color: "#0047AB" },

//   // ── Leave History Modal ──
//   historyModalHeader:{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 12, gap: 6 },
//   historyModalTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A2E", flex: 1 },
//   historyRefreshBtn: { backgroundColor: "#EFF6FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#BFDBFE" },
//   historyRefreshTxt: { fontSize: 12, fontWeight: "700", color: "#0047AB" },
//   historySummaryRow: { flexDirection: "row", width: "100%", gap: 6, marginBottom: 10 },
//   historySummaryPill:{ flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
//   historySummaryCount:{ fontSize: 18, fontWeight: "800" },
//   historySummaryLabel:{ fontSize: 9, fontWeight: "700", marginTop: 1 },
//   historyEmpty:      { alignItems: "center", paddingVertical: 30 },
//   historyEmptyIcon:  { fontSize: 40, marginBottom: 10 },
//   historyEmptyTitle: { fontSize: 15, fontWeight: "700", color: "#555", marginBottom: 4 },
//   historyEmptySubtitle:{ fontSize: 12, color: "#aaa", textAlign: "center" },
//   historyCard:       { flexDirection: "row", backgroundColor: "#FAFBFF", borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: "#E0E6F0", overflow: "hidden", paddingVertical: 12, paddingRight: 12 },
//   historyCardAccent: { width: 4, borderRadius: 2, alignSelf: "stretch" },
//   historyCardDateRow:{ flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 },
//   historyCardDates:  { fontSize: 13, fontWeight: "700", color: "#1A1A2E", flex: 1 },
//   historyCardDaysBadge:{ backgroundColor: "#E0E6F0", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
//   historyCardDaysTxt:{ fontSize: 11, fontWeight: "700", color: "#555" },
//   historyCardReason: { fontSize: 13, color: "#444", marginBottom: 6, lineHeight: 18 },
//   historyCardMeta:   { flexDirection: "row", alignItems: "center", gap: 8 },
//   historyCardApplied:{ fontSize: 11, color: "#aaa", flex: 1 },
//   historyCardStatus: { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
//   historyCardStatusIcon:{ fontSize: 11 },
//   historyCardStatusTxt:{ fontSize: 11, fontWeight: "700" },
//   // ── Teacher comments ──
//   commentsWrap:       { marginTop: 10 },
//   commentsDivider:    { height: 1, backgroundColor: "#E0E6F0", marginBottom: 8 },
//   commentBubble:      { backgroundColor: "#F0F4FF", borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: "#DBEAFE" },
//   commentHeader:      { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
//   commentAvatarWrap:  { width: 28, height: 28, borderRadius: 14, backgroundColor: "#0047AB", alignItems: "center", justifyContent: "center" },
//   commentAvatarTxt:   { fontSize: 13, fontWeight: "800", color: "#fff" },
//   commentBy:          { fontSize: 12, fontWeight: "700", color: "#1A1A2E", textTransform: "capitalize" },
//   commentTime:        { fontSize: 10, color: "#aaa", marginTop: 1 },
//   commentIcon:        { fontSize: 14 },
//   commentText:        { fontSize: 13, color: "#374151", lineHeight: 19, fontStyle: "italic" },

//   // ── Monthly leave section ──
//   monthlyLeaveSection:      { width: "100%", marginTop: 4, marginBottom: 4 },
//   monthlyLeaveSectionHeader:{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
//   monthlyLeaveSectionTitle: { fontSize: 13, fontWeight: "800", color: "#1A1A2E", flex: 1 },
//   monthlyLeaveCount:        { backgroundColor: "#0047AB", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
//   monthlyLeaveCountTxt:     { fontSize: 11, fontWeight: "800", color: "#fff" },
//   monthlyLeaveCard:         { flexDirection: "row", alignItems: "center", backgroundColor: "#FAFBFF", borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: "#E0E6F0", overflow: "hidden", paddingVertical: 10, paddingRight: 10 },
//   monthlyLeaveAccent:       { width: 4, alignSelf: "stretch" },
//   monthlyLeaveDateRow:      { flexDirection: "row", alignItems: "center", marginBottom: 2, gap: 6 },
//   monthlyLeaveDates:        { fontSize: 12, fontWeight: "700", color: "#1A1A2E", flex: 1 },
//   monthlyLeaveDays:         { fontSize: 10, fontWeight: "700", color: "#888", backgroundColor: "#E0E6F0", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
//   monthlyLeaveReason:       { fontSize: 12, color: "#555", lineHeight: 16 },
//   monthlyLeaveComment:      { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
//   monthlyLeaveCommentIcon:  { fontSize: 10 },
//   monthlyLeaveCommentTxt:   { fontSize: 11, color: "#6B7280", fontStyle: "italic", flex: 1 },
//   monthlyLeaveStatusBadge:  { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 6 },
//   monthlyLeaveStatusTxt:    { fontSize: 14 },
// });


import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, ActivityIndicator, Modal, TextInput, FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

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



  // ── Render ────────────────────────────────────────────────────────────────────

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

        {/* Summary cards */}
        {!loading && (
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