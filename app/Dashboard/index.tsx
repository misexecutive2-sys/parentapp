// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   Alert,
//   SafeAreaView,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import { router, useLocalSearchParams } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import Ionicons from "@expo/vector-icons/build/Ionicons";



// export default function DashboardScreen() {
//   const { childId, childName, classname, sectionname } = useLocalSearchParams<{ childId: string; childName: string; classname: string ; sectionname :string }>();

//   const [years, setYears] = useState<any[]>([]);
//   const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
//   const [child, setChild] = useState<any>(null);

//   const modules = [
//     { title: "Attendance", icon: "📋", route: "/Dashboard/attendance" },
//     { title: "Notice Section", icon: "📢", route: "/Dashboard/noticeboard" },
//     { title: "Exam", icon: "📝", route: "/Dashboard/exam" },
//     { title: "School Diary", icon: "📓", route: "/Dashboard/schooldiary" },
//     { title: "Insights & Analysis", icon: "📊", route: "/Dashboard/insight" },
//     // { title: "Study", icon: "📚", route: "/Dashboard/study" },
//     {title: "Fees", icon: "💰", route: "/Dashboard/fees" },
//     { title: "Message Teacher", icon: "💬", route: "/Dashboard/message" },
//   ];

//   // ── Fetch financial years on mount ───────────────────
//   useEffect(() => {
//     fetchYears();
//   }, []);
  

// // const fetchYears = async () => {
// //   try {
// //     const token = await AsyncStorage.getItem("token");
// //     console.log("Token:", token); // 👈
// //     const res = await fetch(
// //       "https://connect.schoolaid.in/api/app/financial-years",
// //       { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
// //     );
// //     console.log("Years status:", res.status); // 👈
// //     const data = await res.json();
// //     console.log("Years data:", JSON.stringify(data, null, 2)); // 👈
// //     const arr = Array.isArray(data) ? data : data.data ?? [];
// //     console.log("Years array:", arr); // 👈
// //     setYears(arr);
// //     if (arr.length > 0) {
// //       setSelectedYearId(arr[0].id);
// //       await AsyncStorage.setItem("selectedYearId", String(arr[0].id));
// //       await AsyncStorage.setItem("selectedYearLabel", arr[0].year ?? String(arr[0].id));
// //     }
// //   } catch (err) {
// //     console.error("Failed to fetch years:", err);
// //   }
// // };
// const fetchYears = async () => {
//   try {
//     const token = await AsyncStorage.getItem("token");
//     console.log("=== YEARS DEBUG ===");
//     console.log("Token:", token);
    
//     const res = await fetch(
//       "https://connect.schoolaid.in/api/app/financial-years",
//       { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
//     );
//     console.log("Years status:", res.status);
//     const data = await res.json();
//     console.log("Years response:", JSON.stringify(data, null, 2));
    
//     const arr = Array.isArray(data) ? data : data.data ?? [];
//     console.log("Years array length:", arr.length);
//     setYears(arr);
//     if (arr.length > 0) {
//       setSelectedYearId(arr[0].id);
//       await AsyncStorage.setItem("selectedYearId", String(arr[0].id));
//       await AsyncStorage.setItem("selectedYearLabel", arr[0].year ?? String(arr[0].id));
//     }
//   } catch (err) {
//     console.error("Failed to fetch years:", err);
//   }
// };


//   // ── When parent changes year, save it globally ────────
//   const handleYearChange = async (yearId: number) => {
//     setSelectedYearId(yearId);
//     const selectedYear = years.find((y) => y.id === yearId);
//     // ✅ Save to AsyncStorage so exam, attendance, diary etc all read it
//     await AsyncStorage.setItem("selectedYearId", String(yearId));
//     await AsyncStorage.setItem("selectedYearLabel", selectedYear?.year ?? String(yearId));
//     console.log("Year changed to:", selectedYear?.year);
//   };

//   const handleLogout = () => {
//     Alert.alert("Logout", "Are you sure you want to log out?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Yes",
//         style: "destructive",
//         onPress: async () => {
//           await AsyncStorage.removeItem("token");
//           await AsyncStorage.removeItem("user");
//           await AsyncStorage.removeItem("selectedChild");
//           await AsyncStorage.removeItem("selectedYearId");
//           await AsyncStorage.removeItem("selectedYearLabel");
//           router.replace("/login");
//         },
//       },
//     ]);
//   };

