// import React, { useState, useRef, useCallback } from "react";
// import {
//   View, Text, TextInput, TouchableOpacity, FlatList,
//   SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet,
//   ActivityIndicator, Alert, Image,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
// import Ionicons from "@expo/vector-icons/build/Ionicons";
// import { useTheme } from "../ThemeContext";
// import * as ImagePicker from "expo-image-picker";
// import * as DocumentPicker from "expo-document-picker";

// const BASE_URL = "https://connect.schoolaid.in";

// interface Message {
//   id: string;
//   text: string;
//   sender: "parent" | "teacher";
//   createdAt: string;
//   attachmentUrl?: string;
//   attachmentType?: "image" | "file";
//   attachmentName?: string;
// }

// export default function MessageScreen() {
//   const { theme } = useTheme();
//   const router = useRouter();
//   const { childId, childName, classname, sectionname } = useLocalSearchParams<{
//     childId: string;
//     childName: string;
//     classname: string;
//     sectionname: string;
//   }>();

//   const [messages, setMessages]     = useState<Message[]>([]);
//   const [inputText, setInputText]   = useState("");
//   const [loading, setLoading]       = useState(true);
//   const [sending, setSending]       = useState(false);
//   const [token, setToken]           = useState("");
//   const [threadId, setThreadId]     = useState<number | null>(null);
//   const [attachment, setAttachment] = useState<{
//     uri: string;
//     type: "image" | "file";
//     name: string;
//     mimeType: string;
//   } | null>(null);
//   const flatListRef = useRef<FlatList>(null);

//   // ── Fetch ALL messages from ALL threads ─────────────
//   const fetchMessages = async (t: string, newThreadId?: number) => {
//     setLoading(true);
//     try {
//       // Get saved thread IDs for this student
//       const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
//       const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];

//       // Include new thread ID if passed and not already saved
//       if (newThreadId && !savedIds.includes(newThreadId)) {
//         savedIds.push(newThreadId);
//         await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(savedIds));
//       }

//       console.log("Fetching thread IDs:", savedIds);

//       if (savedIds.length === 0) {
//         setMessages([]);
//         return;
//       }

//       // Fetch messages from ALL threads in parallel
//       const allArrays = await Promise.all(
//         savedIds.map(async (tid) => {
//           try {
//             const res = await fetch(
//               `${BASE_URL}/api/parent-notes/threads/${tid}/messages`,
//               {
//                 headers: {
//                   Authorization: `Bearer ${t}`,
//                   "Content-Type": "application/json",
//                 },
//               }
//             );
//             if (!res.ok) return [];
//             const data = await res.json();
//             return data.data ?? data ?? [];
//           } catch {
//             return [];
//           }
//         })
//       );

//       // Flatten + sort by date ascending
//       const combined = allArrays
//         .flat()
//         .sort((a: any, b: any) =>
//           new Date(a.created_at ?? a.createdAt).getTime() -
//           new Date(b.created_at ?? b.createdAt).getTime()
//         );

//       console.log("Total combined messages:", combined.length);

//       setMessages(
//         combined.map((m: any) => ({
//           id:             String(m.id ?? m._id ?? Math.random()),
//           text:           m.message ?? m.body ?? m.text ?? "",
//           sender:         m.sender_type === "teacher" ? "teacher" : "parent",
//           createdAt:      m.created_at ?? m.createdAt ?? new Date().toISOString(),
//           attachmentUrl:  m.attachment_url ?? undefined,
//           attachmentType: m.attachment_url ? "image" : undefined,
//           attachmentName: m.attachment_name ?? undefined,
//         }))
//       );
//     } catch (err) {
//       console.error("Fetch messages error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Focus Effect ────────────────────────────────────
//   useFocusEffect(
//     useCallback(() => {
//       const init = async () => {
//         const t = await AsyncStorage.getItem("token");
//         if (t) {
//           setToken(t);
//           fetchMessages(t);
//         }
//       };
//       init();
//     }, [childId])
//   );

