import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system/legacy";


const BASE_URL = "https://connect.schoolaid.in";
const COMPLETED_KEY = "completedHomework";
const SUBMITTED_KEY = "submittedHomework";

// ── Types ──────────────────────────────────────────────
type NotificationType = "homework" | "comment";
type Priority = "overdue" | "urgent" | "soon" | "planned";
type TabType = "all" | "homework" | "comment" | "submitted";

interface Attachment {
  filename: string;
  url: string;
}
interface Notification {
  id: string;
  type: NotificationType;
  body: string;
  subject: string;
  dueDate?: string;
  attachment?: Attachment | null;
  createdAt: string;
  read: boolean;
}
interface SubmissionFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
  isImage: boolean;
}
interface SubmissionRecord {
  id: string | number;
  submission_text?: string;
  created_at?: string;
  createdAt?: string;
  status?: string;
  attachments?: {
    file_url?: string;
    url?: string;
    filename?: string;
    original_name?: string;
    name?: string;
    mime_type?: string;
  }[];
  [key: string]: any;
}

// ── Helpers ────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getDaysLeft = (dueDate?: string): number | null => {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
};

const getPriority = (d: number | null): Priority => {
  if (d === null) return "planned";
  if (d < 0) return "overdue";
  if (d <= 1) return "urgent";
  if (d <= 3) return "soon";
  return "planned";
};

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string; icon: string }
> = {
  overdue: { label: "Overdue", color: "#DC2626", bg: "#FEF2F2", icon: "🚨" },
  urgent: { label: "Urgent", color: "#EA580C", bg: "#FFF7ED", icon: "🔴" },
  soon: { label: "Due Soon", color: "#D97706", bg: "#FFFBEB", icon: "🟡" },
  planned: { label: "Planned", color: "#059669", bg: "#F0FDF4", icon: "🟢" },
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#4F46E5",
  Science: "#059669",
  English: "#DC2626",
  History: "#D97706",
  Geography: "#0891B2",
  Hindi: "#7C3AED",
  default: "#6366F1",
};

const getSubjectColor = (s: string) =>
  SUBJECT_COLORS[s] || SUBJECT_COLORS.default;

const formatFileSize = (b?: number) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const getFileUrl = (f: any): string => {
  const raw = f.file_url ?? f.url ?? "";
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  return `${BASE_URL}/${raw}`;
};

const isImageFile = (f: any): boolean => {
  const url = f.file_url ?? f.url ?? "";
  const mime = f.mime_type ?? f.type ?? "";
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || mime.startsWith("image/");
};

