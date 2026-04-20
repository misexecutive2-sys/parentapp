import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Linking,
} from "react-native";
import { router } from "expo-router";

const API_URL = "https://staging.schoolaid.in";

// ── Placeholder data (replace with API response later) ──────────────
const SUBJECTS = [
  { id: "1", title: "Mathematics", icon: "📐" },
  { id: "2", title: "Science", icon: "🔬" },
  { id: "3", title: "English", icon: "📖" },
  { id: "4", title: "History", icon: "🏛️" },
  { id: "5", title: "Geography", icon: "🌍" },
];

const CHAPTERS: Record<string, { id: string; title: string }[]> = {
  "1": [
    { id: "c1", title: "Algebra" },
    { id: "c2", title: "Geometry" },
    { id: "c3", title: "Trigonometry" },
  ],
  "2": [
    { id: "c4", title: "Physics" },
    { id: "c5", title: "Chemistry" },
    { id: "c6", title: "Biology" },
  ],
  "3": [
    { id: "c7", title: "Grammar" },
    { id: "c8", title: "Literature" },
  ],
  "4": [
    { id: "c9", title: "Ancient History" },
    { id: "c10", title: "Modern History" },
  ],
  "5": [
    { id: "c11", title: "Physical Geography" },
    { id: "c12", title: "Human Geography" },
  ],
};

const MATERIALS: Record<string, { id: string; title: string; type: "pdf" | "video"; url: string }[]> = {
  c1: [
    { id: "m1", title: "Algebra Basics.pdf", type: "pdf", url: "https://example.com/algebra.pdf" },
    { id: "m2", title: "Algebra Introduction", type: "video", url: "https://example.com/algebra.mp4" },
  ],
  c2: [
    { id: "m3", title: "Geometry Notes.pdf", type: "pdf", url: "https://example.com/geometry.pdf" },
  ],
  c4: [
    { id: "m4", title: "Newton's Laws.pdf", type: "pdf", url: "https://example.com/newton.pdf" },
    { id: "m5", title: "Force & Motion Video", type: "video", url: "https://example.com/force.mp4" },
  ],
};
// ─────────────────────────────────────────────────────────────────────

export default function StudyScreen() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const handleSubjectSelect = (id: string) => {
    setSelectedSubject(id);
    setSelectedChapter(null); // reset chapter when subject changes
  };

  const materials = selectedChapter ? (MATERIALS[selectedChapter] ?? []) : [];

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/Dashboard")} activeOpacity={0.85}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study</Text>
        <Text style={styles.headerSubtitle}>Select a subject and chapter</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Subjects ── */}
        <Text style={styles.sectionLabel}>Subjects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
          {SUBJECTS.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={[styles.subjectChip, selectedSubject === sub.id && styles.subjectChipActive]}
              onPress={() => handleSubjectSelect(sub.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.subjectChipIcon}>{sub.icon}</Text>
              <Text style={[styles.subjectChipText, selectedSubject === sub.id && styles.subjectChipTextActive]}>
                {sub.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Chapters ── */}
        {selectedSubject && (
          <>
            <Text style={styles.sectionLabel}>Chapters</Text>
            <View style={styles.chapterGrid}>
              {CHAPTERS[selectedSubject]?.map((ch) => (
                <TouchableOpacity
                  key={ch.id}
                  style={[styles.chapterCard, selectedChapter === ch.id && styles.chapterCardActive]}
                  onPress={() => setSelectedChapter(ch.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.chapterIcon}>📄</Text>
                  <Text style={[styles.chapterText, selectedChapter === ch.id && styles.chapterTextActive]}>
                    {ch.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Materials ── */}
        {selectedChapter && (
          <>
            <Text style={styles.sectionLabel}>Study Materials</Text>
            {materials.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No materials available for this chapter yet.</Text>
              </View>
            ) : (
              materials.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.materialCard}
                  onPress={() => Linking.openURL(item.url)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.materialIcon}>{item.type === "pdf" ? "📕" : "🎬"}</Text>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialTitle}>{item.title}</Text>
                    <Text style={styles.materialType}>{item.type === "pdf" ? "PDF Document" : "Video"}</Text>
                  </View>
                  <Text style={styles.materialArrow}>↗</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // ── Header ──
  header: {
    backgroundColor: "#0047AB",
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    left: 18,
    top: 52,
    backgroundColor: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  backText: {
    color: "#0047AB",
    fontWeight: "700",
    fontSize: 13,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },

  // ── Body ──
  body: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0047AB",
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.3,
  },

  // ── Subjects ──
  subjectScroll: {
    marginBottom: 24,
  },
  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "#E0E6F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  subjectChipActive: {
    backgroundColor: "#0047AB",
    borderColor: "#0047AB",
  },
  subjectChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0047AB",
  },
  subjectChipTextActive: {
    color: "#ffffff",
  },

  // ── Chapters ──
  chapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  chapterCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E6F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  chapterCardActive: {
    backgroundColor: "#EEF3FF",
    borderColor: "#0047AB",
  },
  chapterIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  chapterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },
  chapterTextActive: {
    color: "#0047AB",
    fontWeight: "700",
  },

  // ── Materials ──
  materialCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  materialIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 3,
  },
  materialType: {
    fontSize: 12,
    color: "#888",
  },
  materialArrow: {
    fontSize: 18,
    color: "#0047AB",
    fontWeight: "700",
  },

  // ── Empty ──
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E6F0",
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },
});