//   // ── Pick Image ──────────────────────────────────────
//   const pickImage = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permission.granted) {
//       Alert.alert("Permission required", "Please allow access to your photo library.");
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 0.8,
//     });
//     if (!result.canceled && result.assets[0]) {
//       const asset = result.assets[0];
//       setAttachment({
//         uri:      asset.uri,
//         type:     "image",
//         name:     asset.fileName ?? "image.jpg",
//         mimeType: asset.mimeType ?? "image/jpeg",
//       });
//     }
//   };

//   // ── Pick File ───────────────────────────────────────
//   const pickFile = async () => {
//     const result = await DocumentPicker.getDocumentAsync({
//       type: "*/*",
//       copyToCacheDirectory: true,
//     });
//     if (!result.canceled && result.assets[0]) {
//       const asset = result.assets[0];
//       setAttachment({
//         uri:      asset.uri,
//         type:     "file",
//         name:     asset.name,
//         mimeType: asset.mimeType ?? "application/octet-stream",
//       });
//     }
//   };

//   // ── Attachment Options ──────────────────────────────
//   const showAttachmentOptions = () => {
//     Alert.alert("Attach", "Choose attachment type", [
//       { text: "📷 Photo", onPress: pickImage },
//       { text: "📄 File",  onPress: pickFile  },
//       { text: "Cancel",  style: "cancel"     },
//     ]);
//   };

//   // ── Send Message ────────────────────────────────────
//   const sendMessage = async () => {
//     if (!inputText.trim() && !attachment) return;
//     setSending(true);

//     // Optimistic message
//     const tempMsg: Message = {
//       id:             String(Date.now()),
//       text:           inputText.trim(),
//       sender:         "parent",
//       createdAt:      new Date().toISOString(),
//       attachmentUrl:  attachment?.uri ?? undefined,
//       attachmentType: attachment?.type ?? undefined,
//       attachmentName: attachment?.name ?? undefined,
//     };
//     setMessages((prev) => [...prev, tempMsg]);
//     const sentText = inputText.trim();
//     const sentFile = attachment;
//     setInputText("");
//     setAttachment(null);

//     try {
//       let res: Response;

//       if (sentFile) {
//         const formData = new FormData();
//         formData.append("student_id", String(Number(childId)));
//         if (sentText) formData.append("message", sentText);
//         formData.append("attachment", {
//           uri:  sentFile.uri,
//           type: sentFile.mimeType,
//           name: sentFile.name,
//         } as any);

//         res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
//           method: "POST",
//           headers: { Authorization: `Bearer ${token}` },
//           body: formData,
//         });
//       } else {
//         res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             student_id: Number(childId),
//             message:    sentText,
//           }),
//         });
//       }

//       if (!res.ok) {
//         setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
//         throw new Error(`${res.status}`);
//       }

//       const data = JSON.parse(await res.text());
//       console.log("Send response:", data);

//       if (data.thread_id) {
//         setThreadId(data.thread_id);

//         // ✅ Add new thread_id to the saved list
//         const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
//         const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
//         if (!savedIds.includes(data.thread_id)) {
//           savedIds.push(data.thread_id);
//           await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(savedIds));
//         }
//         console.log("All saved thread IDs:", savedIds);

//         // ✅ Refetch ALL messages so full history is shown
//         await fetchMessages(token, data.thread_id);
//       }

//       setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
//     } catch (err) {
//       console.log("Send error:", err);
//       Alert.alert("Error", "Could not send message. Please try again.");
//     } finally {
//       setSending(false);
//     }
//   };

//   // ── Logout ──────────────────────────────────────────
//   const handleLogout = () =>
//     Alert.alert("Logout", "Do you really want to logout?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Yes",
//         style: "destructive",
//         onPress: async () => {
//           await AsyncStorage.removeItem("token");
//           await AsyncStorage.removeItem("selectedChild");
//           await AsyncStorage.removeItem("selectedYearId");
//           await AsyncStorage.removeItem("selectedYearLabel");
//           router.replace("/login");
//         },
//       },
//     ]);

