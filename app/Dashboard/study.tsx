// app/Dashboard/StudyMaterial.tsx
// Student Side — Study Material with Download & Local Storage

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  documentDirectory,
  makeDirectoryAsync,
  getInfoAsync,
  downloadAsync,
  deleteAsync,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";

const BASE_URL = "https://staging.schoolaid.in";
const DOWNLOADED_KEY = "downloaded_study_materials";

// ── Types ─────────────────────────────────
interface StudyMaterial {
  id: string;
  subject: string;
  chapter: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: "pdf" | "image" | "video" | "doc" | "other";
  uploadedAt: string;
}

interface DownloadedFile {
  id: string;
  localUri: string;
  downloadedAt: string;
  fileName: string;
}

// ── Helpers ───────────────────────────────
const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const fileIcon = (type?: string) => {
  switch (type) {
    case "pdf":   return "📄";
    case "image": return "🖼️";
    case "video": return "🎬";
    case "doc":   return "📝";
    default:      return "📎";
  }
};

const subjectColors: Record<string, string> = {
  Mathematics: "#4F46E5",
  Science:     "#059669",
  English:     "#DC2626",
  History:     "#D97706",
  Geography:   "#0891B2",
  Hindi:       "#7C3AED",
  EVS:         "#0D9488",
  default:     "#6366F1",
};

const getSubjectColor = (subject: string) =>
  subjectColors[subject] || subjectColors.default;

// ── Mock Data ─────────────────────────────
const MOCK_MATERIALS: StudyMaterial[] = [
  {
    id: "1", subject: "Mathematics", chapter: "Chapter 1 - Numbers",
    title: "Number System Notes",
    description: "Complete notes on number system including natural, whole, and integers.",
    fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf",
    fileName: "number_system.pdf", fileType: "pdf",
    uploadedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "2", subject: "Mathematics", chapter: "Chapter 2 - Shapes",
    title: "Basic Shapes Worksheet",
    description: "Practice worksheet for identifying 2D and 3D shapes.",
    fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf",
    fileName: "shapes_worksheet.pdf", fileType: "pdf",
    uploadedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "3", subject: "Science", chapter: "Chapter 1 - Plants",
    title: "Parts of a Plant",
    description: "Diagram and explanation of all parts of a plant.",
    fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf",
    fileName: "plants_diagram.pdf", fileType: "pdf",
    uploadedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "4", subject: "Science", chapter: "Chapter 2 - Animals",
    title: "Animal Kingdom Overview",
    description: "Classification of animals with examples.",
    fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf",
    fileName: "animals.pdf", fileType: "pdf",
    uploadedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: "5", subject: "English", chapter: "Chapter 1 - Grammar",
    title: "Nouns and Pronouns",
    description: "Types of nouns with exercises.",
    fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf",
    fileName: "nouns.pdf", fileType: "pdf",
    uploadedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "6", subject: "Hindi", chapter: "Chapter 1 - वर्णमाला",
    title: "Hindi Alphabet Chart",
    description: "स्वर और व्यंजन with pronunciation guide.",
    fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf",
    fileName: "varnamala.pdf", fileType: "pdf",
    uploadedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
  },
];

