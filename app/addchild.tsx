import React, { useEffect, useState } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const API_URL = "https://connect.schoolaid.in";

export default function AddChildScreen() {
  const router = useRouter();
  const [children, setChildren] = useState([]);
  const [license, setLicense] = useState("");
  const [preview, setPreview] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();

  const fetchChildren = async () => {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/add-child/my-children`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setChildren(data.children);
  };

  const handleDeleteChild = async (childId: number, childName: string) => {
  Alert.alert(
    "Remove Child",
    `Are you sure you want to remove ${childName} from your account?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/add-child/${childId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
              Alert.alert("Success", data.msg ?? "Child removed successfully");
              fetchChildren(); // ✅ refresh list
            } else {
              Alert.alert("Error", data.msg ?? "Could not remove child");
            }
          } catch (err) {
            Alert.alert("Error", "Network issue. Please try again.");
          }
        },
      },
    ],
    { cancelable: true }
  );
};

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("selectedChild"); // ✅ clear child too
          router.replace("/login");
        },
      },
    ]);
  };

  const handlePreview = async () => {
    if (!license) {
      Alert.alert("Error", "Enter license key");
      return;
    }
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/add-child/preview-child`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ license }),
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (res.ok) setPreview(data.student);
      else Alert.alert("Error", data.msg);
    } catch (e) {
      Alert.alert("Error", "Server returned an unexpected response");
    }
  };

  const handleAddChild = async () => {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/add-child`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ license }),
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (res.ok) {
        Alert.alert("Success", data.msg);
        setModalVisible(false);
        setPreview(null);
        setLicense("");
        fetchChildren();
      } else {
        Alert.alert("Error", data.msg);
      }
    } catch (e) {
      Alert.alert("Error", "Server returned an unexpected response");
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setPreview(null);
    setLicense("");
  };

  // ✅ Save child to AsyncStorage then navigate
  const handleSelectChild = async (item: any) => {
    await AsyncStorage.setItem(
      "selectedChild",
      JSON.stringify({
        id: item.id,
        name: item.student_firstname,
        classname: item.class_name,
        sectionname: item.section_name,
      })
    );
    router.replace({
      pathname: "/Dashboard",
      params: { childId: item.id, childName: item.student_firstname , classname: item.class_name, sectionname: item.section_name},
    });
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Image source={require("../assets/logo.png")} style={styles.logoImage} />
        <Text style={styles.headerTitle}>My Children</Text>
        <Text style={styles.headerSubtitle}>
          Select a child profile to view their{"\n"}schedule and academic progress.
        </Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <FlatList
          data={children}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 10 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🧒</Text>
              <Text style={styles.emptyText}>
                No children added yet.{"\n"}Add a child using their license key.
              </Text>
            </View>
          }
          // renderItem={({ item }) => (
          //   <TouchableOpacity
          //     style={styles.card}
          //     onPress={() => handleSelectChild(item)} // ✅ fixed
          //     activeOpacity={0.85}
          //   >
          //     {item.profile_image ? (
          //       <Image source={{ uri: item.profile_image }} style={styles.avatarImage} />
          //     ) : (
          //       <View style={styles.avatar}>
          //         <Text style={styles.avatarText}>
          //           {item.student_firstname?.charAt(0).toUpperCase()}
          //         </Text>
          //       </View>
          //     )}
          //     <View style={styles.cardInfo}>
          //       <Text style={styles.name}>{item.student_firstname}</Text>
          //       <Text style={styles.detail}>
          //         {item.class_name} · Section{" "}
          //         <Text style={styles.sectionBadge}>{item.section_name}</Text>
          //       </Text>
          //     </View>
          //     <Text style={styles.arrow}>›</Text>
          //   </TouchableOpacity>
          // )}
          renderItem={({ item }) => (
  <View style={styles.card}>
    {/* Left — avatar + info — tappable to select */}
    <TouchableOpacity
      style={styles.cardLeft}
      onPress={() => handleSelectChild(item)}
      activeOpacity={0.85}
    >
      {item.profile_image ? (
        <Image source={{ uri: item.profile_image }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.student_firstname?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.student_firstname}</Text>
        <Text style={styles.detail}>
          {item.class_name} · Section{" "}
          <Text style={styles.sectionBadge}>{item.section_name}</Text>
        </Text>
      </View>
    </TouchableOpacity>

    {/* Right — delete button */}
    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => handleDeleteChild(item.id, item.student_firstname)}
      activeOpacity={0.7}
    >
      <Text style={styles.deleteIcon}>🗑</Text>
    </TouchableOpacity>
  </View>
)}
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.addText}>+ Add Child</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          You can switch profiles anytime from{"\n"}the Settings menu in your dashboard.
        </Text>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            {!preview ? (
              <>
                <Text style={styles.modalTitle}>Add a Child</Text>
                <Text style={styles.modalSubtitle}>
                  Enter the child's license key to preview their profile.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter License Key"
                  placeholderTextColor="#aaa"
                  value={license}
                  onChangeText={setLicense}
                />
                <TouchableOpacity style={styles.button} onPress={handlePreview} activeOpacity={0.85}>
                  <Text style={styles.buttonText}>Preview Child</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Confirm Child</Text>
                <Text style={styles.modalSubtitle}>Is this the correct child profile?</Text>
                {preview.profile_image ? (
                  <Image source={{ uri: preview.profile_image }} style={styles.previewImg} />
                ) : (
                  <View style={styles.previewAvatar}>
                    <Text style={styles.previewAvatarText}>
                      {preview.student_name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.previewName}>{preview.student_name}</Text>
                <Text style={styles.previewDetail}>
                  {preview.classname} · {preview.sectionname}
                </Text>
                <TouchableOpacity style={styles.button} onPress={handleAddChild} activeOpacity={0.85}>
                  <Text style={styles.buttonText}>✓ Add This Child</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    backgroundColor: "#0047AB",
    paddingTop: 50,
    paddingBottom: 36,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  logoutBtn: {
    position: "absolute",
    right: 18,
    top: 52,
    backgroundColor: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  logoutText: { color: "#0047AB", fontWeight: "700", fontSize: 13 },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    resizeMode: "contain",
    backgroundColor: "#ffffff",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
card: {
  flexDirection: "row",
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.07,
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 8,
  elevation: 3,
  borderWidth: 1,
  borderColor: "#E0E6F0",
},
cardLeft: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
},
deleteBtn: {
  padding: 8,
  borderRadius: 8,
  backgroundColor: "#fee2e2",
  marginLeft: 8,
},
deleteIcon: {
  fontSize: 16,
},
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E8F0FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarImage: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  avatarText: { fontSize: 22, fontWeight: "800", color: "#0047AB" },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 3 },
  detail: { fontSize: 13, color: "#666" },
  sectionBadge: { color: "#0047AB", fontWeight: "700" },
  arrow: { fontSize: 26, color: "#0047AB", marginLeft: 8 },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 20 },
  addButton: {
    borderWidth: 1.5,
    borderColor: "#0047AB",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#ffffff",
  },
  addText: { color: "#0047AB", fontSize: 15, fontWeight: "600" },
  hint: { textAlign: "center", fontSize: 12, color: "#aaa", lineHeight: 18, paddingBottom: 10 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0047AB", marginBottom: 6, textAlign: "center" },
  modalSubtitle: { fontSize: 13, color: "#888", textAlign: "center", marginBottom: 24 },
  input: {
    width: "100%",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#222",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E6F0",
  },
  button: {
    width: "100%",
    backgroundColor: "#0047AB",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 4,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.4 },
  cancelBtn: { marginTop: 12, paddingVertical: 8 },
  cancelText: { fontSize: 14, color: "#888", fontWeight: "500" },
  previewImg: { width: 90, height: 90, borderRadius: 45, marginBottom: 14 },
  previewAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8F0FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  previewAvatarText: { fontSize: 36, fontWeight: "800", color: "#0047AB" },
  previewName: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 4, textAlign: "center" },
  previewDetail: { fontSize: 13, color: "#888", marginBottom: 24, textAlign: "center" },
});