//   const handleSwitchChild = async () => {
//     if (childId && childName) {
//       await AsyncStorage.setItem(
//         "selectedChild",
//         JSON.stringify({ id: childId, name: childName, classname, sectionname })
//       );
//     }
//     router.replace("/addchild");
//   };
//   useEffect(() => {
//   if (childId && childName && classname && sectionname) {
//     AsyncStorage.setItem("selectedChild", JSON.stringify({
//       id: childId,
//       name: childName,
//       classname: classname,
//       sectionname: sectionname,
//     }));
//   }
// }, [childId, childName, classname, sectionname]);

// return (
//     <SafeAreaView style={styles.safe}>

//       {/* ── Header ── */}
//       <View style={styles.header}>

//         {/* ── Top Row: Settings left, Logo center, spacer right ── */}
//         {/* <View style={styles.headerTopRow}>
//           <TouchableOpacity
//             style={styles.settingsBtn}
//             onPress={() => router.push("/Dashboard/settings")}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.settingsIcon}>⚙️</Text>
//           </TouchableOpacity>

//           <View style={styles.logoContainer}>
//             <Image source={require("../../assets/logo.png")} style={styles.logo} />
//           </View>

//           <View style={{ width: 44 }} />
//         </View> */}
//         <View style={styles.headerTopRow}>
//   {/* <View style={{ width: 44 }} />   */}

//   <TouchableOpacity
//   style={styles.settingsBtn}
//   onPress={() => router.push({
//     pathname: "/Dashboard/message",
//     params: { childId, childName }
//   })}
//   activeOpacity={0.85}
// >
//   <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
// </TouchableOpacity>

//   <View style={styles.logoContainer}>
//     <Image source={require("../../assets/logo.png")} style={styles.logo} />
//   </View>

//   <TouchableOpacity          
//     style={styles.settingsBtn}
//     onPress={() => router.push("/Dashboard/setting")}
//     activeOpacity={0.85}
//   >
//     {/* <Text style={styles.settingsIcon}>⚙️</Text> */}
//     <Ionicons name="settings-outline" size={26} color="#fff" />
//   </TouchableOpacity>
// </View>

//         <Text style={styles.headerTitle}>Welcome, {childName}</Text>
//         <Text style={styles.headerSubtitle}>
//           Class: {classname} · Section: {sectionname}
//         </Text>

//         {/* ── Year Picker ── */}
// {years.length > 0 && (
//   <View style={styles.yearPickerWrapper}>
//     <Text style={styles.yearPickerLabel}>Academic Year</Text>
//     <View style={styles.yearPickerBox}>
//       <Picker
//         selectedValue={selectedYearId}
//         onValueChange={(val) => handleYearChange(val)}
//         style={styles.yearPicker}
//         dropdownIconColor="#0047AB"
//         mode="dropdown"
//       >
//         {years.map((yr) => (
//           <Picker.Item
//             key={yr.id}
//             label={yr.year ?? String(yr.id)}
//             value={yr.id}
//             color="#0047AB"
//           />
//         ))}
//       </Picker>
//     </View>
//   </View>
// )}

//         {/* ── Buttons row ── */}
//         <View style={styles.headerButtons}>
//           <TouchableOpacity
//             style={styles.switchButton}
//             onPress={handleSwitchChild}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.switchText}>Switch Child</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.logoutButton}
//             onPress={handleLogout}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.logoutText}>Logout</Text>
//           </TouchableOpacity>
//         </View>

//       </View>

//       {/* ── Cards Grid ── */}
//       <ScrollView
//         contentContainerStyle={styles.cardContainer}
//         showsVerticalScrollIndicator={false}
//       >
//         {modules.map((mod, idx) => (
//           <TouchableOpacity
//             key={idx}
//             style={styles.card}
//               // ✅ FIXED
//             onPress={() =>
//               router.push({
//                 pathname: mod.route,
//                 params: { 
//                   yearId: selectedYearId,
//                   childId: childId,
//                   childName: childName,
//                   classname: classname,
//                   sectionname: sectionname,
//                 },
//               })
//             }
//             activeOpacity={0.85}
//           >
//             <Text style={styles.cardIcon}>{mod.icon}</Text>
//             <Text style={styles.cardText}>{mod.title}</Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>

//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: "#F5F7FA" },

