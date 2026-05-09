import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import Svg, { Rect, Text as SvgText, Line, G } from "react-native-svg";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTheme } from "../ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = "https://connect.schoolaid.in";
const SCREEN_W = Dimensions.get("window").width;
const CHART_W = SCREEN_W - 48;

type TabType = "subject" | "consolidated";

// ─── Helpers ───────────────────────────────────────────────────────────────
const SUBJECT_COLORS = [
  "#0047AB",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0891b2",
];

const gradeColor = (grade: string) => {
  if (!grade) return "#94a3b8";
  if (grade === "A+") return "#16a34a";
  if (grade === "A") return "#0047AB";
  if (grade === "B+") return "#d97706";
  if (grade === "B") return "#f59e0b";
  return "#dc2626";
};

const shortLabel = (name: string) => {
  const map: Record<string, string> = {
    "Computer Studies": "Comp.",
    "Environmental Studies": "EVS",
    Mathematics: "Math",
    English: "Eng.",
    Hindi: "Hindi",
    Marathi: "Mar.",
  };
  return map[name] ?? name.split(" ")[0].substring(0, 5);
};

// ─── Bar Chart (subject-wise) ───────────────────────────────────────────────
const SubjectBarChart = ({ subjects }: { subjects: any[] }) => {
  const chartH = 190;
  const padL = 30;
  const padB = 36;
  const padT = 16;
  const innerH = chartH - padB - padT;
  const barAreaW = CHART_W - padL - 8;
  const barW = Math.min(30, (barAreaW / subjects.length) * 0.55);
  const gap = barAreaW / subjects.length;

  return (
    <View style={cStyles.chartBox}>
      <Text style={cStyles.chartTitle}>Subject Performance</Text>
      <Svg width={CHART_W} height={chartH}>
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = padT + innerH - (pct / 100) * innerH;
          return (
            <G key={pct}>
              <Line
                x1={padL}
                y1={y}
                x2={CHART_W - 4}
                y2={y}
                stroke={pct === 0 ? "#C8D5E8" : "#EEF2F8"}
                strokeWidth={pct === 0 ? 1.5 : 1}
                strokeDasharray={pct === 0 ? "0" : "3,3"}
              />
            </G>
          );
        })}

        {subjects.map((sub, i) => {
          const pct = parseFloat(sub.percentage) || 0;
          const barH = (pct / 100) * innerH;
          const x = padL + i * gap + gap / 2 - barW / 2;
          const y = padT + innerH - barH;
          const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
          return (
            <G key={i}>
              <Rect
                x={x}
                y={padT}
                width={barW}
                height={innerH}
                rx={6}
                fill="#EEF2F8"
              />
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill={color}
                opacity={0.88}
              />
              <SvgText
                x={x + barW / 2}
                y={chartH - 8}
                fontSize={9}
                fill="#666"
                textAnchor="middle"
              >
                {shortLabel(sub.subject_name)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <View style={cStyles.legendRow}>
        {subjects.map((sub, i) => (
          <View key={i} style={cStyles.legendItem}>
            <View
              style={[
                cStyles.legendDot,
                { backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] },
              ]}
            />
            <Text style={cStyles.legendText} numberOfLines={1}>
              {sub.subject_name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Grade Summary Strip (replaces Radar) ─────────────────────────────────────
const GradeSummaryStrip = ({ subjects }: { subjects: any[] }) => {
  const emojiForGrade = (grade: string) => {
    if (grade === "A+") return "🌟";
    if (grade === "A") return "✅";
    if (grade === "B+") return "👍";
    if (grade === "B") return "📘";
    return "⚠️";
  };

  const labelForGrade = (grade: string) => {
    if (grade === "A+") return "Excellent";
    if (grade === "A") return "Very Good";
    if (grade === "B+") return "Good";
    if (grade === "B") return "Average";
    return "Needs Work";
  };

  // return (
  //   <View style={cStyles.chartBox}>
  //     <Text style={cStyles.chartTitle}>At a Glance</Text>
  //     {subjects.map((sub: any, i: number) => {
  //       const color = gradeColor(sub.grade);
  //       return (
  //         <View key={i} style={glanceStyles.row}>
  //           <Text style={glanceStyles.emoji}>{emojiForGrade(sub.grade)}</Text>
  //           <View style={{ flex: 1 }}>
  //             <Text style={glanceStyles.subName}>{sub.subject_name}</Text>
  //             <Text style={[glanceStyles.label, { color }]}>{labelForGrade(sub.grade)}</Text>
  //           </View>
  //           <View style={[glanceStyles.gradeBadge, { backgroundColor: color + "18" }]}>
  //             <Text style={[glanceStyles.gradeVal, { color }]}>{sub.grade}</Text>
  //           </View>
  //         </View>
  //       );
  //     })}
  //   </View>
  // );
};

// ─── Horizontal Bar Chart (consolidated) ─────────────────────────────────────
const ConsolidatedBarChart = ({ breakdown }: { breakdown: any[] }) => {
  const barH = 38;
  const gap = 14;
  const padL = 60;
  const padR = 52;
  const innerW = CHART_W - padL - padR;
  const totalH = breakdown.length * (barH + gap) + 20;
  const termColors = ["#0047AB", "#16a34a", "#d97706", "#7c3aed"];

  return (
    <View style={cStyles.chartBox}>
      <Text style={cStyles.chartTitle}>Term-wise Performance</Text>
      <Svg width={CHART_W} height={totalH}>
        {breakdown.map((exam, i) => {
          const pct = parseFloat(exam.percentage) || 0;
          const fillW = (pct / 100) * innerW;
          const y = i * (barH + gap) + 8;
          const color = termColors[i % termColors.length];
          return (
            <G key={i}>
              <SvgText
                x={padL - 8}
                y={y + barH / 2 + 4}
                fontSize={10}
                fill="#444"
                textAnchor="end"
                fontWeight="bold"
              >
                {exam.examName}
              </SvgText>
              <Rect
                x={padL}
                y={y}
                width={innerW}
                height={barH}
                rx={8}
                fill="#EEF2F8"
              />
              <Rect
                x={padL}
                y={y}
                width={Math.max(fillW, 8)}
                height={barH}
                rx={8}
                fill={color}
                opacity={0.85}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// ─── Subject improvement cards (consolidated) ─────────────────────────────────
// const SubjectImprovementCards = ({ subjects }: { subjects: any[] }) => {
//   return (
//     <View style={cStyles.chartBox}>
//       <Text style={cStyles.chartTitle}>Subject Progress</Text>
//       {subjects.map((sub: any, i: number) => {
//         const results = sub.exam_results ?? [];
//         if (results.length < 2) return null;
//         const first = parseFloat(results[0].percentage) || 0;
//         const last  = parseFloat(results[results.length - 1].percentage) || 0;
//         const diff  = last - first;
//         const improved = diff > 0.01;
//         const dropped  = diff < -0.01;
//         const arrow    = improved ? "▲" : dropped ? "▼" : "●";
//         const arrowColor = improved ? "#16a34a" : dropped ? "#dc2626" : "#888";
//         const diffLabel = improved
//           ? `+${diff.toFixed(1)}% from ${results[0].exam_name}`
//           : dropped
//           ? `${diff.toFixed(1)}% from ${results[0].exam_name}`
//           : `No change from ${results[0].exam_name}`;

//         return (
//           <View key={i} style={improvStyles.row}>
//             <View style={[improvStyles.accent, { backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }]} />
//             <View style={{ flex: 1 }}>
//               <Text style={improvStyles.subName}>{sub.subject_name}</Text>
//               <Text style={[improvStyles.diffLabel, { color: arrowColor }]}>{diffLabel}</Text>
//             </View>
//             <Text style={[improvStyles.arrow, { color: arrowColor }]}>{arrow}</Text>
//             <Text style={[improvStyles.latestPct, { color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }]}>
//               {last.toFixed(0)}%
//             </Text>
//           </View>
//         );
//       })}
//     </View>
//   );
// };

// ─── Subject-wise Result View ─────────────────────────────────────────────────
const SubjectWiseResults = ({ data }: { data: any }) => {
  const { summary, subjectPerformance } = data;
  return (
    <View>
      {/* Pill summary */}
      <View style={styles.pillRow}>
        {/* <View style={[styles.pill, { backgroundColor: "#EFF6FF" }]}>
          <Text style={[styles.pillValue, { color: "#0047AB" }]}>{summary?.overallPercentage?.toFixed(1)}%</Text>
          <Text style={styles.pillLabel}>Percentage</Text>
        </View> */}
        <View
          style={[
            styles.pill,
            { backgroundColor: gradeColor(summary?.overallGrade) + "15" },
          ]}
        >
          <Text
            style={[
              styles.pillValue,
              { color: gradeColor(summary?.overallGrade) },
            ]}
          >
            {summary?.overallGrade}
          </Text>
          <Text style={styles.pillLabel}>Grade</Text>
        </View>
        {/* <View style={[styles.pill, { backgroundColor: "#F0FDF4" }]}>
          <Text style={[styles.pillValue, { color: "#16a34a" }]}>#{summary?.rank}</Text>
          <Text style={styles.pillLabel}>Rank</Text>
        </View> */}
      </View>

      {/* Charts */}
      <SubjectBarChart subjects={subjectPerformance ?? []} />
      {/* <GradeSummaryStrip subjects={subjectPerformance ?? []} /> */}

      {/* Subject cards — percentage + grade ONLY */}
      <Text style={styles.subheading}>Subject Details</Text>
      {(subjectPerformance ?? []).map((sub: any, idx: number) => {
        const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
        return (
          <View key={idx} style={styles.subjectCard}>
            <View style={styles.subjectRow}>
              <View
                style={[styles.subjectAccent, { backgroundColor: color }]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.subjectName}>{sub.subject_name}</Text>
                {/* {sub.teacher_name && (
            <Text style={styles.teacherText}>👤 {sub.teacher_name}</Text>
          )} */}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <View
                  style={[
                    styles.gradePill,
                    { backgroundColor: gradeColor(sub.grade) + "18" },
                  ]}
                >
                  <Text
                    style={[styles.gradeText, { color: gradeColor(sub.grade) }]}
                  >
                    {sub.grade}
                  </Text>
                </View>
              </View>
            </View>

            {/* Combined parts — show only grade */}
            {sub.is_combined && sub.child_subjects?.length > 0 && (
              <View style={styles.childBox}>
                {sub.child_subjects.map((cs: any, ci: number) => (
                  <View key={ci} style={styles.childRow}>
                    {/* Hardcoded subject names */}
                    <Text style={styles.childLabel}>
                      {ci === 0 ? "English Language" : "English Literature"}
                    </Text>
                    <View
                      style={[
                        styles.gradePillSm,
                        { backgroundColor: gradeColor(cs.grade) + "15" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.gradeTextSm,
                          { color: gradeColor(cs.grade) },
                        ]}
                      >
                        {cs.grade}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

// ─── Consolidated Result View ─────────────────────────────────────────────────
const ConsolidatedResults = ({ data }: { data: any }) => {
  const { summary, subjectPerformance } = data;
  return (
    <View>
      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: "#EFF6FF" }]}>
          <Text style={[styles.pillValue, { color: "#0047AB" }]}>
            {summary?.consolidatedPercentage?.toFixed(1)}%
          </Text>
          <Text style={styles.pillLabel}>Overall</Text>
        </View>
        <View
          style={[
            styles.pill,
            { backgroundColor: gradeColor(summary?.overallGrade) + "15" },
          ]}
        >
          <Text
            style={[
              styles.pillValue,
              { color: gradeColor(summary?.overallGrade) },
            ]}
          >
            {summary?.overallGrade}
          </Text>
          <Text style={styles.pillLabel}>Grade</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: "#F0FDF4" }]}>
          <Text style={[styles.pillValue, { color: "#16a34a" }]}>
            #{summary?.overallRank}
          </Text>
          <Text style={styles.pillLabel}>Rank</Text>
        </View>
      </View>

      {summary?.examBreakdown?.length > 0 && (
        <ConsolidatedBarChart breakdown={summary.examBreakdown} />
      )}

      {/* {subjectPerformance?.length > 0 && (
        <SubjectImprovementCards subjects={subjectPerformance} />
      )} */}

      <Text style={styles.subheading}>Subject Details</Text>
      {/* {subjectPerformance?.length > 0 && (
        <SubjectImprovementCards subjects={subjectPerformance} />
      )} */}
      {(subjectPerformance ?? []).map((sub: any, idx: number) => {
        const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
        return (
          <View key={idx} style={styles.subjectCard}>
            <View style={[styles.subjectRow, { marginBottom: 10 }]}>
              <View
                style={[styles.subjectAccent, { backgroundColor: color }]}
              />
              <Text style={[styles.subjectName, { flex: 1 }]}>
                {sub.subject_name}
              </Text>
            </View>

            <View style={styles.termCompareRow}>
              {(sub.exam_results ?? []).map((res: any, ri: number) => (
                <View
                  key={ri}
                  style={[styles.termChip, { borderColor: color + "40" }]}
                >
                  <Text style={styles.termChipLabel}>{res.exam_name}</Text>
                  <View
                    style={[
                      styles.gradePillSm,
                      { backgroundColor: gradeColor(res.grade) + "15" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.gradeTextSm,
                        { color: gradeColor(res.grade) },
                      ]}
                    >
                      {res.grade}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {sub.exam_results?.length === 2 &&
              (() => {
                const grade1 = sub.exam_results[0].grade;
                const grade2 = sub.exam_results[1].grade;

                // You can define a helper to compare grades if needed
                const improvement =
                  grade2 > grade1
                    ? "📈 Improved"
                    : grade2 < grade1
                      ? "📉 Declined"
                      : "➡️ Consistent";

                return (
                  <Text
                    style={[
                      styles.trendText,
                      {
                        color: improvement.includes("Improved")
                          ? "#16a34a"
                          : improvement.includes("Declined")
                            ? "#dc2626"
                            : "#888",
                      },
                    ]}
                  >
                    {improvement}
                  </Text>
                );
              })()}
          </View>
        );
      })}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
export default function InsightScreen() {
  const [child, setChild] = useState<any>(null);
  const [yearId, setYearId] = useState<string | null>(null);
  const { theme } = useTheme();

  const childName = child?.name ?? "Student";
  const childClass = child?.classname ?? "";
  const childSection = child?.sectionname ?? "";

  const [activeTab, setActiveTab] = useState<TabType>("subject");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    null,
  );
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const childStr = await AsyncStorage.getItem("selectedChild");
      const yearIdStr = await AsyncStorage.getItem("selectedYearId");
      if (childStr) setChild(JSON.parse(childStr));
      if (yearIdStr) setYearId(yearIdStr);
    })();
  }, []);

  useEffect(() => {
    if (child && yearId) fetchExams();
  }, [child, yearId]);

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
      if (data.class_id) setSelectedClassId(data.class_id);
      if (data.section_id) setSelectedSectionId(data.section_id);
      const arr = Array.isArray(data.exams) ? data.exams : [];
      setExams(arr);
      if (arr.length > 0) setSelectedExamId(arr[0].id);
    } catch (err: any) {
      Alert.alert("Error", `Could not fetch exams: ${err.message}`);
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchAnalysis = async () => {
    if (!selectedExamId) {
      Alert.alert("Error", "Please select an exam first.");
      return;
    }
    if (!selectedClassId || !selectedSectionId) {
      Alert.alert("Error", "Class info not loaded yet.");
      return;
    }
    try {
      setLoadingAnalysis(true);
      setAnalysisData(null);
      const token = await AsyncStorage.getItem("token");
      const savedYearId = await AsyncStorage.getItem("selectedYearId"); // ← read fresh

      console.log("🔑 Token:", token);
      console.log("📅 YearId:", savedYearId);
      console.log(
        "🎓 classId:",
        selectedClassId,
        "sectionId:",
        selectedSectionId,
      );

      const url =
        activeTab === "subject"
          ? `${BASE_URL}/api/analytics/student-wise?exam_id=${selectedExamId}&class_id=${selectedClassId}&section_id=${selectedSectionId}&student_id=${child?.id}`
          : `${BASE_URL}/api/analytics/consolidated?type=student&exam_id=${selectedExamId}&class_id=${selectedClassId}&section_id=${selectedSectionId}&student_id=${child?.id}`;

      console.log("🔍 URL:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-academic-year": savedYearId ?? "8", // ← ADD THIS
        },
      });

      const data = await res.json();
      console.log("📦 Status:", res.status);
      console.log("📦 Response:", JSON.stringify(data, null, 2));

      if (!res.ok) {
        Alert.alert("Server Error", data.msg ?? "Something went wrong");
        return;
      }

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
            await AsyncStorage.multiRemove([
              "token",
              "selectedChild",
              "selectedYearId",
              "selectedYearLabel",
            ]);
            router.replace("/login");
          },
        },
      ],
      { cancelable: true },
    );

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* HEADER */}
      <View style={[styles.headerTop, { backgroundColor: theme.primary }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <Text style={styles.iconBtnText}>⬅</Text>
          </TouchableOpacity>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {getInitials(childName)}
              </Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>{childName}</Text>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>
                  {childClass}
                  {childSection ? ` · ${childSection}` : ""}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>↪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabBar}>
        {(["subject", "consolidated"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab);
              setAnalysisData(null);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "subject" ? "Subject-wise" : "Consolidated"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loadingExams ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0047AB" />
            <Text style={styles.loadingText}>Loading exams…</Text>
          </View>
        ) : (
          <>
            <View style={styles.pickerCard}>
              <Text style={styles.pickerLabel}>Select Exam</Text>
              {exams.length > 0 ? (
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedExamId}
                    onValueChange={(val) => {
                      setSelectedExamId(val);
                      setAnalysisData(null);
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

            <TouchableOpacity
              style={[
                styles.analysisBtn,
                (loadingAnalysis || !selectedExamId) && {
                  backgroundColor: "#aaa",
                },
              ]}
              onPress={fetchAnalysis}
              disabled={loadingAnalysis || !selectedExamId}
              activeOpacity={0.85}
            >
              {loadingAnalysis ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
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

        {analysisData ? (
          activeTab === "subject" ? (
            <SubjectWiseResults data={analysisData} />
          ) : (
            <ConsolidatedResults data={analysisData} />
          )
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

// ─── Chart StyleSheet ──────────────────────────────────────────────────────────
const cStyles = StyleSheet.create({
  chartBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    elevation: 2,
    shadowColor: "#0047AB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0047AB",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 4,
    marginBottom: 2,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: "#555", maxWidth: 72 },
});

// ─── Screen StyleSheet ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA" },

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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  iconBtnText: { color: "#fff", fontSize: 20, fontWeight: "600" },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    justifyContent: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarInitials: { color: "#fff", fontSize: 16, fontWeight: "800" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  classBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 3,
  },
  classBadgeText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 11,
    fontWeight: "600",
  },

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
  tabActive: { borderBottomColor: "#0047AB" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#888" },
  tabTextActive: { color: "#0047AB" },

  scroll: { padding: 16, paddingBottom: 48 },

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

  analysisBtn: {
    backgroundColor: "#0047AB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 4,
  },
  analysisBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  pillRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  pill: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center" },
  pillValue: { fontSize: 22, fontWeight: "900" },
  pillLabel: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  subheading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },

  subjectCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    elevation: 2,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  subjectAccent: { width: 4, height: 36, borderRadius: 2 },
  subjectName: { fontSize: 14, fontWeight: "800", color: "#1A1A2E" },
  teacherText: { fontSize: 11, color: "#aaa", marginTop: 2 },
  gradePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  gradeText: { fontSize: 13, fontWeight: "800" },
  pctText: { fontSize: 16, fontWeight: "900" },
  progressBg: {
    height: 6,
    backgroundColor: "#E0E6F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },

  childBox: {
    backgroundColor: "#F8FAFF",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 6,
  },
  childRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  childLabel: { fontSize: 11, color: "#666", flex: 1, fontWeight: "600" },
  childPct: { fontSize: 12, fontWeight: "700", color: "#333" },
  gradePillSm: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  gradeTextSm: { fontSize: 11, fontWeight: "700" },

  termCompareRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  termChip: {
    flex: 1,
    minWidth: 100,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    backgroundColor: "#FAFBFF",
    alignItems: "center",
  },
  termChipLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  termChipPct: { fontSize: 18, fontWeight: "900", marginBottom: 4 },
  trendText: { fontSize: 12, fontStyle: "italic", marginTop: 8 },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E6F0",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0047AB",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  centered: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, color: "#0047AB", fontSize: 14 },
});

// ─── At a Glance styles ────────────────────────────────────────────────────────
const glanceStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4FF",
    gap: 10,
  },
  emoji: { fontSize: 22, width: 30, textAlign: "center" },
  subName: { fontSize: 13, fontWeight: "700", color: "#1A1A2E" },
  label: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  gradeVal: { fontSize: 14, fontWeight: "900" },
  pct: { fontSize: 15, fontWeight: "900", minWidth: 42, textAlign: "right" },
});

// ─── Improvement card styles ───────────────────────────────────────────────────
const improvStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4FF",
    gap: 10,
  },
  accent: { width: 4, height: 32, borderRadius: 2 },
  subName: { fontSize: 13, fontWeight: "700", color: "#1A1A2E" },
  diffLabel: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  arrow: { fontSize: 16, fontWeight: "900" },
  latestPct: {
    fontSize: 16,
    fontWeight: "900",
    minWidth: 42,
    textAlign: "right",
  },
});
