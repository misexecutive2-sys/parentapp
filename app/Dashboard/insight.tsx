import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const BASE_URL = "https://connect.schoolaid.in";

// ── Tab type ──
type TabType = "subject" | "consolidated";

export default function InsightScreen() {
  const [child, setChild] = useState<any>(null);
  const [yearId, setYearId] = useState<string | null>(null);
  const [yearLabel, setYearLabel] = useState<string | null>(null);

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState<TabType>("subject");

  // ── Exams list ──
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  // ── class_id + section_id extracted from exams response ──
  // No need for separate /api/classes or /api/sections (that API has a backend bug)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  // ── Loading states ──
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [analysisData, setAnalysisData] = useState<any>(null);

  // ── Load child + year on mount ──
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

  // ── Fetch exams once child & year are ready ──
  useEffect(() => {
    if (child && yearId) fetchExams();
  }, [child, yearId]);

  // ─────────────────────────────────────────────────────
  // Exams API — also extracts class_id + section_id
  // POST /api/app/student-exams
  // Response: { class_id, section_id, exams: [...] }
  // ─────────────────────────────────────────────────────
  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      const token = await AsyncStorage.getItem("token");
      const savedYearId = await AsyncStorage.getItem("selectedYearId");

      const res = await fetch(`${BASE_URL}/api/app/student-exams`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-academic-year": savedYearId ?? "8",
        },
        body: JSON.stringify({ student_id: child?.id }),
      });

      const data = await res.json();
      console.log("Exams response:", JSON.stringify(data, null, 2));

      // ✅ Extract class_id + section_id directly — no separate API needed
      if (data.class_id) {
        setSelectedClassId(data.class_id);
        console.log("✅ class_id:", data.class_id);
      }
      if (data.section_id) {
        setSelectedSectionId(data.section_id);
        console.log("✅ section_id:", data.section_id);
      }

      const arr = Array.isArray(data.exams) ? data.exams : [];
      setExams(arr);
      if (arr.length > 0) setSelectedExamId(arr[0].id);
    } catch (err: any) {
      Alert.alert("Error", `Could not fetch exams: ${err.message}`);
    } finally {
      setLoadingExams(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // Analysis API
  // TODO: Replace URL when developer provides the real endpoint
  // ─────────────────────────────────────────────────────
  const fetchAnalysis = async () => {
    if (!selectedExamId) {
      Alert.alert("Error", "Please select an exam first.");
      return;
    }
    if (!selectedClassId || !selectedSectionId) {
      Alert.alert("Error", "Class and section info not loaded yet. Please wait.");
      return;
    }

    try {
      setLoadingAnalysis(true);
      setAnalysisData(null);
      const token = await AsyncStorage.getItem("token");

      console.log("=== FETCH ANALYSIS ===");
      console.log("exam_id:", selectedExamId);
      console.log("class_id:", selectedClassId);
      console.log("section_id:", selectedSectionId);
      console.log("child_id:", child?.id);
      console.log("year_id:", yearId);
      console.log("tab:", activeTab);

      // TODO: Replace with real analysis API when developer provides it
      const res = await fetch(
        `${BASE_URL}/api/app/student-analysis?child_id=${child?.id}&year_id=${yearId}&exam_id=${selectedExamId}&class_id=${selectedClassId}&section_id=${selectedSectionId}&type=${activeTab}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      console.log("Analysis status:", res.status);
      const data = await res.json();
      console.log("Analysis response:", JSON.stringify(data, null, 2));
      setAnalysisData(data);
    } catch (err: any) {
      Alert.alert("Error", `Could not fetch analysis: ${err.message}`);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleLogout = () =>
    Alert.alert(
      "Logout",
      "Do you really want to logout?",
      [
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
      ],
      { cancelable: true }
    );

  return (
    <SafeAreaView style={styles.safe}>

      {/* ══ HEADER ══ */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>↩</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Welcome, {child?.name ?? "Child"}
          </Text>
          <View style={styles.backBtn} />
        </View>
        <Text style={styles.headerSubtitle}>
          Class: {child?.classname ?? "—"} · Section {child?.sectionname ?? "—"}
        </Text>
        <Text style={styles.headerSubtitle}>Academic Year: {yearLabel ?? "—"}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/addchild")}
          >
            <Text style={styles.actionText}>Switch Child</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Text style={styles.actionText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══ TABS ══ */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "subject" && styles.tabActive]}
          onPress={() => {
            setActiveTab("subject");
            setAnalysisData(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === "subject" && styles.tabTextActive]}>
            Subject-wise
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "consolidated" && styles.tabActive]}
          onPress={() => {
            setActiveTab("consolidated");
            setAnalysisData(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === "consolidated" && styles.tabTextActive]}>
            Consolidated
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionTitle}>
          {activeTab === "subject" ? "Subject-wise Analytics" : "Consolidated Analytics"}
        </Text>

        {loadingExams ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0047AB" />
            <Text style={styles.loadingText}>Loading exams…</Text>
          </View>
        ) : (
          <>
            {/* ── EXAM PICKER ── */}
            <View style={styles.pickerCard}>
              <Text style={styles.pickerLabel}>Select Exam</Text>
              {exams.length > 0 ? (
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedExamId}
                    onValueChange={(val) => {
                      setSelectedExamId(val);
                      setAnalysisData(null); // reset on exam change
                    }}
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
                <Text style={styles.noDataText}>No exams found</Text>
              )}
            </View>

            {/* ── CLASS + SECTION (auto-filled from exams API, read-only) ── */}
            {/* <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Class ID</Text>
                <Text style={styles.infoValue}>{selectedClassId ?? "—"}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Section ID</Text>
                <Text style={styles.infoValue}>{selectedSectionId ?? "—"}</Text>
              </View>
            </View> */}

            {/* ── VIEW ANALYSIS BUTTON ── */}
            <TouchableOpacity
              style={[
                styles.analysisBtn,
                (loadingAnalysis || !selectedExamId) && { backgroundColor: "#aaa" },
              ]}
              onPress={fetchAnalysis}
              disabled={loadingAnalysis || !selectedExamId}
              activeOpacity={0.85}
            >
              {loadingAnalysis ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.analysisBtnText, { marginLeft: 8 }]}>
                    Loading…
                  </Text>
                </View>
              ) : (
                <Text style={styles.analysisBtnText}>📊 View Analysis</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── ANALYSIS RESULTS ── */}
        {analysisData ? (
          Object.entries(analysisData).map(([key, val], idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.cardTitle}>{key}</Text>
              <Text style={styles.cardValue}>{JSON.stringify(val)}</Text>
            </View>
          ))
        ) : !loadingAnalysis && !loadingExams ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Analysis Yet</Text>
            <Text style={styles.emptySubtext}>
              Select an exam and tap View Analysis.
            </Text>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA" },

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
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  actionButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  actionText: { fontWeight: "700", fontSize: 14, color: "#0047AB" },

  // ── TAB BAR ──
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E6F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#0047AB",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  tabTextActive: {
    color: "#0047AB",
  },

  scroll: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0047AB",
    marginBottom: 16,
    textAlign: "center",
  },

  pickerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    marginBottom: 12,
    padding: 12,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0047AB",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#E0E6F0",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F5F7FA",
  },
  picker: { height: 50, color: "#1A1A2E" },
  noDataText: { fontSize: 13, color: "#aaa", paddingVertical: 10 },

  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    padding: 12,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0047AB",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A2E",
  },

  analysisBtn: {
    backgroundColor: "#0047AB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 4,
  },
  analysisBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnRow: { flexDirection: "row", alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0047AB" },
  cardValue: { fontSize: 13, color: "#333", marginTop: 6 },

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
  emptySubtext: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },

  centered: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, color: "#0047AB", fontSize: 14 },
});