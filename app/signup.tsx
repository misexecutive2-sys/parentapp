// import React, { useState } from 'react';
// import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
// import { useLocalSearchParams, useRouter } from "expo-router";

// const API_URL = "https://staging.schoolaid.in";

// export default function SignupScreen() {
//   const { tempToken } = useLocalSearchParams();
//   const router = useRouter();

//   const [mobile, setMobile] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSignup = async () => {
//     try {
//       const res = await fetch(`${API_URL}/api/student/create-account`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ mobile, password, tempToken })
//       });

//       const data = await res.json();

//       if (res.ok) {
//         Alert.alert("Success", data.msg);
//         router.replace("/login");
//       } else {
//         Alert.alert("Error", data.msg);
//       }
//     } catch (err) {
//       Alert.alert("Error", "Network issue");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.card}>

//         <Text style={styles.icon}>🎓</Text>

//         <Text style={styles.title}>Create Account</Text>
//         <Text style={styles.subtitle}>Sign up to get started with SchoolAid</Text>

//         <TextInput
//           style={styles.input}
//           placeholder="Mobile Number"
//           placeholderTextColor="#aaa"
//           value={mobile}
//           onChangeText={setMobile}
//           keyboardType="phone-pad"
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Password"
//           placeholderTextColor="#aaa"
//           secureTextEntry
//           value={password}
//           onChangeText={setPassword}
//         />

//         <TouchableOpacity style={styles.button} onPress={handleSignup} activeOpacity={0.85}>
//           <Text style={styles.buttonText}>Create Account</Text>
//         </TouchableOpacity>

//           <TouchableOpacity onPress={() => router.replace("/LicenseKeyScreen")} activeOpacity={0.7}>
//             <Text style={styles.backText}>← Back to License Verification</Text>
//           </TouchableOpacity>
//       </View>
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
//   icon: {
//     fontSize: 52,
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
//   input: {
//     width: '100%',
//     backgroundColor: '#F5F7FA',
//     borderRadius: 12,
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     fontSize: 15,
//     color: '#222',
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#E0E6F0',
//   },
//   button: {
//     width: '100%',
//     backgroundColor: '#0047AB',
//     borderRadius: 12,
//     paddingVertical: 16,
//     alignItems: 'center',
//     marginTop: 4,
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '700',
//     letterSpacing: 0.5,
//   },
//   backText: {
//     fontSize: 13,
//     color: '#0047AB',
//     fontWeight: '500',
//   },
// });

// // import React, { useState } from 'react';
// // import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
// // import { useLocalSearchParams, useRouter } from "expo-router";
 
// // const API_URL = "https://staging.schoolaid.in";
 
// // export default function SignupScreen() {
// //   const { tempToken } = useLocalSearchParams();
// //   const router = useRouter();
 
// //   const [mobile, setMobile] = useState('');
// //   const [password, setPassword] = useState('');
 
// //   const handleSignup = async () => {
// //     try {
// //       const res = await fetch(`${API_URL}/api/student/create-account`, {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json"
// //         },
// //         body: JSON.stringify({
// //           mobile,
// //           password,
// //           tempToken
// //         })
// //       });
 
// //       const data = await res.json();
 
// //       if (res.ok) {
// //         Alert.alert("Success", data.msg);
// //         router.replace("/login");
// //       } else {
// //         Alert.alert("Error", data.msg);
// //       }
 
// //     } catch (err) {
// //       Alert.alert("Error", "Network issue");
// //     }
// //   };
 
// //   return (
// // <View>
// // <TextInput placeholder="Mobile" value={mobile} onChangeText={setMobile} />
// // <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
 
// //       <TouchableOpacity onPress={handleSignup}>
// // <Text>Create Account</Text>
// // </TouchableOpacity>
// // </View>
// //   );
// // }


// app/signup.js

// import React, { useState } from 'react';

// import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';

// import { useLocalSearchParams, useRouter } from "expo-router";
 