//   const formatTime = (iso: string) => {
//     const d = new Date(iso);
//     return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
//   };

//   const renderMessage = ({ item }: { item: Message }) => {
//     const isParent = item.sender === "parent";
//     return (
//       <View style={[msgStyles.bubble, isParent ? msgStyles.bubbleRight : msgStyles.bubbleLeft]}>
//         {!isParent && <Text style={msgStyles.senderLabel}>🧑‍🏫 Teacher</Text>}

//         {!!item.text && (
//           <Text style={[msgStyles.msgText, isParent && { color: "#fff" }]}>
//             {item.text}
//           </Text>
//         )}

//         {item.attachmentType === "image" && item.attachmentUrl && (
//           <Image
//             source={{ uri: item.attachmentUrl.startsWith("http")
//               ? item.attachmentUrl
//               : `${BASE_URL}${item.attachmentUrl}` }}
//             style={msgStyles.attachedImage}
//             resizeMode="cover"
//           />
//         )}

//         {item.attachmentType === "file" && item.attachmentUrl && (
//           <View style={msgStyles.fileChip}>
//             <Ionicons name="document-outline" size={16} color={isParent ? "#fff" : "#0047AB"} />
//             <Text style={[msgStyles.fileName, isParent && { color: "#fff" }]} numberOfLines={1}>
//               {item.attachmentName ?? "File"}
//             </Text>
//           </View>
//         )}

//         <Text style={[msgStyles.timeText, isParent && { color: "rgba(255,255,255,0.7)" }]}>
//           {formatTime(item.createdAt)}
//         </Text>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={msgStyles.safe}>

//       {/* ── Header ── */}
//       <View style={[msgStyles.headerTop, { backgroundColor: theme.primary }]}>
//         <View style={msgStyles.headerTopRow}>
//           <TouchableOpacity onPress={() => router.back()} style={msgStyles.backBtn}>
//             <Text style={msgStyles.backArrow}>↩</Text>
//           </TouchableOpacity>
//           <Text style={msgStyles.headerTitle} numberOfLines={1}>
//             Welcome, {childName}
//           </Text>
//           <View style={msgStyles.backBtn} />
//         </View>
//         <Text style={msgStyles.headerSubtitle}>
//           Class: {classname} · Section {sectionname}
//         </Text>
//         <View style={msgStyles.actions}>
//           <TouchableOpacity style={msgStyles.actionButton} onPress={() => router.push("/addchild")}>
//             <Text style={msgStyles.actionText}>Switch Child</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={msgStyles.actionButton} onPress={handleLogout}>
//             <Text style={msgStyles.actionText}>Logout</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={0}
//       >
//         {loading ? (
//           <View style={msgStyles.loadingWrapper}>
//             <ActivityIndicator size="large" color={theme.primary} />
//             <Text style={msgStyles.loadingText}>Loading messages...</Text>
//           </View>
//         ) : (
//           <FlatList
//             ref={flatListRef}
//             data={messages}
//             keyExtractor={(item) => item.id}
//             renderItem={renderMessage}
//             contentContainerStyle={msgStyles.list}
//             onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
//             ListEmptyComponent={
//               <View style={msgStyles.emptyWrapper}>
//                 <Text style={msgStyles.emptyEmoji}>💬</Text>
//                 <Text style={msgStyles.emptyTitle}>No messages yet</Text>
//                 <Text style={msgStyles.emptySub}>Send a note to the teacher below</Text>
//               </View>
//             }
//           />
//         )}

//         {/* ── Attachment Preview ── */}
//         {attachment && (
//           <View style={msgStyles.attachmentPreview}>
//             {attachment.type === "image" ? (
//               <Image source={{ uri: attachment.uri }} style={msgStyles.previewImage} />
//             ) : (
//               <View style={msgStyles.filePreviewChip}>
//                 <Ionicons name="document-outline" size={18} color="#0047AB" />
//                 <Text style={msgStyles.filePreviewName} numberOfLines={1}>{attachment.name}</Text>
//               </View>
//             )}
//             <TouchableOpacity onPress={() => setAttachment(null)} style={msgStyles.removeAttachment}>
//               <Ionicons name="close-circle" size={22} color="#EF4444" />
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* ── Input Bar ── */}
//         <View style={msgStyles.inputBar}>
//           <TouchableOpacity onPress={showAttachmentOptions} style={msgStyles.attachBtn}>
//             <Ionicons name="attach" size={24} color="#6B7280" />
//           </TouchableOpacity>

