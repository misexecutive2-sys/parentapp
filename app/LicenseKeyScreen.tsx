import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://staging.schoolaid.in";

export default function LicenseKeyScreen() {
  const [licenseKey, setLicenseKey] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/login/verify-license`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license: licenseKey })
      });

      const data = await res.json();
      console.log(data);
      if (res.ok) {
        await AsyncStorage.setItem("licenseKey", licenseKey);
        router.replace({
          pathname: "/signup",
          params: { tempToken: data.tempToken },
        });
        
        // Alert.alert("Successful");
      } else {
        Alert.alert("Error", data.msg);
      }
    } catch (err) {
      Alert.alert("Error", "Network issue");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SchoolAid</Text>
        <Text style={styles.headerSubtitle}>Enter your License Key</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="License Key"
          placeholderTextColor="#999"
          value={licenseKey}
          onChangeText={setLicenseKey}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "#0047AB",
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: "#ffffff",
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E6F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 14,
    color: "#333",
  },
  button: {
    backgroundColor: "#0047AB",
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
