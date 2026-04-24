// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   SafeAreaView,
//   Image,
//   Alert,
//   ActivityIndicator,
//   StyleSheet,
//   Modal,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { useTheme } from "../ThemeContext";

// export default function ExamResultsScreen() {
//   const router = useRouter();
//   const { theme } = useTheme();

//   const [loading, setLoading] = useState(true);
//   const [downloading, setDownloading] = useState(false);
//   const [showResult, setShowResult] = useState(false);
//   const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
//   const [exams, setExams] = useState<any[]>([]);
//   const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
//   const [childName, setChildName] = useState("Student");
//   const [childId, setChildId] = useState<number | null>(null);
//   const [studentId, setStudentId] = useState<number | null>(null);
//   const [className, setClassName] = useState<string | null>(null);
// const [sectionName, setSectionName] = useState<string | null>(null);
// // const [exams, setExams] = useState<any[]>([]);
// // const [selectedExamId, setSelectedExamId] = useState<number | null>(null);



//   useEffect(() => {
//     loadChildAndFetchYears();
//   }, []);

//   // const loadChildAndFetchYears = async () => {
//   //   try {
//   //     setLoading(true);
//   //     const childRaw = await AsyncStorage.getItem("selectedChild");
//   //     const child = childRaw ? JSON.parse(childRaw) : null;
//   //     if (child) {
//   //       setChildName(child.name ?? "Student");
//   //       setChildId(child.id ?? null);
//   //       setStudentId(child.id ?? null);
//   //        setClassName(child.classname ?? null);   
//   //     setSectionName(child.sectionname ?? null); 
//   //     }

//   //     // ✅ Read year set by dashboard
//   //     const savedYearId = await AsyncStorage.getItem("selectedYearId");
//   //     if (savedYearId) {
//   //       setSelectedYearId(Number(savedYearId));
//   //     }
//   //   } catch {
//   //     Alert.alert("Error", "Could not load data");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // ✅ Trigger fetchExams when both selectedYearId and studentId are ready
  
//   const loadChildAndFetchYears = async () => {
//   try {
//     setLoading(true);
//     const childRaw = await AsyncStorage.getItem("selectedChild");
//     const child = childRaw ? JSON.parse(childRaw) : null;
//     if (child) {
//       setChildName(child.name ?? "Student");
//       setChildId(child.id ?? null);
//       setStudentId(child.id ?? null);
//       setClassName(child.classname ?? null);
//       setSectionName(child.sectionname ?? null);
//     }

//     const savedYearId = await AsyncStorage.getItem("selectedYearId");
//     // ✅ fallback to 8 if API is broken
//     setSelectedYearId(savedYearId ? Number(savedYearId) : 8);

//   } catch {
//     Alert.alert("Error", "Could not load data");
//   } finally {
//     setLoading(false);
//   }
// };
//   useEffect(() => {
//     if (selectedYearId && studentId) fetchExams(selectedYearId);
//   }, [selectedYearId, studentId]);

//   const fetchExams = async (yearId: number) => {
//     try {
//       setLoading(true);
//       setSelectedExamId(null);
//       setExams([]);
//       setShowResult(false);

//       const token = await AsyncStorage.getItem("token");
//       const childRaw = await AsyncStorage.getItem("selectedChild");
//       const child = childRaw ? JSON.parse(childRaw) : null;

//       const res = await fetch(
//         "https://connect.schoolaid.in/api/app/student-exams",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             "x-academic-year": `${yearId}`, // ✅ uses dashboard year
//           },
//           body: JSON.stringify({ student_id: child?.id }),
//         }
//       );
//       const data = await res.json();
//       console.log("Exams response:", data);
//       const arr = Array.isArray(data.exams) ? data.exams : [];
//       setExams(arr);
//       if (arr.length > 0) setSelectedExamId(arr[0].id);
//     } catch (err: any) {
//       Alert.alert("Error", `Could not fetch exams: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownload = async () => {
//     if (!selectedExamId || !studentId) {
//       Alert.alert("Error", "Please select an exam first.");
//       return;
//     }
//     try {
//       setDownloading(true);
//       const token = await AsyncStorage.getItem("token");

//       // ── TODO: Replace with real API when developer provides it ──
//       const res = await fetch(
//         "https://connect.schoolaid.in/api/app/marks",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             student_id: studentId,
//             exam_id: selectedExamId,
//           }),
//         }
//       );
//       const data = await res.json();
//       if (data.pdf_url) {
//         await Linking.openURL(data.pdf_url);
//       }

