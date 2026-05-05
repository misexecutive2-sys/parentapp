import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  RefreshControl, StyleSheet, Animated, ActivityIndicator,
  Linking, Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform, Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const BASE_URL     = "https://connect.schoolaid.in";
const COMPLETED_KEY  = "completedHomework";
const SUBMITTED_KEY  = "submittedHomework";

// ── Types ──────────────────────────────────────────────
type NotificationType = "homework" | "comment";
type Priority         = "overdue" | "urgent" | "soon" | "planned";

interface Attachment     { filename: string; url: string; }
interface Notification   {
  id: string; type: NotificationType; body: string; subject: string;
  dueDate?: string; attachment?: Attachment | null; createdAt: string; read: boolean;
}
interface SubmissionFile {
  uri: string; name: string; type: string; size?: number; isImage: boolean;
}
interface SubmissionRecord {
  id: string | number; submission_text?: string; created_at?: string;
  createdAt?: string; status?: string;
  attachments?: { url: string; filename?: string; name?: string }[];
  [key: string]: any;
}

// ── Helpers ────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getDaysLeft = (dueDate?: string): number | null => {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
};

const getPriority = (d: number | null): Priority => {
  if (d === null) return "planned";
  if (d < 0)  return "overdue";
  if (d <= 1) return "urgent";
  if (d <= 3) return "soon";
  return "planned";
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: string }> = {
  overdue: { label: "Overdue",  color: "#DC2626", bg: "#FEF2F2", icon: "🚨" },
  urgent:  { label: "Urgent",   color: "#EA580C", bg: "#FFF7ED", icon: "🔴" },
  soon:    { label: "Due Soon", color: "#D97706", bg: "#FFFBEB", icon: "🟡" },
  planned: { label: "Planned",  color: "#059669", bg: "#F0FDF4", icon: "🟢" },
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#4F46E5", Science: "#059669", English: "#DC2626",
  History: "#D97706", Geography: "#0891B2", Hindi: "#7C3AED", default: "#6366F1",
};

const getSubjectColor = (s: string) => SUBJECT_COLORS[s] || SUBJECT_COLORS.default;

const formatFileSize = (b?: number) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