// ════════════════════════════════════════════
//  DROPDOWN
// ════════════════════════════════════════════
const Dropdown = ({
  label, value, options, onSelect, color,
}: {
  label: string; value: string; options: string[];
  onSelect: (v: string) => void; color: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[styles.dropdownTrigger, { borderColor: value !== "All" ? color : "#E5E7EB" }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.dropdownLabel}>{label}</Text>
          <Text style={[styles.dropdownValue, { color: value !== "All" ? color : "#374151" }]} numberOfLines={1}>
            {value}
          </Text>
        </View>
        <Text style={[styles.dropdownArrow, { color: value !== "All" ? color : "#9CA3AF" }]}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalOption, value === opt && { backgroundColor: `${color}12` }]}
                  onPress={() => { onSelect(opt); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, value === opt && { color, fontWeight: "800" }]}>{opt}</Text>
                  {value === opt && <Text style={{ color, fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ════════════════════════════════════════════
//  MATERIAL CARD
// ════════════════════════════════════════════
const MaterialCard = ({
  item, downloadedFiles, onDownload, onOpen, onDelete, downloading,
}: {
  item: StudyMaterial;
  downloadedFiles: Record<string, DownloadedFile>;
  onDownload: (item: StudyMaterial) => void;
  onOpen: (item: StudyMaterial) => void;
  onDelete: (item: StudyMaterial) => void;
  downloading: string | null;
}) => {
  const color = getSubjectColor(item.subject);
  const isDownloaded = !!downloadedFiles[item.id];
  const isDownloading = downloading === item.id;

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardContent}>

        <View style={styles.cardTopRow}>
          <View style={[styles.subjectPill, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.subjectPillText, { color }]}>{item.subject}</Text>
          </View>
          <View style={styles.cardTopRight}>
            {isDownloaded && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>✓ Saved</Text>
              </View>
            )}
            <Text style={styles.timeAgo}>{timeAgo(item.uploadedAt)}</Text>
          </View>
        </View>

        <Text style={styles.chapterTag}>📖 {item.chapter}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={styles.fileInfo}>
          <Text style={styles.fileIcon}>{fileIcon(item.fileType)}</Text>
          <Text style={styles.fileName} numberOfLines={1}>{item.fileName || "File"}</Text>
        </View>

        <View style={styles.actionRow}>
          {isDownloaded ? (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: color }]}
                onPress={() => onOpen(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>📂 Open</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => onDelete(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteBtnText}>🗑 Remove</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.downloadBtn, { borderColor: color }, isDownloading && styles.downloadingBtn]}
              onPress={() => onDownload(item)}
              activeOpacity={0.8}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={color} />
              ) : (
                <Text style={[styles.downloadBtnText, { color }]}>⬇ Download</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  );
};