//       await new Promise<void>((resolve) => setTimeout(resolve, 1000));
//       Alert.alert(
//         "Coming Soon",
//         "Result download will be available once the API is ready.",
//         [{ text: "OK" }]
//       );
//     } catch (err: any) {
//       Alert.alert("Error", `Download failed: ${err.message}`);
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const selectedExam = exams.find((e) => e.id === selectedExamId);

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
//   {/* Top row: back arrow left, title centered, spacer right */}
//   <View style={styles.headerTopRow}>
//     <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//       <Text style={styles.backArrow}>↩</Text>
//     </TouchableOpacity>
//     <Text style={styles.headerTitle} numberOfLines={1}>Welcome, {childName}</Text>
//     <View style={styles.backBtn} />
//   </View>
//   <Text style={styles.headerSubtitle}>
//     Class: {className} · Section {sectionName}
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

//       {loading ? (
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" color={theme.primary} />
//           <Text style={{ marginTop: 12, color: theme.text }}>Loading…</Text>
//         </View>
//       ) : (
//         <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

//           {/* ── EXAM PICKER ONLY ── */}
//           <View style={styles.filters}>
//             {exams.length > 0 && (
//               <>
//                 <Text style={[styles.filterLabel, { color: theme.primary }]}>
//                   Select Exam
//                 </Text>
//                 <View style={[styles.pickerWrapper, { borderColor: theme.primary }]}>
//                   <Picker
//                     selectedValue={selectedExamId}
//                     onValueChange={(val) => {
//                       setSelectedExamId(val);
//                       setShowResult(false);
//                     }}
//                     style={styles.picker}
//                   >
//                     {exams.map((ex) => (
//                       <Picker.Item
//                         key={ex.id}
//                         label={ex.exam_name ?? ex.name ?? String(ex.id)}
//                         value={ex.id}
//                       />
//                     ))}
//                   </Picker>
//                 </View>
//               </>
//             )}
//           </View>

//           {/* ── EXAM INFO CARD ── */}
//           {selectedExam && (
//             <View style={[styles.examInfoCard, { borderLeftColor: theme.primary }]}>
//               <View style={{ flex: 1 }}>
//                 <Text style={[styles.examInfoName, { color: theme.primary }]}>
//                   {selectedExam.exam_name ?? selectedExam.name}
//                 </Text>
//                 <Text style={styles.examInfoDates}>
//                   📅 {selectedExam.start_date} → {selectedExam.end_date}
//                 </Text>
//               </View>
//             </View>
//           )}

//           {/* ── NO EXAMS ── */}
//           {exams.length === 0 && (
//             <View style={styles.emptyCard}>
//               <Text style={styles.emptyIcon}>📭</Text>
//               <Text style={[styles.emptyTitle, { color: theme.primary }]}>
//                 No Exams Yet
//               </Text>
//               <Text style={[styles.emptySubtext, { color: theme.text }]}>
//                 No exams scheduled for this academic year.{"\n"}
//                 Please check back later.
//               </Text>
//               <TouchableOpacity
//                 style={[styles.retryBtn, { borderColor: theme.primary }]}
//                 onPress={() => selectedYearId && fetchExams(selectedYearId)}
//               >
//                 <Text style={[styles.retryText, { color: theme.primary }]}>
//                   🔄 Refresh
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* ── VIEW RESULT BUTTON ── */}
//           {selectedExam && (
//             <TouchableOpacity
//               style={[styles.viewResultBtn, { backgroundColor: theme.primary }]}
//               onPress={() => setShowResult(true)}
//               activeOpacity={0.85}
//             >
//               <Text style={styles.viewResultText}>📊 View Result Summary</Text>
//             </TouchableOpacity>
//           )}

//         </ScrollView>
//       )}

//       {/* ══ RESULT MODAL ══ */}
//       <Modal
//         visible={showResult}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setShowResult(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalCard}>

//             <View style={styles.modalHeader}>
//               <Text style={[styles.modalTitle, { color: theme.primary }]}>
//                 📊 Result Summary
//               </Text>
//               <TouchableOpacity onPress={() => setShowResult(false)}>
//                 <Text style={styles.modalClose}>✕</Text>
//               </TouchableOpacity>
//             </View>

