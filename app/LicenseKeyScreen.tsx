import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://connect.schoolaid.in";
const PRIMARY = "#0047AB";
const PRIMARY_LIGHT = "#EEF3FF";
const PRIMARY_DARK = "#003080";

export default function LicenseKeyScreen() {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  // ── Animations ────────────────────────────────────────────
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const cardSlide   = useRef(new Animated.Value(60)).current;
  const cardFade    = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const dotAnim1    = useRef(new Animated.Value(0)).current;
  const dotAnim2    = useRef(new Animated.Value(0)).current;
  const dotAnim3    = useRef(new Animated.Value(0)).current;
  const inputBorder = useRef(new Animated.Value(0)).current;

  // Entry animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade,  { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]),
    ]).start();
  }, []);

  // Animated dots (decorative header)
  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        ])
      ).start();
    pulse(dotAnim1, 0);
    pulse(dotAnim2, 300);
    pulse(dotAnim3, 600);
  }, []);

  // Input focus border animation
  const handleFocus = () => {
    setFocused(true);
    Animated.timing(inputBorder, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(inputBorder, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  // Shake on error
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60,  useNativeDriver: true }),
    ]).start();
  };

  // Button press scale
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const borderColor = inputBorder.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E0E6F0", PRIMARY],
  });

  const handleSubmit = async () => {
    if (!licenseKey.trim()) {
      triggerShake();
      Alert.alert("Missing Key", "Please enter your license key.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/login/verify-license`, {
        method: "POST",
        headers: { "Content-Type": "application/json" ,"x-academic-year-id": await AsyncStorage.getItem("selectedYearId") ?? "16" },
        body: JSON.stringify({ license: licenseKey }),
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem("licenseKey", licenseKey);
        router.replace({ pathname: "/signup", params: { tempToken: data.tempToken } });
      } else {
        triggerShake();
        Alert.alert("Invalid Key", data.msg);
      }
    } catch {
      triggerShake();
      Alert.alert("Error", "Network issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Decorative pulsing dots */}
          <View style={styles.dotsRow}>
            {[dotAnim1, dotAnim2, dotAnim3].map((d, i) => (
              <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
            ))}
          </View>

          {/* Shield / lock icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#fff" />
          </View>

          <Text style={styles.appName}>SchoolAid</Text>
          <Text style={styles.headerTitle}>License Verification</Text>
          <Text style={styles.headerSub}>
            Enter the key provided by your school to get started
          </Text>
        </Animated.View>

        {/* ── Card ──────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardFade,
              transform: [
                { translateY: cardSlide },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {/* Label */}
          <Text style={styles.inputLabel}>License Key</Text>

          {/* Animated border input */}
          <Animated.View style={[styles.inputWrap, { borderColor }]}>
            <Ionicons
              name="key-outline"
              size={18}
              color={focused ? PRIMARY : "#AABBD0"}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              placeholderTextColor="#BCC8DA"
              value={licenseKey}
              onChangeText={setLicenseKey}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {licenseKey.length > 0 && (
              <TouchableOpacity onPress={() => setLicenseKey('')}>
                <Ionicons name="close-circle" size={18} color="#AABBD0" />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Helper text */}
          <Text style={styles.helperText}>
            <Ionicons name="information-circle-outline" size={11} color="#9CA3AF" />
            {"  "}Your school admin provides this key
          </Text>

          {/* Verify button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginTop: 28 }}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Verify License</Text>
                  <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          {/* <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Need help?</Text>
            <View style={styles.dividerLine} />
          </View> */}

          {/* Contact CTA */}
          {/* <TouchableOpacity style={styles.contactBtn}>
            <Ionicons name="mail-outline" size={14} color={PRIMARY} />
            <Text style={styles.contactText}>Contact your school administrator</Text>
          </TouchableOpacity> */}
        </Animated.View>

        {/* ── Footer ────────────────────────────────────────── */}
        <Animated.View style={[styles.footer, { opacity: cardFade }]}>
          <Ionicons name="lock-closed-outline" size={12} color="#BCC8DA" />
          <Text style={styles.footerText}>Secured by SchoolAid · v2.0</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F4FB" },

  // Header
  header:        { backgroundColor: PRIMARY, paddingTop: 50, paddingBottom: 36, alignItems: "center", paddingHorizontal: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  dotsRow:       { flexDirection: "row", gap: 8, marginBottom: 20 },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  iconCircle:    { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)" },
  appName:       { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 },
  headerTitle:   { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 8 },
  headerSub:     { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center", lineHeight: 19, maxWidth: 260 },

  // Card
  card:          { backgroundColor: "#fff", marginHorizontal: 20, marginTop: 24, borderRadius: 20, padding: 24, shadowColor: "#0047AB", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 6 },
  inputLabel:    { fontSize: 12, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  inputWrap:     { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13, backgroundColor: "#FAFBFF", gap: 8 },
  inputIcon:     { marginRight: 2 },
  input:         { flex: 1, fontSize: 15, color: "#1F2937", fontWeight: "600", letterSpacing: 1 },
  helperText:    { fontSize: 11, color: "#9CA3AF", marginTop: 8, flexDirection: "row", alignItems: "center" },

  // Button
  button:        { backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", shadowColor: PRIMARY, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6 },
  buttonDisabled:{ opacity: 0.7 },
  buttonInner:   { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText:    { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },

  // Divider
  divider:       { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24 },
  dividerLine:   { flex: 1, height: 1, backgroundColor: "#F0F4FB" },
  dividerText:   { fontSize: 11, color: "#BCC8DA", fontWeight: "600" },

  // Contact
  contactBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, paddingVertical: 10, backgroundColor: PRIMARY_LIGHT, borderRadius: 10 },
  contactText:   { fontSize: 12, color: PRIMARY, fontWeight: "700" },

  // Footer
  footer:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 20, marginTop: "auto" },
  footerText:    { fontSize: 11, color: "#BCC8DA", fontWeight: "600" },
});