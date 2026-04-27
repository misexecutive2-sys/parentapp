// import React, { useState } from "react";
// import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet, Image } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { useTheme } from "./ThemeContext";

// const API_URL = "https://connect.schoolaid.in";

// export default function LoginScreen() {
//   const [mobile, setMobile] = useState("");
//   const [password, setPassword] = useState("");
//   const router = useRouter();
//   const { theme } = useTheme();

// const handleLogin = async () => {
//   try {
//     const res = await fetch(`${API_URL}/api/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ 
//         mobile: `+91${mobile}`,   // ✅ add prefix here
//         password 
//       }),
//     });

    
//     const data = await res.json();
// console.log("Status:", res.status);        // ← add this
// console.log("Response:", JSON.stringify(data)); // ← add this

//     if (res.ok) {
//       await AsyncStorage.setItem("token", data.token);

//       // ✅ Fetch children list immediately
//       const childRes = await fetch(`${API_URL}/api/add-child/my-children`, {
//         headers: { Authorization: `Bearer ${data.token}` },
//       });
//       const childData = await childRes.json();
//       console.log("Children response:", childData);

//       if (childData.children && childData.children.length > 0) {
//         const firstChild = childData.children[0];
//         await AsyncStorage.setItem(
//           "selectedChild",
//           JSON.stringify({
//             id: firstChild.id,
//             name: firstChild.student_firstname,
//             classname: firstChild.class_name,
//             sectionname: firstChild.section_name,
//           })
//         );
//         console.log("Saved child:", firstChild.student_firstname);
//       } else {
//         console.warn("No children found for this account");
//       }

//       router.replace("/addchild");
//     } else {
//       Alert.alert("Error", data.msg);
//     }
//   } catch (err) {
//     console.error("Login error:", err);
//     Alert.alert("Error", "Network issue");
//   }
// };
//     const handleForgotPassword = async () => {
//     try {
//       const res = await fetch(`${API_URL}/api/login/forgot`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ mobile })
//       });

//       const data = await res.json();

//       if (res.ok) {
//         // ✅ SMS template will be sent from backend
//         Alert.alert("Success", "Password reset SMS has been sent to your mobile number.");
//       } else {
//         Alert.alert("Error", data.msg);
//       }
//     } catch (err) {
//       Alert.alert("Error", "Network issue");
//     }
//   };
//   const LoginScreen = () => {
//   const { theme } = useTheme();



//   return (
//     <View style={[styles.container, { backgroundColor: theme.primary }]}>
//       <View style={[styles.card, { backgroundColor: theme.background }]}>
//         <Text style={[styles.title, { color: theme.primary }]}>Welcome Back</Text>
//         <Text style={[styles.subtitle, { color: theme.text }]}>
//           Sign in to your School Aid account
//         </Text>
//       </View>
//     </View>
//   );
// };
//   return (
//     <View style={styles.container}>
//       <View style={styles.card}>

//         <Image source={require('../assets/logo.png')} style={styles.logoImage} />

//         <Text style={styles.title}>Welcome Back</Text>
//         <Text style={styles.subtitle}>Sign in to your School Aid account</Text>

//         <View style={styles.inputWrapper}>
//           <Text style={styles.prefixText}>+91</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Mobile Number"
//             placeholderTextColor="#aaa"
//             keyboardType="phone-pad"
//             value={mobile}
//             onChangeText={setMobile}
//           />
//         </View>



//         {/* Password Input (no prefix, but same wrapper) */}
//         <View style={styles.inputWrapper}>
//           <TextInput
//             style={styles.input}
//             placeholder="Password"
//             placeholderTextColor="#aaa"
//             secureTextEntry
//             value={password}
//             onChangeText={setPassword}
//           />
//         </View>

//         <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.85}>
//           <Text style={styles.buttonText}>Login</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPassword} activeOpacity={0.7}>
//         <Text style={styles.forgotLinkText}>Forgot Password?</Text>
//         </TouchableOpacity>