//   // Header
//   header: {
//     backgroundColor: "#0047AB",
//     paddingTop: 50,
//     paddingBottom: 24,
//     alignItems: "center",
//     paddingHorizontal: 20,
//   },
//   logoContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 20,
//     backgroundColor: "#ffffff",
//     alignItems: "center",
//     justifyContent: "center",
//     // marginBottom: ,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   logo: { width: "80%", height: "80%", resizeMode: "contain" },
//   headerTitle: {
//     color: "#ffffff",
//     fontSize: 24,
//     fontWeight: "800",
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 13,
//     marginBottom: 5,
//   },

//   // Year Picker
// yearPickerWrapper: {
//   flexDirection: "row",
//   alignItems: "center",
//   marginBottom: 10,
//   gap: 8,
// },
// yearPickerLabel: {
//   color: "rgba(255,255,255,0.85)",
//   fontSize: 12,
//   fontWeight: "600",
// },
// yearPickerBox: {
//   backgroundColor: "#ffffff",   // ✅ white bg — dark text always visible
//   borderRadius: 8,
//   borderWidth: 1,
//   borderColor: "rgba(255,255,255,0.6)",
//   height: 36,
//   overflow: "hidden",
// },
// yearPicker: {
//   height: 50,
//   width: 140,
//   color: "#0047AB", 
//   marginTop: -6            
// },

//   // Buttons
//   headerButtons: { flexDirection: "row", gap: 10 },
//   switchButton: {
//     backgroundColor: "#ffffff",
//     paddingVertical: 6,
//     paddingHorizontal: 14,
//     borderRadius: 8,
//   },
//   switchText: { color: "#0047AB", fontWeight: "700", fontSize: 13 },
//   logoutButton: {
//     backgroundColor: "#ffffff",
//     paddingVertical: 6,
//     paddingHorizontal: 14,
//     borderRadius: 8,
//   },
//   logoutText: { color: "#0047AB", fontWeight: "700", fontSize: 13 },

//   // Cards
//   cardContainer: {
//     padding: 20,
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },
//   card: {
//     width: "48%",
//     backgroundColor: "#ffffff",
//     paddingVertical: 24,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//     marginBottom: 14,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#E0E6F0",
//     shadowColor: "#000",
//     shadowOpacity: 0.06,
//     shadowOffset: { width: 0, height: 3 },
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   cardIcon: { fontSize: 30, marginBottom: 10 },
//   cardText: {
//     fontSize: 13,
//     fontWeight: "700",
//     color: "#0047AB",
//     textAlign: "center",
//     letterSpacing: 0.2,
//   },
//   headerTopRow: {
//   flexDirection: "row",
//   alignItems: "center",
//   justifyContent: "space-between",
//   width: "100%",
//   marginBottom: 12,
// },
// settingsBtn: {
//   width: 44,
//   height: 44,
//   backgroundColor: "rgba(255,255,255,0.2)",
//   borderRadius: 12,
//   alignItems: "center",
//   justifyContent: "center",
// },
// settingsIcon: {
//   fontSize: 22,
//   color: "#fff",
// },
// });

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY = "#0047AB";

