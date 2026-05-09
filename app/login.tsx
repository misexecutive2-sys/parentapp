import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  Image,
  Switch,
  AppState,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { Buffer } from "buffer";
import { COUNTRY_LIST } from "./countrycode"; // ✅ import your country list

const API_URL = "https://connect.schoolaid.in";

const STORAGE_KEYS = {
  TOKEN: "token",
  REMEMBER_ME: "rememberMe",
  SAVED_MOBILE: "savedMobile",
  SAVED_PASSWORD: "savedPassword",
  SAVED_CALLING_CODE: "savedCallingCode",
  SAVED_FLAG: "savedFlag",
  SELECTED_CHILD: "selectedChild",
};

const isValidMobile = (mobile: string) => /^[0-9]{6,15}$/.test(mobile);
const isValidPassword = (password: string) => password && password.length >= 6;

export default function LoginScreen() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // ✅ Country picker state
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRY_LIST.find((c) => c.cca2 === "IN")! // default India
  );

  const router = useRouter();
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        if (!rememberMe) setPassword("");
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [rememberMe]);

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const remembered = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      if (remembered === "true") {
        const savedMobile = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_MOBILE);
        const savedPassword = await SecureStore.getItemAsync(STORAGE_KEYS.SAVED_PASSWORD);
        const savedCode = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_CALLING_CODE);
        const savedFlag = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_FLAG);

        if (savedMobile) setMobile(savedMobile);
        if (savedPassword) setPassword(savedPassword);
        if (savedCode && savedFlag) {
          const found = COUNTRY_LIST.find((c) => c.code === savedCode);
          if (found) setSelectedCountry(found);
        }
        setRememberMe(true);
      }
    } catch (err) {
      console.log("Could not load saved credentials:", err);
    }
  };

  const handleMobileChange = (text: string) => {
    const sanitised = text.replace(/[^0-9]/g, "").slice(0, 15);
    setMobile(sanitised);
  };

  const handlePasswordChange = (text: string) => {
    if (text.length <= 128) setPassword(text);
  };

  const filteredCountries = COUNTRY_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.includes(searchQuery) ||
      c.cca2.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // -----------------------------Login and Forgot Password Handlers-----------------------------
  const handleLogin = async () => {
    // if (lockoutUntil && Date.now() < lockoutUntil) {
    //   const secondsLeft = Math.ceil((lockoutUntil - Date.now()) / 1000);
    //   Alert.alert("Too Many Attempts", `Please wait ${secondsLeft}s before trying again.`);
    //   return;
    // }

    if (!isValidMobile(mobile)) {
      Alert.alert("Invalid Input", "Please enter a valid mobile number.");
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert("Invalid Input", "Password must be at least 6 characters.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client": "SchoolAid-App/1.0",
        },
        body: JSON.stringify({
          mobile: `${selectedCountry.code}${mobile}`,
          password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok) {
        setLoginAttempts(0);
        setLockoutUntil(null);

        if (!data.token || typeof data.token !== "string") {
          Alert.alert("Error", "Invalid server response. Please try again.");
          return;
        }

        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);

        const base64Payload = data.token.split(".")[1];
        const paddedPayload = base64Payload + "==".slice((base64Payload.length % 4) || 4);
        const decodedPayload = JSON.parse(
          Buffer.from(paddedPayload, "base64").toString("utf8")
        );
        console.log("Decoded token:", decodedPayload);
        await AsyncStorage.setItem("user_id", String(decodedPayload.user_id));

        if (rememberMe) {
          await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
          await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MOBILE, mobile);
          await AsyncStorage.setItem(STORAGE_KEYS.SAVED_CALLING_CODE, selectedCountry.code);
          await AsyncStorage.setItem(STORAGE_KEYS.SAVED_FLAG, selectedCountry.flag);
          await SecureStore.setItemAsync(STORAGE_KEYS.SAVED_PASSWORD, password);
        } else {
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.REMEMBER_ME,
            STORAGE_KEYS.SAVED_MOBILE,
            STORAGE_KEYS.SAVED_CALLING_CODE,
            STORAGE_KEYS.SAVED_FLAG,
          ]);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.SAVED_PASSWORD).catch(() => {});
        }

        const childRes = await fetch(`${API_URL}/api/add-child/my-children`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        const childData = await childRes.json();
        console.log("Children response:", childData);

        if (childData.children && childData.children.length > 0) {
          const firstChild = childData.children[0];
          await AsyncStorage.setItem(
            STORAGE_KEYS.SELECTED_CHILD,
            JSON.stringify({
              id: firstChild.id,
              name: firstChild.student_firstname,
              classname: firstChild.class_name,
              sectionname: firstChild.section_name,
            })
          );
        } else {
          console.warn("No children found for this account");
        }

        router.replace("/addchild");

      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= 5) {
          setLockoutUntil(Date.now() + 30 * 1000);
          Alert.alert("Too Many Attempts", "Please wait 30 seconds before trying again.");
        } else {
          Alert.alert("Error", data.msg || "Invalid credentials. Please try again.");
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        Alert.alert("Timeout", "Request timed out. Please check your connection.");
      } else {
        console.error("Login error:", err);
        Alert.alert("Error", "Network issue. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!isValidMobile(mobile)) {
      Alert.alert("Invalid Input", "Please enter your mobile number first.");
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_URL}/api/login/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: `${selectedCountry.code}${mobile}` }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Password reset SMS has been sent to your mobile number.");
      } else {
        Alert.alert("Error", data.msg || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        Alert.alert("Timeout", "Request timed out. Please try again.");
      } else {
        Alert.alert("Error", "Network issue. Please try again.");
      }
    }
  };



  return (
    <View style={styles.container}>
      {/* ✅ Country Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              onPress={() => {
                setShowPicker(false);
                setSearchQuery("");
              }}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search country or code..."
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  selectedCountry.name === item.name && styles.countryRowSelected,
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowPicker(false);
                  setSearchQuery("");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>{item.code}</Text>
                {selectedCountry.name === item.name && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>

      {/* ✅ Login Card */}
      <View style={styles.card}>
        <Image source={require('../assets/logo.png')} style={styles.logoImage} />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your School Aid account</Text>

        {/* Mobile Input with Country Picker */}
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={styles.flagButton}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
            <Text style={styles.callingCode}>{selectedCountry.code}</Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={handleMobileChange}
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={handlePasswordChange}
            maxLength={128}
            autoComplete="password"
            textContentType="password"
          />
        </View>

        {/* Remember Me */}
        <View style={styles.rememberRow}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: "#E0E6F0", true: "#0047AB" }}
            thumbColor={rememberMe ? "#fff" : "#aaa"}
          />
          <Text style={styles.rememberText}>Remember Me</Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? "Signing in..." : "Login"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPassword} activeOpacity={0.7}>
          <Text style={styles.forgotLinkText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signupLink} onPress={() => router.replace("/signup")} activeOpacity={0.7}>
          <Text style={styles.signupLinkText}>
            Don't have an account?{' '}
            <Text style={styles.signupLinkBold}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.termsButton}
        onPress={() =>
          Alert.alert(
            "Terms of Use",
            `Usage of products, applications, and services offered by School Aid is governed by the following terms and conditions ("Terms of Use").

When YOU or any of YOUR customers, associates, employees, colleagues, partners or any individual/third party authorized by YOU (collectively referred as "YOU"), use any of the products, applications or services, YOU will be subjected to the terms and conditions applicable to such products, applications or services and the associated number of licenses of such products, applications or services purchased by YOU, and they shall be deemed to be incorporated into this Terms of Use. School Aid reserves the right, at its sole discretion, to change, modify, add or remove portions of these Terms of Use, at any time. It is YOUR responsibility to check these Terms of Use periodically for changes. YOUR continued use of our products, applications, and services through any channel (website, mobile or any other channel) following the posting of changes will mean that YOU accept and agree to the changes.

Accessing, Browsing or Otherwise using School Aid products, applications and services implies that YOU have read this agreement carefully and that YOU agree to the Terms and Conditions outlined below

These Terms and Conditions will be applicable to YOU when YOU either procure the products, applications, and services from School Aid or intend to procure the products, applications and services offered by School Aid or browse through or use the publicly available resources of School Aid or related to School Aid.`
          )
        }
        activeOpacity={0.7}
      >
        <Text style={styles.termsButtonText}>Terms of Use</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0047AB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0047AB',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 28,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E6F0',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 8,
    gap: 3,
  },
  flagEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  callingCode: {
    fontSize: 14,
    color: '#0047AB',
    fontWeight: '600',
    marginLeft: 4,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#888',
    marginLeft: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E6F0',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 14,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  rememberText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    backgroundColor: '#0047AB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: '#7FA8D9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotLink: {
    marginTop: 14,
  },
  forgotLinkText: {
    fontSize: 14,
    color: '#0047AB',
    fontWeight: '600',
  },
  signupLink: {
    marginTop: 20,
  },
  signupLinkText: {
    fontSize: 14,
    color: '#888',
  },
  signupLinkBold: {
    color: '#0047AB',
    fontWeight: '700',
  },
  termsButton: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E6F0',
  },
  termsButtonText: {
    fontSize: 14,
    color: '#0047AB',
    fontWeight: '600',
    textAlign: 'center',
  },

  // ✅ Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6F0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0047AB',
  },
  modalClose: {
    fontSize: 18,
    color: '#888',
    padding: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E6F0',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 12,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  countryRowSelected: {
    backgroundColor: '#EEF3FB',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  countryCode: {
    fontSize: 14,
    color: '#0047AB',
    fontWeight: '600',
    marginRight: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#0047AB',
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F4FA',
    marginHorizontal: 20,
  },
});