// ════════════════════════════════════════════════════════
//  IN-APP FILE VIEWER
// ════════════════════════════════════════════════════════
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const FileViewer = ({
  visible,
  url,
  filename,
  isImage,
  onClose,
}: {
  visible: boolean;
  url: string;
  filename: string;
  isImage: boolean;
  onClose: () => void;
}) => {
  const [status, setStatus] = useState<
    "idle" | "downloading" | "ready" | "error"
  >("idle");
  const [localUri, setLocalUri] = useState("");
  const [base64Data, setBase64] = useState("");
  const [progress, setProgress] = useState(0);
  const [webKey, setWebKey] = useState(0);
  const [blankCount, setBlankCount] = useState(0);

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf";

  useEffect(() => {
    if (!visible || !url) return;
    setStatus("idle");
    setLocalUri("");
    setBase64("");
    setProgress(0);
    setWebKey(0);
    setBlankCount(0);

    if (isPdf) {
      // PDFs: use Google Docs Viewer — no download needed
      setStatus("ready");
    } else {
      downloadFile();
    }
  }, [visible, url]);

  const downloadFile = async () => {
    try {
      setStatus("downloading");
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const baseDir = FileSystem.documentDirectory + "schoolaid_files/";
      const cacheKey = `${baseDir}schoolaid_${safeName}`;

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(baseDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
      }

      // Use cached file if already downloaded
      const fileInfo = await FileSystem.getInfoAsync(cacheKey);
      if (fileInfo.exists) {
        await loadFile(cacheKey);
        return;
      }

      const task = FileSystem.createDownloadResumable(
        url,
        cacheKey,
        {},
        (dp: any) => {
          if (dp.totalBytesExpectedToWrite > 0) {
            setProgress(dp.totalBytesWritten / dp.totalBytesExpectedToWrite);
          }
        },
      );

      const result = await task.downloadAsync();
      if (!result?.uri) throw new Error("Download failed");
      await loadFile(result.uri);
    } catch (err) {
      console.error("download error:", err);
      setStatus("error");
    }
  };

  const loadFile = async (fileUri: string) => {
    try {
      setLocalUri(fileUri);
      if (!isImage) {
        const b64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: "base64" as any,
        });
        setBase64(b64);
      }
      setStatus("ready");
    } catch (err) {
      console.error("load error:", err);
      setStatus("error");
    }
  };

  const getDocHtml = () => {
    const mimeMap: Record<string, string> = {
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
    const mime = mimeMap[ext] ?? "application/octet-stream";

    if (ext === "txt") {
      return `<!DOCTYPE html><html><head>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        </head><body style="margin:16px;font-family:monospace;font-size:14px;
        color:#222;white-space:pre-wrap;word-break:break-word;">
        <script>
          try { document.body.innerText = decodeURIComponent(escape(atob("${base64Data}"))); }
          catch(e) { document.body.innerText = "Could not decode file."; }
        <\/script></body></html>`;
    }

    return `<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1.0">
      <style>*{margin:0;padding:0;}html,body{width:100%;height:100%;background:#fff;}
      iframe{width:100%;height:100%;border:none;display:block;}</style></head>
      <body><iframe src="data:${mime};base64,${base64Data}"></iframe></body></html>`;
  };

  // Google Docs Viewer URL — most reliable PDF renderer on Android WebView
  const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}&t=${webKey}`;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={fvS.container}>
        {/* Header */}
        <View style={fvS.header}>
          <TouchableOpacity
            onPress={onClose}
            style={fvS.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={fvS.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={fvS.filename} numberOfLines={1}>
            {filename}
          </Text>
          {isPdf ? (
            <TouchableOpacity
              onPress={() => {
                setWebKey((k) => k + 1);
                setBlankCount(0);
              }}
              style={fvS.reloadBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={fvS.reloadIcon}>↺</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <View style={fvS.content}>
          {/* Downloading */}
          {status === "downloading" && (
            <View style={fvS.overlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={fvS.overlayText}>
                {progress > 0
                  ? `Downloading… ${Math.round(progress * 100)}%`
                  : "Downloading…"}
              </Text>
              {progress > 0 && (
                <View style={fvS.progressBar}>
                  <View
                    style={[
                      fvS.progressFill,
                      { width: `${Math.round(progress * 100)}%` as any },
                    ]}
                  />
                </View>
              )}
            </View>
          )}

          {/* Error */}
          {status === "error" && (
            <View style={fvS.overlay}>
              <Text style={{ fontSize: 48 }}>⚠️</Text>
              <Text style={[fvS.overlayText, { marginTop: 12 }]}>
                Could not open file
              </Text>
              <TouchableOpacity
                onPress={
                  isPdf
                    ? () => {
                        setWebKey((k) => k + 1);
                        setStatus("ready");
                      }
                    : downloadFile
                }
                style={fvS.retryBtn}
              >
                <Text style={fvS.retryTxt}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Image viewer */}
          {status === "ready" && isImage && (
            <ScrollView
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
              contentContainerStyle={fvS.imageScroll}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={{ uri: localUri }}
                style={fvS.fullImage}
                resizeMode="contain"
              />
            </ScrollView>
          )}

          {/* PDF via Google Docs Viewer */}
          {status === "ready" && isPdf && (
            <WebView
              key={`pdf-${webKey}`}
              source={{ uri: googleDocsUrl }}
              style={fvS.webview}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              scalesPageToFit
              mixedContentMode="always"
              renderLoading={() => (
                <View style={[fvS.overlay, { backgroundColor: "#fff" }]}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={[fvS.overlayText, { color: "#333" }]}>
                    Loading PDF…
                  </Text>
                  <Text
                    style={{ color: "#9CA3AF", fontSize: 11, marginTop: 4 }}
                  >
                    {blankCount > 0
                      ? `Retrying… (attempt ${blankCount + 1})`
                      : "This may take a few seconds"}
                  </Text>
                </View>
              )}
              // Auto-detect blank page and retry (Google Docs viewer quirk)
              injectedJavaScript={`
                (function() {
                  setTimeout(function() {
                    var b = document.body;
                    if (!b || b.innerHTML.trim() === '' || b.innerText.trim() === '') {
                      window.ReactNativeWebView.postMessage('BLANK');
                    }
                  }, 3500);
                })();
                true;
              `}
              onMessage={(e) => {
                if (e.nativeEvent.data === "BLANK" && blankCount < 4) {
                  setBlankCount((c) => c + 1);
                  setWebKey((k) => k + 1);
                }
              }}
              onError={() => setStatus("error")}
            />
          )}

          {/* Other docs via base64 */}
          {status === "ready" && !isImage && !isPdf && base64Data !== "" && (
            <WebView
              key="doc-viewer"
              source={{ html: getDocHtml() }}
              style={fvS.webview}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              allowFileAccess
              allowUniversalAccessFromFileURLs
              mixedContentMode="always"
              scalesPageToFit
              startInLoadingState
              renderLoading={() => (
                <View style={[fvS.overlay, { backgroundColor: "#fff" }]}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={[fvS.overlayText, { color: "#333" }]}>
                    Rendering…
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const fvS = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#111",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { color: "#fff", fontSize: 16, fontWeight: "700" },
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  reloadIcon: { color: "#fff", fontSize: 20, fontWeight: "700" },
  filename: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 8,
  },
  content: { flex: 1, backgroundColor: "#fff" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: 12,
  },
  overlayText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%" as any,
    backgroundColor: "#4F46E5",
    borderRadius: 3,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  imageScroll: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: SCREEN_H - 120,
  },
  fullImage: { width: SCREEN_W, height: SCREEN_H - 120 },
  webview: { flex: 1, backgroundColor: "#fff" },
});

// ════════════════════════════════════════════════════════
//  ATTACHMENT STRIP — horizontal scroll with previews
// ════════════════════════════════════════════════════════
const AttachmentStrip = ({
  attachments,
  onOpen,
}: {
  attachments: any[];
  onOpen: (url: string, filename: string, isImage: boolean) => void;
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <View style={attS.wrapper}>
      <Text style={attS.label}>📎 Attachments ({attachments.length})</Text>
      {/* FIX: nestedScrollEnabled + explicit height so horizontal scroll works inside vertical scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={attS.scrollContainer}
        contentContainerStyle={attS.scrollContent}
      >
        {attachments.map((f: any, fi: number) => {
          const url = getFileUrl(f);
          const fname =
            f.original_name ?? f.filename ?? f.name ?? `File ${fi + 1}`;
          const isImg = isImageFile(f);
          const ext = fname.split(".").pop()?.toUpperCase() ?? "FILE";

          return (
            <TouchableOpacity
              key={fi}
              onPress={() => url && onOpen(url, fname, isImg)}
              activeOpacity={0.8}
              style={attS.tile}
            >
              {isImg ? (
                <Image
                  source={{ uri: url }}
                  style={attS.tileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={attS.tileDoc}>
                  <Text style={attS.tileDocIcon}>
                    {ext === "PDF"
                      ? "📕"
                      : ext === "DOCX" || ext === "DOC"
                        ? "📘"
                        : ext === "XLSX" || ext === "XLS"
                          ? "📗"
                          : "📄"}
                  </Text>
                  <Text style={attS.tileExt}>{ext}</Text>
                </View>
              )}
              <Text style={attS.tileName} numberOfLines={2}>
                {fname}
              </Text>
              {isImg && (
                <View style={attS.imgBadge}>
                  <Text style={attS.imgBadgeTxt}>IMG</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const attS = StyleSheet.create({
  wrapper: { marginTop: 8, marginBottom: 4 },
  label: { fontSize: 11, fontWeight: "700", color: "#6B7280", marginBottom: 6 },
  // FIX: explicit height so Android measures the ScrollView correctly
  scrollContainer: { height: 130 },
  scrollContent: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 2,
    paddingVertical: 4,
    alignItems: "flex-start",
  },
  tile: { width: 90, alignItems: "center", position: "relative" },
  tileImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  tileDoc: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  tileDocIcon: { fontSize: 30 },
  tileExt: {
    fontSize: 9,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: 0.5,
  },
  tileName: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
    maxWidth: 90,
    lineHeight: 13,
  },
  imgBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  imgBadgeTxt: { fontSize: 8, color: "#fff", fontWeight: "900" },
});

// ════════════════════════════════════════════════════════
//  SUBMISSION HISTORY
// ════════════════════════════════════════════════════════
const SubmissionHistory = ({
  homeworkId,
  studentId,
  token,
  refreshTrigger,
}: {
  homeworkId: string;
  studentId: string;
  token: string;
  refreshTrigger: number;
}) => {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerFilename, setViewerFilename] = useState("");
  const [viewerIsImage, setViewerIsImage] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  const openFile = (url: string, filename: string, isImage: boolean) => {
    setViewerUrl(url);
    setViewerFilename(filename);
    setViewerIsImage(isImage);
    setViewerVisible(true);
  };

  const fetchSubmissions = useCallback(async () => {
    if (!studentId || !token || !homeworkId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/api/homework/my-submissions?student_id=${studentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-academic-year-id": await AsyncStorage.getItem("selectedYearId") || "16",
          },
        },
      );
      const data = await response.json();
      if (response.ok) {
        const all = data.submissions ?? [];
        const mine = all.filter(
          (s: any) => String(s.homework_id) === String(homeworkId),
        );
        setSubmissions(mine);
      } else {
        setSubmissions([]);
      }
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, token, homeworkId]);

  useEffect(() => {
    if (expanded) fetchSubmissions();
  }, [expanded, fetchSubmissions]);
  useEffect(() => {
    if (refreshTrigger > 0) fetchSubmissions();
  }, [refreshTrigger, fetchSubmissions]);

  return (
    <View style={hS.wrapper}>
      <FileViewer
        visible={viewerVisible}
        url={viewerUrl}
        filename={viewerFilename}
        isImage={viewerIsImage}
        onClose={() => setViewerVisible(false)}
      />

      <TouchableOpacity
        style={hS.toggleRow}
        onPress={() => setExpanded((p) => !p)}
        activeOpacity={0.8}
      >
        <View style={hS.toggleLeft}>
          <Text style={hS.toggleIcon}>📋</Text>
          <Text style={hS.toggleLabel}>
            My Submissions{" "}
            {submissions.length > 0 ? `(${submissions.length})` : ""}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#4F46E5" />
        ) : (
          <Text style={hS.toggleArrow}>{expanded ? "▲" : "▼"}</Text>
        )}
      </TouchableOpacity>

      {expanded &&
        !loading &&
        (submissions.length === 0 ? (
          <View style={hS.emptyRow}>
            <Text style={hS.emptyText}>📭 No submissions yet</Text>
          </View>
        ) : (
          submissions.map((sub, idx) => {
            const dateStr =
              sub.submitted_at ?? sub.created_at ?? sub.createdAt ?? "";
            const text = sub.submission_text ?? sub.text ?? sub.comment ?? "";
            const status = sub.status ?? "Submitted";
            const attachments = sub.attachments ?? [];
            const statusColor =
              status.toLowerCase() === "graded"
                ? "#059669"
                : status.toLowerCase() === "rejected"
                  ? "#DC2626"
                  : "#D97706";

            return (
              <View key={String(sub.id ?? idx)} style={hS.card}>
                <View style={hS.cardHeader}>
                  <Text style={hS.cardIndex}>#{idx + 1}</Text>
                  {!!dateStr && (
                    <Text style={hS.cardDate}>
                      🕐 {formatDate(dateStr)} · {timeAgo(dateStr)}
                    </Text>
                  )}
                  <View
                    style={[
                      hS.statusBadge,
                      { backgroundColor: `${statusColor}18` },
                    ]}
                  >
                    <Text style={[hS.statusText, { color: statusColor }]}>
                      {status}
                    </Text>
                  </View>
                </View>
                {!!text && <Text style={hS.subText}>{text}</Text>}
                {/* ✅ FIX: use AttachmentStrip for proper horizontal scroll */}
                <AttachmentStrip attachments={attachments} onOpen={openFile} />
              </View>
            );
          })
        ))}
    </View>
  );
};

const hS = StyleSheet.create({
  wrapper: { marginTop: 10 },
  emptyRow: { paddingVertical: 8 },
  emptyText: { fontSize: 12, color: "#9CA3AF", fontStyle: "italic" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleIcon: { fontSize: 14 },
  toggleLabel: { fontSize: 13, fontWeight: "700", color: "#4F46E5" },
  toggleArrow: { fontSize: 11, color: "#4F46E5", fontWeight: "700" },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  cardIndex: { fontSize: 11, fontWeight: "800", color: "#9CA3AF" },
  cardDate: { fontSize: 11, color: "#6B7280", flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  subText: { fontSize: 13, color: "#374151", lineHeight: 20, marginBottom: 8 },
});

// ════════════════════════════════════════════════════════
//  SUBMISSION MODAL
// ════════════════════════════════════════════════════════
const SubmissionModal = ({
  visible,
  onClose,
  item,
  studentId,
  token,
  primaryColor,
  onSubmitSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  item: Notification | null;
  studentId: string;
  token: string;
  primaryColor: string;
  onSubmitSuccess: (id: string) => void;
}) => {
  const [submissionText, setSubmissionText] = useState("");
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setSubmissionText("");
      setFiles([]);
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [visible]);

  const pickDocument = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (r.canceled) return;
      setFiles((p) => [
        ...p,
        ...r.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          type: a.mimeType ?? "application/octet-stream",
          size: a.size,
          isImage: false,
        })),
      ]);
    } catch {
      Alert.alert("Error", "Could not pick document.");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow photo library access.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (r.canceled) return;
    setFiles((p) => [
      ...p,
      ...r.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName ?? `photo_${Date.now()}.jpg`,
        type: a.mimeType ?? "image/jpeg",
        size: a.fileSize,
        isImage: true,
      })),
    ]);
  };

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow camera access.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (r.canceled) return;
    const a = r.assets[0];
    setFiles((p) => [
      ...p,
      {
        uri: a.uri,
        name: `camera_${Date.now()}.jpg`,
        type: a.mimeType ?? "image/jpeg",
        size: a.fileSize,
        isImage: true,
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!item || isSubmittingRef.current) return;
    if (!submissionText.trim() && files.length === 0) {
      Alert.alert(
        "Empty Submission",
        "Please add a comment or attach at least one file.",
      );
      return;
    }
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("homework_id", String(item.id));
      fd.append("student_id", String(studentId));
      fd.append("submission_text", submissionText.trim());
      files.forEach((f) =>
        fd.append("attachments", {
          uri: f.uri,
          name: f.name,
          type: f.type,
        } as any),
      );

      const res = await fetch(
        `${BASE_URL}/api/homework/submit?student_id=${studentId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` ,"x-academic-year-id" : await AsyncStorage.getItem("selectedYearId") || "8"},
          body: fd,
        },
      );
      const raw = await res.text();
      if (!res.ok) {
        let e: any = {};
        try {
          e = JSON.parse(raw);
        } catch {}
        throw new Error(e.message ?? e.error ?? `Server error: ${res.status}`);
      }
      onSubmitSuccess(item.id);
      onClose();
      Alert.alert("Success 🎉", "Homework submitted successfully!");
    } catch (err: any) {
      Alert.alert(
        "Submission Failed",
        err.message ?? "Could not submit homework.",
      );
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!item) return null;
  const color = getSubjectColor(item.subject);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={mS.overlay}
      >
        <TouchableOpacity
          style={mS.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={mS.label}>Add a Comment (optional)</Text>
            <TextInput
              style={mS.textInput}
              placeholder="Write your submission notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              value={submissionText}
              onChangeText={setSubmissionText}
              textAlignVertical="top"
            />
            <Text style={mS.label}>Attach Files</Text>
            <View style={mS.attachRow}>
              <TouchableOpacity
                style={[mS.attachOpt, { borderColor: "#4F46E5" }]}
                onPress={pickCamera}
                activeOpacity={0.8}
              >
                <Text style={mS.attachIcon}>📷</Text>
                <Text style={[mS.attachTxt, { color: "#4F46E5" }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mS.attachOpt, { borderColor: "#059669" }]}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Text style={mS.attachIcon}>🖼️</Text>
                <Text style={[mS.attachTxt, { color: "#059669" }]}>
                  Gallery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mS.attachOpt, { borderColor: "#D97706" }]}
                onPress={pickDocument}
                activeOpacity={0.8}
              >
                <Text style={mS.attachIcon}>📄</Text>
                <Text style={[mS.attachTxt, { color: "#D97706" }]}>Files</Text>
              </TouchableOpacity>
            </View>
            {files.length > 0 && (
              <View style={mS.fileList}>
                <Text style={mS.fileListHdr}>
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </Text>
                {files.map((f, i) => (
                  <View key={i} style={mS.fileItem}>
                    {f.isImage ? (
                      <Image
                        source={{ uri: f.uri }}
                        style={mS.fileThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={mS.fileIconBox}>
                        <Text style={mS.fileIcon}>📄</Text>
                      </View>
                    )}
                    <View style={mS.fileInfo}>
                      <Text style={mS.fileName} numberOfLines={1}>
                        {f.name}
                      </Text>
                      {f.size ? (
                        <Text style={mS.fileSize}>
                          {formatFileSize(f.size)}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        setFiles((p) => p.filter((_, j) => j !== i))
                      }
                      style={mS.fileRemove}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={mS.fileRemoveTxt}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[
                mS.submitBtn,
                { backgroundColor: submitting ? "#9CA3AF" : primaryColor },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={mS.submitTxt}>Submit Homework ✓</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const mS = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "92%",
  },
  handle: {
    width: 42,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 18,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  subject: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: { fontSize: 14, color: "#6B7280", fontWeight: "700" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#111827",
    minHeight: 110,
    backgroundColor: "#FAFAFA",
    marginBottom: 18,
  },
  attachRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  attachOpt: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  attachIcon: { fontSize: 22, marginBottom: 4 },
  attachTxt: { fontSize: 11, fontWeight: "800" },
  fileList: { marginBottom: 18 },
  fileListHdr: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  fileThumb: { width: 44, height: 44, borderRadius: 8 },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  fileIcon: { fontSize: 22 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: "600", color: "#111827" },
  fileSize: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  fileRemove: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  fileRemoveTxt: { fontSize: 11, color: "#DC2626", fontWeight: "800" },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitTxt: { fontSize: 15, fontWeight: "800", color: "#fff" },
});

// ════════════════════════════════════════════════════════
//  HOMEWORK CARD
// ════════════════════════════════════════════════════════
const HomeworkCard = ({
  item,
  onRead,
  isCompleted,
  onToggleComplete,
  showToggle,
  onSubmit,
  studentId,
  token,
}: {
  item: Notification;
  onRead: (id: string) => void;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  showToggle: boolean;
  onSubmit: (item: Notification) => void;
  studentId: string;
  token: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [submitRefresh, setSubmitRefresh] = useState(0);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerFilename, setViewerFilename] = useState("");
  const [viewerIsImage, setViewerIsImage] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  const openAttachment = (url: string, filename: string) => {
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}/${url}`;
    const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(fullUrl);
    setViewerUrl(fullUrl);
    setViewerFilename(filename);
    setViewerIsImage(isImg);
    setViewerVisible(true);
  };

  const checkAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const color = getSubjectColor(item.subject);
  const daysLeft = getDaysLeft(item.dueDate);
  const pConfig = PRIORITY_CONFIG[getPriority(daysLeft)];

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: isCompleted ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 6,
    }).start();
  }, [isCompleted]);

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.35, 1],
  });

  return (
    <TouchableOpacity
      onPress={() => {
        setExpanded((p) => !p);
        if (!item.read) onRead(item.id);
      }}
      activeOpacity={0.92}
      style={[
        s.card,
        !item.read && !isCompleted && s.cardUnread,
        isCompleted && s.cardCompleted,
      ]}
    >
      <FileViewer
        visible={viewerVisible}
        url={viewerUrl}
        filename={viewerFilename}
        isImage={viewerIsImage}
        onClose={() => setViewerVisible(false)}
      />
      <View
        style={[
          s.cardAccent,
          { backgroundColor: isCompleted ? "#A7F3D0" : color },
        ]}
      />
      <View style={s.cardContent}>
        <View style={s.cardTopRow}>
          <View style={[s.subjectPill, { backgroundColor: `${color}18` }]}>
            <Text style={[s.subjectPillText, { color }]}>
              📚 {item.subject}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[s.priorityBadge, { backgroundColor: pConfig.bg }]}>
              <Text style={[s.priorityText, { color: pConfig.color }]}>
                {pConfig.icon} {pConfig.label}
              </Text>
            </View>
            {!item.read && (
              <View style={[s.unreadDot, { backgroundColor: color }]} />
            )}
            <Text style={s.timeAgo}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>

        {showToggle && (
          <View style={s.titleRow}>
            <TouchableOpacity
              onPress={() => {
                if (item.type === "homework") onToggleComplete(item.id);
              }}
              activeOpacity={0.8}
              style={[s.checkBtn, isCompleted && s.checkBtnDone]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.Text
                style={[
                  s.checkIcon,
                  { transform: [{ scale: checkScale }] },
                  !isCompleted && s.checkIconEmpty,
                ]}
              >
                {isCompleted ? "✓" : ""}
              </Animated.Text>
            </TouchableOpacity>
          </View>
        )}

        {item.dueDate && (
          <View style={s.dueDateRow}>
            <Text style={s.dueDateText}>
              📅 Due: {formatDate(item.dueDate)}
            </Text>
            <Text style={[s.daysLeftText, { color: pConfig.color }]}>
              {daysLeft === null
                ? ""
                : daysLeft < 0
                  ? `${Math.abs(daysLeft)}d overdue`
                  : daysLeft === 0
                    ? "Due today!"
                    : `${daysLeft}d left`}
            </Text>
          </View>
        )}

        {expanded && (
          <View style={s.expandedSection}>
            <View style={s.divider} />
            {!!item.body && <Text style={s.homeworkBody}>{item.body}</Text>}
            {isCompleted && (
              <Text style={s.completedMsg}>✅ Marked as completed</Text>
            )}
            {item.attachment && (
              <TouchableOpacity
                style={s.attachmentBtn}
                onPress={() =>
                  openAttachment(
                    item.attachment!.url,
                    item.attachment!.filename,
                  )
                }
                activeOpacity={0.8}
              >
                <Text style={s.attachmentIcon}>📎</Text>
                <Text style={s.attachmentText} numberOfLines={1}>
                  {item.attachment.filename}
                </Text>
                <Text style={s.attachmentDownload}>Open ↗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                hwS.submitHwBtn,
                { borderColor: color, backgroundColor: `${color}10` },
              ]}
              onPress={() => {
                onSubmit(item);
                setTimeout(() => setSubmitRefresh((p) => p + 1), 3000);
              }}
              activeOpacity={0.8}
            >
              <Text style={hwS.submitHwIcon}>📤</Text>
              <Text style={[hwS.submitHwText, { color }]}>Submit Homework</Text>
            </TouchableOpacity>
            <SubmissionHistory
              homeworkId={item.id}
              studentId={studentId}
              token={token}
              refreshTrigger={submitRefresh}
            />
          </View>
        )}

        <View style={s.bottomRow}>
          <Text style={[s.expandHint, { color }]}>
            {expanded ? "▲ Show less" : "▼ Show more"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const hwS = StyleSheet.create({
  submitHwBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
    gap: 8,
  },
  submitHwIcon: { fontSize: 16 },
  submitHwText: { fontSize: 13, fontWeight: "800" },
});

// ════════════════════════════════════════════════════════
//  SUBMITTED CARD
// ════════════════════════════════════════════════════════
const SubmittedCard = ({
  item,
  studentId,
  token,
}: {
  item: Notification;
  studentId: string;
  token: string;
}) => {
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
        {!!item.dueDate && (
          <Text style={subS.dueText}>📅 Due: {formatDate(item.dueDate)}</Text>
        )}
        {!!item.body && (
          <Text style={subS.bodyText} numberOfLines={2}>
            {item.body}
          </Text>
        )}
        <SubmissionHistory
          homeworkId={item.id}
          studentId={studentId}
          token={token}
          refreshTrigger={0}
        />
      </View>
    </View>
  );
};