//           <TextInput
//             style={msgStyles.input}
//             value={inputText}
//             onChangeText={setInputText}
//             placeholder="Type a message..."
//             placeholderTextColor="#9CA3AF"
//             multiline
//             maxLength={500}
//           />

//           <TouchableOpacity
//             style={[
//               msgStyles.sendBtn,
//               { backgroundColor: theme.primary },
//               ((!inputText.trim() && !attachment) || sending) && { opacity: 0.5 },
//             ]}
//             onPress={sendMessage}
//             disabled={(!inputText.trim() && !attachment) || sending}
//             activeOpacity={0.8}
//           >
//             {sending
//               ? <ActivityIndicator size="small" color="#fff" />
//               : <Ionicons name="send" size={18} color="#fff" />
//             }
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>

//     </SafeAreaView>
//   );
// }

// // ── YOUR EXISTING CSS UNCHANGED ──────────────────────
// const msgStyles = StyleSheet.create({
//   safe:               { flex: 1, backgroundColor: "#F5F7FA" },
//   headerTop:          { paddingTop: 50, paddingBottom: 28, paddingHorizontal: 16, alignItems: "center" },
//   headerTopRow:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 },
//   backBtn:            { width: 36, padding: 4 },
//   backArrow:          { color: "#fff", fontSize: 24, fontWeight: "bold" },
//   headerTitle:        { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
//   headerSubtitle:     { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 12 },
//   actions:            { flexDirection: "row", gap: 12 },
//   actionButton:       { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 28, borderRadius: 10 },
//   actionText:         { fontWeight: "700", fontSize: 14 },
//   loadingWrapper:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
//   loadingText:        { fontSize: 13, color: "#6B7280", fontWeight: "600" },
//   list:               { padding: 16, paddingBottom: 8 },
//   emptyWrapper:       { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
//   emptyEmoji:         { fontSize: 52, marginBottom: 12 },
//   emptyTitle:         { fontSize: 18, fontWeight: "800", color: "#111827" },
//   emptySub:           { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
//   bubble:             { maxWidth: "78%", borderRadius: 16, padding: 12, marginBottom: 10 },
//   bubbleLeft:         { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },
//   bubbleRight:        { backgroundColor: "#0047AB", alignSelf: "flex-end", borderBottomRightRadius: 4 },
//   senderLabel:        { fontSize: 11, fontWeight: "700", color: "#6B7280", marginBottom: 4 },
//   msgText:            { fontSize: 14, color: "#111827", lineHeight: 20 },
//   timeText:           { fontSize: 10, color: "#9CA3AF", marginTop: 4, alignSelf: "flex-end" },
//   attachedImage:      { width: 200, height: 150, borderRadius: 8, marginTop: 6 },
//   fileChip:           { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
//   fileName:           { fontSize: 13, color: "#111827", flex: 1 },
//   attachmentPreview:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#F0F4FF", borderTopWidth: 1, borderTopColor: "#E5E7EB" },
//   previewImage:       { width: 50, height: 50, borderRadius: 8 },
//   filePreviewChip:    { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
//   filePreviewName:    { fontSize: 13, color: "#111827", flex: 1 },
//   removeAttachment:   { marginLeft: "auto", padding: 4 },
//   inputBar:           { flexDirection: "row", alignItems: "flex-end", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F0F0", gap: 8, marginBottom: 30 },
//   attachBtn:          { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
//   input:              { flex: 1, backgroundColor: "#F9FAFB", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#111827", maxHeight: 100, borderWidth: 1, borderColor: "#E5E7EB" },
//   sendBtn:            { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
// });

