// import React, { useEffect, useState } from "react";
// import { useTheme } from "./ThemeContext";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   FlatList,
//   TextInput,
//   Alert,
//   Modal,
//   StyleSheet,
//   SafeAreaView,
//   Image,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";

// const API_URL = "https://connect.schoolaid.in";

// export default function AddChildScreen() {
//   const router = useRouter();
//   const [children, setChildren] = useState([]);
//   const [license, setLicense] = useState("");
//   const [preview, setPreview] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const { theme } = useTheme();

//   const fetchChildren = async () => {
//     const token = await AsyncStorage.getItem("token");
//     const res = await fetch(`${API_URL}/api/add-child/my-children`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     const data = await res.json();
//     if (res.ok) setChildren(data.children);
//   };

// //   const handleDeleteChild = async (childId: number, childName: string) => {
// //   Alert.alert(
// //     "Remove Child",
// //     `Are you sure you want to remove ${childName} from your account?`,
// //     [
// //       { text: "Cancel", style: "cancel" },
// //       {
// //         text: "Remove",
// //         style: "destructive",
// //         onPress: async () => {
// //           try {
// //             const token = await AsyncStorage.getItem("token");
// //             const res = await fetch(`${API_URL}/api/add-child/${childId}`, {
// //               method: "DELETE",
// //               headers: { Authorization: `Bearer ${token}` },
// //             });
// //             const data = await res.json();
// //             if (res.ok) {
// //               Alert.alert("Success", data.msg ?? "Child removed successfully");
// //               fetchChildren(); // ✅ refresh list
// //             } else {
// //               Alert.alert("Error", data.msg ?? "Could not remove child");
// //             }
// //           } catch (err) {
// //             Alert.alert("Error", "Network issue. Please try again.");
// //           }
// //         },
// //       },
// //     ],
// //     { cancelable: true }
// //   );
// // };

//   useEffect(() => {
//     fetchChildren();
//   }, []);

//   const handleLogout = () => {
//     Alert.alert("Logout", "Are you sure you want to log out?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Yes",
//         style: "destructive",
//         onPress: async () => {
//           await AsyncStorage.removeItem("token");
//           await AsyncStorage.removeItem("user");
//           await AsyncStorage.removeItem("selectedChild"); // ✅ clear child too
//           router.replace("/login");
//         },
//       },
//     ]);
//   };

//   // const handlePreview = async () => {
//   //   if (!license) {
//   //     Alert.alert("Error", "Enter license key");
//   //     return;
//   //   }
//   //   const token = await AsyncStorage.getItem("token");
//   //   const res = await fetch(`${API_URL}/api/add-child/preview-child`, {
//   //     method: "POST",
//   //     headers: {
//   //       "Content-Type": "application/json",
//   //       Authorization: `Bearer ${token}`,
//   //     },
//   //     body: JSON.stringify({ license }),
//   //   });
//   //   const text = await res.text();
//   //   try {
//   //     const data = JSON.parse(text);
//   //     // if (res.ok) setPreview(data.student);
//   //     if (res.ok) setPreview(data.student || data.child || data.data || data);
//   //     else Alert.alert("Error", data.msg);
//   //   } catch (e) {
//   //     Alert.alert("Error", "Server returned an unexpected response");
//   //   }
//   //   console.log("Preview student:", preview);
//   // };
// const handlePreview = async () => {
//     if (!license) {
//       Alert.alert("Error", "Enter license key");
//       return;
//     }
//     const token = await AsyncStorage.getItem("token");
//     const res = await fetch(`${API_URL}/api/add-child/preview-child`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ license }),
//     });

//     console.log("=== PREVIEW DEBUG ===");
//     console.log("Status:", res.status, "| OK:", res.ok);

//     const text = await res.text();
//     console.log("Raw Response:", text);

//     try {
//       const data = JSON.parse(text);
//       console.log("Parsed Data:", JSON.stringify(data, null, 2));
//       console.log("data.student:", data.student);
//       console.log("data.child:", data.child);
//       console.log("data.data:", data.data);

