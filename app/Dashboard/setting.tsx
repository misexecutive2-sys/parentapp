import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "../ThemeContext";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  // const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

  const handleChangePassword = () => {
    // TODO: navigate to change password screen
    router.push("/Dashboard/changepasword");
  };

  const handleTerms = () => {
    Alert.alert(
      "Terms & Conditions",
      `Usage of products, applications, and services offered by School Aid is governed by the following terms and conditions ("Terms of Use").

When YOU or any of YOUR customers, associates, employees, colleagues, partners or any individual/third party authorized by YOU (collectively referred as "YOU"), use any of the products, applications or services, YOU will be subjected to the terms and conditions applicable to such products, applications or services and the associated number of licenses of such products, applications or services purchased by YOU, and they shall be deemed to be incorporated into this Terms of Use. School Aid reserves the right, at its sole discretion, to change, modify, add or remove portions of these Terms of Use, at any time. It is YOUR responsibility to check these Terms of Use periodically for changes. YOUR continued use of our products, applications, and services through any channel (website, mobile or any other channel) following the posting of changes will mean that YOU accept and agree to the changes.


Accessing, Browsing or Otherwise using School Aid products, applications and services implies that YOU have read this agreement carefully and that YOU agree to the Terms and Conditions outlined below

These Terms and Conditions will be applicable to YOU when YOU either procure the products, applications, and services from School Aid or intend to procure the products, applications and services offered by School Aid or browse through or use the publicly available resources of School Aid or related to School Aid.`,
      [{ text: "OK" }]
    );
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
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your preferences</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── ACCOUNT SECTION ── */}
        <Text style={[styles.sectionLabel, { color: theme.primary }]}>Account</Text>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleChangePassword}
            activeOpacity={0.8}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🔒</Text>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Change Password</Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── PREFERENCES SECTION ── */}
        {/* <Text style={[styles.sectionLabel, { color: theme.primary }]}>Preferences</Text> */}

        {/* <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🔔</Text>
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Notifications</Text>
                <Text style={styles.rowSubtitle}>
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => {
                setNotificationsEnabled(val);
                // TODO: save to AsyncStorage or API
                // AsyncStorage.setItem("notificationsEnabled", String(val));
              }}
              trackColor={{ false: "#E0E6F0", true: theme.primary }}
              thumbColor="#fff"
            />
          </View>
        </View> */}

        {/* ── LEGAL SECTION ── */}
        <Text style={[styles.sectionLabel, { color: theme.primary }]}>Legal</Text>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleTerms}
            activeOpacity={0.8}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>📄</Text>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Terms & Conditions</Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── LOGOUT ── */}
        <Text style={[styles.sectionLabel, { color: theme.primary }]}>Account Actions</Text>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🚪</Text>
              <Text style={[styles.rowTitle, { color: "#dc2626" }]}>Logout</Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App version */}
        <Text style={styles.version}>SchoolAid v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
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

  // Sections
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E6F0",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: { fontSize: 20 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSubtitle: { fontSize: 12, color: "#888", marginTop: 2 },
  rowArrow: { fontSize: 22, color: "#888" },

  // Version
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#aaa",
    marginTop: 32,
  },
});