import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet,
  ActivityIndicator, Alert, Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useTheme } from "../ThemeContext";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const BASE_URL = "https://connect.schoolaid.in";

interface Message {
  id: string;
  text: string;
  sender: "parent" | "teacher";
  createdAt: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "file";
  attachmentName?: string;
}

interface AttachmentItem {
  uri: string;
  type: "image" | "file";
  name: string;
  mimeType: string;
}

export default function MessageScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { childId, childName, classname, sectionname } = useLocalSearchParams<{
    childId: string;
    childName: string;
    classname: string;
    sectionname: string;
  }>();

  const [messages,    setMessages]    = useState<Message[]>([]);
  const [inputText,   setInputText]   = useState("");
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [token,       setToken]       = useState("");
  const [threadId,    setThreadId]    = useState<number | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // ── Fetch ALL messages from ALL threads ─────────────
  const fetchMessages = async (t: string, newThreadId?: number) => {
    setLoading(true);
    try {
      const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
      const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];

      if (newThreadId && !savedIds.includes(newThreadId)) {
        savedIds.push(newThreadId);
        await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(savedIds));
      }

      if (savedIds.length === 0) { setMessages([]); return; }

      const allArrays = await Promise.all(
        savedIds.map(async (tid) => {
          try {
            const res = await fetch(
              `${BASE_URL}/api/parent-notes/threads/${tid}/messages`,
              { headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } }
            );
            if (!res.ok) return [];
            const data = await res.json();
            return data.data ?? data ?? [];
          } catch { return []; }
        })
      );

      const combined = allArrays
        .flat()
        .sort((a: any, b: any) =>
          new Date(a.created_at ?? a.createdAt).getTime() -
          new Date(b.created_at ?? b.createdAt).getTime()
        );

      setMessages(
        combined.map((m: any) => ({
          id:             String(m.id ?? m._id ?? Math.random()),
          text:           m.message ?? m.body ?? m.text ?? "",
          sender:         m.sender_type === "teacher" ? "teacher" : "parent",
          createdAt:      m.created_at ?? m.createdAt ?? new Date().toISOString(),
          attachmentUrl:  m.attachment_url ?? undefined,
          attachmentType: m.attachment_url ? "image" : undefined,
          attachmentName: m.attachment_name ?? undefined,
        }))
      );
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Focus Effect ────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const t = await AsyncStorage.getItem("token");
        if (t) { setToken(t); fetchMessages(t); }
      };
      init();
    }, [childId])
  );

  // ── Pick Images (multi) ─────────────────────────────
  // const pickImage = async () => {
  //   const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //   if (!permission.granted) {
  //     Alert.alert("Permission required", "Please allow access to your photo library.");
  //     return;
  //   }
  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     quality: 0.8,
  //     allowsMultipleSelection: true,
  //   });
  //   if (!result.canceled && result.assets.length > 0) {
  //     const newItems: AttachmentItem[] = result.assets.map((asset) => ({
  //       uri:      asset.uri,
  //       type:     "image",
  //       name:     asset.fileName ?? "image.jpg",
  //       mimeType: asset.mimeType ?? "image/jpeg",
  //     }));
  //     setAttachments((prev) => [...prev, ...newItems]);
  //   }
  // };

  // ── Pick Images (multi) ─────────────────────────────
