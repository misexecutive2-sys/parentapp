import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

const API_URL = "https://endurable-even-distant.ngrok-free.dev";

export default function NewChildScreen() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState("");
  // const [name, setName] = useState("");
  // const [grade, setGrade] = useState("");
  // const [section, setSection] = useState("");
  // const [school, setSchool] = useState("");

  const handleSave = async () => {
    const token = await AsyncStorage.getItem("token");
    const user = await AsyncStorage.getItem("user");
    const parsedUser = user ? JSON.parse(user) : null;

    // Reject if license key is same as existing one
    if (parsedUser && parsedUser.licenseKey === licenseKey.trim()) {
      Alert.alert("Error", "You must enter a different license key.");
      return;
    }

    const res = await fetch(`${API_URL}/api/children/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ licenseKey }),
    });

    const data = await res.json();
    if (data.success) {
      Alert.alert("Success", "Child added successfully!");
      router.replace("/addchild"); // go back to list
    } else {
      Alert.alert("Error", data.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Gradient Header */}
      <ExpoLinearGradient
        colors={["#4FC3F7", "#1565C0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>➕</Text>
        </View>
        <Text style={styles.title}>Add New Child</Text>
        <Text style={styles.subtitle}>
          Enter child details and a unique license key.
        </Text>
      </ExpoLinearGradient>

      {/* Form */}
      <View style={styles.body}>
        <TextInput
          style={styles.input}
          placeholder="License Key"
          value={licenseKey}
          onChangeText={setLicenseKey}
        />
        {/* <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Grade"
          value={grade}
          onChangeText={setGrade}
        />
        <TextInput
          style={styles.input}
          placeholder="Section"
          value={section}
          onChangeText={setSection}
        />
        <TextInput
          style={styles.input}
          placeholder="School"
          value={school}
          onChangeText={setSchool}
        /> */}

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Child</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 36,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconEmoji: { fontSize: 28 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    lineHeight: 20,
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    backgroundColor: "#F5F7FB",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#1565C0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