//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Exam</Text>
//               <Text style={[styles.resultValue, { color: theme.text }]}>
//                 {selectedExam?.exam_name ?? "—"}
//               </Text>
//             </View>
//             <View style={styles.divider} />

//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Duration</Text>
//               <Text style={[styles.resultValue, { color: theme.text }]}>
//                 {selectedExam?.start_date} – {selectedExam?.end_date}
//               </Text>
//             </View>
//             <View style={styles.divider} />

//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Total Marks</Text>
//               <Text style={[styles.resultValue, { color: theme.text }]}>
//                 — {/* data.total_marks */}
//               </Text>
//             </View>
//             <View style={styles.divider} />

//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Obtained Marks</Text>
//               <Text style={[styles.resultValue, { color: theme.text }]}>
//                 — {/* data.obtained_marks */}
//               </Text>
//             </View>
//             <View style={styles.divider} />

//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Percentage</Text>
//               <Text style={[styles.resultValue, { color: theme.text }]}>
//                 — {/* data.percentage */}
//               </Text>
//             </View>
//             <View style={styles.divider} />

//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Grade</Text>
//               <Text style={[styles.resultValue, { color: theme.text }]}>
//                 — {/* data.grade */}
//               </Text>
//             </View>
//             <View style={styles.divider} />

//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Status</Text>
//               <View style={styles.statusBadge}>
//                 <Text style={styles.statusText}>
//                   — {/* Pass / Fail */}
//                 </Text>
//               </View>
//             </View>

//             <TouchableOpacity
//               style={[
//                 styles.downloadButton,
//                 { backgroundColor: downloading ? "#aaa" : theme.primary },
//               ]}
//               onPress={handleDownload}
//               disabled={downloading}
//               activeOpacity={0.85}
//             >
//               {downloading ? (
//                 <View style={styles.downloadRow}>
//                   <ActivityIndicator size="small" color="#fff" />
//                   <Text style={[styles.downloadText, { marginLeft: 8 }]}>
//                     Preparing PDF…
//                   </Text>
//                 </View>
//               ) : (
//                 <Text style={styles.downloadText}>📥 Download Result</Text>
//               )}
//             </TouchableOpacity>

//           </View>
//         </View>
//       </Modal>

//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1 },
//   centered: { flex: 1, alignItems: "center", justifyContent: "center" },

//   // Header
//   headerTop: { paddingTop: 50, paddingBottom: 28, paddingHorizontal: 16, alignItems: "center" },
//     headerSubtitle: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 13,
//     marginBottom: 12,
//   },
// headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 },
//  backBtn: { width: 36, padding: 4 },
// backArrow: { color: "#fff", fontSize: 24, fontWeight: "bold" },
// headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
//   logoWrapper: { marginBottom: 14 },
//   logo: { width: 84, height: 84, resizeMode: "contain", borderRadius: 18, backgroundColor: "#fff" },
  
//   childSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", marginBottom: 20 },
//   actions: { flexDirection: "row", gap: 12 },
//   actionButton: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 28, borderRadius: 10 },
//   actionText: { fontWeight: "700", fontSize: 14 },

//   // Filters
//   filters: { margin: 16 },
//   filterLabel: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
//   pickerWrapper: { borderWidth: 1, borderRadius: 8, marginBottom: 12, overflow: "hidden", backgroundColor: "#fff" },
//   picker: { height: 50 },

//   // Exam info card
//   examInfoCard: {
//     marginHorizontal: 16,
//     marginBottom: 12,
//     padding: 14,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#E0E6F0",
//     borderLeftWidth: 4,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   examInfoName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
//   examInfoDates: { fontSize: 12, color: "#888" },

//   // View result button
//   viewResultBtn: {
//     marginHorizontal: 16,
//     marginBottom: 16,
//     padding: 14,
//     borderRadius: 10,
//     alignItems: "center",
//   },
//   viewResultText: { color: "#fff", fontWeight: "700", fontSize: 15 },

//   // Modal
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//   },
//   modalCard: {
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 24,
//     paddingBottom: 40,
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   modalTitle: { fontSize: 17, fontWeight: "700" },
//   modalClose: { fontSize: 18, color: "#888", fontWeight: "700" },

//   // Result rows
//   resultRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 10,
//   },
//   resultLabel: { fontSize: 13, color: "#888", fontWeight: "500" },
//   resultValue: { fontSize: 13, fontWeight: "700" },
//   divider: { height: 0.5, backgroundColor: "#E0E6F0" },
//   statusBadge: {
//     backgroundColor: "#dcfce7",
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 20,
//   },
//   statusText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },

//   // Download button
//   downloadButton: { marginTop: 16, padding: 14, borderRadius: 10, alignItems: "center" },
//   downloadRow: { flexDirection: "row", alignItems: "center" },
//   downloadText: { color: "#fff", fontWeight: "700", fontSize: 15, textAlign: "center" },

//   // Empty
//   emptyCard: {
//     backgroundColor: "#fff", marginHorizontal: 16, marginTop: 8, padding: 32,
//     borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#E0E6F0",
//   },
//   emptyIcon: { fontSize: 48, marginBottom: 12 },
//   emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
//   emptySubtext: { fontSize: 13, textAlign: "center", opacity: 0.7, lineHeight: 20, marginBottom: 20 },
//   retryBtn: { borderWidth: 1.5, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
//   retryText: { fontWeight: "700", fontSize: 14 },
// });

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";

export default function ExamResultsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [childName, setChildName] = useState("Student");
  const [studentId, setStudentId] = useState<number | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState<string | null>(null);
  const [marksData, setMarksData] = useState<any>(null); // ✅ stores marks result

  useEffect(() => {
    loadChildAndFetchYears();
  }, []);

  const loadChildAndFetchYears = async () => {
    try {
      setLoading(true);
      const childRaw = await AsyncStorage.getItem("selectedChild");
      const child = childRaw ? JSON.parse(childRaw) : null;
      console.log("=== LOAD CHILD ===");
      console.log("Child from storage:", JSON.stringify(child));
      if (child) {
        setChildName(child.name ?? "Student");
        setStudentId(child.id ?? null);
        setClassName(child.classname ?? null);
        setSectionName(child.sectionname ?? null);
      }
      const savedYearId = await AsyncStorage.getItem("selectedYearId");
      console.log("Saved year ID:", savedYearId);
      setSelectedYearId(savedYearId ? Number(savedYearId) : 8);
    } catch {
      Alert.alert("Error", "Could not load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedYearId && studentId) fetchExams(selectedYearId);
  }, [selectedYearId, studentId]);

  const fetchExams = async (yearId: number) => {
    try {
      setLoading(true);
      setSelectedExamId(null);
      setExams([]);
      setShowResult(false);
      setMarksData(null);

      const token = await AsyncStorage.getItem("token");
      const childRaw = await AsyncStorage.getItem("selectedChild");
      const child = childRaw ? JSON.parse(childRaw) : null;

      console.log("=== FETCH EXAMS ===");
      console.log("Year ID:", yearId, "Student ID:", child?.id);

      const res = await fetch(
        "https://connect.schoolaid.in/api/app/student-exams",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-academic-year": `${yearId}`,
          },
          body: JSON.stringify({ student_id: child?.id }),
        }
      );
      console.log("Exams status:", res.status);
      const data = await res.json();
      console.log("Exams response:", JSON.stringify(data, null, 2));
      const arr = Array.isArray(data.exams) ? data.exams : [];
      setExams(arr);
      if (arr.length > 0) setSelectedExamId(arr[0].id);
    } catch (err: any) {
      Alert.alert("Error", `Could not fetch exams: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch marks when View Result is pressed
  // const fetchMarks = async () => {
  //   if (!selectedExamId || !studentId) {
  //     Alert.alert("Error", "Please select an exam first.");
  //     return;
  //   }
  //   try {
  //     setDownloading(true);
  //     setMarksData(null);
  //     const token = await AsyncStorage.getItem("token");

  //     console.log("=== FETCH MARKS ===");
  //     console.log("Student ID:", studentId, "Exam ID:", selectedExamId);

  //     const res = await fetch(
  //       "https://connect.schoolaid.in/api/app/marks",
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //           "x-academic-year": `${selectedYearId}`, // ✅ include year for marks API as well
  //         },
  //         body: JSON.stringify({
  //           student_id: studentId,
  //           exam_id: selectedExamId,
  //         }),
  //       }
  //     );
  //     console.log("Marks status:", res.status);
  //     const data = await res.json();
  //     console.log("Marks response:", JSON.stringify(data, null, 2));

  //     if (res.ok) {
  //       setMarksData(data);
  //       setShowResult(true);
  //     } else {
  //       Alert.alert("Error", data.msg ?? "Could not fetch marks");
  //     }
  //   } catch (err: any) {
  //     Alert.alert("Error", `Failed to load marks: ${err.message}`);
  //   } finally {
  //     setDownloading(false);
  //   }
  // };
  const fetchMarks = async () => {
  if (!selectedExamId || !studentId) {
    Alert.alert("Error", "Please select an exam first.");
    return;
  }
  try {
    setDownloading(true);
    setMarksData(null);
    const token = await AsyncStorage.getItem("token");

    console.log("=== FETCH MARKS ===");
    console.log("Student ID:", studentId);
    console.log("Exam ID:", selectedExamId);
    console.log("Year ID being sent:", selectedYearId); // 👈 check this

    const res = await fetch(
      "https://connect.schoolaid.in/api/app/marks",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          // ❌ Remove x-academic-year — marks API doesn't need it
          "x-academic-year": `${selectedYearId}`,
        },
        body: JSON.stringify({
          student_id: studentId,
          exam_id: selectedExamId,
        }),
      }
    );
    console.log("Marks status:", res.status);
    const data = await res.json();
    console.log("Marks response:", JSON.stringify(data, null, 2));

    if (res.ok) {
      setMarksData(data);
      setShowResult(true);
    } else {
      Alert.alert("Error", data.msg ?? "Could not fetch marks");
    }
  } catch (err: any) {
    Alert.alert("Error", `Failed to load marks: ${err.message}`);
  } finally {
    setDownloading(false);
  }
};

  const selectedExam = exams.find((e) => e.id === selectedExamId);

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

      {/* ══ HEADER ══ */}
      <View style={[styles.headerTop, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>↩</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Welcome, {childName}</Text>
          <View style={styles.backBtn} />
        </View>
        <Text style={styles.headerSubtitle}>
          Class: {className} · Section {sectionName}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/addchild")}>
            <Text style={styles.actionText}>Switch Child</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Text style={styles.actionText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 12, color: theme.text }}>Loading…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

          <View style={styles.filters}>
            {exams.length > 0 && (
              <>
                <Text style={[styles.filterLabel, { color: theme.primary }]}>
                  Select Exam
                </Text>
                <View style={[styles.pickerWrapper, { borderColor: theme.primary }]}>
                  <Picker
                    selectedValue={selectedExamId}
                    onValueChange={(val) => {
                      setSelectedExamId(val);
                      setShowResult(false);
                      setMarksData(null);
                    }}
                    style={styles.picker}
                  >
                    {exams.map((ex) => (
                      <Picker.Item
                        key={ex.id}
                        label={ex.exam_name ?? ex.name ?? String(ex.id)}
                        value={ex.id}
                      />
                    ))}
                  </Picker>
                </View>
              </>
            )}
          </View>

          {selectedExam && (
            <View style={[styles.examInfoCard, { borderLeftColor: theme.primary }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.examInfoName, { color: theme.primary }]}>
                  {selectedExam.exam_name ?? selectedExam.name}
                </Text>
                <Text style={styles.examInfoDates}>
                  📅 {selectedExam.start_date} → {selectedExam.end_date}
                </Text>
              </View>
            </View>
          )}

          {exams.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyTitle, { color: theme.primary }]}>No Exams Yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.text }]}>
                No exams scheduled for this academic year.{"\n"}Please check back later.
              </Text>
              <TouchableOpacity
                style={[styles.retryBtn, { borderColor: theme.primary }]}
                onPress={() => selectedYearId && fetchExams(selectedYearId)}
              >
                <Text style={[styles.retryText, { color: theme.primary }]}>🔄 Refresh</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ✅ View Result button now calls fetchMarks */}
          {selectedExam && (
            <TouchableOpacity
              style={[styles.viewResultBtn, { backgroundColor: downloading ? "#aaa" : theme.primary }]}
              onPress={fetchMarks}
              disabled={downloading}
              activeOpacity={0.85}
            >
              {downloading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.viewResultText}>Loading…</Text>
                </View>
              ) : (
                <Text style={styles.viewResultText}>📊 View Result Summary</Text>
              )}
            </TouchableOpacity>
          )}

        </ScrollView>
      )}

      {/* ══ RESULT MODAL ══ */}
{/* ══ RESULT MODAL ══ */}
<Modal
  visible={showResult}
  transparent
  animationType="slide"
  onRequestClose={() => setShowResult(false)}
>
  <View style={styles.modalOverlay}>
    <ScrollView>
      <View style={styles.modalCard}>

        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.primary }]}>📊 Result Summary</Text>
          <TouchableOpacity onPress={() => setShowResult(false)}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── OVERALL SUMMARY ── */}
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Exam</Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {marksData?.exam?.exam_name ?? "—"}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Total Marks</Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {marksData?.exam?.total_max_marks ?? "—"}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Obtained Marks</Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {marksData?.exam?.total_obtained_marks ?? "—"}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Percentage</Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {marksData?.exam?.percentage ? `${marksData.exam.percentage}%` : "—"}
          </Text>
        </View>
          <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Grade</Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {marksData?.exam?.grade ?? "—"}
          </Text>
        </View>
        <View style={styles.divider} />

        {/* ── SUBJECT WISE ── */}
        <Text style={[styles.sectionHeading, { color: theme.primary }]}>
          Subject-wise Marks
        </Text>

        {(marksData?.exam?.subjects ?? []).map((sub: any) => (
          <View key={sub.subject_id} style={styles.subjectCard}>
            <View style={styles.subjectRow}>
              <Text style={styles.subjectName}>{sub.subject_name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: sub.result === "Pass" ? "#dcfce7" : "#fee2e2" }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: sub.result === "Pass" ? "#16a34a" : "#dc2626" }
                ]}>
                  {sub.result}
                </Text>
              </View>
            </View>
            <View style={styles.subjectDetails}>
              <Text style={styles.subjectStat}>
                Marks: <Text style={styles.subjectStatValue}>{sub.marks_obtained}/{sub.max_marks?.total}</Text>
              </Text>
              <Text style={styles.subjectStat}>
                Grade: <Text style={styles.subjectStatValue}>{sub.grade}</Text>
              </Text>
              <Text style={styles.subjectStat}>
                Passing: <Text style={styles.subjectStatValue}>{sub.passing_marks}</Text>
              </Text>
            </View>
            <View style={styles.divider} />
          </View>
        ))}

      </View>
    </ScrollView>
  </View>
</Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerTop: { paddingTop: 50, paddingBottom: 28, paddingHorizontal: 16, alignItems: "center" },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 12 },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 },
  backBtn: { width: 36, padding: 4 },
  backArrow: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
  actions: { flexDirection: "row", gap: 12 },
  actionButton: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 28, borderRadius: 10 },
  actionText: { fontWeight: "700", fontSize: 14 },
  filters: { margin: 16 },
  filterLabel: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  pickerWrapper: { borderWidth: 1, borderRadius: 8, marginBottom: 12, overflow: "hidden", backgroundColor: "#fff" },
  picker: { height: 50 },
  examInfoCard: {
    marginHorizontal: 16, marginBottom: 12, padding: 14, backgroundColor: "#fff",
    borderRadius: 12, borderWidth: 1, borderColor: "#E0E6F0", borderLeftWidth: 4,
    flexDirection: "row", alignItems: "center",
  },
  examInfoName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  examInfoDates: { fontSize: 12, color: "#888" },
  viewResultBtn: { marginHorizontal: 16, marginBottom: 16, padding: 14, borderRadius: 10, alignItems: "center" },
  viewResultText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalClose: { fontSize: 18, color: "#888", fontWeight: "700" },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  resultLabel: { fontSize: 13, color: "#888", fontWeight: "500" },
  resultValue: { fontSize: 13, fontWeight: "700" },
  divider: { height: 0.5, backgroundColor: "#E0E6F0" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  emptyCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 8, padding: 32,
    borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#E0E6F0",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySubtext: { fontSize: 13, textAlign: "center", opacity: 0.7, lineHeight: 20, marginBottom: 20 },
  retryBtn: { borderWidth: 1.5, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { fontWeight: "700", fontSize: 14 },

  sectionHeading: {
  fontSize: 15,
  fontWeight: "700",
  marginTop: 16,
  marginBottom: 10,
},
subjectCard: {
  marginBottom: 4,
},
subjectRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
},
subjectName: {
  fontSize: 14,
  fontWeight: "600",
  color: "#1A1A2E",
  flex: 1,
},
subjectDetails: {
  flexDirection: "row",
  gap: 16,
  marginBottom: 8,
},
subjectStat: {
  fontSize: 12,
  color: "#888",
},
subjectStatValue: {
  fontWeight: "700",
  color: "#1A1A2E",
},
});