//       if (res.ok) {
//         const student = data.student || data.child || data.data || data;
//         console.log("Final student being set:", JSON.stringify(student, null, 2));
//         setPreview(student);
//       } else {
//         console.log("Error msg from server:", data.msg);
//         Alert.alert("Error", data.msg);
//       }
//     } catch (e) {
//       console.log("JSON Parse Error:", e);
//       console.log("Raw text was:", text);
//       Alert.alert("Error", "Server returned an unexpected response");
//     }
//   };
//   const handleAddChild = async () => {
//     const token = await AsyncStorage.getItem("token");
//     const res = await fetch(`${API_URL}/api/add-child`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ license }),
//     });
//     const text = await res.text();
//     try {
//       const data = JSON.parse(text);
//       if (res.ok) {
//         Alert.alert("Success", data.msg);
//         setModalVisible(false);
//         setPreview(null);
//         setLicense("");
//         fetchChildren();
//       } else {
//         Alert.alert("Error", data.msg);
//       }
//     } catch (e) {
//       Alert.alert("Error", "Server returned an unexpected response");
//     }
//   };

//   const handleCloseModal = () => {
//     setModalVisible(false);
//     setPreview(null);
//     setLicense("");
//   };

//   // ✅ Save child to AsyncStorage then navigate
// const handleSelectChild = async (item: any) => {
//   const token = await AsyncStorage.getItem("token");
//   const yearId = await AsyncStorage.getItem("selectedYearId");

//   let classId = null;
//   let sectionId = null;

//   try {
//     const res = await fetch(`${API_URL}/api/app/student-exams`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//         "x-academic-year": yearId ?? "16",
//       },
//       body: JSON.stringify({ student_id: item.id }),
//     });
//     const data = await res.json();
//     classId = data.class_id ?? null;
//     sectionId = data.section_id ?? null;
//     console.log("Got class_id:", classId, "section_id:", sectionId);
//   } catch (e) {
//     console.warn("Could not fetch class/section IDs:", e);
//   }

//   await AsyncStorage.setItem(
//     "selectedChild",
//     JSON.stringify({
//       id: item.id,
//       name: item.student_firstname,
//       classname: item.class_name,
//       sectionname: item.section_name,
//       class_id: classId,
//       section_id: sectionId,
//     })
//   );

//   router.replace({
//     pathname: "/Dashboard",
//     params: {
//       childId: item.id,
//       childName: item.student_firstname,
//       classname: item.class_name,
//       sectionname: item.section_name,
//     },
//   });
// };

//   return (
//     <SafeAreaView style={styles.safe}>

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//         <Image source={require("../assets/logo.png")} style={styles.logoImage} />
//         <Text style={styles.headerTitle}>My Children</Text>
//         <Text style={styles.headerSubtitle}>
//           Select a child profile to view their{"\n"}schedule and academic progress.
//         </Text>
//       </View>

//       {/* Body */}
//       <View style={styles.body}>
//         <FlatList
//           data={children}
//           keyExtractor={(item) => item.id.toString()}
//           contentContainerStyle={{ paddingBottom: 10 }}
//           ListEmptyComponent={
//             <View style={styles.emptyBox}>
//               <Text style={styles.emptyIcon}>🧒</Text>
//               <Text style={styles.emptyText}>
//                 No children added yet.{"\n"}Add a child using their license key.
//               </Text>
//             </View>
//           }
//           // renderItem={({ item }) => (
//           //   <TouchableOpacity
//           //     style={styles.card}
//           //     onPress={() => handleSelectChild(item)} // ✅ fixed
//           //     activeOpacity={0.85}
//           //   >
//           //     {item.profile_image ? (
//           //       <Image source={{ uri: item.profile_image }} style={styles.avatarImage} />
//           //     ) : (
//           //       <View style={styles.avatar}>
//           //         <Text style={styles.avatarText}>
//           //           {item.student_firstname?.charAt(0).toUpperCase()}
//           //         </Text>
//           //       </View>
//           //     )}
//           //     <View style={styles.cardInfo}>
//           //       <Text style={styles.name}>{item.student_firstname}</Text>
//           //       <Text style={styles.detail}>
//           //         {item.class_name} · Section{" "}
//           //         <Text style={styles.sectionBadge}>{item.section_name}</Text>
//           //       </Text>
//           //     </View>
//           //     <Text style={styles.arrow}>›</Text>
//           //   </TouchableOpacity>
//           // )}
//           renderItem={({ item }) => (
//   <View style={styles.card}>
//     {/* Left — avatar + info — tappable to select */}
//   <TouchableOpacity
//   style={styles.cardLeft}
//   onPress={() => handleSelectChild(item)}
//   activeOpacity={0.85}
// >
//   <View style={styles.avatar}>
//     <Text style={styles.avatarText}>
//       {item.student_firstname?.charAt(0).toUpperCase()}
//     </Text>
//   </View>
//   <View style={styles.cardInfo}>
//     <Text style={styles.name}>{item.student_firstname}</Text>
//     <Text style={styles.detail}>
//       {item.class_name} · Section{" "}
//       <Text style={styles.sectionBadge}>{item.section_name}</Text>
//     </Text>
//   </View>
// </TouchableOpacity>