export default function DashboardScreen() {
  const { childId, childName, classname, sectionname } = useLocalSearchParams<{
    childId: string;
    childName: string;
    classname: string;
    sectionname: string;
  }>();

  const [years, setYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const modules = [
    { title: "Attendance",      icon: "📋", route: "/Dashboard/attendance" },
    { title: "Notice Board",    icon: "📢", route: "/Dashboard/noticeboard" },
    { title: "Exam",            icon: "📝", route: "/Dashboard/exam" },
    { title: "School Diary",    icon: "📓", route: "/Dashboard/schooldiary" },
    { title: "Insights",        icon: "📊", route: "/Dashboard/insight" },
    { title: "Fees",            icon: "💰", route: "/Dashboard/fees" },
    { title: "Message Teacher", icon: "💬", route: "/Dashboard/message" },
  ];

  useEffect(() => { fetchYears(); }, []);

  useEffect(() => {
    if (childId && childName && classname && sectionname) {
      AsyncStorage.setItem("selectedChild", JSON.stringify({
        id: childId, name: childName, classname, sectionname,
      }));
    }
  }, [childId, childName, classname, sectionname]);

  const fetchYears = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        "https://connect.schoolaid.in/api/app/financial-years",
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data ?? [];
      setYears(arr);
      if (arr.length > 0) {
        setSelectedYearId(arr[0].id);
        await AsyncStorage.setItem("selectedYearId", String(arr[0].id));
        await AsyncStorage.setItem("selectedYearLabel", arr[0].year ?? String(arr[0].id));
      }
    } catch (err) {
      console.error("Failed to fetch years:", err);
    }
  };

  const handleYearChange = async (yearId: number) => {
    setSelectedYearId(yearId);
    const y = years.find((yr) => yr.id === yearId);
    await AsyncStorage.setItem("selectedYearId", String(yearId));
    await AsyncStorage.setItem("selectedYearLabel", y?.year ?? String(yearId));
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "user", "selectedChild", "selectedYearId", "selectedYearLabel"]);
          router.replace("/login");
        },
      },
    ]);
  };

  const handleSwitchChild = () => { setSidebarOpen(false); router.replace("/addchild"); };

  const getInitials = (name: string) => {
    const parts = (name ?? "").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name ?? "S").substring(0, 2).toUpperCase();
  };

  const navigateTo = (route: string) => {
    router.push({
      pathname: route,
      params: { yearId: selectedYearId, childId, childName, classname, sectionname },
    });
  };

  const selectedYearLabel = years.find((y) => y.id === selectedYearId)?.year ?? "";

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── HEADER ── */}
      <View style={styles.header}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.logoBox}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
          </View>
          <View style={styles.topBarCenter}>
            <Text style={styles.schoolLabel}>School Aid</Text>
            {selectedYearLabel ? (
              <View style={styles.yearPill}>
                <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.85)" />
                <Text style={styles.yearPillText}>{selectedYearLabel}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setSidebarOpen(true)} activeOpacity={0.8}>
            <Ionicons name="menu-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Child info card — floats over the curved bottom */}
        <View style={styles.childCard}>
          <View style={styles.childAvatarWrap}>
            <View style={styles.childAvatar}>
              <Text style={styles.childAvatarText}>{getInitials(childName ?? "")}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.childInfo}>
            <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
            <Text style={styles.childName}>{childName}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.infoBadge}>
                <Ionicons name="school-outline" size={11} color={PRIMARY} />
                <Text style={styles.infoBadgeText}>Class {classname}</Text>
              </View>
              <Text style={styles.badgeDot}>·</Text>
              <View style={styles.infoBadge}>
                <Ionicons name="layers-outline" size={11} color={PRIMARY} />
                <Text style={styles.infoBadgeText}>Section {sectionname}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigateTo("/Dashboard/noticeboard")}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

      </View>

      {/* ── MODULE GRID ── */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {modules.map((mod, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.card}
            onPress={() => navigateTo(mod.route)}
            activeOpacity={0.85}
          >
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIcon}>{mod.icon}</Text>
            </View>
            <Text style={styles.cardText}>{mod.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── SIDEBAR DRAWER ── */}
      <Modal visible={sidebarOpen} transparent animationType="fade" onRequestClose={() => setSidebarOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setSidebarOpen(false)} activeOpacity={1} />
          <View style={styles.sidebar}>

            <View style={styles.sbHeader}>
              <View style={styles.sbAvatarCircle}>
                <Text style={styles.sbAvatarText}>{getInitials(childName ?? "")}</Text>
              </View>
              <Text style={styles.sbName}>{childName}</Text>
              <Text style={styles.sbMeta}>Class {classname} · Section {sectionname}</Text>
              <TouchableOpacity style={styles.sbClose} onPress={() => setSidebarOpen(false)}>
                <Ionicons name="close-outline" size={22} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={styles.sbSection}>
                <Text style={styles.sbSectionLabel}>ACADEMIC YEAR</Text>
                {years.length > 0 && (
                  <View style={styles.sbPickerBox}>
                    <Picker
                      selectedValue={selectedYearId}
                      onValueChange={(val) => handleYearChange(val)}
                      style={styles.sbPicker}
                      dropdownIconColor={PRIMARY}
                      mode="dropdown"
                    >
                      {years.map((yr) => (
                        <Picker.Item key={yr.id} label={yr.year ?? String(yr.id)} value={yr.id} color={PRIMARY} />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>

              <View style={styles.sbSection}>
                <Text style={styles.sbSectionLabel}>QUICK LINKS</Text>

                <TouchableOpacity style={styles.sbItem} onPress={() => { setSidebarOpen(false); navigateTo("/Dashboard/message"); }}>
                  <View style={[styles.sbItemIcon, { backgroundColor: "#E3F2FD" }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1565C0" />
                  </View>
                  <Text style={styles.sbItemLabel}>Message Teacher</Text>
                  <Ionicons name="chevron-forward-outline" size={16} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.sbItem} onPress={() => { setSidebarOpen(false); router.push("/Dashboard/setting"); }}>
                  <View style={[styles.sbItemIcon, { backgroundColor: "#F3E5F5" }]}>
                    <Ionicons name="settings-outline" size={18} color="#6A1B9A" />
                  </View>
                  <Text style={styles.sbItemLabel}>Settings</Text>
                  <Ionicons name="chevron-forward-outline" size={16} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.sbItem} onPress={handleSwitchChild}>
                  <View style={[styles.sbItemIcon, { backgroundColor: "#E8F5E9" }]}>
                    <Ionicons name="people-outline" size={18} color="#2E7D32" />
                  </View>
                  <Text style={styles.sbItemLabel}>Switch Child</Text>
                  <Ionicons name="chevron-forward-outline" size={16} color="#ccc" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.sbLogout} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#C62828" />
                <Text style={styles.sbLogoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F4FF" },

  // ── Header ──
header: {
  backgroundColor: PRIMARY,
  paddingTop: 6,          // ← reduced from 12/20
  paddingHorizontal: 16,
  paddingBottom: 24,      // ← reduced from 32
  borderBottomLeftRadius: 32,
  borderBottomRightRadius: 32,
  elevation: 8,
  shadowColor: PRIMARY,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 16,
},

topBar: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 14,       // ← reduced from 22
},
logoBox: {
  width: 46,
  height: 46,
  borderRadius: 13,
  backgroundColor: "#fff",
  alignItems: "center",
  justifyContent: "center",
  overflow: "visible",      // ← was "hidden", this was clipping your logo
  elevation: 3,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,
},
  logo: { width: 38, height: 38, resizeMode: "contain" },
  topBarCenter: {
    flex: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  schoolLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  yearPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  yearPillText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 10,
    fontWeight: "700",
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  // Child card
childCard: {
  backgroundColor: "#fff",
  borderRadius: 20,
  padding: 12,            // ← reduced from 16
  flexDirection: "row",
  alignItems: "center",
  gap: 12,                // ← reduced from 14
  elevation: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
},
  childAvatarWrap: { position: "relative" },
childAvatar: {
  width: 46,              // ← reduced from 54
  height: 46,             // ← reduced from 54
  borderRadius: 23,
  backgroundColor: "#E8F0FE",
  borderWidth: 2,
  borderColor: PRIMARY,
  alignItems: "center",
  justifyContent: "center",
},
childAvatarText: { color: PRIMARY, fontSize: 16, fontWeight: "900" },  // ← fontSize reduced
  // childAvatarText: { color: PRIMARY, fontSize: 19, fontWeight: "900" },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  childInfo: { flex: 1 },
  greetingText: { fontSize: 10, color: "#9CA3AF", fontWeight: "500", marginBottom: 1 },
childName: { fontSize: 15, fontWeight: "800", color: "#1A1A2E", marginBottom: 4 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  infoBadgeText: { fontSize: 10, fontWeight: "700", color: PRIMARY },
  badgeDot: { color: "#D1D5DB", fontSize: 14 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Grid ──
  grid: {
    padding: 16,
    paddingTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8EEFF",
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardIcon: { fontSize: 26 },
  cardText: { fontSize: 12, fontWeight: "700", color: "#1A1A2E", textAlign: "center" },

  // ── Sidebar ──
  overlay: { flex: 1, flexDirection: "row" },
  overlayBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sidebar: {
    width: 280,
    backgroundColor: "#fff",
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sbHeader: {
    backgroundColor: PRIMARY,
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  sbAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  sbAvatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sbName: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 3 },
  sbMeta: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  sbClose: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sbSection: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 4 },
  sbSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sbPickerBox: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    overflow: "hidden",
    height: 44,
  },
  sbPicker: { height: 56, marginTop: -6, color: PRIMARY },
  sbItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F2F8",
    gap: 12,
  },
  sbItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sbItemLabel: { flex: 1, fontSize: 14, color: "#1A1A2E", fontWeight: "500" },
  sbLogout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginTop: 8,
    padding: 14,
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  sbLogoutText: { fontSize: 14, fontWeight: "700", color: "#C62828" },
});