// const API_URL = "https://staging.schoolaid.in";
 
// export default function SignupScreen() {

//   const { tempToken } = useLocalSearchParams();

//   const router = useRouter();
 
//   const [mobile, setMobile] = useState('');

//   const [password, setPassword] = useState('');
 
//   const handleSignup = async () => {

//     try {

//       const res = await fetch(`${API_URL}/api/create-account`, {

//         method: "POST",

//         headers: { "Content-Type": "application/json" },

//         body: JSON.stringify({ mobile, password, tempToken })

//       });
 
//       const data = await res.json();
 
//       if (res.ok) {

//         Alert.alert("Success", data.msg);

//         router.replace("/login");

//       } else {

//         Alert.alert("Error", data.msg);

//       }

//     } catch (err) {

//       Alert.alert("Error", "Network issue");

//     }

//   };
 
//   return (
// <View>
// <TextInput placeholder="Mobile" value={mobile} onChangeText={setMobile} />
// <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
 
//       <TouchableOpacity onPress={handleSignup}>
// <Text>Create Account</Text>
// </TouchableOpacity>
// </View>

//   );

// }
 
// import React, { useState } from 'react';
// import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet, Image } from 'react-native';
// import { useLocalSearchParams, useRouter } from "expo-router";

// const API_URL = "https://staging.schoolaid.in";

// export default function SignupScreen() {
//   const { tempToken } = useLocalSearchParams();
//   const router = useRouter();

//   const [mobile, setMobile] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSignup = async () => {
//     try {
//       const res = await fetch(`${API_URL}/api/student/create-account`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ mobile, password, tempToken })
//       });

//       const data = await res.json();

//       if (res.ok) {
//         Alert.alert("Success", data.msg);
//         router.replace("/login");
//       } else {
//         Alert.alert("Error", data.msg);
//       }
//     } catch (err) {
//       Alert.alert("Error", "Network issue");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.card}>

//         <Image source={require('../assets/logo.png')} style={styles.logoImage} />

//         <Text style={styles.title}>Create Account</Text>
//         <Text style={styles.subtitle}>Set up your School Aid account</Text>

//         <TextInput
//           style={styles.input}
//           placeholder="Mobile Number"
//           placeholderTextColor="#aaa"
//           keyboardType="phone-pad"
//           value={mobile}
//           onChangeText={setMobile}
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Password"
//           placeholderTextColor="#aaa"
//           secureTextEntry
//           value={password}
//           onChangeText={setPassword}
//         />

//         <TouchableOpacity style={styles.button} onPress={handleSignup} activeOpacity={0.85}>
//           <Text style={styles.buttonText}>Create Account</Text>
//         </TouchableOpacity>

//       </View>
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
//   input: {
//     width: '100%',
//     backgroundColor: '#F5F7FA',
//     borderRadius: 12,
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     fontSize: 15,
//     color: '#222',
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#E0E6F0',
//   },
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
// });
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_URL = "https://staging.schoolaid.in";

export default function SignupScreen() {
  const { tempToken } = useLocalSearchParams();
  const router = useRouter();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      const res = await fetch(`${API_URL}/api/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password, tempToken })
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", data.msg);
        router.replace("/login");
      } else {
        Alert.alert("Error", data.msg);
      }
    } catch (err) {
      Alert.alert("Error", "Network issue");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        <Image source={require('../assets/logo.png')} style={styles.logoImage} />

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Set up your School Aid account</Text>

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

        <TouchableOpacity style={styles.button} onPress={handleSignup} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Already have an account */}
        <TouchableOpacity style={styles.loginLink} onPress={() => router.replace("/login")} activeOpacity={0.7}>
          <Text style={styles.loginLinkText}>
            Already have an account?{' '}
            <Text style={styles.loginLinkBold}>Login</Text>
          </Text>
        </TouchableOpacity>

      </View>
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
  loginLink: {
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#888',
  },
  loginLinkBold: {
    color: '#0047AB',
    fontWeight: '700',
  },
});