// ════════════════════════════════════════════════════════
//  SUBMISSION HISTORY
// ════════════════════════════════════════════════════════
const SubmissionHistory = ({
  homeworkId, studentId, token, refreshTrigger,
}: {
  homeworkId: string; studentId: string; token: string; refreshTrigger: number;
}) => {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [expanded,    setExpanded]    = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!studentId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/homework/my-submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: Number(studentId) }),
      });
      if (!res.ok) { 
        // console.log("Submissions fetch failed:", res.status); 
        return; 
      }
      const data = await res.json();
      console.log("📋 Raw submissions:", JSON.stringify(data));
      const all: SubmissionRecord[] = data.data ?? data ?? [];
      const mine = all.filter((s) => String(s.homework_id) === String(homeworkId));
      console.log(`📋 For homework ${homeworkId}:`, mine.length);
      setSubmissions(mine);
    } catch (err) {
      console.log("Submission history error:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId, token, homeworkId]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions, refreshTrigger]);

  if (loading) return (
    <View style={hS.loadingRow}>
      <ActivityIndicator size="small" color="#4F46E5" />
      <Text style={hS.loadingText}>Loading submissions...</Text>
    </View>
  );

  return (
    <View style={hS.wrapper}>
      <TouchableOpacity style={hS.toggleRow} onPress={() => setExpanded((p) => !p)} activeOpacity={0.8}>
        <View style={hS.toggleLeft}>
          <Text style={hS.toggleIcon}>📋</Text>
          <Text style={hS.toggleLabel}>
            My Submissions {submissions.length > 0 ? `(${submissions.length})` : ""}
          </Text>
        </View>
        <Text style={hS.toggleArrow}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded && (
        submissions.length === 0 ? (
          <View style={hS.emptyRow}>
            <Text style={hS.emptyText}>📭 No submissions yet</Text>
          </View>
        ) : (
          submissions.map((sub, idx) => {
            const dateStr     = sub.created_at ?? sub.createdAt ?? "";
            const text        = sub.submission_text ?? sub.text ?? sub.comment ?? "";
            const status      = sub.status ?? "Submitted";
            const files: any[] = sub.attachments ?? [];
            const statusColor =
              status.toLowerCase() === "graded"   ? "#059669" :
              status.toLowerCase() === "rejected"  ? "#DC2626" : "#D97706";

            return (
              <View key={String(sub.id ?? idx)} style={hS.card}>
                <View style={hS.cardHeader}>
                  <Text style={hS.cardIndex}>#{idx + 1}</Text>
                  {!!dateStr && (
                    <Text style={hS.cardDate}>🕐 {formatDate(dateStr)} · {timeAgo(dateStr)}</Text>
                  )}
                  <View style={[hS.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                    <Text style={[hS.statusText, { color: statusColor }]}>{status}</Text>
                  </View>
                </View>

                {!!text && <Text style={hS.subText}>{text}</Text>}

                {files.length > 0 && (
                  <View style={hS.filesRow}>
                    {files.map((f, fi) => (
                      <TouchableOpacity
                        key={fi} style={hS.fileChip}
                        onPress={() => { const u = f.url ?? f.file_url ?? ""; if (u) Linking.openURL(u); }}
                        activeOpacity={0.8}
                      >
                        <Text style={hS.fileChipIcon}>📎</Text>
                        <Text style={hS.fileChipName} numberOfLines={1}>
                          {f.filename ?? f.name ?? `File ${fi + 1}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {Object.entries(sub)
                  .filter(([k]) => !["id","homework_id","student_id","submission_text",
                    "text","comment","created_at","createdAt","status","attachments","updated_at"].includes(k))
                  .filter(([, v]) => v !== null && v !== undefined && v !== "")
                  .map(([k, v]) => (
                    <Text key={k} style={hS.extraField}>
                      <Text style={hS.extraKey}>{k.replace(/_/g, " ")}: </Text>
                      {String(v)}
                    </Text>
                  ))}
              </View>
            );
          })
        )
      )}
    </View>
  );
};

const hS = StyleSheet.create({
  wrapper:     { marginTop: 10 },
  loadingRow:  { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 12, color: "#6B7280" },
  emptyRow:    { paddingVertical: 8 },
  emptyText:   { fontSize: 12, color: "#9CA3AF", fontStyle: "italic" },
  toggleRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EEF2FF", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6 },
  toggleLeft:  { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleIcon:  { fontSize: 14 },
  toggleLabel: { fontSize: 13, fontWeight: "700", color: "#4F46E5" },
  toggleArrow: { fontSize: 11, color: "#4F46E5", fontWeight: "700" },
  card:        { backgroundColor: "#F9FAFB", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  cardHeader:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" },
  cardIndex:   { fontSize: 11, fontWeight: "800", color: "#9CA3AF" },
  cardDate:    { fontSize: 11, color: "#6B7280", flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 10, fontWeight: "800" },
  subText:     { fontSize: 13, color: "#374151", lineHeight: 20, marginBottom: 8 },
  filesRow:    { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  fileChip:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  fileChipIcon:{ fontSize: 12 },
  fileChipName:{ fontSize: 11, color: "#4F46E5", fontWeight: "600", maxWidth: 140 },
  extraField:  { fontSize: 11, color: "#6B7280", marginTop: 2 },
  extraKey:    { fontWeight: "700" },
});

// ════════════════════════════════════════════════════════
//  SUBMISSION MODAL
// ════════════════════════════════════════════════════════
const SubmissionModal = ({
  visible, onClose, item, studentId, token, primaryColor, onSubmitSuccess,
}: {
  visible: boolean; onClose: () => void; item: Notification | null;
  studentId: string; token: string; primaryColor: string;
  onSubmitSuccess: (id: string) => void;
}) => {
  const [submissionText, setSubmissionText] = useState("");
  const [files,          setFiles]          = useState<SubmissionFile[]>([]);
  const [submitting,     setSubmitting]     = useState(false);

  useEffect(() => {
    if (visible) { setSubmissionText(""); setFiles([]); setSubmitting(false); }
  }, [visible]);

  const pickDocument = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: "*/*", multiple: true, copyToCacheDirectory: true });
      if (r.canceled) return;
      setFiles((p) => [...p, ...r.assets.map((a) => ({
        uri: a.uri, name: a.name, type: a.mimeType ?? "application/octet-stream", size: a.size, isImage: false,
      }))]);
    } catch { Alert.alert("Error", "Could not pick document."); }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission Required", "Please allow photo library access."); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
    if (r.canceled) return;
    setFiles((p) => [...p, ...r.assets.map((a) => ({
      uri: a.uri, name: a.fileName ?? `photo_${Date.now()}.jpg`,
      type: a.mimeType ?? "image/jpeg", size: a.fileSize, isImage: true,
    }))]);
  };

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission Required", "Please allow camera access."); return; }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (r.canceled) return;
    const a = r.assets[0];
    setFiles((p) => [...p, { uri: a.uri, name: `camera_${Date.now()}.jpg`, type: a.mimeType ?? "image/jpeg", size: a.fileSize, isImage: true }]);
  };

  const handleSubmit = async () => {
    if (!item) return;
    if (!submissionText.trim() && files.length === 0) {
      Alert.alert("Empty Submission", "Please add a comment or attach at least one file."); return;
    }
    setSubmitting(true);
    try {
      let body: FormData | string;
      let headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      if (files.length > 0) {
        const fd = new FormData();
        fd.append("homework_id",     item.id);
        fd.append("student_id",      studentId);
        fd.append("submission_text", submissionText.trim());
        files.forEach((f) => fd.append("attachments", { uri: f.uri, name: f.name, type: f.type } as any));
        body = fd;
        console.log("📤 FormData:", { homework_id: item.id, student_id: studentId, files: files.map((f) => f.name) });
      } else {
        const j = { homework_id: Number(item.id), student_id: Number(studentId), submission_text: submissionText.trim(), attachments: "null" };
        body = JSON.stringify(j);
        headers["Content-Type"] = "application/json";
        console.log("📤 JSON:", j);
      }

      const res = await fetch(`${BASE_URL}/api/homework/submit`, { method: "POST", headers, body });
      const raw = await res.text();
      console.log("📥 Status:", res.status, "Body:", raw);

      if (!res.ok) {
        let e: any = {};
        try { e = JSON.parse(raw); } catch {}
        throw new Error(e.message ?? e.error ?? `Server error: ${res.status}`);
      }

      onSubmitSuccess(item.id);
      onClose();
      Alert.alert("Success 🎉", "Homework submitted successfully!");
    } catch (err: any) {
      console.log("💥 Error:", err.message);
      Alert.alert("Submission Failed", err.message ?? "Could not submit homework.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;
  const color = getSubjectColor(item.subject);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={mS.overlay}>
        <TouchableOpacity style={mS.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={mS.sheet}>
          <View style={mS.handle} />
          <View style={[mS.header, { borderLeftColor: color }]}>
            <View style={{ flex: 1 }}>
              <Text style={mS.title}>Submit Homework</Text>
              <Text style={[mS.subject, { color }]}>📚 {item.subject}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={mS.closeBtn}>
              <Text style={mS.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={mS.label}>Add a Comment (optional)</Text>
            <TextInput
              style={mS.textInput} placeholder="Write your submission notes..." placeholderTextColor="#9CA3AF"
              multiline numberOfLines={5} value={submissionText} onChangeText={setSubmissionText} textAlignVertical="top"
            />

            <Text style={mS.label}>Attach Files</Text>
            <View style={mS.attachRow}>
              <TouchableOpacity style={[mS.attachOpt, { borderColor: "#4F46E5" }]} onPress={pickCamera} activeOpacity={0.8}>
                <Text style={mS.attachIcon}>📷</Text>
                <Text style={[mS.attachTxt, { color: "#4F46E5" }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[mS.attachOpt, { borderColor: "#059669" }]} onPress={pickImage} activeOpacity={0.8}>
                <Text style={mS.attachIcon}>🖼️</Text>
                <Text style={[mS.attachTxt, { color: "#059669" }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[mS.attachOpt, { borderColor: "#D97706" }]} onPress={pickDocument} activeOpacity={0.8}>
                <Text style={mS.attachIcon}>📄</Text>
                <Text style={[mS.attachTxt, { color: "#D97706" }]}>Files</Text>
              </TouchableOpacity>
            </View>

            {files.length > 0 && (
              <View style={mS.fileList}>
                <Text style={mS.fileListHdr}>{files.length} file{files.length > 1 ? "s" : ""} selected</Text>
                {files.map((f, i) => (
                  <View key={i} style={mS.fileItem}>
                    {f.isImage
                      ? <Image source={{ uri: f.uri }} style={mS.fileThumb} resizeMode="cover" />
                      : <View style={mS.fileIconBox}><Text style={mS.fileIcon}>📄</Text></View>
                    }
                    <View style={mS.fileInfo}>
                      <Text style={mS.fileName} numberOfLines={1}>{f.name}</Text>
                      {f.size ? <Text style={mS.fileSize}>{formatFileSize(f.size)}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => setFiles((p) => p.filter((_, j) => j !== i))} style={mS.fileRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={mS.fileRemoveTxt}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[mS.submitBtn, { backgroundColor: submitting ? "#9CA3AF" : primaryColor }]}
              onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={mS.submitTxt}>Submit Homework ✓</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const mS = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: "flex-end" },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet:       { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: "92%" },
  handle:      { width: 42, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header:      { flexDirection: "row", alignItems: "flex-start", borderLeftWidth: 4, paddingLeft: 12, marginBottom: 18 },
  title:       { fontSize: 18, fontWeight: "800", color: "#111827" },
  subject:     { fontSize: 13, fontWeight: "700", marginTop: 2 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  closeTxt:    { fontSize: 14, color: "#6B7280", fontWeight: "700" },
  label:       { fontSize: 12, fontWeight: "700", color: "#6B7280", marginBottom: 8, marginTop: 4, letterSpacing: 0.5 },
  textInput:   { borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, fontSize: 14, color: "#111827", minHeight: 110, backgroundColor: "#FAFAFA", marginBottom: 18 },
  attachRow:   { flexDirection: "row", gap: 10, marginBottom: 16 },
  attachOpt:   { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "#FAFAFA" },
  attachIcon:  { fontSize: 22, marginBottom: 4 },
  attachTxt:   { fontSize: 11, fontWeight: "800" },
  fileList:    { marginBottom: 18 },
  fileListHdr: { fontSize: 12, fontWeight: "700", color: "#6B7280", marginBottom: 8 },
  fileItem:    { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: "#E5E7EB", gap: 10 },
  fileThumb:   { width: 44, height: 44, borderRadius: 8 },
  fileIconBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  fileIcon:    { fontSize: 22 },
  fileInfo:    { flex: 1 },
  fileName:    { fontSize: 13, fontWeight: "600", color: "#111827" },
  fileSize:    { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  fileRemove:  { width: 26, height: 26, borderRadius: 13, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  fileRemoveTxt:{ fontSize: 11, color: "#DC2626", fontWeight: "800" },
  submitBtn:   { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  submitTxt:   { fontSize: 15, fontWeight: "800", color: "#fff" },
});

// ════════════════════════════════════════════════════════
//  PROGRESS SUMMARY
// ════════════════════════════════════════════════════════
const ProgressSummary = ({ total, completed, overdue, primaryColor }: {
  total: number; completed: number; overdue: number; primaryColor: string;
}) => {
  const progress  = total > 0 ? completed / total : 0;
  const animWidth = useRef(new Animated.Value(0)).current;
  const pct       = Math.round(progress * 100);

  useEffect(() => {
    Animated.timing(animWidth, { toValue: progress, duration: 900, useNativeDriver: false }).start();
  }, [progress]);

  const msg =
    total === 0        ? { text: "No homework assigned 🎉",        color: "#059669" } :
    pct === 100        ? { text: "All done! Great work! 🏆",       color: "#059669" } :
    pct >= 70          ? { text: "Almost there, keep going! 💪",   color: "#D97706" } :
    pct >= 30          ? { text: "Good progress, stay focused 📖", color: primaryColor } :
                         { text: "Let's get started! 🚀",           color: "#DC2626" };

  // return (
  //   <View style={pS.card}>
  //     {/* <View style={pS.topRow}>
  //       <View style={{ flex: 1 }}>
  //         <Text style={pS.title}>HOMEWORK PROGRESS</Text>
  //         <Text style={[pS.message, { color: msg.color }]}>{msg.text}</Text>
  //       </View>
  //       <View style={[pS.circle, { borderColor: primaryColor }]}>
  //         <Text style={[pS.pct, { color: primaryColor }]}>{pct}%</Text>
  //       </View>
  //     </View> */}
  //     {/* <View style={pS.barBg}>
  //       <Animated.View style={[pS.barFill, { backgroundColor: primaryColor, width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
  //     </View> */}
  //     {/* <View style={pS.statsRow}>
  //       {[
  //         { val: total,           color: "#111827", label: "Total"   },
  //         { val: completed,       color: "#059669", label: "Done"    },
  //         { val: total-completed, color: "#6B7280", label: "Pending" },
  //         { val: overdue,         color: "#DC2626", label: "Overdue" },
  //       ].map((s, i, arr) => (
  //         <React.Fragment key={s.label}>
  //           <View style={pS.statItem}>
  //             <Text style={[pS.statVal, { color: s.color }]}>{s.val}</Text>
  //             <Text style={pS.statLabel}>{s.label}</Text>
  //           </View>
  //           {i < arr.length - 1 && <View style={pS.divider} />}
  //         </React.Fragment>
  //       ))}
  //     </View> */}
  //   </View>
  // );
};

const pS = StyleSheet.create({
  card:     { marginHorizontal: 16, marginBottom: 12, backgroundColor: "#fff", borderRadius: 18, padding: 18, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: "#F0F4FF" },
  topRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title:    { fontSize: 11, fontWeight: "800", color: "#9CA3AF", marginBottom: 4, letterSpacing: 1 },
  message:  { fontSize: 15, fontWeight: "800" },
  circle:   { width: 54, height: 54, borderRadius: 27, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFF" },
  pct:      { fontSize: 14, fontWeight: "900" },
  barBg:    { height: 8, backgroundColor: "#F3F4F6", borderRadius: 99, overflow: "hidden", marginBottom: 16 },
  barFill:  { height: "100%", borderRadius: 99 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statVal:  { fontSize: 18, fontWeight: "800" },
  statLabel:{ fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  divider:  { width: 1, height: 30, backgroundColor: "#F3F4F6" },
});

// ════════════════════════════════════════════════════════
//  HOMEWORK CARD (active)
// ════════════════════════════════════════════════════════
const HomeworkCard = ({
  item, onRead, isCompleted, onToggleComplete,
  showToggle, onSubmit, studentId, token,
}: {
  item: Notification; onRead: (id: string) => void; isCompleted: boolean;
  onToggleComplete: (id: string) => void; showToggle: boolean;
  onSubmit: (item: Notification) => void; studentId: string; token: string;
}) => {
  const [expanded,      setExpanded]      = useState(false);
  const [submitRefresh, setSubmitRefresh] = useState(0);
  const checkAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const color     = getSubjectColor(item.subject);
  const daysLeft  = getDaysLeft(item.dueDate);
  const pConfig   = PRIORITY_CONFIG[getPriority(daysLeft)];

  useEffect(() => {
    Animated.spring(checkAnim, { toValue: isCompleted ? 1 : 0, useNativeDriver: true, tension: 80, friction: 6 }).start();
  }, [isCompleted]);

  const checkScale = checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.35, 1] });

  return (
    <TouchableOpacity
      onPress={() => { setExpanded((p) => !p); if (!item.read) onRead(item.id); }}
      activeOpacity={0.92}
      style={[s.card, !item.read && !isCompleted && s.cardUnread, isCompleted && s.cardCompleted]}
    >
      <View style={[s.cardAccent, { backgroundColor: isCompleted ? "#A7F3D0" : color }]} />
      <View style={s.cardContent}>

        {/* Top row */}
        <View style={s.cardTopRow}>
          <View style={[s.subjectPill, { backgroundColor: `${color}18` }]}>
            <Text style={[s.subjectPillText, { color }]}>📚 {item.subject}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[s.priorityBadge, { backgroundColor: pConfig.bg }]}>
              <Text style={[s.priorityText, { color: pConfig.color }]}>{pConfig.icon} {pConfig.label}</Text>
            </View>
            {!item.read && <View style={[s.unreadDot, { backgroundColor: color }]} />}
            <Text style={s.timeAgo}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>

        {/* Toggle checkbox */}
        {showToggle && (
          <View style={s.titleRow}>
            <TouchableOpacity
              onPress={() => { if (item.type === "homework") onToggleComplete(item.id); }}
              activeOpacity={0.8}
              style={[s.checkBtn, isCompleted && s.checkBtnDone]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.Text style={[s.checkIcon, { transform: [{ scale: checkScale }] }, !isCompleted && s.checkIconEmpty]}>
                {isCompleted ? "✓" : ""}
              </Animated.Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Due date */}
        {item.dueDate && (
          <View style={s.dueDateRow}>
            <Text style={s.dueDateText}>📅 Due: {formatDate(item.dueDate)}</Text>
            <Text style={[s.daysLeftText, { color: pConfig.color }]}>
              {daysLeft === null ? "" : daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today!" : `${daysLeft}d left`}
            </Text>
          </View>
        )}

        {/* Expanded section */}
        {expanded && (
          <View style={s.expandedSection}>
            <View style={s.divider} />
            {!!item.body && <Text style={s.homeworkBody}>{item.body}</Text>}
            {isCompleted && <Text style={s.completedMsg}>✅ Marked as completed</Text>}
            {item.attachment && (
              <TouchableOpacity style={s.attachmentBtn} onPress={() => Linking.openURL(item.attachment!.url)} activeOpacity={0.8}>
                <Text style={s.attachmentIcon}>📎</Text>
                <Text style={s.attachmentText} numberOfLines={1}>{item.attachment.filename}</Text>
                <Text style={s.attachmentDownload}>Download</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[hwS.submitHwBtn, { borderColor: color, backgroundColor: `${color}10` }]}
              onPress={() => { onSubmit(item); setTimeout(() => setSubmitRefresh((p) => p + 1), 3000); }}
              activeOpacity={0.8}
            >
              <Text style={hwS.submitHwIcon}>📤</Text>
              <Text style={[hwS.submitHwText, { color }]}>Submit Homework</Text>
            </TouchableOpacity>
            <SubmissionHistory homeworkId={item.id} studentId={studentId} token={token} refreshTrigger={submitRefresh} />
          </View>
        )}

        <View style={s.bottomRow}>
          <Text style={[s.expandHint, { color }]}>{expanded ? "▲ Show less" : "▼ Show more"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const hwS = StyleSheet.create({
  submitHwBtn:  { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginTop: 10, gap: 8 },
  submitHwIcon: { fontSize: 16 },
  submitHwText: { fontSize: 13, fontWeight: "800" },
});

// ════════════════════════════════════════════════════════
//  SUBMITTED HOMEWORK CARD (read-only)
// ════════════════════════════════════════════════════════
const SubmittedCard = ({ item, studentId, token }: { item: Notification; studentId: string; token: string }) => {
  const color = getSubjectColor(item.subject);
  return (
    <View style={subS.card}>
      <View style={[subS.accent, { backgroundColor: color }]} />
      <View style={subS.body}>
        <View style={subS.topRow}>
          <View style={[subS.pill, { backgroundColor: `${color}18` }]}>
            <Text style={[subS.pillTxt, { color }]}>📚 {item.subject}</Text>
          </View>
          <View style={subS.doneBadge}>
            <Text style={subS.doneTxt}>✅ Submitted</Text>
          </View>
        </View>
        {!!item.dueDate && <Text style={subS.dueText}>📅 Due: {formatDate(item.dueDate)}</Text>}
        {!!item.body && <Text style={subS.bodyText} numberOfLines={2}>{item.body}</Text>}
        <SubmissionHistory homeworkId={item.id} studentId={studentId} token={token} refreshTrigger={0} />
      </View>
    </View>
  );
};

const subS = StyleSheet.create({
  card:     { flexDirection: "row", backgroundColor: "#F9FFF9", borderRadius: 14, marginBottom: 10, overflow: "hidden", borderWidth: 1, borderColor: "#D1FAE5" },
  accent:   { width: 5 },
  body:     { flex: 1, padding: 12 },
  topRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  pill:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillTxt:  { fontSize: 11, fontWeight: "700" },
  doneBadge:{ backgroundColor: "#D1FAE5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  doneTxt:  { fontSize: 10, fontWeight: "800", color: "#059669" },
  dueText:  { fontSize: 11, color: "#6B7280", marginBottom: 4 },
  bodyText: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
});

// ════════════════════════════════════════════════════════
//  COMMENT CARD
// ════════════════════════════════════════════════════════
const CommentCard = ({ item, onRead }: { item: Notification; onRead: (id: string) => void }) => {
  const color = getSubjectColor(item.subject);
  return (
    <TouchableOpacity onPress={() => { if (!item.read) onRead(item.id); }} activeOpacity={0.92} style={[s.card, !item.read && s.cardUnread]}>
      <View style={[s.cardAccent, { backgroundColor: color }]} />
      <View style={s.cardContent}>
        <View style={s.cardTopRow}>
          <View style={[s.subjectPill, { backgroundColor: `${color}18` }]}>
            <Text style={[s.subjectPillText, { color }]}>💬 {item.subject}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {!item.read && <View style={[s.unreadDot, { backgroundColor: color }]} />}
            <Text style={s.timeAgo}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <View style={s.commentBubble}>
          <Text style={s.teacherLabel}>🧑‍🏫 Teacher's Comment</Text>
          <Text style={s.commentText}>{item.body}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ════════════════════════════════════════════════════════
//  EMPTY STATE
// ════════════════════════════════════════════════════════
const EmptyState = ({ tab }: { tab: "homework" | "comment" | "all" }) => (
  <View style={s.emptyWrapper}>
    <Text style={s.emptyEmoji}>{tab === "homework" ? "📭" : tab === "comment" ? "💭" : "🎉"}</Text>
    <Text style={s.emptyTitle}>{tab === "homework" ? "No Homework Yet" : tab === "comment" ? "No Comments Yet" : "You're all caught up!"}</Text>
    <Text style={s.emptySubtitle}>
      {tab === "homework" ? "Your teacher hasn't assigned any homework yet."
        : tab === "comment" ? "No teacher comments for you yet."
        : "Pull down to refresh and check for new updates."}
    </Text>
  </View>
);

// ════════════════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════════════════
export default function SchoolDiaryScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [childName,    setChildName]    = useState("Student");
  const [childClass,   setChildClass]   = useState("");
  const [childSection, setChildSection] = useState("");
  const [studentId,    setStudentId]    = useState("");
  const [token,        setToken]        = useState("");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [completedIds,  setCompletedIds]  = useState<Set<string>>(new Set());
  const [submittedIds,  setSubmittedIds]  = useState<Set<string>>(new Set());
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [activeTab,     setActiveTab]     = useState<"all" | "homework" | "comment">("all");
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedHwItem,     setSelectedHwItem]     = useState<Notification | null>(null);

  const homeworkItems = notifications.filter((n) => n.type === "homework");
  const totalHw       = homeworkItems.length;
  const activeHw      = homeworkItems.filter((n) => !submittedIds.has(n.id));
  const submittedHw   = homeworkItems.filter((n) => submittedIds.has(n.id));
  const completedHw   = homeworkItems.filter((n) => completedIds.has(n.id)).length;
  const overdueHw     = homeworkItems.filter((n) => { const d = getDaysLeft(n.dueDate); return d !== null && d < 0 && !completedIds.has(n.id); }).length;
  const unreadCount   = notifications.filter((n) => !n.read).length;
  const cmnCount      = notifications.filter((n) => n.type === "comment").length;

  // Load from storage
  useEffect(() => {
    const load = async () => {
      try {
        const t = await AsyncStorage.getItem("token");
        if (t) setToken(t);
        const childStr = await AsyncStorage.getItem("selectedChild");
        if (childStr) {
          const c = JSON.parse(childStr);
          setChildName(c.name ?? "Student");
          setChildClass(c.classname ?? "");
          setChildSection(c.sectionname ?? "");
          setStudentId(c.id?.toString() ?? "");
        }
        const comp = await AsyncStorage.getItem(COMPLETED_KEY);
        if (comp) setCompletedIds(new Set(JSON.parse(comp)));
        const subm = await AsyncStorage.getItem(SUBMITTED_KEY);
        if (subm) setSubmittedIds(new Set(JSON.parse(subm)));
      } catch (err) { console.error("Load error:", err); }
    };
    load();
  }, []);

  const handleToggleComplete = useCallback(async (id: string) => {
    const item = notifications.find((n) => n.id === id);
    if (!item || item.type !== "homework") return;
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify([...next])).catch(console.error);
      return next;
    });
  }, [notifications]);

  const handleOpenSubmit = useCallback((item: Notification) => {
    setSelectedHwItem(item);
    setSubmitModalVisible(true);
  }, []);

  // On success → mark completed + submitted → disappears from active list
  const handleSubmitSuccess = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify([...next])).catch(console.error);
      return next;
    });
    setSubmittedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem(SUBMITTED_KEY, JSON.stringify([...next])).catch(console.error);
      return next;
    });
  }, []);
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () =>
    Alert.alert("Logout", "Do you really want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: async () => {
        await AsyncStorage.multiRemove(["token", "selectedChild", "selectedYearId", "selectedYearLabel"]);
        router.replace("/login");
      }},
    ], { cancelable: true });

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!studentId || !token) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/diary/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.status === 401) {
        Alert.alert("Session Expired", "Please log in again.");
        await AsyncStorage.removeItem("token");
        router.replace("/login"); return;
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const raw: any[] = data.success ? data.data : Array.isArray(data) ? data : [];
      setNotifications((prev) => {
        const readIds = new Set(prev.filter((n) => n.read).map((n) => n.id));
        return raw.map((n: any) => ({
          id:         String(n.id ?? n._id ?? Math.random()),
          type:       (n.type === "comment" || (n.type === "" && (n.comment != null || (!n.due_date && !n.dueDate)))) ? "comment" : "homework",
          body:       n.body ?? n.description ?? n.comment ?? "",
          subject:    n.subject ?? n.subject_name ?? "General",
          dueDate:    n.dueDate ?? n.due_date ?? null,
          attachment: n.attachment ?? null,
          createdAt:  n.createdAt ?? n.created_at ?? new Date().toISOString(),
          read:       readIds.has(String(n.id ?? n._id)),
        }));
      });
    } catch (err) {
      console.error("fetchNotifications error:", err);
      if (!silent) Alert.alert("Error", "Could not connect to server.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [studentId, token]);

  useEffect(() => {
    if (studentId && token) {
      fetchNotifications();
      const iv = setInterval(() => fetchNotifications(true), 30000);
      return () => clearInterval(iv);
    }
  }, [fetchNotifications, studentId, token]);

  const markAsRead  = (id: string) => setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));

  // Active items (not submitted)
  const filtered =
    activeTab === "all"      ? notifications.filter((n) => !submittedIds.has(n.id)) :
    activeTab === "homework" ? activeHw :
                               notifications.filter((n) => n.type === "comment");

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={[s.headerTop, { backgroundColor: theme.primary }]}>
        <View style={s.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          
          {/* Avatar Circle with Initials */}
          <View style={s.avatarContainer}>
            <View style={[s.avatarCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={s.avatarInitials}>{getInitials(childName)}</Text>
            </View>
            <View style={s.headerTextContainer}>
              <Text style={s.headerTitle}>{childName}</Text>
              <View style={s.classBadge}>
                <Text style={s.classBadgeText}>
                  {childClass} {childSection && `· ${childSection}`}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutIcon}>↪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { num: totalHw,     color: "#4F46E5", border: "#4F46E520", label: "Homework"  },
          { num: cmnCount,    color: "#059669", border: "#05966920", label: "Comments"  },
          { num: unreadCount, color: "#DC2626", border: "#DC262620", label: "Unread"    },
        ].map((st) => (
          <View key={st.label} style={[s.statCard, { borderColor: st.border }]}>
            <Text style={[s.statNum, { color: st.color }]}>{st.num}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {(["all", "homework", "comment"] as const).map((tab) => (
          <TouchableOpacity
            key={tab} onPress={() => setActiveTab(tab)} activeOpacity={0.8}
            style={[s.tab, activeTab === tab && [s.tabActive, { backgroundColor: theme.primary }]]}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === "all" ? "All" : tab === "homework" ? "📚 Homework" : "💬 Comment"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {unreadCount > 0 && (
        <TouchableOpacity onPress={markAllRead} style={s.markAllBtn} activeOpacity={0.7}>
          <Text style={[s.markAllText, { color: theme.primary }]}>✓ Mark all as read</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={s.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[s.loadingText, { color: theme.text }]}>Loading diary...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={[theme.primary]} tintColor={theme.primary} />}
        >
          {/* {(activeTab === "all" || activeTab === "homework") && totalHw > 0 && (
            <ProgressSummary total={totalHw} completed={completedHw} overdue={overdueHw} primaryColor={theme.primary} />
          )} */}

          {/* Active homework & comments */}
          <View style={{ paddingHorizontal: 16 }}>
            {filtered.length === 0 && submittedHw.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              filtered.map((item) =>
                item.type === "homework" ? (
                  <HomeworkCard
                    key={item.id} item={item} onRead={markAsRead}
                    isCompleted={completedIds.has(item.id)}
                    onToggleComplete={handleToggleComplete}
                    showToggle={activeTab === "homework"}
                    onSubmit={handleOpenSubmit}
                    studentId={studentId} token={token}
                  />
                ) : (
                  <CommentCard key={item.id} item={item} onRead={markAsRead} />
                )
              )
            )}
          </View>

          {/* Submitted homework section */}
          {(activeTab === "all" || activeTab === "homework") && submittedHw.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
              <View style={s.submittedHeader}>
                <Text style={s.submittedTitle}>✅ Submitted Homework</Text>
                <View style={s.submittedBadge}>
                  <Text style={s.submittedBadgeTxt}>{submittedHw.length}</Text>
                </View>
              </View>
              {submittedHw.map((item) => (
                <SubmittedCard key={item.id} item={item} studentId={studentId} token={token} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <SubmissionModal
        visible={submitModalVisible}
        onClose={() => setSubmitModalVisible(false)}
        item={selectedHwItem}
        studentId={studentId}
        token={token}
        primaryColor={theme.primary}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe:          { flex: 1 },
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

  statsRow:  { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  statCard:  { flex: 1, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statNum:   { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 2, fontWeight: "600" },

  tabsRow:       { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  tab:           { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center", backgroundColor: "#F3F4F6" },
  tabActive:     { elevation: 3, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6 },
  tabText:       { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  tabTextActive: { color: "#fff" },

  markAllBtn:  { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 6 },
  markAllText: { fontSize: 12, fontWeight: "700" },

  card:          { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: "#F0F0F0" },
  cardUnread:    { borderColor: "#E0E7FF", backgroundColor: "#FAFBFF" },
  cardCompleted: { backgroundColor: "#F9FFF9", borderColor: "#D1FAE5", opacity: 0.85 },
  cardAccent:    { width: 5 },
  cardContent:   { flex: 1, padding: 14 },
  cardTopRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },

  subjectPill:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  subjectPillText: { fontSize: 11, fontWeight: "700" },
  priorityBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText:    { fontSize: 10, fontWeight: "800" },
  unreadDot:       { width: 8, height: 8, borderRadius: 4 },
  timeAgo:         { fontSize: 11, color: "#9CA3AF" },

  titleRow:        { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  checkBtn:        { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB", marginTop: 1, flexShrink: 0 },
  checkBtnDone:    { backgroundColor: "#059669", borderColor: "#059669" },
  checkIcon:       { fontSize: 15, fontWeight: "900", color: "#fff" },
  checkIconEmpty:  { color: "transparent" },

  dueDateRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  dueDateText: { fontSize: 12, color: "#6B7280" },
  daysLeftText:{ fontSize: 12, fontWeight: "700" },

  expandedSection: { marginTop: 8 },
  divider:         { height: 1, backgroundColor: "#F3F4F6", marginBottom: 10 },
  homeworkBody:    { fontSize: 14, color: "#374151", lineHeight: 22, marginBottom: 12 },
  completedMsg:    { fontSize: 12, color: "#059669", fontWeight: "600", marginTop: 6, fontStyle: "italic" },

  attachmentBtn:      { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  attachmentIcon:     { fontSize: 18 },
  attachmentText:     { flex: 1, fontSize: 13, color: "#374151", fontWeight: "600" },
  attachmentDownload: { fontSize: 12, color: "#4F46E5", fontWeight: "700" },

  bottomRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  expandHint: { fontSize: 11, fontWeight: "700" },

  commentBubble: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginTop: 4, borderLeftWidth: 3, borderLeftColor: "#4F46E5" },
  teacherLabel:  { fontSize: 11, fontWeight: "700", color: "#6B7280", marginBottom: 6 },
  commentText:   { fontSize: 14, color: "#374151", lineHeight: 22 },

  submittedHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 4 },
  submittedTitle:    { fontSize: 13, fontWeight: "800", color: "#059669" },
  submittedBadge:    { backgroundColor: "#059669", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  submittedBadgeTxt: { fontSize: 12, fontWeight: "800", color: "#fff" },

  emptyWrapper:  { alignItems: "center", paddingTop: 80 },
  emptyEmoji:    { fontSize: 64, marginBottom: 16 },
  emptyTitle:    { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 32, lineHeight: 22 },

  loadingWrapper: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:    { fontSize: 14, fontWeight: "600" },
});