//     {/* Right — delete button */}
//     {/* <TouchableOpacity
//       style={styles.deleteBtn}
//       onPress={() => handleDeleteChild(item.id, item.student_firstname)}
//       activeOpacity={0.7}
//     >
//       <Text style={styles.deleteIcon}>🗑</Text>
//     </TouchableOpacity> */}
//   </View>
// )}
//         />

//         <TouchableOpacity
//           style={styles.addButton}
//           onPress={() => setModalVisible(true)}
//           activeOpacity={0.85}
//         >
//           <Text style={styles.addText}>+ Add Child</Text>
//         </TouchableOpacity>

//         <Text style={styles.hint}>
//           You can switch profiles anytime from{"\n"}the Settings menu in your dashboard.
//         </Text>
//       </View>

//       {/* Modal */}
//       <Modal visible={modalVisible} transparent animationType="slide">
//         <View style={styles.modalBg}>
//           <View style={styles.modalCard}>
//             {!preview ? (
//               <>
//                 <Text style={styles.modalTitle}>Add a Child</Text>
//                 <Text style={styles.modalSubtitle}>
//                   Enter the child's license key to preview their profile.
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter License Key"
//                   placeholderTextColor="#aaa"
//                   value={license}
//                   onChangeText={setLicense}
//                 />
//                 <TouchableOpacity style={styles.button} onPress={handlePreview} activeOpacity={0.85}>
//                   <Text style={styles.buttonText}>Preview Child</Text>
//                 </TouchableOpacity>
//               </>
// ) : (
//   <>
//     <Text style={styles.modalTitle}>Confirm Child</Text>
//     <Text style={styles.modalSubtitle}>Is this the correct child profile?</Text>
//     {preview.profile_pic ? (
//       <Image
//         source={{ uri: `${API_URL}${preview.profile_pic}` }} // ✅ full URL
//         style={styles.previewImg}
//       />
//     ) : (
//       <View style={styles.previewAvatar}>
//         <Text style={styles.previewAvatarText}>
//           {preview.student_firstname?.charAt(0).toUpperCase()} // ✅ correct field
//         </Text>
//       </View>
//     )}
//       <Text style={styles.previewName}>{preview.student_firstname}</Text>
//       <Text style={styles.previewDetail}>
//         {`${preview.class_name ?? "N/A"} · ${preview.section_name ?? "N/A"}`}
//       </Text>
//     <TouchableOpacity style={styles.button} onPress={handleAddChild} activeOpacity={0.85}>
//       <Text style={styles.buttonText}>✓ Add This Child</Text>
//     </TouchableOpacity>
//   </>
// )}
//             <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal} activeOpacity={0.7}>
//               <Text style={styles.cancelText}>Cancel</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: "#F5F7FA" },
//   header: {
//     backgroundColor: "#0047AB",
//     paddingTop: 50,
//     paddingBottom: 36,
//     alignItems: "center",
//     paddingHorizontal: 30,
//   },
//   logoutBtn: {
//     position: "absolute",
//     right: 18,
//     top: 52,
//     backgroundColor: "#ffffff",
//     paddingVertical: 6,
//     paddingHorizontal: 14,
//     borderRadius: 8,
//   },
//   logoutText: { color: "#0047AB", fontWeight: "700", fontSize: 13 },
//   logoImage: {
//     width: 72,
//     height: 72,
//     borderRadius: 20,
//     resizeMode: "contain",
//     backgroundColor: "#ffffff",
//     marginBottom: 16,
//   },
//   headerTitle: {
//     color: "#ffffff",
//     fontSize: 24,
//     fontWeight: "800",
//     letterSpacing: 0.4,
//     marginBottom: 6,
//   },
//   headerSubtitle: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 13,
//     textAlign: "center",
//     lineHeight: 20,
//   },
//   body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
// card: {
//   flexDirection: "row",
//   backgroundColor: "#ffffff",
//   borderRadius: 16,
//   padding: 16,
//   marginBottom: 12,
//   alignItems: "center",
//   shadowColor: "#000",
//   shadowOpacity: 0.07,
//   shadowOffset: { width: 0, height: 3 },
//   shadowRadius: 8,
//   elevation: 3,
//   borderWidth: 1,
//   borderColor: "#E0E6F0",
// },
// cardLeft: {
//   flex: 1,
//   flexDirection: "row",
//   alignItems: "center",
// },
// deleteBtn: {
//   padding: 8,
//   borderRadius: 8,
//   backgroundColor: "#fee2e2",
//   marginLeft: 8,
// },
// deleteIcon: {
//   fontSize: 16,
// },
//   avatar: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     backgroundColor: "#E8F0FE",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 14,
//   },
//   avatarImage: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
//   avatarText: { fontSize: 22, fontWeight: "800", color: "#0047AB" },
//   cardInfo: { flex: 1 },
//   name: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 3 },
//   detail: { fontSize: 13, color: "#666" },
//   sectionBadge: { color: "#0047AB", fontWeight: "700" },
//   arrow: { fontSize: 26, color: "#0047AB", marginLeft: 8 },
//   emptyBox: {
//     alignItems: "center",
//     paddingVertical: 40,
//     backgroundColor: "#ffffff",
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: "#E0E6F0",
//     marginBottom: 16,
//   },
//   emptyIcon: { fontSize: 36, marginBottom: 10 },
//   emptyText: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 20 },
//   addButton: {
//     borderWidth: 1.5,
//     borderColor: "#0047AB",
//     borderRadius: 12,
//     paddingVertical: 15,
//     alignItems: "center",
//     marginBottom: 16,
//     backgroundColor: "#ffffff",
//   },
//   addText: { color: "#0047AB", fontSize: 15, fontWeight: "600" },
//   hint: { textAlign: "center", fontSize: 12, color: "#aaa", lineHeight: 18, paddingBottom: 10 },
//   modalBg: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.45)",
//     justifyContent: "center",
//     paddingHorizontal: 24,
//   },
//   modalCard: {
//     backgroundColor: "#ffffff",
//     borderRadius: 20,
//     paddingVertical: 32,
//     paddingHorizontal: 24,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.15,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   modalTitle: { fontSize: 20, fontWeight: "700", color: "#0047AB", marginBottom: 6, textAlign: "center" },
//   modalSubtitle: { fontSize: 13, color: "#888", textAlign: "center", marginBottom: 24 },
//   input: {
//     width: "100%",
//     backgroundColor: "#F5F7FA",
//     borderRadius: 12,
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     fontSize: 15,
//     color: "#222",
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: "#E0E6F0",
//   },
//   button: {
//     width: "100%",
//     backgroundColor: "#0047AB",
//     borderRadius: 12,
//     paddingVertical: 15,
//     alignItems: "center",
//     marginBottom: 4,
//   },
//   buttonText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.4 },
//   cancelBtn: { marginTop: 12, paddingVertical: 8 },
//   cancelText: { fontSize: 14, color: "#888", fontWeight: "500" },
//   previewImg: { width: 90, height: 90, borderRadius: 45, marginBottom: 14 },
//   previewAvatar: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//     backgroundColor: "#E8F0FE",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 14,
//   },
//   previewAvatarText: { fontSize: 36, fontWeight: "800", color: "#0047AB" },
//   previewName: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 4, textAlign: "center" },
//   previewDetail: { fontSize: 13, color: "#888", marginBottom: 24, textAlign: "center" },
// });