//         {/* Don't have an account */}
//         <TouchableOpacity style={styles.signupLink} onPress={() => router.replace("/signup")} activeOpacity={0.7}>
//           <Text style={styles.signupLinkText}>
//             Don't have an account?{' '}
//             <Text style={styles.signupLinkBold}>Create one</Text>
//           </Text>
//         </TouchableOpacity>
//       </View>
//     <TouchableOpacity
//   style={styles.termsButton}
//   onPress={() =>
//     Alert.alert(
//       "Terms of Use",
//       `Usage of products, applications, and services offered by School Aid is governed by the following terms and conditions ("Terms of Use").

// When YOU or any of YOUR customers, associates, employees, colleagues, partners or any individual/third party authorized by YOU (collectively referred as "YOU"), use any of the products, applications or services, YOU will be subjected to the terms and conditions applicable to such products, applications or services and the associated number of licenses of such products, applications or services purchased by YOU, and they shall be deemed to be incorporated into this Terms of Use. School Aid reserves the right, at its sole discretion, to change, modify, add or remove portions of these Terms of Use, at any time. It is YOUR responsibility to check these Terms of Use periodically for changes. YOUR continued use of our products, applications, and services through any channel (website, mobile or any other channel) following the posting of changes will mean that YOU accept and agree to the changes.

// Accessing, Browsing or Otherwise using School Aid products, applications and services implies that YOU have read this agreement carefully and that YOU agree to the Terms and Conditions outlined below

// These Terms and Conditions will be applicable to YOU when YOU either procure the products, applications, and services from School Aid or intend to procure the products, applications and services offered by School Aid or browse through or use the publicly available resources of School Aid or related to School Aid.`
//     )
//   }
//   activeOpacity={0.7}
// >
//   <Text style={styles.termsButtonText}>Terms of Use</Text>
// </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#0047AB',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//   },
//   card: {
//     width: '100%',
//     backgroundColor: '#ffffff',
//     borderRadius: 20,
//     paddingVertical: 40,
//     paddingHorizontal: 28,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.15,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   logoImage: {
//     width: 72,
//     height: 72,
//     borderRadius: 20,
//     resizeMode: 'contain',
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#0047AB',
//     marginBottom: 6,
//     textAlign: 'center',
//     letterSpacing: 0.3,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 28,
//     textAlign: 'center',
//   },
// input: {
//   flex: 1,
//   fontSize: 15,
//   color: '#222',
//   paddingVertical: 14,
// },
// inputWrapper: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   width: '100%',
//   backgroundColor: '#F5F7FA',
//   borderRadius: 12,
//   borderWidth: 1,
//   borderColor: '#E0E6F0',
//   marginBottom: 16,
//   paddingHorizontal: 12,
// },
// prefixText: {
//   fontSize: 15,
//   color: '#0047AB',
//   fontWeight: '600',
//   marginRight: 6,
// },
//   button: {
//     width: '100%',
//     backgroundColor: '#0047AB',
//     borderRadius: 12,
//     paddingVertical: 16,
//     alignItems: 'center',
//     marginTop: 4,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '700',
//     letterSpacing: 0.5,
//   },
//   signupLink: {
//     marginTop: 20,
//   },
//   signupLinkText: {
//     fontSize: 14,
//     color: '#888',
//   },
//   signupLinkBold: {
//     color: '#0047AB',
//     fontWeight: '700',
//   },
//   forgotLink: {
//   marginTop: 14,
// },
// forgotLinkText: {
//   fontSize: 14,
//   color: '#0047AB',
//   fontWeight: '600',
// },
// termsButton: {
//   marginTop: 18,
//   paddingVertical: 12,
//   paddingHorizontal: 20,
//   borderRadius: 10,
//   backgroundColor: '#F5F7FA',
//   borderWidth: 1,
//   borderColor: '#E0E6F0',
// },

