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

const BASE_URL = "https://connect.schoolaid.in"; // ← change this

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  

  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword]         = useState<string>("");
  const [user_id, setUserid]                   = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showCurrent, setShowCurrent]         = useState<boolean>(false);
  const [showNew, setShowNew]                 = useState<boolean>(false);
  const [showConfirm, setShowConfirm]         = useState<boolean>(false);
  const [loading, setLoading]                 = useState<boolean>(false);
    const [childName, setChildName] = useState("Student");
    const [childClass, setChildClass] = useState("—");
    const [childSection, setChildSection] = useState("—");

  // const handleChangePassword = async (): Promise<void> => {
  //   // ── Validations ──────────────────────────
  //   if (!oldPassword || !newPassword || !confirmPassword) {
  //     return Alert.alert("Error", "Please fill in all fields.");
  //   }
  //   // if (newPassword.length < 8) {
  //   //   return Alert.alert("Error", "New password must be at least 8 characters.");
  //   // }
  //   if (newPassword !== confirmPassword) {
  //     return Alert.alert("Error", "New password and confirm password do not match.");
  //   }
  //   if (oldPassword === newPassword) {
  //     return Alert.alert("Error", "New password must be different from old password.");
  //   }

  //   // ── Call API ─────────────────────────────
  //   setLoading(true);
  //   try {
  //     const token = await AsyncStorage.getItem("token");
  //     const userId = await AsyncStorage.getItem("user_id");
  //     const res = await fetch(`${BASE_URL}/api/login/change-password`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ oldPassword, newPassword , user_id: userId}),
  //     });

  //     const data = await res.json();

  //     if (data.success) {
  //       Alert.alert("Success ✅", "Your password has been changed successfully.", [
  //         { text: "OK", onPress: () => router.back() },
  //       ]);
  //     } else {
  //       Alert.alert("Failed", data.message || "Something went wrong.");
  //     }
  //   } catch (err) {
  //     Alert.alert("Error", "Network error. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


// const handleChangePassword = async (): Promise<void> => {
//     if (!oldPassword || !newPassword || !confirmPassword) {
//       return Alert.alert("Error", "Please fill in all fields.");
//     }
//     if (newPassword !== confirmPassword) {
//       return Alert.alert("Error", "New password and confirm password do not match.");
//     }
//     if (oldPassword === newPassword) {
//       return Alert.alert("Error", "New password must be different from old password.");
//     }

//     setLoading(true);

//     try {
//       const userId = await AsyncStorage.getItem("user_id");

//       // ── Debug logs — check these in terminal ──
//       console.log("BASE_URL:", BASE_URL);
//       console.log("user_id:", userId);
//       console.log("Payload:", { oldPassword, newPassword, user_id: userId });

//       const res = await fetch(`${BASE_URL}/api/login/change-password`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",  // ✅ needed so server reads body as JSON
//         },
//         body: JSON.stringify({ oldPassword, newPassword, user_id: userId }),
//       });

//       console.log("Response status:", res.status);
//       const data = await res.json();
//       console.log("Response data:", data);

//       if (data.success) {
//         Alert.alert("Success ✅", "Your password has been changed successfully.", [
//           { text: "OK", onPress: () => router.back() },
//         ]);
//       } else {
//         Alert.alert("Failed", data.message || "Something went wrong.");
//       }
//     } catch (err) {
//       console.log("Catch error:", err);  // ✅ this will tell you the real error
//       Alert.alert("Error", "Network error. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

// const handleChangePassword = async (): Promise<void> => {
//     if (!oldPassword || !newPassword || !confirmPassword) {
//       return Alert.alert("Error", "Please fill in all fields.");
//     }
//     if (newPassword !== confirmPassword) {
//       return Alert.alert("Error", "New password and confirm password do not match.");
//     }
//     if (oldPassword === newPassword) {
//       return Alert.alert("Error", "New password must be different from old password.");
//     }

//     setLoading(true);

//     try {
//       const userId = await AsyncStorage.getItem("user_id");

//       const res = await fetch(`${BASE_URL}/api/login/change-password`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ 
//           oldPassword, 
//           newPassword, 
//           user_id: Number(userId)  // ✅ send as number not string
// }),
//       });

//       const data = await res.json();
//       console.log("Response status:", res.status);

//       if (res.ok) {  // ✅ check status 200, not data.success (API returns data.msg not data.success)
//         Alert.alert("Success ✅", "Your password has been changed successfully.", [
//           { text: "OK", onPress: () => router.back() },
//         ]);
//       } else {
//         Alert.alert("Failed", data.msg || "Something went wrong."); // ✅ data.msg not data.message
//       }
//     } catch (err) {
//       Alert.alert("Error", "Network error. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };
  
const handleChangePassword = async (): Promise<void> => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Error", "Please fill in all fields.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "New password and confirm password do not match.");
    }
    if (oldPassword === newPassword) {
      return Alert.alert("Error", "New password must be different from old password.");
    }

    setLoading(true);

    try {
      const userId = await AsyncStorage.getItem("user_id");

      // ── Debug logs ──
      console.log("=== CHANGE PASSWORD ===");
      console.log("user_id from storage:", userId);
      console.log("user_id as number:", Number(userId));
      console.log("oldPassword:", oldPassword);
      console.log("newPassword:", newPassword);
      console.log("Payload being sent:", { oldPassword, newPassword, user_id: Number(userId) });

      const res = await fetch(`${BASE_URL}/api/login/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-academic-year-id": await AsyncStorage.getItem("selectedYearId") ?? "16",
        },
        body: JSON.stringify({ 
          oldPassword, 
          newPassword, 
          user_id: Number(userId)
        }),
      });

      console.log("Response status:", res.status);
      const text = await res.text(); // ✅ read as text first to avoid JSON crash
      console.log("Raw response:", text);

      const data = JSON.parse(text); // ✅ then parse manually
      console.log("Parsed response:", data);

      if (res.ok) {
        Alert.alert("Success ", "Your password has been changed successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Failed", data.msg || "Something went wrong.");
      }
    } catch (err) {
      console.log("=== CATCH ERROR ===");
      console.log(err);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () =>
    Alert.alert("Logout", "Do you really want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes", style: "destructive", onPress: async () => {
          await AsyncStorage.multiRemove(["token", "selectedChild", "selectedYearId", "selectedYearLabel"]);
          router.replace("/login");
        },
      },
    ], { cancelable: true });

  
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>

      {/* ══ HEADER ══ */}
   <View style={[styles.headerTop, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>⬅</Text>
          </TouchableOpacity>
          
          {/* Avatar Circle with Initials */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.avatarInitials}>{getInitials(childName)}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{childName}</Text>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>
                  {childClass} {childSection && `· ${childSection}`}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>↪</Text>
          </TouchableOpacity>
        </View>
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
                value={oldPassword}
                onChangeText={setOldPassword}
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
                placeholder="Enter new password"
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