// --------------------------------- updated theme and back button in all dashboard screens ---------------------------------
import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "./ThemeContext";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  SafeAreaView,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://connect.schoolaid.in";
const PRIMARY = "#0047AB";
const PRIMARY_LIGHT = "#EEF3FF";

export default function AddChildScreen() {
  const router = useRouter();
  const [children, setChildren] = useState([]);
  const [license, setLicense] = useState("");
  const [preview, setPreview] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();

  // ── Animations ─────────────────────────────────────────────
  const headerFade  = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const bodyFade    = useRef(new Animated.Value(0)).current;
  const bodySlide   = useRef(new Animated.Value(40)).current;
  const dotAnim1    = useRef(new Animated.Value(0.3)).current;
  const dotAnim2    = useRef(new Animated.Value(0.3)).current;
  const dotAnim3    = useRef(new Animated.Value(0.3)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const inputBorder = useRef(new Animated.Value(0)).current;
  const addBtnScale = useRef(new Animated.Value(1)).current;
  const modalScale  = useRef(new Animated.Value(0.92)).current;
  const modalFade   = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade,  { toValue: 1, duration: 550, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(headerSlide, { toValue: 0, duration: 550, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]),
      Animated.parallel([
        Animated.timing(bodyFade,  { toValue: 1, duration: 450, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(bodySlide, { toValue: 0, duration: 450, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]),
    ]).start();

    // Pulsing dots
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(anim, { toValue: 0.3, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        ])
      ).start();
    pulse(dotAnim1, 0);
    pulse(dotAnim2, 300);
    pulse(dotAnim3, 600);
  }, []);

  // Modal open animation
  const openModal = () => {
    setModalVisible(true);
    modalScale.setValue(0.92);
    modalFade.setValue(0);
    Animated.parallel([
      Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
      Animated.timing(modalFade,  { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const borderColor = inputBorder.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E0E6F0", PRIMARY],
  });

  // ── API calls ───────────────────────────────────────────────
  const fetchChildren = async () => {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/add-child/my-children`, {
      headers: { Authorization: `Bearer ${token}` , "Content-Type": "application/json" , "x-academic-year-id": await AsyncStorage.getItem("selectedYearId") ?? "16" },
    });
    const data = await res.json();
    if (res.ok) setChildren(data.children);
  };

  useEffect(() => { fetchChildren(); }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("selectedChild");
          router.replace("/login");
        },
      },
    ]);
  };

  const handlePreview = async () => {
    if (!license.trim()) {
      triggerShake();
      Alert.alert("Missing Key", "Enter a license key first.");
      return;
    }
    setLoadingPreview(true);
    const token = await AsyncStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/add-child/preview-child`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` , "x-academic-year-id": await AsyncStorage.getItem("selectedYearId") ?? "16" },
        body: JSON.stringify({ license }),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (res.ok) {
        const student = data.student || data.child || data.data || data;
        setPreview(student);
      } else {
        triggerShake();
        Alert.alert("Error", data.msg);
      }
    } catch {
      Alert.alert("Error", "Server returned an unexpected response");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleAddChild = async () => {
    setLoadingAdd(true);
    const token = await AsyncStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/add-child`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` , "x-academic-year-id": await AsyncStorage.getItem("selectedYearId") ?? "16" },
        body: JSON.stringify({ license }),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (res.ok) {
        Alert.alert("Success", data.msg);
        handleCloseModal();
        fetchChildren();
      } else {
        Alert.alert("Error", data.msg);
      }
    } catch {
      Alert.alert("Error", "Server returned an unexpected response");
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setPreview(null);
    setLicense("");
  };

  const handleSelectChild = async (item: any) => {
    const token = await AsyncStorage.getItem("token");
    const yearId = await AsyncStorage.getItem("selectedYearId");
    let classId = null;
    let sectionId = null;
    try {
      const res = await fetch(`${API_URL}/api/app/student-exams`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-academic-year-id": yearId ?? "16" },
        body: JSON.stringify({ student_id: item.id }),
      });
      const data = await res.json();
      classId = data.class_id ?? null;
      sectionId = data.section_id ?? null;
    } catch {}
    await AsyncStorage.setItem("selectedChild", JSON.stringify({
      id: item.id,
      name: item.student_firstname,
      classname: item.class_name,
      sectionname: item.section_name,
      class_id: classId,
      section_id: sectionId,
    }));
    router.replace({
      pathname: "/Dashboard",
      params: { childId: item.id, childName: item.student_firstname, classname: item.class_name, sectionname: item.section_name },
    });
  };

  // ── Child card ──────────────────────────────────────────────
  const ChildCard = ({ item, index }: { item: any; index: number }) => {
    const cardFade  = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(cardFade,  { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(cardSlide, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]).start();
    }, []);

    return (
      <Animated.View style={{ opacity: cardFade, transform: [{ translateY: cardSlide }] }}>
        <TouchableOpacity style={styles.card} onPress={() => handleSelectChild(item)} activeOpacity={0.82}>
          {/* Left accent bar */}
          <View style={styles.cardAccent} />

          {/* Avatar */}
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.student_firstname?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{item.student_firstname}</Text>
            <View style={styles.detailRow}>
              <Ionicons name="school-outline" size={12} color="#6B7280" />
              <Text style={styles.detail}>
                {item.class_name}
                {"  ·  "}
                <Text style={styles.sectionBadge}>Section {item.section_name}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.arrowWrap}>
            <Ionicons name="chevron-forward-outline" size={18} color={PRIMARY} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ─────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>

        {/* Logout */}
  <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>↪</Text>
          </TouchableOpacity>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {[dotAnim1, dotAnim2, dotAnim3].map((d, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
          ))}
        </View>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image source={require("../assets/logo.png")} style={styles.logoImage} />
        </View>

        <Text style={styles.appLabel}>SchoolAid</Text>
        <Text style={styles.headerTitle}>My Children</Text>
         {/*<Text style={styles.headerSubtitle}>
          Select a child profile to view their{"\n"}schedule and academic progress.
        </Text> */}

        {/* Stats pill */}
        <View style={styles.statsPill}>
          <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.9)" />
          <Text style={styles.statsText}>
            {children.length} {children.length === 1 ? "child" : "children"} linked
          </Text>
        </View>
      </Animated.View>

      {/* ── Body ───────────────────────────────────────────── */}
      <Animated.View style={[styles.body, { opacity: bodyFade, transform: [{ translateY: bodySlide }] }]}>
        <FlatList
          data={children}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="person-add-outline" size={36} color={PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>No children added yet</Text>
              <Text style={styles.emptyText}>
                Add a child using their school license key to get started.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => <ChildCard item={item} index={index} />}
        />

        {/* Add button */}
        <Animated.View style={{ transform: [{ scale: addBtnScale }] }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={openModal}
            onPressIn={() => Animated.spring(addBtnScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()}
            onPressOut={() => Animated.spring(addBtnScale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start()}
            activeOpacity={1}
          >
            <Ionicons name="add-circle-outline" size={20} color={PRIMARY} />
            <Text style={styles.addText}>Add Child</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={13} color="#BCC8DA" />
          <Text style={styles.hint}>
            Switch profiles anytime from the Settings menu.
          </Text>
        </View>
      </Animated.View>

      {/* ── Modal ──────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="none">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalBg}>
            <Animated.View style={[styles.modalCard, { opacity: modalFade, transform: [{ scale: modalScale }, { translateX: shakeAnim }] }]}>

              {!preview ? (
                <>
                  {/* Add step */}
                  <View style={styles.modalIconWrap}>
                    <Ionicons name="key-outline" size={28} color={PRIMARY} />
                  </View>
                  <Text style={styles.modalTitle}>Add a Child</Text>
                  <Text style={styles.modalSubtitle}>
                    Enter the child's school license key to preview their profile.
                  </Text>

                  <Text style={styles.inputLabel}>License Key</Text>
                  <Animated.View style={[styles.inputWrap, { borderColor }]}>
                    <Ionicons name="key-outline" size={16} color={focused ? PRIMARY : "#AABBD0"} />
                    <TextInput
                      style={styles.input}
                      placeholder="XXXX-XXXX-XXXX"
                      placeholderTextColor="#BCC8DA"
                      value={license}
                      onChangeText={setLicense}
                      onFocus={() => {
                        setFocused(true);
                        Animated.timing(inputBorder, { toValue: 1, duration: 200, useNativeDriver: false }).start();
                      }}
                      onBlur={() => {
                        setFocused(false);
                        Animated.timing(inputBorder, { toValue: 0, duration: 200, useNativeDriver: false }).start();
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    {license.length > 0 && (
                      <TouchableOpacity onPress={() => setLicense("")}>
                        <Ionicons name="close-circle" size={16} color="#AABBD0" />
                      </TouchableOpacity>
                    )}
                  </Animated.View>

                  <TouchableOpacity
                    style={[styles.button, loadingPreview && { opacity: 0.7 }]}
                    onPress={handlePreview}
                    activeOpacity={0.85}
                    disabled={loadingPreview}
                  >
                    {loadingPreview
                      ? <ActivityIndicator color="#fff" size="small" />
                      : (
                        <View style={styles.btnInner}>
                          <Ionicons name="search-outline" size={16} color="#fff" />
                          <Text style={styles.buttonText}>Preview Child</Text>
                        </View>
                      )
                    }
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Confirm step */}
                  <View style={styles.modalIconWrap}>
                    <Ionicons name="checkmark-circle-outline" size={28} color="#059669" />
                  </View>
                  <Text style={styles.modalTitle}>Confirm Child</Text>
                  <Text style={styles.modalSubtitle}>Is this the correct child profile?</Text>

                  {preview.profile_pic ? (
                    <Image source={{ uri: `${API_URL}${preview.profile_pic}` }} style={styles.previewImg} />
                  ) : (
                    <View style={styles.previewAvatar}>
                      <Text style={styles.previewAvatarText}>
                        {preview.student_firstname?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.previewName}>{preview.student_firstname}</Text>

                  <View style={styles.previewDetailRow}>
                    <Ionicons name="school-outline" size={13} color="#6B7280" />
                    <Text style={styles.previewDetail}>
                      {`${preview.class_name ?? "N/A"}  ·  Section ${preview.section_name ?? "N/A"}`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, styles.confirmBtn, loadingAdd && { opacity: 0.7 }]}
                    onPress={handleAddChild}
                    activeOpacity={0.85}
                    disabled={loadingAdd}
                  >
                    {loadingAdd
                      ? <ActivityIndicator color="#fff" size="small" />
                      : (
                        <View style={styles.btnInner}>
                          <Ionicons name="person-add-outline" size={16} color="#fff" />
                          <Text style={styles.buttonText}>Add This Child</Text>
                        </View>
                      )
                    }
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.backBtn} onPress={() => setPreview(null)}>
                    <Ionicons name="arrow-back-outline" size={14} color={PRIMARY} />
                    <Text style={styles.backText}>Try different key</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F4FB" },

  // Header
  header:         { backgroundColor: PRIMARY, paddingTop: 50, paddingBottom: 32, alignItems: "center", paddingHorizontal: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
logoutBtn: {
  position: "absolute",
  right: 18,
  top: 52,
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
  backgroundColor: "#fff",
  paddingVertical: 7,
  paddingHorizontal: 12,
  borderRadius: 10,
},
logoutIcon: { color: PRIMARY, fontWeight: "900", fontSize: 20 },
// DELETE logoutIcon style entirely
  dotsRow:        { flexDirection: "row", gap: 8, marginBottom: 16 },
  dot:            { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  logoWrap:       { width: 72, height: 72, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  logoImage:      { width: 58, height: 58, borderRadius: 14, resizeMode: "contain" },
  appLabel:       { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 },
  headerTitle:    { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 6 },
  headerSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  statsPill:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  statsText:      { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "700" },

  // Body
  body:           { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

  // Cards
  card:           { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, alignItems: "center", shadowColor: "#0047AB", shadowOpacity: 0.07, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: "#E8EFFA", overflow: "hidden" },
  cardAccent:     { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: PRIMARY, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  avatar:         { width: 50, height: 50, borderRadius: 25, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginRight: 14, marginLeft: 8 },
  avatarImage:    { width: 50, height: 50, borderRadius: 25, marginRight: 14, marginLeft: 8 },
  avatarText:     { fontSize: 20, fontWeight: "800", color: PRIMARY },
  cardInfo:       { flex: 1 },
  name:           { fontSize: 15, fontWeight: "700", color: "#1F2937", marginBottom: 4 },
  detailRow:      { flexDirection: "row", alignItems: "center", gap: 4 },
  detail:         { fontSize: 12, color: "#6B7280" },
  sectionBadge:   { color: PRIMARY, fontWeight: "700" },
  arrowWrap:      { width: 32, height: 32, borderRadius: 16, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center" },

  // Empty
  emptyBox:       { alignItems: "center", paddingVertical: 40, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E8EFFA", marginBottom: 16, shadowColor: "#0047AB", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  emptyIconWrap:  { width: 72, height: 72, borderRadius: 36, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle:     { fontSize: 15, fontWeight: "700", color: "#1F2937", marginBottom: 6 },
  emptyText:      { fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

  // Add button
  addButton:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 14, paddingVertical: 15, backgroundColor: "#fff", marginBottom: 12, shadowColor: PRIMARY, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  addText:        { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  hintRow:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingBottom: 12 },
  hint:           { fontSize: 11, color: "#BCC8DA", lineHeight: 18 },

  // Modal
  modalBg:        { flex: 1, backgroundColor: "rgba(0,20,60,0.5)", justifyContent: "center", paddingHorizontal: 20 },
  modalCard:      { backgroundColor: "#fff", borderRadius: 24, paddingVertical: 28, paddingHorizontal: 24, alignItems: "center", shadowColor: "#0047AB", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 14 },
  modalIconWrap:  { width: 60, height: 60, borderRadius: 30, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  modalTitle:     { fontSize: 19, fontWeight: "800", color: "#1F2937", marginBottom: 6, textAlign: "center" },
  modalSubtitle:  { fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 20, lineHeight: 19 },
  inputLabel:     { alignSelf: "flex-start", fontSize: 11, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  inputWrap:      { width: "100%", flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13, backgroundColor: "#FAFBFF", marginBottom: 16 },
  input:          { flex: 1, fontSize: 14, color: "#1F2937", fontWeight: "600", letterSpacing: 1 },
  button:         { width: "100%", backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15, alignItems: "center", justifyContent: "center", shadowColor: PRIMARY, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 5 },
  confirmBtn:     { backgroundColor: "#059669" },
  btnInner:       { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText:     { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  backBtn:        { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 14, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: PRIMARY_LIGHT, borderRadius: 8 },
  backText:       { fontSize: 13, color: PRIMARY, fontWeight: "600" },
  cancelBtn:      { marginTop: 14, paddingVertical: 8 },
  cancelText:     { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },

  // Preview
  previewImg:         { width: 84, height: 84, borderRadius: 42, marginBottom: 12, borderWidth: 3, borderColor: PRIMARY_LIGHT },
  previewAvatar:      { width: 84, height: 84, borderRadius: 42, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 3, borderColor: "#DBEAFE" },
  previewAvatarText:  { fontSize: 32, fontWeight: "800", color: PRIMARY },
  previewName:        { fontSize: 18, fontWeight: "800", color: "#1F2937", marginBottom: 6, textAlign: "center" },
  previewDetailRow:   { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 22 },
  previewDetail:      { fontSize: 13, color: "#6B7280" },
});