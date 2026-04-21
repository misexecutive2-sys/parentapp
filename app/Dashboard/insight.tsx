import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function InsightScreen() {
  const [child, setChild] = useState<any>(null);
  const [yearId, setYearId] = useState<string | null>(null);
  const [yearLabel, setYearLabel] = useState<string | null>(null);

  const [reportType, setReportType] = useState<"subjectWise" | "consolidated">("consolidated");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ── Load child + year info ────────────────────────────
  useEffect(() => {
    const loadContext = async () => {
      const childStr = await AsyncStorage.getItem("selectedChild");
      const yearIdStr = await AsyncStorage.getItem("selectedYearId");
      const yearLabelStr = await AsyncStorage.getItem("selectedYearLabel");
      if (childStr) setChild(JSON.parse(childStr));
      if (yearIdStr) setYearId(yearIdStr);
      if (yearLabelStr) setYearLabel(yearLabelStr);
    };
    loadContext();
  }, []);

  // ── Fetch subjects when child + year ready ────────────
  useEffect(() => {
    if (child && yearId) fetchSubjects();
  }, [child, yearId]);

  const fetchSubjects = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `https://staging.schoolaid.in/api/app/subjects?child_id=${child?.id}&year_id=${yearId}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    }
  };

  // ── Fetch exams ───────────────────────────────────────
  const fetchExams = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        "https://staging.schoolaid.in/api/app/student-exams",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-academic-year": "5",
          },
          body: JSON.stringify({ student_id: child?.id }),
        }
      );
      const data = await res.json();
      const arr = Array.isArray(data.exams) ? data.exams : [];
      setExams(arr);
      if (arr.length > 0) setSelectedExamId(arr[0].id);
    } catch (err) {
      console.error("Failed to fetch exams:", err);
    }
  };

  // ------------- logout -------------
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

  // ── Fetch analysis ────────────────────────────────────
  // useEffect(() => {
  //   if (child && yearId) fetchAnalysis();
  // }, [reportType, selectedSubjectId, selectedExamId, child, yearId]);

  useEffect(() => {
  if (child && yearId) {
    fetchSubjects();
    fetchExams(); // ✅ fetch exams for both modes
  }
}, [child, yearId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      let url = "";

      if (reportType === "subjectWise" && selectedSubjectId) {
        url = `https://staging.schoolaid.in/api/app/student-analysis?child_id=${child.id}&year_id=${yearId}&subject_id=${selectedSubjectId}&exam_id=${selectedExamId}`;
      } else {
        url = `https://staging.schoolaid.in/api/app/student-analysis?child_id=${child.id}&year_id=${yearId}&type=consolidated&exam_id=${selectedExamId}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      setAnalysisData(data);
    } catch (err) {
      console.error("Failed to fetch analysis:", err);
    } finally {
      setLoading(false);
    }
  };

return (
    <SafeAreaView style={styles.safe}>

      {/* ══ HEADER ══ */}
<View style={styles.header}>
  <View style={styles.headerTopRow}>
    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
      <Text style={styles.backArrow}>↩</Text>
    </TouchableOpacity>
    <Text style={styles.headerTitle} numberOfLines={1}>Welcome, {child?.name ?? "Child"}</Text>
    <View style={styles.backBtn} />
  </View>
  <Text style={styles.headerSubtitle}>
    Class: {child?.classname ?? "—"} · Section {child?.sectionname ?? "—"}
  </Text>
  <Text style={styles.headerSubtitle}>
    Academic Year: {yearLabel ?? "—"}
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

      {/* ══ FILTER TOGGLE ══ */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, reportType === "consolidated" && styles.filterActive]}
          onPress={() => setReportType("consolidated")}
        >
          <Text style={[styles.filterText, reportType === "consolidated" && { color: "#fff" }]}>
            Consolidated
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, reportType === "subjectWise" && styles.filterActive]}
          onPress={() => setReportType("subjectWise")}
        >
          <Text style={[styles.filterText, reportType === "subjectWise" && { color: "#fff" }]}>
            Subject-wise
          </Text>
        </TouchableOpacity>
      </View>

      {/* ══ CONSOLIDATED EXAM PICKER ══ */}
      {reportType === "consolidated" && (
        <View style={styles.pickersWrapper}>
          {exams.length > 0 ? (
            <View style={styles.pickerBox}>
              <Text style={styles.pickerLabel}>Select Exam</Text>
              <Picker
                selectedValue={selectedExamId}
                onValueChange={(val) => setSelectedExamId(val)}
                style={styles.picker}
                dropdownIconColor="#0047AB"
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
          ) : (
            <View style={styles.pickerBox}>
              <Text style={[styles.pickerLabel, { paddingBottom: 8 }]}>
                Loading exams…
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ══ SUBJECT-WISE PICKERS ══ */}
      {reportType === "subjectWise" && (
        <View style={styles.pickersWrapper}>

          {/* Exam Picker */}
          {exams.length > 0 ? (
            <View style={styles.pickerBox}>
              <Text style={styles.pickerLabel}>Select Exam</Text>
              <Picker
                selectedValue={selectedExamId}
                onValueChange={(val) => setSelectedExamId(val)}
                style={styles.picker}
                dropdownIconColor="#0047AB"
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
          ) : (
            <View style={styles.pickerBox}>
              <Text style={[styles.pickerLabel, { paddingBottom: 8 }]}>
                Loading exams…
              </Text>
            </View>
          )}

          {/* Subject Picker */}
          {subjects.length > 0 && (
            <View style={styles.pickerBox}>
              <Text style={styles.pickerLabel}>Select Subject</Text>
              <Picker
                selectedValue={selectedSubjectId}
                onValueChange={(val) => setSelectedSubjectId(val)}
                style={styles.picker}
                dropdownIconColor="#0047AB"
              >
                {subjects.map((sub) => (
                  <Picker.Item key={sub.id} label={sub.name} value={sub.id} />
                ))}
              </Picker>
            </View>
          )}

        </View>
      )}

      {/* ══ ANALYSIS DATA ══ */}
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator size="large" color="#0047AB" style={{ marginTop: 32 }} />
        ) : analysisData ? (
          Object.entries(analysisData).map(([key, val], idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.cardTitle}>{key}</Text>
              <Text style={styles.cardValue}>{JSON.stringify(val)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySubtext}>
              No analysis data found.{"\n"}Please check back later.
            </Text>
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA" },

  // Header
header: {
  backgroundColor: "#0047AB",
  paddingTop: 50,
  paddingBottom: 20,
  paddingHorizontal: 16,
  alignItems: "center",
},
headerTopRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: 6,
},
 backBtn: { width: 36, padding: 4 },
backArrow: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  backButton: { padding: 6 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: { width: "80%", height: "80%", resizeMode: "contain" },
headerTitle: {
  color: "#fff",
  fontSize: 22,
  fontWeight: "800",
  textAlign: "center",
  flex: 1,
},
headerSubtitle: {
  color: "rgba(255,255,255,0.85)",
  fontSize: 13,
  textAlign: "center",
  marginBottom: 4,
},

  // Filter toggle
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
    gap: 10,
    paddingHorizontal: 20,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#E0E6F0",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  filterActive: { backgroundColor: "#0047AB" },
  filterText: { color: "#0047AB", fontWeight: "700", fontSize: 13 },

  // Pickers
  pickersWrapper: { paddingHorizontal: 20, gap: 10, marginBottom: 4 },
  pickerBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E6F0",
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0047AB",
    paddingHorizontal: 12,
    paddingTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  picker: { height: 50, color: "#0047AB" },

  // Cards
  scroll: { padding: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0047AB" },
  cardValue: { fontSize: 13, color: "#333", marginTop: 6 },

  // Empty
  emptyBox: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E6F0",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0047AB", marginBottom: 8 },
  emptySubtext: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 20 },

actions: {
  flexDirection: "row",
  gap: 12,
  marginTop: 12,
},
actionButton: {
  backgroundColor: "#fff",
  paddingVertical: 10,
  paddingHorizontal: 24,
  borderRadius: 10,
},
actionText: {
  fontWeight: "700",
  fontSize: 14,
  color: "#0047AB",
},

});