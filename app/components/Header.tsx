// app/components/Header.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Header({
  title,
  showBack = false,
  childName = "Diya Sen",
  childId = "2",
}: {
  title: string;
  showBack?: boolean;
  childName?: string;
  childId?: string;
}) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {/* Back arrow if needed */}
      {showBack && (
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      )}

      {/* Logo */}
      <Image source={require("../../assets/logo.png")} style={styles.logo} />

      {/* Title */}
      <Text style={styles.headerTitle}>{title}</Text>

      {/* Welcome + Child Info */}
      <Text style={styles.welcomeText}>Welcome, {childName}</Text>
      <Text style={styles.childInfo}>Viewing dashboard for Child ID: {childId}</Text>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Switch Child</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0047AB",
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backArrow: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  logo: { width: 60, height: 60, resizeMode: "contain", marginBottom: 8 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 8 },
  welcomeText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  childInfo: { color: "#fff", fontSize: 14, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 12 },
  actionButton: {
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: { color: "#0047AB", fontWeight: "700" },
});
