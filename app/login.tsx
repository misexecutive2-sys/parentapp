import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTheme } from "./ThemeContext";

const API_URL = "https://staging.schoolaid.in";

export default function LoginScreen() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { theme } = useTheme();

const handleLogin = async () => {
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password }),
    });

    const data = await res.json();
    console.log("Login API response:", data);

    if (res.ok) {
      await AsyncStorage.setItem("token", data.token);

      // ✅ Login gives no child, so fetch children list immediately
      const childRes = await fetch(`${API_URL}/api/add-child/my-children`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const childData = await childRes.json();
      console.log("Children response:", childData);

      if (childData.children && childData.children.length > 0) {
        const firstChild = childData.children[0];
        // ✅ Save first child — same shape as addchild.tsx handleSelectChild
        await AsyncStorage.setItem(
          "selectedChild",
          JSON.stringify({
            id: firstChild.id,
            name: firstChild.student_firstname,
            class_name: firstChild.class_name,
            section_name: firstChild.section_name,
          })
        );
        console.log("Saved child:", firstChild.student_firstname);
      } else {
        console.warn("No children found for this account");
      }

      router.replace("/addchild");
    } else {
      Alert.alert("Error", data.msg);
    }
  } catch (err) {
    console.error("Login error:", err);
    Alert.alert("Error", "Network issue");
  }
};


 
    const handleForgotPassword = async () => {
    try {
      const res = await fetch(`${API_URL}/api/login/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile })
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ SMS template will be sent from backend
        Alert.alert("Success", "Password reset SMS has been sent to your mobile number.");
      } else {
        Alert.alert("Error", data.msg);
      }
    } catch (err) {
      Alert.alert("Error", "Network issue");
    }
  };
  const LoginScreen = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <View style={[styles.card, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.primary }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Sign in to your School Aid account
        </Text>
      </View>
    </View>
  );
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
            onChangeText={setMobile}
          />
        </View>



        {/* Password Input (no prefix, but same wrapper) */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPassword} activeOpacity={0.7}>
        <Text style={styles.forgotLinkText}>Forgot Password?</Text>
        </TouchableOpacity>


        {/* Don't have an account */}
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
  button: {
    width: '100%',
    backgroundColor: '#0047AB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
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