const subS = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#F9FFF9",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  accent: { width: 5 },
  body: { flex: 1, padding: 12 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillTxt: { fontSize: 11, fontWeight: "700" },
  doneBadge: {
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  doneTxt: { fontSize: 10, fontWeight: "800", color: "#059669" },
  dueText: { fontSize: 11, color: "#6B7280", marginBottom: 4 },
  bodyText: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
});

// ════════════════════════════════════════════════════════
//  COMMENT CARD
// ════════════════════════════════════════════════════════
const CommentCard = ({
  item,
  onRead,
}: {
  item: Notification;
  onRead: (id: string) => void;
}) => {
  const color = getSubjectColor(item.subject);
  return (
    <TouchableOpacity
      onPress={() => {
        if (!item.read) onRead(item.id);
      }}
      activeOpacity={0.92}
      style={[s.card, !item.read && s.cardUnread]}
    >
      <View style={[s.cardAccent, { backgroundColor: color }]} />
      <View style={s.cardContent}>
        <View style={s.cardTopRow}>
          <View style={[s.subjectPill, { backgroundColor: `${color}18` }]}>
            <Text style={[s.subjectPillText, { color }]}>
              💬 {item.subject}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {!item.read && (
              <View style={[s.unreadDot, { backgroundColor: color }]} />
            )}
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
//----------------- date filter ---------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DateFilterProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onClear: () => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
  from,
  to,
  onFromChange,
  onToChange,
  onClear,
}) => {
  const [pickerTarget, setPickerTarget] = useState<"from" | "to" | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (year: number, month: number) => 
    new Date(year, month + 1, 0).getDate();
  
  const getFirstDayOfMonth = (year: number, month: number) => 
    new Date(year, month, 1).getDay();

  const formatDateForDisplay = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = date.getDate();
    const month = MONTHS_SHORT[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const toDateStr = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const handleDayPress = (day: number) => {
    const selected = toDateStr(viewYear, viewMonth, day);
    
    if (pickerTarget === "from") {
      onFromChange(selected);
      // If "from" is selected and "to" is empty, auto-open "to" picker
      if (!to && selected) {
        setTimeout(() => {
          const base = to ? new Date(to) : new Date();
          setViewYear(base.getFullYear());
          setViewMonth(base.getMonth());
          setPickerTarget("to");
        }, 300);
      } else {
        setPickerTarget(null);
      }
    } else if (pickerTarget === "to") {
      // Ensure "to" date is not before "from" date
      if (from && selected < from) {
        onToChange(from);
      } else {
        onToChange(selected);
      }
      setPickerTarget(null);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const isSelectedDate = (day: number) => {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    return dateStr === from || dateStr === to;
  };

  const isInRange = (day: number) => {
    if (!from || !to) return false;
    const dateStr = toDateStr(viewYear, viewMonth, day);
    return dateStr > from && dateStr < to;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewMonth === today.getMonth() &&
      viewYear === today.getFullYear()
    );
  };

  const getDateRangeText = () => {
    if (from && to) {
      return `${formatDateForDisplay(from)} - ${formatDateForDisplay(to)}`;
    }
    if (from) return `From ${formatDateForDisplay(from)}`;
    if (to) return `Until ${formatDateForDisplay(to)}`;
    return "Select date range";
  };

  const openPicker = (target: "from" | "to") => {
    const dateToUse = target === "from" ? from : to;
    const baseDate = dateToUse ? new Date(dateToUse) : new Date();
    setViewYear(baseDate.getFullYear());
    setViewMonth(baseDate.getMonth());
    setPickerTarget(target);
  };

  const clearFilter = () => {
    onClear();
  };

  return (
    <View style={styles.container}>
      {/* Date Range Card */}
      <TouchableOpacity 
        style={styles.rangeCard} 
        onPress={() => openPicker("from")}
        activeOpacity={0.95}
      >
        <View style={styles.calendarIcon}>
          <Text style={styles.calendarIconText}>📅</Text>
        </View>
        
        <View style={styles.rangeTextContainer}>
          <Text style={styles.rangeLabel}>Date Range</Text>
          <Text style={[styles.rangeValue, (from || to) && styles.rangeValueActive]}>
            {getDateRangeText()}
          </Text>
        </View>
        
        {Boolean(from || to) &&(
          <TouchableOpacity onPress={clearFilter} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Quick Selection Chips */}
      <View style={styles.chipsContainer}>
        <TouchableOpacity 
          style={styles.chip}
          onPress={() => {
            const today = new Date();
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            onFromChange(weekAgo.toISOString().split("T")[0]);
            onToChange(today.toISOString().split("T")[0]);
          }}
        >
          <Text style={styles.chipText}>Last 7 days</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.chip}
          onPress={() => {
            const today = new Date();
            const monthAgo = new Date();
            monthAgo.setMonth(today.getMonth() - 1);
            onFromChange(monthAgo.toISOString().split("T")[0]);
            onToChange(today.toISOString().split("T")[0]);
          }}
        >
          <Text style={styles.chipText}>Last 30 days</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.chip}
          onPress={() => {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            onFromChange(firstDay.toISOString().split("T")[0]);
            onToChange(lastDay.toISOString().split("T")[0]);
          }}
        >
          <Text style={styles.chipText}>This Month</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setPickerTarget(null)}
          />
          
          <View style={styles.modalContent}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Text style={styles.modalHeaderIconText}>
                  {pickerTarget === "from" ? "📅" : "🎯"}
                </Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {pickerTarget === "from" ? "Select Start Date" : "Select End Date"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {pickerTarget === "from" 
                    ? "Choose when your submission period begins" 
                    : "Pick the final date of your period"}
                </Text>
              </View>
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
                <Text style={styles.navButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                <Text style={styles.navButtonText}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {DAYS.map(day => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: totalCells }).map((_, index) => {
                const day = index - firstDay + 1;
                const isValid = day >= 1 && day <= daysInMonth;
                const isSelected = isValid && isSelectedDate(day);
                const isInRangeDate = isValid && isInRange(day);
                const isTodayDate = isValid && isToday(day);
                const isStart = isValid && from === toDateStr(viewYear, viewMonth, day);
                const isEnd = isValid && to === toDateStr(viewYear, viewMonth, day);

                if (!isValid) {
                  return <View key={index} style={styles.emptyCell} />;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      isInRangeDate && styles.dayCellInRange,
                      isSelected && styles.dayCellSelected,
                      isStart && styles.dayCellStart,
                      isEnd && styles.dayCellEnd,
                      isTodayDate && !isSelected && styles.dayCellToday,
                    ]}
                    onPress={() => handleDayPress(day)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isInRangeDate && styles.dayTextInRange,
                        isTodayDate && !isSelected && styles.dayTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                    {isTodayDate && !isSelected && <View style={styles.todayDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Range Preview */}
            {Boolean(from || to) && (
            <View style={styles.rangePreview}>
                <View style={styles.rangePreviewItem}>
                  <Text style={styles.rangePreviewLabel}>From</Text>
                  <Text style={styles.rangePreviewValue}>
                    {from ? formatDateForDisplay(from) : "Not selected"}
                  </Text>
                </View>
                <View style={styles.rangePreviewArrow}>
                  <Text style={styles.rangePreviewArrowText}>→</Text>
                </View>
                <View style={styles.rangePreviewItem}>
                  <Text style={styles.rangePreviewLabel}>To</Text>
                  <Text style={styles.rangePreviewValue}>
                    {to ? formatDateForDisplay(to) : "Not selected"}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPickerTarget(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setPickerTarget(null)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
    marginBottom: 12,  
  },

  // Range Card
  rangeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },

    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 4,
    marginTop: 12,
  },
  calendarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  calendarIconText: {
    fontSize: 22,
  },
  rangeTextContainer: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  rangeValueActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
  },

  // Quick Chips
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: "90%",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  modalHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderIconText: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4F46E5",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: "#4F46E5",
    borderRadius: 24,
  },
  dayCellStart: {
    backgroundColor: "#4F46E5",
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  dayCellEnd: {
    backgroundColor: "#4F46E5",
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  dayCellInRange: {
    backgroundColor: "#EEF2FF",
    borderRadius: 0,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: "#4F46E5",
    backgroundColor: "#FFFFFF",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dayTextInRange: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  dayTextToday: {
    color: "#4F46E5",
    fontWeight: "800",
  },
  todayDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4F46E5",
  },
  rangePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  rangePreviewItem: {
    flex: 1,
  },
  rangePreviewLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rangePreviewValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  rangePreviewArrow: {
    width: 30,
    alignItems: "center",
  },
  rangePreviewArrowText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});




// ════════════════════════════════════════════════════════
//  EMPTY STATE
// ════════════════════════════════════════════════════════
const EmptyState = ({ tab }: { tab: TabType }) => {
  const config = {
    all: {
      emoji: "🎉",
      title: "You're all caught up!",
      sub: "Pull down to refresh and check for new updates.",
    },
    homework: {
      emoji: "📭",
      title: "No Homework Yet",
      sub: "Your teacher hasn't assigned any homework yet.",
    },
    comment: {
      emoji: "💭",
      title: "No Comments Yet",
      sub: "No teacher comments for you yet.",
    },
    submitted: {
      emoji: "📤",
      title: "No Submissions Yet",
      sub: "Homework you submit will appear here.",
    },
  };
  const c = config[tab];
  return (
    <View style={s.emptyWrapper}>
      <Text style={s.emptyEmoji}>{c.emoji}</Text>
      <Text style={s.emptyTitle}>{c.title}</Text>
      <Text style={s.emptySubtitle}>{c.sub}</Text>
    </View>
  );
};

// ════════════════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════════════════
export default function SchoolDiaryScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [childName, setChildName] = useState("Student");
  const [childClass, setChildClass] = useState("");
  const [childSection, setChildSection] = useState("");
  const [studentId, setStudentId] = useState("");
  const [token, setToken] = useState("");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedHwItem, setSelectedHwItem] = useState<Notification | null>(
    null,
  );
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  const homeworkItems = notifications.filter((n) => n.type === "homework");
  const activeHw = homeworkItems.filter((n) => !submittedIds.has(n.id));
  const submittedHw = homeworkItems.filter((n) => submittedIds.has(n.id));
  const unreadCount = notifications.filter((n) => !n.read).length;

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
      } catch (err) {
        console.error("Load error:", err);
      }
    };
    load();
  }, []);

  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!studentId || !token) return;
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/diary/student/${studentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-academic-year-id": await AsyncStorage.getItem("selectedYearId") || "",
          },
        });
        if (res.status === 401) {
          Alert.alert("Session Expired", "Please log in again.");
          await AsyncStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        const raw: any[] = data.success
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setNotifications((prev) => {
          const readIds = new Set(prev.filter((n) => n.read).map((n) => n.id));
          return raw.map((n: any) => ({
            id: String(n.id ?? n._id ?? Math.random()),
            type:
              n.type === "comment" ||
              (n.type === "" &&
                (n.comment != null || (!n.due_date && !n.dueDate)))
                ? "comment"
                : "homework",
            body: n.body ?? n.description ?? n.comment ?? "",
            subject: n.subject ?? n.subject_name ?? "General",
            dueDate: n.dueDate ?? n.due_date ?? null,
            attachment: n.attachment ?? null,
            createdAt: n.createdAt ?? n.created_at ?? new Date().toISOString(),
            read: readIds.has(String(n.id ?? n._id)),
          }));
        });
      } catch (err) {
        console.error("fetchNotifications error:", err);
        if (!silent) Alert.alert("Error", "Could not connect to server.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [studentId, token],
  );

  useEffect(() => {
    if (studentId && token) {
      fetchNotifications();
      const iv = setInterval(() => fetchNotifications(true), 30000);
      return () => clearInterval(iv);
    }
  }, [fetchNotifications, studentId, token]);

  const handleToggleComplete = useCallback(
    async (id: string) => {
      const item = notifications.find((n) => n.id === id);
      if (!item || item.type !== "homework") return;
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify([...next])).catch(
          console.error,
        );
        return next;
      });
    },
    [notifications],
  );

  const handleOpenSubmit = useCallback((item: Notification) => {
    setSelectedHwItem(item);
    setSubmitModalVisible(true);
  }, []);
  const handleSubmitSuccess = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify([...next])).catch(
        console.error,
      );
      return next;
    });
    setSubmittedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem(SUBMITTED_KEY, JSON.stringify([...next])).catch(
        console.error,
      );
      return next;
    });
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
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

  const markAsRead = (id: string) =>
    setNotifications((p) =>
      p.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  const markAllRead = () =>
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  
const filteredSubmitted = submittedHw.filter((n) => {
    const submittedAt = n.createdAt ? new Date(n.createdAt).getTime() : null;
    if (!submittedAt) return true;
    if (filterFrom && submittedAt < new Date(filterFrom).getTime()) return false;
    if (filterTo) {
      // include the full "To" day by setting time to end of day
      const toEnd = new Date(filterTo);
      toEnd.setHours(23, 59, 59, 999);
      if (submittedAt > toEnd.getTime()) return false;
    }
    return true;
  });

  const filtered =
    activeTab === "all"
      ? notifications.filter((n) => !submittedIds.has(n.id))
      : activeTab === "homework"
        ? activeHw
        : activeTab === "comment"
          ? notifications.filter((n) => n.type === "comment")
          : filteredSubmitted;

  const TABS: { key: TabType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "homework", label: "📚 Homework" },
    { key: "comment", label: "💬 Comments" },
    {
      key: "submitted",
      label: `✅ Submitted${submittedHw.length > 0 ? ` (${submittedHw.length})` : ""}`,
    },
  ];