const pickImage = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission required", "Please allow access to your photo library.");
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],   // ✅ fixed deprecation warning
    quality: 0.8,
    allowsMultipleSelection: true,
  });
  if (!result.canceled && result.assets.length > 0) {
    const newItems: AttachmentItem[] = result.assets.map((asset) => ({
      uri:      asset.uri,
      type:     "image",
      name:     asset.fileName ?? "image.jpg",
      mimeType: asset.mimeType ?? "image/jpeg",
    }));
    setAttachments((prev) => [...prev, ...newItems]);
  }
};

  // ── Pick Files (multi) ──────────────────────────────
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newItems: AttachmentItem[] = result.assets.map((asset) => ({
        uri:      asset.uri,
        type:     "file",
        name:     asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
      }));
      setAttachments((prev) => [...prev, ...newItems]);
    }
  };

  // ── Attachment Options ──────────────────────────────
  const showAttachmentOptions = () => {
    Alert.alert("Attach", "Choose attachment type", [
      { text: "📷 Photo", onPress: pickImage },
      { text: "📄 File",  onPress: pickFile  },
      { text: "Cancel",  style: "cancel"     },
    ]);
  };

  // ── Remove single attachment ────────────────────────
  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Send Message ────────────────────────────────────
  // const sendMessage = async () => {
  //   if (!inputText.trim() && attachments.length === 0) return;
  //   setSending(true);

  //   const tempMsg: Message = {
  //     id:             String(Date.now()),
  //     text:           inputText.trim(),
  //     sender:         "parent",
  //     createdAt:      new Date().toISOString(),
  //     attachmentUrl:  attachments[0]?.uri ?? undefined,
  //     attachmentType: attachments[0]?.type ?? undefined,
  //     attachmentName: attachments[0]?.name ?? undefined,
  //   };
  //   setMessages((prev) => [...prev, tempMsg]);
  //   const sentText  = inputText.trim();
  //   const sentFiles = attachments;
  //   setInputText("");
  //   setAttachments([]);

  //   try {
  //     let res: Response;

  //     if (sentFiles.length > 0) {
  //       const formData = new FormData();
  //       formData.append("student_id", String(Number(childId)));
  //       if (sentText) formData.append("message", sentText);
  //       sentFiles.forEach((f, i) => {
  //         formData.append(sentFiles.length > 1 ? `attachment_${i}` : "attachment", {
  //           uri:  f.uri,
  //           type: f.mimeType,
  //           name: f.name,
  //         } as any);
  //       });
  //       res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
  //         method:  "POST",
  //         headers: { Authorization: `Bearer ${token}` },
  //         body:    formData,
  //       });
  //     } else {
  //       res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
  //         method:  "POST",
  //         headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  //         body:    JSON.stringify({ student_id: Number(childId), message: sentText }),
  //       });
  //     }

  //     if (!res.ok) {
  //       setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
  //       throw new Error(`${res.status}`);
  //     }

  //     const data = JSON.parse(await res.text());
  //     if (data.thread_id) {
  //       setThreadId(data.thread_id);
  //       const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
  //       const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
  //       if (!savedIds.includes(data.thread_id)) {
  //         savedIds.push(data.thread_id);
  //         await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(savedIds));
  //       }
  //       await fetchMessages(token, data.thread_id);
  //     }
  //     setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  //   } catch (err) {
  //     console.log("Send error:", err);
  //     Alert.alert("Error", "Could not send message. Please try again.");
  //   } finally {
  //     setSending(false);
  //   }
  // };

  const sendMessage = async () => {
  if (!inputText.trim() && attachments.length === 0) return;
  setSending(true);

  const tempMsg: Message = {
    id:             String(Date.now()),
    text:           inputText.trim(),
    sender:         "parent",
    createdAt:      new Date().toISOString(),
    attachmentUrl:  attachments[0]?.uri ?? undefined,
    attachmentType: attachments[0]?.type ?? undefined,
    attachmentName: attachments[0]?.name ?? undefined,
  };
  setMessages((prev) => [...prev, tempMsg]);
  const sentText  = inputText.trim();
  const sentFiles = attachments;
  setInputText("");
  setAttachments([]);

  try {
    let lastThreadId = threadId;

    if (sentFiles.length > 0) {
      // ✅ Send one request per file — most reliable approach
      for (let i = 0; i < sentFiles.length; i++) {
        const f = sentFiles[i];
        const formData = new FormData();
        formData.append("student_id", String(Number(childId)));
        // ✅ Only attach text to the first file message
        if (i === 0 && sentText) formData.append("message", sentText);
        formData.append("attachment", {
          uri:  f.uri,
          type: f.mimeType,
          name: f.name,
        } as any);

        const res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
          method:  "POST",
          headers: { Authorization: `Bearer ${token}` },
          body:    formData,
        });

        if (!res.ok) {
          const errText = await res.text();
          console.log(`File ${i} upload failed:`, res.status, errText);
          throw new Error(`${res.status}`);
        }

        const data = JSON.parse(await res.text());
        console.log(`File ${i} send response:`, data);

        if (data.thread_id) {
          lastThreadId = data.thread_id;
          setThreadId(data.thread_id);
          const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
          const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
          if (!savedIds.includes(data.thread_id)) {
            savedIds.push(data.thread_id);
            await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(savedIds));
          }
        }
      }
    } else {
      // ✅ Text only — no attachment
      const res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ student_id: Number(childId), message: sentText }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.log("Text send failed:", res.status, errText);
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
        throw new Error(`${res.status}`);
      }

      const data = JSON.parse(await res.text());
      console.log("Text send response:", data);

      if (data.thread_id) {
        lastThreadId = data.thread_id;
        setThreadId(data.thread_id);
        const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
        const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
        if (!savedIds.includes(data.thread_id)) {
          savedIds.push(data.thread_id);
          await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(savedIds));
        }
      }
    }

    // ✅ Refetch all messages after everything is sent
    await fetchMessages(token, lastThreadId ?? undefined);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

  } catch (err) {
    console.log("Send error:", err);
    setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    Alert.alert("Error", "Could not send message. Please try again.");
  } finally {
    setSending(false);
  }
};

  // ── Logout ──────────────────────────────────────────
  const handleLogout = () =>
    Alert.alert("Logout", "Do you really want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "selectedChild", "selectedYearId", "selectedYearLabel"]);
          router.replace("/login");
        },
      },
    ]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // ── Render Message ──────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isParent = item.sender === "parent";
    return (
      <View style={[msgStyles.bubble, isParent ? msgStyles.bubbleRight : msgStyles.bubbleLeft]}>
        {!isParent && <Text style={msgStyles.senderLabel}>🧑‍🏫 Teacher</Text>}
        {!!item.text && (
          <Text style={[msgStyles.msgText, isParent && { color: "#fff" }]}>{item.text}</Text>
        )}
        {item.attachmentType === "image" && item.attachmentUrl && (
          <Image
            source={{ uri: item.attachmentUrl.startsWith("http") ? item.attachmentUrl : `${BASE_URL}${item.attachmentUrl}` }}
            style={msgStyles.attachedImage}
            resizeMode="cover"
          />
        )}
        {item.attachmentType === "file" && item.attachmentUrl && (
          <View style={msgStyles.fileChip}>
            <Ionicons name="document-outline" size={16} color={isParent ? "#fff" : "#0047AB"} />
            <Text style={[msgStyles.fileName, isParent && { color: "#fff" }]} numberOfLines={1}>
              {item.attachmentName ?? "File"}
            </Text>
          </View>
        )}
        <Text style={[msgStyles.timeText, isParent && { color: "rgba(255,255,255,0.7)" }]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={msgStyles.safe}>

      {/* ── Header ── */}
      <View style={[msgStyles.headerTop, { backgroundColor: theme.primary }]}>
        <View style={msgStyles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={msgStyles.backBtn}>
            <Text style={msgStyles.backArrow}>↩</Text>
          </TouchableOpacity>
          <Text style={msgStyles.headerTitle} numberOfLines={1}>Welcome, {childName}</Text>
          <View style={msgStyles.backBtn} />
        </View>
        <Text style={msgStyles.headerSubtitle}>Class: {classname} · Section {sectionname}</Text>
        <View style={msgStyles.actions}>
          <TouchableOpacity style={msgStyles.actionButton} onPress={() => router.push("/addchild")}>
            <Text style={msgStyles.actionText}>Switch Child</Text>
          </TouchableOpacity>
          <TouchableOpacity style={msgStyles.actionButton} onPress={handleLogout}>
            <Text style={msgStyles.actionText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={msgStyles.loadingWrapper}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={msgStyles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={msgStyles.list}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={msgStyles.emptyWrapper}>
                <Text style={msgStyles.emptyEmoji}>💬</Text>
                <Text style={msgStyles.emptyTitle}>No messages yet</Text>
                <Text style={msgStyles.emptySub}>Send a note to the teacher below</Text>
              </View>
            }
          />
        )}

        {/* ── Multi Attachment Preview ── */}
        {attachments.length > 0 && (
          <View style={msgStyles.attachmentPreviewWrap}>
            {attachments.map((att, idx) => (
              <View key={idx} style={msgStyles.attachmentPreview}>
                {att.type === "image" ? (
                  <Image source={{ uri: att.uri }} style={msgStyles.previewImage} />
                ) : (
                  <View style={msgStyles.filePreviewChip}>
                    <Ionicons name="document-outline" size={18} color="#0047AB" />
                    <Text style={msgStyles.filePreviewName} numberOfLines={1}>{att.name}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => removeAttachment(idx)} style={msgStyles.removeAttachment}>
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Input Bar ── */}
        <View style={msgStyles.inputBar}>
          <TouchableOpacity onPress={showAttachmentOptions} style={msgStyles.attachBtn}>
            <Ionicons name="attach" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TextInput
            style={msgStyles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              msgStyles.sendBtn,
              { backgroundColor: theme.primary },
              ((!inputText.trim() && attachments.length === 0) || sending) && { opacity: 0.5 },
            ]}
            onPress={sendMessage}
            disabled={(!inputText.trim() && attachments.length === 0) || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const msgStyles = StyleSheet.create({
  safe:                { flex: 1, backgroundColor: "#F5F7FA" },
  headerTop:           { paddingTop: 50, paddingBottom: 28, paddingHorizontal: 16, alignItems: "center" },
  headerTopRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 6 },
  backBtn:             { width: 36, padding: 4 },
  backArrow:           { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerTitle:         { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", flex: 1 },
  headerSubtitle:      { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 12 },
  actions:             { flexDirection: "row", gap: 12 },
  actionButton:        { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 28, borderRadius: 10 },
  actionText:          { fontWeight: "700", fontSize: 14 },
  loadingWrapper:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText:         { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  list:                { padding: 16, paddingBottom: 8 },
  emptyWrapper:        { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
  emptyEmoji:          { fontSize: 52, marginBottom: 12 },
  emptyTitle:          { fontSize: 18, fontWeight: "800", color: "#111827" },
  emptySub:            { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  bubble:              { maxWidth: "78%", borderRadius: 16, padding: 12, marginBottom: 10 },
  bubbleLeft:          { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },
  bubbleRight:         { backgroundColor: "#0047AB", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  senderLabel:         { fontSize: 11, fontWeight: "700", color: "#6B7280", marginBottom: 4 },
  msgText:             { fontSize: 14, color: "#111827", lineHeight: 20 },
  timeText:            { fontSize: 10, color: "#9CA3AF", marginTop: 4, alignSelf: "flex-end" },
  attachedImage:       { width: 200, height: 150, borderRadius: 8, marginTop: 6 },
  fileChip:            { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  fileName:            { fontSize: 13, color: "#111827", flex: 1 },
  attachmentPreviewWrap:{ backgroundColor: "#F0F4FF", borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingVertical: 4 },
  attachmentPreview:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 6 },
  previewImage:        { width: 50, height: 50, borderRadius: 8 },
  filePreviewChip:     { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  filePreviewName:     { fontSize: 13, color: "#111827", flex: 1 },
  removeAttachment:    { marginLeft: "auto", padding: 4 },
  inputBar:            { flexDirection: "row", alignItems: "flex-end", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F0F0", gap: 8, marginBottom: 30 },
  attachBtn:           { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  input:               { flex: 1, backgroundColor: "#F9FAFB", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#111827", maxHeight: 100, borderWidth: 1, borderColor: "#E5E7EB" },
  sendBtn:             { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});