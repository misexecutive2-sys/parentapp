// app/Dashboard/changepassword.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";

const BASE_URL = "http://YOUR_SERVER_IP:5000"; // ← change this

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword]         = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showCurrent, setShowCurrent]         = useState<boolean>(false);
  const [showNew, setShowNew]                 = useState<boolean>(false);
  const [showConfirm, setShowConfirm]         = useState<boolean>(false);
  const [loading, setLoading]                 = useState<boolean>(false);

  const handleChangePassword = async (): Promise<void> => {
    // ── Validations ──────────────────────────
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Error", "Please fill in all fields.");
    }
    if (newPassword.length < 8) {
      return Alert.alert("Error", "New password must be at least 8 characters.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "New password and confirm password do not match.");
    }
    if (currentPassword === newPassword) {
      return Alert.alert("Error", "New password must be different from current password.");
    }

    // ── Call API ─────────────────────────────
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/settings/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        Alert.alert("Success ✅", "Your password has been changed successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Failed", data.message || "Something went wrong.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>

      {/* ══ HEADER ══ */}
      <View style={[styles.headerTop, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.logoWrapper}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} />
        </View>
        <Text style={styles.headerTitle}>Change Password</Text>
        <Text style={styles.headerSubtitle}>Keep your account secure</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── FORM SECTION ── */}
        <Text style={[styles.sectionLabel, { color: theme.primary }]}>Update Password</Text>

        <View style={styles.section}>

          {/* Current Password */}
          <View style={styles.inputRow}>
            <Text style={styles.rowIcon}>🔑</Text>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: theme.primary }]}>Current Password</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter current password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showCurrent ? "👁" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* New Password */}
          <View style={styles.inputRow}>
            <Text style={styles.rowIcon}>🔒</Text>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: theme.primary }]}>New Password</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Min. 8 characters"
                placeholderTextColor="#aaa"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showNew ? "👁" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Confirm Password */}
          <View style={styles.inputRow}>
            <Text style={styles.rowIcon}>✅</Text>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: theme.primary }]}>Confirm New Password</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Re-enter new password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showConfirm ? "👁" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* ── PASSWORD RULES ── */}
        {/* <Text style={[styles.sectionLabel, { color: theme.primary }]}>Password Rules</Text>
        <View style={styles.section}>
          {[
            "At least 8 characters long",
            "Must be different from current password",
            "New password and confirm must match",
          ].map((rule, i, arr) => (
            <View
              key={i}
              style={[styles.ruleRow, i === arr.length - 1 && styles.lastRow]}
            >
              <Text style={styles.ruleDot}>•</Text>
              <Text style={[styles.ruleText, { color: theme.text }]}>{rule}</Text>
            </View>
          ))}
        </View> */}

        {/* ── SUBMIT BUTTON ── */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: theme.primary },
            loading && styles.submitBtnDisabled,
          ]}
          onPress={handleChangePassword}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Update Password</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header — exact same as SettingsScreen
  headerTop: {
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  backBtn: { position: "absolute", top: 52, left: 16, zIndex: 10, padding: 4 },
  backArrow: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  logoWrapper: { marginBottom: 14 },
  logo: { width: 84, height: 84, resizeMode: "contain", borderRadius: 18, backgroundColor: "#fff" },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  headerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center" },

  // Section labels — exact same as SettingsScreen
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 6,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    overflow: "hidden",
  },

  // Input rows
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { fontSize: 20 },
  inputWrapper: { flex: 1 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: { fontSize: 15, fontWeight: "500", paddingVertical: 2 },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },
  divider: { height: 0.5, backgroundColor: "#E0E6F0", marginLeft: 52 },

  // Password rules
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E6F0",
    gap: 10,
  },
  lastRow: { borderBottomWidth: 0 },
  ruleDot: { fontSize: 18, color: "#aaa" },
  ruleText: { fontSize: 13, fontWeight: "500" },

  // Submit button
  submitBtn: {
    marginHorizontal: 16,
    marginTop: 28,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});