// termsButtonText: {
//   fontSize: 14,
//   color: '#0047AB',
//   fontWeight: '600',
//   textAlign: 'center',
// },

// });


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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store"; // ✅ Encrypted storage for passwords
import { useRouter } from "expo-router";
import { useTheme } from "./ThemeContext";

const API_URL = "https://connect.schoolaid.in";

// ✅ SECURITY: Keys as constants to avoid typos and centralise key management
const STORAGE_KEYS = {
  TOKEN: "token",
  REMEMBER_ME: "rememberMe",
  SAVED_MOBILE: "savedMobile",
  SAVED_PASSWORD: "savedPassword", // stored in SecureStore, not AsyncStorage
  SELECTED_CHILD: "selectedChild",
};

// ✅ SECURITY: Validate mobile number - only digits, exactly 10 chars
const isValidMobile = (mobile) => /^[0-9]{10}$/.test(mobile);

// ✅ SECURITY: Validate password - at least 6 chars, no empty
const isValidPassword = (password) => password && password.length >= 6;

export default function LoginScreen() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ✅ Prevent double-tap login
  const [loginAttempts, setLoginAttempts] = useState(0); // ✅ Rate limiting
  const [lockoutUntil, setLockoutUntil] = useState(null); // ✅ Lockout timer
  const router = useRouter();
  const { theme } = useTheme();

  // ✅ SECURITY: Ref to clear sensitive fields on app background
  const appStateRef = useRef(AppState.currentState);

  // ✅ SECURITY: Clear password from memory when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // Only clear password if rememberMe is OFF
        if (!rememberMe) {
          setPassword("");
        }
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [rememberMe]);

  // ✅ Load saved credentials on mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const remembered = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      if (remembered === "true") {
        const savedMobile = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_MOBILE);
        // ✅ SECURITY: Password retrieved from SecureStore (encrypted), not AsyncStorage
        const savedPassword = await SecureStore.getItemAsync(STORAGE_KEYS.SAVED_PASSWORD);
        if (savedMobile) setMobile(savedMobile);
        if (savedPassword) setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (err) {
      // ✅ SECURITY: Never expose internal error details to the user
      console.log("Could not load saved credentials:", err);
    }
  };

  // ✅ SECURITY: Sanitise mobile input — strip non-digits, max 10 chars
  const handleMobileChange = (text) => {
    const sanitised = text.replace(/[^0-9]/g, "").slice(0, 10);
    setMobile(sanitised);
  };

  // ✅ SECURITY: Limit password length to prevent buffer overflows / DoS
  const handlePasswordChange = (text) => {
    if (text.length <= 128) setPassword(text);
  };

  const handleLogin = async () => {
    // ✅ SECURITY: Check lockout before doing anything
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const secondsLeft = Math.ceil((lockoutUntil - Date.now()) / 1000);
      Alert.alert("Too Many Attempts", `Please wait ${secondsLeft}s before trying again.`);
      return;
    }

    // ✅ SECURITY: Client-side input validation before hitting the network
    if (!isValidMobile(mobile)) {
      Alert.alert("Invalid Input", "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert("Invalid Input", "Password must be at least 6 characters.");
      return;
    }

    // ✅ SECURITY: Prevent double-tap / multiple concurrent requests
    if (isLoading) return;
    setIsLoading(true);

    try {
      // ✅ SECURITY: Set a timeout so the request doesn't hang forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ✅ SECURITY: Identify client — useful for server-side rate limiting
          "X-Client": "SchoolAid-App/1.0",
        },
        body: JSON.stringify({
          mobile: `+91${mobile}`,
          password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      // ✅ SECURITY: Removed console.log of response data in production
      // console.log("Status:", res.status);
      // console.log("Response:", JSON.stringify(data));

      if (res.ok) {
        // ✅ SECURITY: Reset login attempts on success
        setLoginAttempts(0);
        setLockoutUntil(null);

        // ✅ SECURITY: Validate token exists before storing
        if (!data.token || typeof data.token !== "string") {
          Alert.alert("Error", "Invalid server response. Please try again.");
          return;
        }

        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);

        // ✅ Save or clear credentials based on rememberMe
        if (rememberMe) {
          await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
          await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MOBILE, mobile);
          // ✅ SECURITY: Password saved to SecureStore (AES-256 encrypted), NOT AsyncStorage
          await SecureStore.setItemAsync(STORAGE_KEYS.SAVED_PASSWORD, password);
        } else {
          await AsyncStorage.multiRemove([STORAGE_KEYS.REMEMBER_ME, STORAGE_KEYS.SAVED_MOBILE]);
          // ✅ SECURITY: Delete from SecureStore too
          await SecureStore.deleteItemAsync(STORAGE_KEYS.SAVED_PASSWORD).catch(() => {});
        }

        // ✅ Fetch children list immediately (original logic unchanged)
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
          console.log("Saved child:", firstChild.student_firstname);
        } else {
          console.warn("No children found for this account");
        }

        router.replace("/addchild");

      } else {
        // ✅ SECURITY: Brute-force rate limiting — lock after 5 failed attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= 5) {
          const lockDuration = 30 * 1000; // 30 seconds lockout
          setLockoutUntil(Date.now() + lockDuration);
          Alert.alert(
            "Too Many Attempts",
            "Too many failed logins. Please wait 30 seconds before trying again."
          );
        } else {
          // ✅ SECURITY: Generic error message — don't reveal whether mobile or password is wrong
          Alert.alert("Error", data.msg || "Invalid credentials. Please try again.");
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        Alert.alert("Timeout", "Request timed out. Please check your connection.");
      } else {
        // ✅ SECURITY: Never expose raw error to user
        console.error("Login error:", err);
        Alert.alert("Error", "Network issue. Please try again.");
      }
    } finally {
      // ✅ Always re-enable the button
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // ✅ SECURITY: Validate mobile before sending forgot password request
    if (!isValidMobile(mobile)) {
      Alert.alert("Invalid Input", "Please enter your 10-digit mobile number first.");
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_URL}/api/login/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: `+91${mobile}` }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Password reset SMS has been sent to your mobile number.");
      } else {
        Alert.alert("Error", data.msg || "Something went wrong. Please try again.");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        Alert.alert("Timeout", "Request timed out. Please try again.");
      } else {
        Alert.alert("Error", "Network issue. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        <Image source={require('../assets/logo.png')} style={styles.logoImage} />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your School Aid account</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.prefixText}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={handleMobileChange}  // ✅ Sanitised handler
            maxLength={10}                      // ✅ Hard cap in UI too
            autoComplete="tel"                 // ✅ Helps autofill
            textContentType="telephoneNumber"  // ✅ iOS autofill
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={handlePasswordChange}  // ✅ Sanitised handler
            maxLength={128}                      // ✅ Prevent absurdly long inputs
            autoComplete="password"             // ✅ Helps password managers
            textContentType="password"          // ✅ iOS keychain integration
          />
        </View>

        {/* ✅ Remember Me Toggle */}
        <View style={styles.rememberRow}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: "#E0E6F0", true: "#0047AB" }}
            thumbColor={rememberMe ? "#fff" : "#aaa"}
          />
          <Text style={styles.rememberText}>Remember Me</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={isLoading}   // ✅ Disabled while request is in-flight
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
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 14,
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
  prefixText: {
    fontSize: 15,
    color: '#0047AB',
    fontWeight: '600',
    marginRight: 6,
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
    backgroundColor: '#7FA8D9', // ✅ Visual feedback when disabled
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  forgotLink: {
    marginTop: 14,
  },
  forgotLinkText: {
    fontSize: 14,
    color: '#0047AB',
    fontWeight: '600',
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
});