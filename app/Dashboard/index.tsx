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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/build/Ionicons";



export default function DashboardScreen() {
  const { childId, childName, classname, sectionname } = useLocalSearchParams<{ childId: string; childName: string; classname: string ; sectionname :string }>();

  const [years, setYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [child, setChild] = useState<any>(null);

  const modules = [
    { title: "Attendance", icon: "📋", route: "/Dashboard/attendance" },
    { title: "Notice Section", icon: "📢", route: "/Dashboard/noticeboard" },
    { title: "Exam", icon: "📝", route: "/Dashboard/exam" },
    { title: "School Diary", icon: "📓", route: "/Dashboard/schooldiary" },
    { title: "Insights & Analysis", icon: "📊", route: "/Dashboard/insight" },
    { title: "Study", icon: "📚", route: "/Dashboard/study" },
    {title: "Fees", icon: "💰", route: "/Dashboard/fees" },
  ];

  // ── Fetch financial years on mount ───────────────────
  useEffect(() => {
    fetchYears();
  }, []);
  

  // const fetchYears = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem("token");
  //     console.log("Fetching years with token:", token);
  //     const res = await fetch(
  //       "https://connect.schoolaid.in/api/app/financial-years",
  //       { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
  //     );
  //     const data = await res.json();
  //     const arr = Array.isArray(data) ? data : data.data ?? [];
  //     setYears(arr);
  //     if (arr.length > 0) {
  //       setSelectedYearId(arr[0].id);
  //       // ✅ Save default year to AsyncStorage so all screens can read it
  //       await AsyncStorage.setItem("selectedYearId", String(arr[0].id));
  //       await AsyncStorage.setItem("selectedYearLabel", arr[0].year ?? String(arr[0].id));
  //     }
  //   } catch (err) {
  //     console.error("Failed to fetch years:", err);
  //   }
  // };

// const fetchYears = async () => {
//   try {
//     const token = await AsyncStorage.getItem("token");
//     console.log("Token:", token); // 👈
//     const res = await fetch(
//       "https://connect.schoolaid.in/api/app/financial-years",
//       { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
//     );
//     console.log("Years status:", res.status); // 👈
//     const data = await res.json();
//     console.log("Years data:", JSON.stringify(data, null, 2)); // 👈
//     const arr = Array.isArray(data) ? data : data.data ?? [];
//     console.log("Years array:", arr); // 👈
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
const fetchYears = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log("=== YEARS DEBUG ===");
    console.log("Token:", token);
    
    const res = await fetch(
      "https://connect.schoolaid.in/api/app/financial-years",
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
    );
    console.log("Years status:", res.status);
    const data = await res.json();
    console.log("Years response:", JSON.stringify(data, null, 2));
    
    const arr = Array.isArray(data) ? data : data.data ?? [];
    console.log("Years array length:", arr.length);
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


  // ── When parent changes year, save it globally ────────
  const handleYearChange = async (yearId: number) => {
    setSelectedYearId(yearId);
    const selectedYear = years.find((y) => y.id === yearId);
    // ✅ Save to AsyncStorage so exam, attendance, diary etc all read it
    await AsyncStorage.setItem("selectedYearId", String(yearId));
    await AsyncStorage.setItem("selectedYearLabel", selectedYear?.year ?? String(yearId));
    console.log("Year changed to:", selectedYear?.year);
  };

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
          await AsyncStorage.removeItem("selectedYearId");
          await AsyncStorage.removeItem("selectedYearLabel");
          router.replace("/login");
        },
      },
    ]);
  };

  const handleSwitchChild = async () => {
    if (childId && childName) {
      await AsyncStorage.setItem(
        "selectedChild",
        JSON.stringify({ id: childId, name: childName, classname, sectionname })
      );
    }
    router.replace("/addchild");
  };
  useEffect(() => {
  if (childId && childName && classname && sectionname) {
    AsyncStorage.setItem("selectedChild", JSON.stringify({
      id: childId,
      name: childName,
      classname: classname,
      sectionname: sectionname,
    }));
  }
}, [childId, childName, classname, sectionname]);

return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>

        {/* ── Top Row: Settings left, Logo center, spacer right ── */}
        {/* <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push("/Dashboard/settings")}
            activeOpacity={0.85}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
          </View>

          <View style={{ width: 44 }} />
        </View> */}
        <View style={styles.headerTopRow}>
  <View style={{ width: 44 }} />  {/* spacer left */}

  <View style={styles.logoContainer}>
    <Image source={require("../../assets/logo.png")} style={styles.logo} />
  </View>

  <TouchableOpacity          
    style={styles.settingsBtn}
    onPress={() => router.push("/Dashboard/setting")}
    activeOpacity={0.85}
  >
    {/* <Text style={styles.settingsIcon}>⚙️</Text> */}
    <Ionicons name="settings-outline" size={26} color="#fff" />
  </TouchableOpacity>
</View>

        <Text style={styles.headerTitle}>Welcome, {childName}</Text>
        <Text style={styles.headerSubtitle}>
          Class: {classname} · Section: {sectionname}
        </Text>

        {/* ── Year Picker ── */}
        {years.length > 0 && (
          <View style={styles.yearPickerWrapper}>
            <Text style={styles.yearPickerLabel}>Academic Year</Text>
            <View style={styles.yearPickerBox}>
              <Picker
                selectedValue={selectedYearId}
                onValueChange={(val) => handleYearChange(val)}
                style={styles.yearPicker}
                dropdownIconColor="#0047AB"
              >
                {years.map((yr) => (
                  <Picker.Item
                    key={yr.id}
                    label={yr.year ?? String(yr.id)}
                    value={yr.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* ── Buttons row ── */}
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleSwitchChild}
            activeOpacity={0.85}
          >
            <Text style={styles.switchText}>Switch Child</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Cards Grid ── */}
      <ScrollView
        contentContainerStyle={styles.cardContainer}
        showsVerticalScrollIndicator={false}
      >
        {modules.map((mod, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: mod.route,
                params: { yearId: selectedYearId },
              })
            }
            activeOpacity={0.85}
          >
            <Text style={styles.cardIcon}>{mod.icon}</Text>
            <Text style={styles.cardText}>{mod.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA" },

  // Header
  header: {
    backgroundColor: "#0047AB",
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    // marginBottom: ,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: { width: "80%", height: "80%", resizeMode: "contain" },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginBottom: 5,
  },

  // Year Picker
  yearPickerWrapper: {
    width: "100%",
    marginBottom: 14,

  },
  yearPickerLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  yearPickerBox: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    overflow: "hidden",
  },
  yearPicker: {
    height: 50,
    color: "#0047AB",
  },

  // Buttons
  headerButtons: { flexDirection: "row", gap: 10 },
  switchButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  switchText: { color: "#0047AB", fontWeight: "700", fontSize: 13 },
  logoutButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  logoutText: { color: "#0047AB", fontWeight: "700", fontSize: 13 },

  // Cards
  cardContainer: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E6F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: { fontSize: 30, marginBottom: 10 },
  cardText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0047AB",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  headerTopRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: 12,
},
settingsBtn: {
  width: 44,
  height: 44,
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
},
settingsIcon: {
  fontSize: 22,
  color: "#fff",
},
});