return (
  <SafeAreaView
    style={[s.safe, { backgroundColor: theme.background }]}
    edges={["top"]}
  >
    {/* Header */}
    <View style={[s.headerTop, { backgroundColor: theme.primary }]}>
      <View style={s.headerTopRow}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>⬅</Text>
        </TouchableOpacity>
        <View style={s.avatarContainer}>
          <View
            style={[
              s.avatarCircle,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
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

    {/* Tabs */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.tabsRow}
      nestedScrollEnabled
      style={{ flexGrow: 0 }}
    >
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => setActiveTab(tab.key)}
          activeOpacity={0.8}
          style={[
            s.tab,
            activeTab === tab.key && [
              s.tabActive,
              { backgroundColor: theme.primary },
            ],
          ]}
        >
          <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>

    {loading ? (
      <View style={s.loadingWrapper}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[s.loadingText, { color: theme.text }]}>
          Loading diary...
        </Text>
      </View>
    ) : (
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifications();
            }}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <View style={{ paddingHorizontal: 16 }}>
          {/* ✅ DateFilter - ONLY shown on Submitted tab, INSIDE the ScrollView */}
          {activeTab === "submitted" && (
            <DateFilter
              from={filterFrom}
              to={filterTo}
              onFromChange={setFilterFrom}
              onToChange={setFilterTo}
              onClear={() => {
                setFilterFrom("");
                setFilterTo("");
              }}
            />
          )}

          {filtered.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : activeTab === "submitted" ? (
            filtered.map((item) => (
              <SubmittedCard
                key={item.id}
                item={item}
                studentId={studentId}
                token={token}
              />
            ))
          ) : (
            filtered.map((item) =>
              item.type === "homework" ? (
                <HomeworkCard
                  key={item.id}
                  item={item}
                  onRead={markAsRead}
                  isCompleted={completedIds.has(item.id)}
                  onToggleComplete={handleToggleComplete}
                  showToggle={activeTab === "homework"}
                  onSubmit={handleOpenSubmit}
                  studentId={studentId}
                  token={token}
                />
              ) : (
                <CommentCard key={item.id} item={item} onRead={markAsRead} />
              ),
            )
          )}
        </View>
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
  safe: { flex: 1 },
  headerTop: {
    paddingTop: 12,
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
    width: "100%",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  backArrow: { color: "#fff", fontSize: 22, fontWeight: "600" },
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
  avatarInitials: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerTextContainer: { alignItems: "flex-start" },
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
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  logoutIcon: { color: "#fff", fontSize: 20, fontWeight: "600" },
  tabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  tab: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    flexShrink: 0,
  },
  tabActive: { backgroundColor: "#4F46E5" },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  tabTextActive: { color: "#fff" },
  markAllBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  markAllText: { fontSize: 12, fontWeight: "700" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardUnread: { borderColor: "#E0E7FF", backgroundColor: "#FAFBFF" },
  cardCompleted: {
    backgroundColor: "#F9FFF9",
    borderColor: "#D1FAE5",
    opacity: 0.85,
  },
  cardAccent: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  subjectPillText: { fontSize: 11, fontWeight: "700" },
  priorityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontSize: 10, fontWeight: "800" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  timeAgo: { fontSize: 11, color: "#9CA3AF" },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    marginTop: 1,
    flexShrink: 0,
  },
  checkBtnDone: { backgroundColor: "#059669", borderColor: "#059669" },
  checkIcon: { fontSize: 15, fontWeight: "900", color: "#fff" },
  checkIconEmpty: { color: "transparent" },
  dueDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dueDateText: { fontSize: 12, color: "#6B7280" },
  daysLeftText: { fontSize: 12, fontWeight: "700" },
  expandedSection: { marginTop: 8 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginBottom: 10 },
  homeworkBody: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  completedMsg: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginTop: 6,
    fontStyle: "italic",
  },
  attachmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  attachmentIcon: { fontSize: 18 },
  attachmentText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  attachmentDownload: { fontSize: 12, color: "#4F46E5", fontWeight: "700" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  expandHint: { fontSize: 11, fontWeight: "700" },
  commentBubble: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#4F46E5",
  },
  teacherLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
  },
  commentText: { fontSize: 14, color: "#374151", lineHeight: 22 },
  emptyWrapper: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "600",
  },
});