// ════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════
export default function StudyMaterialScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [childName,    setChildName]    = useState<string>("Student");
  const [childClass,   setChildClass]   = useState<string>("");
  const [childSection, setChildSection] = useState<string>("");

  const [materials,       setMaterials]       = useState<StudyMaterial[]>([]);
  const [downloadedFiles, setDownloadedFiles] = useState<Record<string, DownloadedFile>>({});
  const [loading,         setLoading]         = useState<boolean>(true);
  const [refreshing,      setRefreshing]      = useState<boolean>(false);
  const [downloading,     setDownloading]     = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedChapter, setSelectedChapter] = useState<string>("All");
  const [activeTab,       setActiveTab]       = useState<"all" | "saved">("all");

  // ── Load child info ───────────────────────
  useEffect(() => {
    const load = async () => {
      const childStr = await AsyncStorage.getItem("selectedChild");
      if (childStr) {
        const child = JSON.parse(childStr);
        setChildName(child.name || "Student");
        setChildClass(child.classname || "");
        setChildSection(child.sectionname || "");
      }
    };
    load();
  }, []);

  // ── Load downloaded files ─────────────────
  useEffect(() => {
    const loadDownloaded = async () => {
      const raw = await AsyncStorage.getItem(DOWNLOADED_KEY);
      if (raw) setDownloadedFiles(JSON.parse(raw));
    };
    loadDownloaded();
  }, []);

  const saveDownloadedMap = async (map: Record<string, DownloadedFile>) => {
    await AsyncStorage.setItem(DOWNLOADED_KEY, JSON.stringify(map));
    setDownloadedFiles(map);
  };

  // ── Fetch materials ───────────────────────
  const fetchMaterials = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // ── Real API (uncomment when ready) ───
      // const token = await AsyncStorage.getItem("token");
      // const res = await fetch(
      //   `${BASE_URL}/api/study-material?class=${childClass}&section=${childSection}`,
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      // const data = await res.json();
      // if (data.success) setMaterials(data.data);

      // ── Mock ──────────────────────────────
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      setMaterials(MOCK_MATERIALS);
    } catch {
      if (!silent) Alert.alert("Error", "Could not load study material.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [childClass, childSection]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const onRefresh = () => { setRefreshing(true); fetchMaterials(); };

  // ── Download ──────────────────────────────
  const handleDownload = async (item: StudyMaterial) => {
    if (!item.fileUrl) {
      Alert.alert("Error", "No file URL available.");
      return;
    }

    if (!documentDirectory) {
      Alert.alert("Error", "Storage not available on this device.");
      return;
    }

    setDownloading(item.id);
    try {
      const dir = documentDirectory + "StudyMaterial/";
      const dirInfo = await getInfoAsync(dir);
      if (!dirInfo.exists) {
        await makeDirectoryAsync(dir, { intermediates: true });
      }

      const localUri = dir + item.fileName;
      const result = await downloadAsync(item.fileUrl, localUri);

      if (result.status === 200) {
        const newMap = {
          ...downloadedFiles,
          [item.id]: {
            id: item.id,
            localUri: result.uri,
            downloadedAt: new Date().toISOString(),
            fileName: item.fileName || "file",
          },
        };
        await saveDownloadedMap(newMap);
        Alert.alert("✅ Downloaded!", `"${item.title}" saved to your device.`);
      } else {
        Alert.alert("Failed", "Download failed. Try again.");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong while downloading.");
    } finally {
      setDownloading(null);
    }
  };

  // ── Open ──────────────────────────────────
  const handleOpen = async (item: StudyMaterial) => {
    const downloaded = downloadedFiles[item.id];
    if (!downloaded) return;

    const fileInfo = await getInfoAsync(downloaded.localUri);
    if (!fileInfo.exists) {
      const newMap = { ...downloadedFiles };
      delete newMap[item.id];
      await saveDownloadedMap(newMap);
      Alert.alert("File not found", "Please download again.");
      return;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(downloaded.localUri, {
        mimeType: item.fileType === "pdf" ? "application/pdf" : "*/*",
        dialogTitle: item.title,
      });
    } else {
      Alert.alert("Cannot open", "No app available to open this file.");
    }
  };

  // ── Delete ────────────────────────────────
  const handleDelete = (item: StudyMaterial) => {
    Alert.alert("Remove File", `Remove "${item.title}" from saved files?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          const downloaded = downloadedFiles[item.id];
          if (downloaded) {
            const fileInfo = await getInfoAsync(downloaded.localUri);
            if (fileInfo.exists) await deleteAsync(downloaded.localUri);
          }
          const newMap = { ...downloadedFiles };
          delete newMap[item.id];
          await saveDownloadedMap(newMap);
        },
      },
    ]);
  };

  // ── Logout ────────────────────────────────
  const handleLogout = () =>
    Alert.alert("Logout", "Do you really want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "selectedChild", "selectedYearId", "selectedYearLabel"]);
          router.replace("/login");
        },
      },
    ], { cancelable: true });

  // ── Filters ───────────────────────────────
  const subjects = ["All", ...Array.from(new Set(materials.map((m) => m.subject)))];
  const chapters = [
    "All",
    ...Array.from(new Set(
      materials
        .filter((m) => selectedSubject === "All" || m.subject === selectedSubject)
        .map((m) => m.chapter)
    )),
  ];

  const handleSubjectSelect = (s: string) => {
    setSelectedSubject(s);
    setSelectedChapter("All");
  };

  const baseFiltered = materials.filter((m) => {
    const subjectMatch = selectedSubject === "All" || m.subject === selectedSubject;
    const chapterMatch = selectedChapter === "All" || m.chapter === selectedChapter;
    return subjectMatch && chapterMatch;
  });

  const filtered = activeTab === "saved"
    ? baseFiltered.filter((m) => !!downloadedFiles[m.id])
    : baseFiltered;

  const savedCount = materials.filter((m) => !!downloadedFiles[m.id]).length;
  const activeColor = selectedSubject !== "All" ? getSubjectColor(selectedSubject) : "#4F46E5";

  // ── Render ────────────────────────────────
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
        <Text style={styles.childSubtitle}>
          {childClass ? `Class : ${childClass}` : ""}
          {childClass && childSection ? "  ·  " : ""}
          {childSection ? `Section : ${childSection}` : ""}
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

      {/* ══ PAGE TITLE ══ */}
      <View style={styles.pageTitleRow}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>📚 Study Material</Text>
        <Text style={styles.resultCount}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</Text>
      </View>

      {/* ══ TABS ══ */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && [styles.tabActive, { backgroundColor: theme.primary }]]}
          onPress={() => setActiveTab("all")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "saved" && [styles.tabActive, { backgroundColor: theme.primary }]]}
          onPress={() => setActiveTab("saved")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "saved" && styles.tabTextActive]}>
            📂 Saved {savedCount > 0 ? `(${savedCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ══ FILTERS ══ */}
      <View style={styles.filtersRow}>
        <View style={{ flex: 1 }}>
          <Dropdown label="Subject" value={selectedSubject} options={subjects} onSelect={handleSubjectSelect} color={activeColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Dropdown label="Chapter" value={selectedChapter} options={chapters} onSelect={setSelectedChapter} color={activeColor} />
        </View>
      </View>

      {/* ══ CONTENT ══ */}
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading material...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyEmoji}>{activeTab === "saved" ? "📂" : "📚"}</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === "saved" ? "No Saved Files" : "No Material Found"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "saved"
                  ? "Download files to access them offline anytime."
                  : "No material found for the selected filters."}
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <MaterialCard
                key={item.id}
                item={item}
                downloadedFiles={downloadedFiles}
                onDownload={handleDownload}
                onOpen={handleOpen}
                onDelete={handleDelete}
                downloading={downloading}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
headerTop: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, alignItems: "center" },
headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 },
backBtn: { width: 36, padding: 4 },
backArrow: { color: "#fff", fontSize: 24, fontWeight: "bold" },
headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
childSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", marginBottom: 16 },
actions: { flexDirection: "row", gap: 12 },
actionButton: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
actionText: { fontWeight: "700", fontSize: 14, color: "#0047AB" },

  // Page title
  pageTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  pageTitle: { fontSize: 20, fontWeight: "800" },
  resultCount: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },

  // Tabs
  tabsRow: { flexDirection: "row", marginHorizontal: 16, marginVertical: 10, backgroundColor: "#F3F4F6", borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#fff" },

  // Filters
  filtersRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 4 },
  dropdownTrigger: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" },
  dropdownLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  dropdownValue: { fontSize: 13, fontWeight: "700", marginTop: 1 },
  dropdownArrow: { fontSize: 18, marginLeft: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  modalClose: { fontSize: 18, color: "#6B7280", padding: 4 },
  modalOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  modalOptionText: { fontSize: 15, color: "#374151", fontWeight: "500" },

  // Card
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3, overflow: "hidden" },
  cardAccent: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  subjectPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  subjectPillText: { fontSize: 11, fontWeight: "700" },
  savedBadge: { backgroundColor: "#D1FAE5", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  savedBadgeText: { fontSize: 10, color: "#059669", fontWeight: "700" },
  timeAgo: { fontSize: 11, color: "#9CA3AF" },
  chapterTag: { fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: "500" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 4 },
  cardDesc: { fontSize: 12, color: "#6B7280", lineHeight: 18, marginBottom: 8 },
  fileInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, backgroundColor: "#F9FAFB", padding: 8, borderRadius: 8 },
  fileIcon: { fontSize: 16 },
  fileName: { fontSize: 12, color: "#374151", fontWeight: "500", flex: 1 },

  // Action buttons
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  deleteBtn: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  deleteBtnText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },
  downloadBtn: { borderWidth: 1.5, backgroundColor: "transparent" },
  downloadBtnText: { fontWeight: "700", fontSize: 13 },
  downloadingBtn: { opacity: 0.6 },

  // Loading / Empty
  loadingWrapper: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "500" },
  emptyWrapper: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },
});