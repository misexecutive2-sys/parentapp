// import React, { useState, useRef, useCallback, useEffect } from "react";
// import {
//   View, Text, TextInput, TouchableOpacity, FlatList,
//   SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet,
//   ActivityIndicator, Alert, Image, Modal, ScrollView,
//   Pressable, Clipboard,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
// import Ionicons from "@expo/vector-icons/build/Ionicons";
// import { useTheme } from "../ThemeContext";
// import * as ImagePicker from "expo-image-picker";
// import * as DocumentPicker from "expo-document-picker";
// import { Audio } from "expo-av";
// import * as FileSystem from 'expo-file-system/legacy';
// import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
// import { VideoView, useVideoPlayer } from 'expo-video';




// const BASE_URL = "https://connect.schoolaid.in";

// interface Message {
//   id: string;
//   text: string;
//   sender: "parent" | "teacher";
//   createdAt: string;
//   attachmentUrl?: string;
//   attachmentType?: "image" | "file" | "video";
//   attachmentName?: string;
//   replyToId?: string;       // ← NEW: store which message this replies to
//   replyToText?: string;     // ← NEW: store snippet of replied message
// }

// interface AttachmentItem {
//   uri: string;
//   type: "image" | "file" | "video";
//   name: string;
//   mimeType: string;
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

//   /// ── Core states VIDEO ─────────────────────────────────────
// const [showCamera, setShowCamera] = useState(false);
// const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
// const [cameraPermission, requestCameraPermission] = useCameraPermissions();
// const [micPermission, requestMicPermission] = useMicrophonePermissions();
// const [previewVideo, setPreviewVideo] = useState<string | null>(null);


//   const [messages,    setMessages]    = useState<Message[]>([]);
//   const [inputText,   setInputText]   = useState("");
//   const [loading,     setLoading]     = useState(true);
//   const [sending,     setSending]     = useState(false);
//   const [token,       setToken]       = useState("");
//   const [threadId,    setThreadId]    = useState<number | null>(null);
//   const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

//   // ── Feature states ──────────────────────────────────
//   const [previewItem,  setPreviewItem]  = useState<{ uri: string; type: "image" | "file"; name?: string } | null>(null);
//   const [contextMsg,   setContextMsg]   = useState<Message | null>(null);
//   const [replyTo,      setReplyTo]      = useState<Message | null>(null);
//   const [editingMsg,   setEditingMsg]   = useState<Message | null>(null);
//   const [pinnedIds,    setPinnedIds]    = useState<string[]>([]);

//   // ── Voice states ────────────────────────────────────
//   const [isRecording,    setIsRecording]    = useState(false);
//   const [isTranscribing, setIsTranscribing] = useState(false);
//   // FIX 4: track the sound object for playback
//   const [playingId,      setPlayingId]      = useState<string | null>(null);
//   const soundRef         = useRef<Audio.Sound | null>(null);
//   const recordingRef     = useRef<Audio.Recording | null>(null);

//   const flatListRef = useRef<FlatList>(null);
//   const inputRef    = useRef<TextInput>(null);

//   // Use refs for context menu actions to avoid stale closures
//   const contextMsgRef  = useRef<Message | null>(null);
//   const replyToRef     = useRef<Message | null>(null);
//   const editingMsgRef  = useRef<Message | null>(null);
//   const pinnedIdsRef   = useRef<string[]>([]);
//   // FIX 1: ref to always have latest inputText for edit
//   const inputTextRef   = useRef("");
//     // ── video states ────────────────────────────────────
// const cameraRef = useRef<CameraView>(null);
// const [isVideoRecording, setIsVideoRecording] = useState(false);

//   // Keep refs in sync with state
//   useEffect(() => { contextMsgRef.current  = contextMsg;  }, [contextMsg]);
//   useEffect(() => { replyToRef.current     = replyTo;     }, [replyTo]);
//   useEffect(() => { editingMsgRef.current  = editingMsg;  }, [editingMsg]);
//   useEffect(() => { pinnedIdsRef.current   = pinnedIds;   }, [pinnedIds]);
//   // FIX 1: keep inputText ref in sync
//   useEffect(() => { inputTextRef.current   = inputText;   }, [inputText]);

//   // ── Load pinned IDs ─────────────────────────────────
//   const loadPinned = async () => {
//     try {
//       const raw = await AsyncStorage.getItem(`pinnedMsgs_${childId}`);
//       if (raw) setPinnedIds(JSON.parse(raw));
//     } catch {}
//   };

//   // ── Fetch ALL messages ──────────────────────────────
//   const fetchMessages = async (t: string, newThreadId?: number) => {
//     setLoading(true);
//     try {
//       const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
//       const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];

//       if (newThreadId && !savedIds.includes(newThreadId)) {
//         savedIds.push(newThreadId);
//         await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(savedIds));
//       }

//       if (savedIds.length === 0) { setMessages([]); return; }

//       const allArrays = await Promise.all(
//         savedIds.map(async (tid) => {
//           try {
//             const res = await fetch(
//               `${BASE_URL}/api/parent-notes/threads/${tid}/messages`,
//               { headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } }
//             );
//             if (!res.ok) return [];
//             const data = await res.json();
//             return data.data ?? data ?? [];
//           } catch { return []; }
//         })
//       );

//       const combined = allArrays
//         .flat()
//         .sort((a: any, b: any) =>
//           new Date(a.created_at ?? a.createdAt).getTime() -
//           new Date(b.created_at ?? b.createdAt).getTime()
//         );

//       setMessages(
//         combined.map((m: any) => ({
//           id:             String(m.id ?? m._id ?? Math.random()),
//           text:           m.message ?? m.body ?? m.text ?? "",
//           sender:         m.sender_type === "teacher" ? "teacher" : "parent",
//           createdAt:      m.created_at ?? m.createdAt ?? new Date().toISOString(),
//           attachmentUrl:  m.attachment_url ?? undefined,
//           attachmentType: m.attachment_url ? "image" : undefined,
//           attachmentName: m.attachment_name ?? undefined,
//           // FIX 2: map reply fields from API if your backend returns them
//           replyToId:      m.reply_to_id ? String(m.reply_to_id) : undefined,
//           replyToText:    m.reply_to_text ?? m.reply_message ?? undefined,
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
//         if (t) { setToken(t); fetchMessages(t); }
//         await loadPinned();
//       };
//       init();
//     }, [childId])
//   );

//   // ── Cleanup sound on unmount ─────────────────────────
//   useEffect(() => {
//     return () => {
//       soundRef.current?.unloadAsync();
//     };
//   }, []);

//   // ── Pick Images ─────────────────────────────────────
//   const pickImage = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permission.granted) {
//       Alert.alert("Permission required", "Please allow access to your photo library.");
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ["images"],
//       quality: 0.8,
//       allowsMultipleSelection: true,
//     });
//     if (!result.canceled && result.assets.length > 0) {
//       const newItems: AttachmentItem[] = result.assets.map((asset) => ({
//         uri: asset.uri, type: "image",
//         name: asset.fileName ?? "image.jpg",
//         mimeType: asset.mimeType ?? "image/jpeg",
//       }));
//       setAttachments((prev) => [...prev, ...newItems]);
//     }
//   };

//   // ── Open Camera for Video ─────────────────────────────
//   const openCamera = async () => {
//   if (!cameraPermission?.granted) {
//     const { granted } = await requestCameraPermission();
//     if (!granted) {
//       Alert.alert("Permission required", "Please allow camera access.");
//       return;
//     }
//   }
//   if (!micPermission?.granted) {
//     const { granted } = await requestMicPermission();
//     if (!granted) {
//       Alert.alert("Permission required", "Please allow microphone access.");
//       return;
//     }
//   }
//   setShowCamera(true);
// };

// const buildUrl = (url: string) =>
//   url.startsWith("http") ? url : `${BASE_URL}${url}`;

//   // ── Pick Files ──────────────────────────────────────
//   const pickFile = async () => {
//     const result = await DocumentPicker.getDocumentAsync({
//       type: "*/*", copyToCacheDirectory: true, multiple: true,
//     });
//     if (!result.canceled && result.assets.length > 0) {
//       const newItems: AttachmentItem[] = result.assets.map((asset) => ({
//         uri: asset.uri, type: "file",
//         name: asset.name,
//         mimeType: asset.mimeType ?? "application/octet-stream",
//       }));
//       setAttachments((prev) => [...prev, ...newItems]);
//     }
//   };

//  const showAttachmentOptions = () => {
//   Alert.alert("Attach", "Choose attachment type", [
//     { text: "📷 Photo",  onPress: pickImage },
//     { text: "📄 File",   onPress: pickFile  },
//     { text: "🎥 Video",  onPress: openCamera },
//     { text: "Cancel",   style: "cancel"     },
//   ]);
// };

//   const removeAttachment = (idx: number) =>
//     setAttachments((prev) => prev.filter((_, i) => i !== idx));

//   // ── Voice Recording ─────────────────────────────────
//   const startRecording = async () => {
//     try {
//       const { granted } = await Audio.requestPermissionsAsync();
//       if (!granted) {
//         Alert.alert("Permission required", "Please allow microphone access.");
//         return;
//       }
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });
//         const { recording } = await Audio.Recording.createAsync({
//           android: {
//             extension: ".m4a",
//             outputFormat: Audio.AndroidOutputFormat.MPEG_4,
//             audioEncoder: Audio.AndroidAudioEncoder.AAC,
//             sampleRate: 44100,
//             numberOfChannels: 2,
//             bitRate: 128000,
//           },
//           ios: {
//             extension: ".m4a",
//             outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
//             audioQuality: Audio.IOSAudioQuality.HIGH,
//             sampleRate: 44100,
//             numberOfChannels: 2,
//             bitRate: 128000,
//             linearPCMBitDepth: 16,
//             linearPCMIsBigEndian: false,
//             linearPCMIsFloat: false,
//           },
//           web: {},
// });
//       recordingRef.current = recording;
//       setIsRecording(true);
//     } catch (err) {
//       console.error("Start recording error:", err);
//       Alert.alert("Error", "Could not start recording.");
//     }
//   };
// const stopRecording = async () => {
//   if (!recordingRef.current) return;
//   setIsRecording(false);
//   setIsTranscribing(true);

//   try {
//     const recording = recordingRef.current;
//     recordingRef.current = null;

//     await recording.stopAndUnloadAsync();
//     await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

//     const tempUri = recording.getURI();
//     if (!tempUri) throw new Error("No recording URI");

//     const fileName = `voice_${Date.now()}.m4a`;
//     // ✅ Fix 1: Use Paths.document instead of documentDirectory
//     const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
//     await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

//     // ✅ Fix 2: Cast fileInfo to access size safely
//     const fileInfo = await FileSystem.getInfoAsync(permanentUri);
//     if (!fileInfo.exists) throw new Error("Recording file missing");
//     const size = (fileInfo as any).size ?? 0;
//     if (size === 0) throw new Error("Recording file is empty");

//     const voiceAttachment: AttachmentItem = {
//       uri: permanentUri,
//       type: "file",
//       name: fileName,
//       mimeType: "audio/m4a",
//     };
//     setAttachments((prev) => [...prev, voiceAttachment]);
//     Alert.alert("Voice recorded", "Your voice note has been attached.");

//   } catch (err) {
//     console.error("Stop recording error:", err);
//     Alert.alert("Error", "Could not process recording.");
//   } finally {
//     setIsTranscribing(false);
//   }
// };

// //------------------------- video recording handlers -------------------------
// const startVideoRecording = async () => {
//   if (!cameraRef.current) return;
//   try {
//     setIsVideoRecording(true);
//     const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
//     if (!video?.uri) throw new Error("No video URI");

//     const fileName = `video_${Date.now()}.mp4`;
//     // ✅ Fixed: use documentDirectory from legacy
//     const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
//     await FileSystem.copyAsync({ from: video.uri, to: permanentUri });

//     const videoAttachment: AttachmentItem = {
//       uri: permanentUri,
//       type: "file",
//       name: fileName,
//       mimeType: "video/mp4",
//     };
//     setAttachments((prev) => [...prev, videoAttachment]);
//     setShowCamera(false);
//     Alert.alert("Video recorded", "Your video has been attached.");

//   } catch (err) {
//     console.error("Video recording error:", err);
//     Alert.alert("Error", "Could not record video.");
//   } finally {
//     setIsVideoRecording(false);
//   }
// };

// const stopVideoRecording = () => {
//   cameraRef.current?.stopRecording();
// };

//   // ── Context menu actions ─────────────────────────────
//   const handleCopy = useCallback(() => {
//     const msg = contextMsgRef.current;
//     if (msg?.text) Clipboard.setString(msg.text);
//     setContextMsg(null);
//   }, []);

//   const handleReply = useCallback(() => {
//     const msg = contextMsgRef.current;
//     setReplyTo(msg);
//     setEditingMsg(null);
//     setContextMsg(null);
//     setTimeout(() => inputRef.current?.focus(), 150);
//   }, []);

//   const handleEdit = useCallback(() => {
//     const msg = contextMsgRef.current;
//     if (!msg) return;
//     setEditingMsg(msg);
//     setReplyTo(null);
//     setInputText(msg.text);
//     setContextMsg(null);
//     setTimeout(() => inputRef.current?.focus(), 150);
//   }, []);

//   const handlePin = useCallback(async () => {
//     const msg = contextMsgRef.current;
//     if (!msg) return;
//     const raw = await AsyncStorage.getItem(`pinnedMsgs_${childId}`);
//     const ids: string[] = raw ? JSON.parse(raw) : [];
//     const updated = ids.includes(msg.id)
//       ? ids.filter((i) => i !== msg.id)
//       : [...ids, msg.id];
//     await AsyncStorage.setItem(`pinnedMsgs_${childId}`, JSON.stringify(updated));
//     setPinnedIds(updated);
//     setContextMsg(null);
//   }, [childId]);

//   // ── Cancel edit/reply ───────────────────────────────
//   const cancelEdit = useCallback(() => {
//     setEditingMsg(null);
//     setInputText("");
//     setSending(false);
//   }, []);

//   const cancelReply = useCallback(() => {
//     setReplyTo(null);
//   }, []);

//   // FIX 3: Scroll to a message by id
//   const scrollToMessage = useCallback((msgId: string) => {
//     setMessages((current) => {
//       const idx = current.findIndex((m) => m.id === msgId);
//       if (idx !== -1) {
//         flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
//       }
//       return current;
//     });
//   }, []);

//   // ── Send Message ────────────────────────────────────
//   const sendMessage = async () => {
//     if (!inputText.trim() && attachments.length === 0) return;
//     setSending(true);

//     // ── EDIT MODE ────────────────────────────────────
//     // FIX 1: Read from ref so we always get the latest value
//     const latestText   = inputTextRef.current.trim();
//     const currentEditing = editingMsg;

//     if (currentEditing) {
//       setEditingMsg(null);
//       setInputText("");

//       try {
//         const res = await fetch(`${BASE_URL}/api/parent-notes/messages/${currentEditing.id}`, {
//           method:  "PATCH",
//           headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//           body:    JSON.stringify({ message: latestText }),  // ← use ref value
//         });
//         if (res.ok) {
//           setMessages((prev) =>
//             prev.map((m) =>
//               m.id === currentEditing.id ? { ...m, text: latestText } : m
//             )
//           );
//         } else {
//           Alert.alert("Error", "Could not edit message.");
//         }
//       } catch {
//         Alert.alert("Error", "Could not edit message.");
//       } finally {
//         setSending(false);
//       }
//       return;
//     }

//     // ── SEND MODE ────────────────────────────────────
//     const sentText    = inputText.trim();
//     const sentFiles   = [...attachments];
//     const sentReplyTo = replyTo;

//     setInputText("");
//     setAttachments([]);
//     setReplyTo(null);

//     // FIX 2: include reply snippet in temp message for immediate UI feedback
//     const tempMsg: Message = {
//       id:             String(Date.now()),
//       text:           sentText,
//       sender:         "parent",
//       createdAt:      new Date().toISOString(),
//       attachmentUrl:  sentFiles[0]?.uri ?? undefined,
//       attachmentType: sentFiles[0]?.type ?? undefined,
//       attachmentName: sentFiles[0]?.name ?? undefined,
//       replyToId:      sentReplyTo?.id,
//       replyToText:    sentReplyTo?.text || (sentReplyTo?.attachmentName ? `📎 ${sentReplyTo.attachmentName}` : undefined),
//     };
//     setMessages((prev) => [...prev, tempMsg]);

//     try {
//       let lastThreadId = threadId;

//       if (sentFiles.length > 0) {
//         for (let i = 0; i < sentFiles.length; i++) {
//           const f = sentFiles[i];
//           const formData = new FormData();
//           formData.append("student_id", String(Number(childId)));
//           if (i === 0 && sentText) formData.append("message", sentText);
//           if (i === 0 && sentReplyTo) formData.append("reply_to_id", sentReplyTo.id);
//           formData.append("attachment", {
//             uri: f.uri, type: f.mimeType, name: f.name,
//           } as any);

//           const res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
//             method:  "POST",
//             headers: { Authorization: `Bearer ${token}` },
//             body:    formData,
//           });

//           if (!res.ok) {
//             const errText = await res.text();
//             console.log(`File ${i} upload failed:`, res.status, errText);
//             throw new Error(`${res.status}`);
//           }

//           const data = JSON.parse(await res.text());
//           console.log(`File ${i} send response:`, data);

//           if (data.thread_id) {
//             lastThreadId = data.thread_id;
//             setThreadId(data.thread_id);
//             const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
//             const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
//             if (!savedIds.includes(data.thread_id)) {
//               savedIds.push(data.thread_id);
//               await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(savedIds));
//             }
//           }
//         }
//       } else {
//         const res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
//           method:  "POST",
//           headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//           body:    JSON.stringify({
//             student_id: Number(childId),
//             message:    sentText,
//             ...(sentReplyTo ? { reply_to_id: sentReplyTo.id } : {}),
//           }),
//         });

//         if (!res.ok) {
//           const errText = await res.text();
//           console.log("Text send failed:", res.status, errText);
//           setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
//           throw new Error(`${res.status}`);
//         }

//         const data = JSON.parse(await res.text());
//         console.log("Text send response:", data);

//         if (data.thread_id) {
//           lastThreadId = data.thread_id;
//           setThreadId(data.thread_id);
//           const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
//           const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
//           if (!savedIds.includes(data.thread_id)) {
//             savedIds.push(data.thread_id);
//             await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(savedIds));
//           }
//         }
//       }

//       await fetchMessages(token, lastThreadId ?? undefined);
//       setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

//     } catch (err) {
//       console.log("Send error:", err);
//       setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
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
//         text: "Yes", style: "destructive",
//         onPress: async () => {
//           await AsyncStorage.multiRemove(["token", "selectedChild", "selectedYearId", "selectedYearLabel"]);
//           router.replace("/login");
//         },
//       },
//     ]);

//       const getInitials = (name: string) => {
//     const parts = name.trim().split(' ');
//     if (parts.length >= 2) {
//       return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
//     }
//     return name.substring(0, 2).toUpperCase();
//   };


//     const handleDelete = useCallback(async () => {
//   const msg = contextMsgRef.current;
//   if (!msg) return;
//   setContextMsg(null);
//   Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
//     { text: "Cancel", style: "cancel" },
//     {
//       text: "Delete", style: "destructive",
//       onPress: async () => {
//         try {
//           const res = await fetch(`${BASE_URL}/api/parent-notes/messages/${msg.id}`, {
//             method: "DELETE",
//             headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//           });
//           if (res.ok) {
//             setMessages((prev) => prev.filter((m) => m.id !== msg.id));
//             // also remove from pinned if pinned
//             setPinnedIds((prev) => {
//               const updated = prev.filter((id) => id !== msg.id);
//               AsyncStorage.setItem(`pinnedMsgs_${childId}`, JSON.stringify(updated));
//               return updated;
//             });
//           } else {
//             Alert.alert("Error", "Could not delete message.");
//           }
//         } catch {
//           Alert.alert("Error", "Could not delete message.");
//         }
//       },
//     },
//   ]);
// }, [token, childId]);

// // ✅ Fix 3 & 4: Define these BEFORE renderMessage and the JSX that uses them

// const handleVoicePress = useCallback(() => {
//   if (isRecording) {
//     stopRecording();
//   } else {
//     startRecording();
//   }
// }, [isRecording]);

// const handlePlayVoice = useCallback(async (url: string, msgId: string) => {
//   try {
//     if (playingId === msgId) {
//       await soundRef.current?.stopAsync();
//       await soundRef.current?.unloadAsync();
//       soundRef.current = null;
//       setPlayingId(null);
//       return;
//     }
//     if (soundRef.current) {
//       await soundRef.current.stopAsync();
//       await soundRef.current.unloadAsync();
//       soundRef.current = null;
//       setPlayingId(null);
//     }
//     await Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//       playsInSilentModeIOS: true,
//       staysActiveInBackground: false,
//     });
//     const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
//     const { sound } = await Audio.Sound.createAsync(
//       { uri: fullUrl },
//       { shouldPlay: true }
//     );
//     soundRef.current = sound;
//     setPlayingId(msgId);
//     sound.setOnPlaybackStatusUpdate((status) => {
//       if (status.isLoaded && status.didJustFinish) {
//         sound.unloadAsync();
//         soundRef.current = null;
//         setPlayingId(null);
//       }
//     });
//   } catch (err) {
//     console.error("Voice playback error:", err);
//     Alert.alert("Error", "Could not play voice note.");
//     setPlayingId(null);
//   }
// }, [playingId]);

// // ← renderMessage goes here (after these two)

//   const formatTime = (iso: string) =>
//     new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

//   // ── Render Message ──────────────────────────────────
//   const renderMessage = ({ item }: { item: Message }) => {
//     const isParent = item.sender === "parent";
//     const isPinned = pinnedIds.includes(item.id);
//     const isVoice  = item.attachmentName?.endsWith(".m4a") || item.attachmentName?.startsWith("voice_");
//     const isPlaying = playingId === item.id;

//     return (
//       <Pressable
//         onLongPress={() => setContextMsg(item)}
//         delayLongPress={350}
//       >
//         <View style={[
//           msgStyles.bubble,
//           isParent ? msgStyles.bubbleRight : msgStyles.bubbleLeft,
//           isPinned && msgStyles.bubblePinned,
//         ]}>
//           {isPinned && <Text style={msgStyles.pinIndicator}>📌 Pinned</Text>}
//           {!isParent && <Text style={msgStyles.senderLabel}>🧑‍🏫 Teacher</Text>}

//           {/* FIX 2: Show reply reference bubble inside message */}
//           {item.replyToId && item.replyToText && (
//             <TouchableOpacity
//               onPress={() => scrollToMessage(item.replyToId!)}
//               style={[
//                 msgStyles.replyReference,
//                 isParent ? msgStyles.replyReferenceRight : msgStyles.replyReferenceLeft,
//               ]}
//             >
//               <Text style={msgStyles.replyReferenceLabel}>↩ Reply to:</Text>
//               <Text style={msgStyles.replyReferenceText} numberOfLines={2}>
//                 {item.replyToText}
//               </Text>
//             </TouchableOpacity>
//           )}

//           {!!item.text && (
//             <Text selectable style={[msgStyles.msgText, isParent && { color: "#fff" }]}>
//               {item.text}
//             </Text>
//           )}

          

//           {item.attachmentType === "image" && item.attachmentUrl && (
//             <TouchableOpacity
//               onPress={() => setPreviewItem({
//                 uri: item.attachmentUrl!.startsWith("http")
//                   ? item.attachmentUrl!
//                   : `${BASE_URL}${item.attachmentUrl}`,
//                 type: "image",
//               })}
//             >
//               <Image
//                 source={{ uri: item.attachmentUrl.startsWith("http")
//                   ? item.attachmentUrl
//                   : `${BASE_URL}${item.attachmentUrl}` }}
//                 style={msgStyles.attachedImage}
//                 resizeMode="cover"
//               />
//             </TouchableOpacity>
//           )}

//           {/* FIX 4: Voice note gets a play button instead of generic file chip */}
//           {item.attachmentType === "file" && item.attachmentUrl && isVoice && (
//             <TouchableOpacity
//               style={msgStyles.fileChip}
//               onPress={() => handlePlayVoice(item.attachmentUrl!, item.id)}
//             >
//               <Ionicons
//                 name={isPlaying ? "stop-circle" : "play-circle"}
//                 size={28}
//                 color={isParent ? "#fff" : "#0047AB"}
//               />
//               <Text style={[msgStyles.fileName, isParent && { color: "#fff" }]}>
//                 {isPlaying ? "Tap to stop" : "🎙 Voice note"}
//               </Text>
//               {isPlaying && <ActivityIndicator size="small" color={isParent ? "#fff" : "#0047AB"} />}
//             </TouchableOpacity>
//           )}

//           {item.attachmentType === "file" && item.attachmentUrl && !isVoice && (
//             <TouchableOpacity
//               style={msgStyles.fileChip}
//               onPress={() => setPreviewItem({
//                 uri: item.attachmentUrl!.startsWith("http")
//                   ? item.attachmentUrl!
//                   : `${BASE_URL}${item.attachmentUrl}`,
//                 type: "file",
//                 name: item.attachmentName,
//               })}
//             >
//               <Ionicons name="document-outline" size={16} color={isParent ? "#fff" : "#0047AB"} />
//               <Text style={[msgStyles.fileName, isParent && { color: "#fff" }]} numberOfLines={1}>
//                 {item.attachmentName ?? "File"}
//               </Text>
//               <Ionicons name="eye-outline" size={14} color={isParent ? "rgba(255,255,255,0.7)" : "#6B7280"} />
//             </TouchableOpacity>
//           )}

//           <Text style={[msgStyles.timeText, isParent && { color: "rgba(255,255,255,0.7)" }]}>
//             {formatTime(item.createdAt)}
//           </Text>
//         </View>
//       </Pressable>
//     );
//   };

//   const pinnedMessages = messages.filter((m) => pinnedIds.includes(m.id));

//   return (
//     <SafeAreaView style={msgStyles.safe}>

//       {/* ── Header ── */}
//        <View style={[msgStyles.headerTop, { backgroundColor: theme.primary }]}>
//         <View style={msgStyles.headerTopRow}>
//           <TouchableOpacity onPress={() => router.back()} style={msgStyles.backBtn}>
//             <Text style={msgStyles.backArrow}>←</Text>
//           </TouchableOpacity>
          
//           {/* Avatar Circle with Initials */}
//           <View style={msgStyles.avatarContainer}>
//             <View style={[msgStyles.avatarCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
//               <Text style={msgStyles.avatarInitials}>{getInitials(childName)}</Text>
//             </View>
//             <View style={msgStyles.headerTextContainer}>
//               <Text style={msgStyles.headerTitle}>{childName}</Text>
//               <View style={msgStyles.classBadge}>
//                 <Text style={msgStyles.classBadgeText}>
//                   {classname} {sectionname && `· ${sectionname}`}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           <TouchableOpacity onPress={handleLogout} style={msgStyles.logoutBtn}>
//             <Text style={msgStyles.logoutIcon}>↪</Text>
//           </TouchableOpacity>
//         </View>
//       </View>


//       {/* ── Pinned Banner ── */}
//       {/* FIX 3: Pinned chips are now clickable and scroll to that message */}
//       {pinnedMessages.length > 0 && (
//         <View style={msgStyles.pinnedBanner}>
//           <Text style={msgStyles.pinnedBannerTitle}>
//             📌 {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? "s" : ""}
//           </Text>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {pinnedMessages.map((m) => (
//               <TouchableOpacity
//                 key={m.id}
//                 style={msgStyles.pinnedChip}
//                 onPress={() => scrollToMessage(m.id)}
//                 activeOpacity={0.7}
//               >
//                 <Text style={msgStyles.pinnedChipText} numberOfLines={1}>
//                   {m.text || (m.attachmentType === "file" && m.attachmentName?.startsWith("voice_") ? "🎙 Voice note" : "📎 Attachment")}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>
//       )}

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
//             removeClippedSubviews
//             contentContainerStyle={msgStyles.list}
//             onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
//             // FIX 3: needed for scrollToIndex to work reliably
//             onScrollToIndexFailed={(info) => {
//               setTimeout(() => {
//                 flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
//               }, 300);
//             }}
//             ListEmptyComponent={
//               <View style={msgStyles.emptyWrapper}>
//                 <Text style={msgStyles.emptyEmoji}>💬</Text>
//                 <Text style={msgStyles.emptyTitle}>No messages yet</Text>
//                 <Text style={msgStyles.emptySub}>Send a note to the teacher below</Text>
//               </View>
//             }
//           />
//         )}

//         {/* ── Reply Banner ── */}
//         {replyTo && (
//           <View style={msgStyles.replyBanner}>
//             <View style={{ flex: 1 }}>
//               <Text style={msgStyles.replyBannerLabel}>↩ Replying to:</Text>
//               <Text style={msgStyles.replyBannerText} numberOfLines={1}>
//                 {replyTo.text || (replyTo.attachmentName ? `📎 ${replyTo.attachmentName}` : "📎 Attachment")}
//               </Text>
//             </View>
//             <TouchableOpacity onPress={cancelReply}>
//               <Ionicons name="close" size={20} color="#6B7280" />
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* ── Edit Banner ── */}
//         {editingMsg && (
//           <View style={[msgStyles.replyBanner, msgStyles.editBanner]}>
//             <View style={{ flex: 1 }}>
//               <Text style={[msgStyles.replyBannerLabel, { color: "#F59E0B" }]}>✏️ Editing message</Text>
//               <Text style={msgStyles.replyBannerText} numberOfLines={1}>{editingMsg.text}</Text>
//             </View>
//             <TouchableOpacity onPress={cancelEdit}>
//               <Ionicons name="close" size={20} color="#6B7280" />
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* ── Attachment Preview Strip ── */}
//         {attachments.length > 0 && (
//           <View style={msgStyles.attachmentPreviewWrap}>
//             {attachments.map((att, idx) => (
//               <View key={idx} style={msgStyles.attachmentPreview}>
//                 {att.type === "image" ? (
//                   <Image source={{ uri: att.uri }} style={msgStyles.previewImage} />
//                 ) : att.mimeType === "audio/m4a" ? (
//                   <View style={msgStyles.filePreviewChip}>
//                     <Ionicons name="mic" size={18} color="#0047AB" />
//                     <Text style={msgStyles.filePreviewName} numberOfLines={1}>🎙 Voice note</Text>
//                   </View>
//                 ) : (
//                   <View style={msgStyles.filePreviewChip}>
//                     <Ionicons name="document-outline" size={18} color="#0047AB" />
//                     <Text style={msgStyles.filePreviewName} numberOfLines={1}>{att.name}</Text>
//                   </View>
//                 )}
//                 <TouchableOpacity onPress={() => removeAttachment(idx)} style={msgStyles.removeAttachment}>
//                   <Ionicons name="close-circle" size={22} color="#EF4444" />
//                 </TouchableOpacity>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* ── Camera Modal ── */}
// <Modal
//   visible={showCamera}
//   animationType="slide"
//   onRequestClose={() => {
//     if (isVideoRecording) stopVideoRecording();
//     setShowCamera(false);
//   }}
// >
//   <View style={{ flex: 1, backgroundColor: '#000' }}>
//     <CameraView
//       ref={cameraRef}
//       style={{ flex: 1 }}
//       facing={cameraFacing}
//       mode="video"
//     >
//       {/* Top bar */}
//       <View style={{
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         padding: 16,
//         paddingTop: 50,
//       }}>
//         <TouchableOpacity
//           onPress={() => {
//             if (isVideoRecording) stopVideoRecording();
//             setShowCamera(false);
//           }}
//           style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 }}
//         >
//           <Ionicons name="close" size={24} color="#fff" />
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => setCameraFacing(f => f === 'back' ? 'front' : 'back')}
//           style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 }}
//         >
//           <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* Bottom controls */}
//       <View style={{
//         position: 'absolute',
//         bottom: 50,
//         width: '100%',
//         alignItems: 'center',
//       }}>
//         {isVideoRecording && (
//           <Text style={{ color: '#fff', marginBottom: 12, fontSize: 16 }}>
//             🔴 Recording...
//           </Text>
//         )}
//         <TouchableOpacity
//           onPress={isVideoRecording ? stopVideoRecording : startVideoRecording}
//           style={{
//             width: 72,
//             height: 72,
//             borderRadius: 36,
//             backgroundColor: isVideoRecording ? '#EF4444' : '#fff',
//             borderWidth: 4,
//             borderColor: isVideoRecording ? '#fff' : '#EF4444',
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//         >
//           <Ionicons
//             name={isVideoRecording ? "stop" : "videocam"}
//             size={30}
//             color={isVideoRecording ? '#fff' : '#EF4444'}
//           />
//         </TouchableOpacity>
//         <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: 13 }}>
//           {isVideoRecording ? "Tap to stop" : "Tap to record video"}
//         </Text>
//       </View>
//     </CameraView>
//   </View>
// </Modal>

//         {/* ── Input Bar ── */}
//         <View style={msgStyles.inputBar}>
//           <TouchableOpacity onPress={showAttachmentOptions} style={msgStyles.attachBtn}>
//             <Ionicons name="attach" size={24} color="#6B7280" />
//           </TouchableOpacity>

//           <TextInput
//             ref={inputRef}
//             style={msgStyles.input}
//             value={inputText}
//             onChangeText={setInputText}
//             placeholder={
//               editingMsg ? "Edit message..." :
//               replyTo    ? "Write a reply..."  :
//                            "Type a message..."
//             }
//             placeholderTextColor="#9CA3AF"
//             multiline
//             maxLength={500}
//           />

//           {!inputText.trim() && attachments.length === 0 && !editingMsg && (
//             <TouchableOpacity
//               style={[msgStyles.voiceBtn, isRecording && msgStyles.voiceBtnActive]}
//               onPress={handleVoicePress}
//               activeOpacity={0.8}
//             >
//               {isTranscribing
//                 ? <ActivityIndicator size="small" color="#fff" />
//                 : <Ionicons name={isRecording ? "stop" : "mic"} size={20} color="#fff" />
//               }
//             </TouchableOpacity>
//           )}

//           {(!!inputText.trim() || attachments.length > 0 || editingMsg) && (
//             <TouchableOpacity
//               style={[
//                 msgStyles.sendBtn,
//                 { backgroundColor: editingMsg ? "#F59E0B" : theme.primary },
//                 sending && { opacity: 0.5 },
//               ]}
//               onPress={sendMessage}
//               disabled={sending}
//               activeOpacity={0.8}
//             >
//               {sending
//                 ? <ActivityIndicator size="small" color="#fff" />
//                 : <Ionicons name={editingMsg ? "checkmark" : "send"} size={18} color="#fff" />
//               }
//             </TouchableOpacity>
//           )}
//         </View>

//         {isRecording && (
//           <View style={msgStyles.recordingBar}>
//             <View style={msgStyles.recordingDot} />
//             <Text style={msgStyles.recordingText}>Recording... tap 🛑 to stop</Text>
//           </View>
//         )}
//       </KeyboardAvoidingView>

//       {/* ── Context Menu Modal ── */}
//       <Modal
//         visible={!!contextMsg}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setContextMsg(null)}
//       >
//         <Pressable style={msgStyles.modalOverlay} onPress={() => setContextMsg(null)}>
//           <View style={msgStyles.contextMenu}>
//             <Text style={msgStyles.contextPreview} numberOfLines={2}>
//               {contextMsg?.text || "📎 Attachment"}
//             </Text>

//             <TouchableOpacity style={msgStyles.contextItem} onPress={handleCopy}>
//               <Ionicons name="copy-outline" size={20} color="#111827" />
//               <Text style={msgStyles.contextItemText}>Copy</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={msgStyles.contextItem} onPress={handleReply}>
//               <Ionicons name="arrow-undo-outline" size={20} color="#111827" />
//               <Text style={msgStyles.contextItemText}>Reply</Text>
//             </TouchableOpacity>

//             {contextMsg?.sender === "parent" && (
//               <TouchableOpacity style={msgStyles.contextItem} onPress={handleEdit}>
//                 <Ionicons name="pencil-outline" size={20} color="#111827" />
//                 <Text style={msgStyles.contextItemText}>Edit</Text>
//               </TouchableOpacity>
//             )}
//             {contextMsg?.sender === "parent" && (
//               <TouchableOpacity style={msgStyles.contextItem} onPress={handleDelete}>
//                 <Ionicons name="trash-outline" size={20} color="#EF4444" />
//                 <Text style={[msgStyles.contextItemText, { color: "#EF4444" }]}>Delete</Text>
//               </TouchableOpacity>
//             )}

//             <TouchableOpacity style={msgStyles.contextItem} onPress={handlePin}>
//               <Ionicons
//                 name={pinnedIds.includes(contextMsg?.id ?? "") ? "pin" : "pin-outline"}
//                 size={20}
//                 color={pinnedIds.includes(contextMsg?.id ?? "") ? "#EF4444" : "#111827"}
//               />
//               <Text style={[
//                 msgStyles.contextItemText,
//                 pinnedIds.includes(contextMsg?.id ?? "") && { color: "#EF4444" },
//               ]}>
//                 {pinnedIds.includes(contextMsg?.id ?? "") ? "Unpin" : "Pin"}
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[msgStyles.contextItem, msgStyles.contextCancel]}
//               onPress={() => setContextMsg(null)}
//             >
//               <Ionicons name="close-outline" size={20} color="#9CA3AF" />
//               <Text style={[msgStyles.contextItemText, { color: "#9CA3AF" }]}>Cancel</Text>
//             </TouchableOpacity>
//           </View>
//         </Pressable>
//       </Modal>

//       {/* ── Attachment Preview Modal ── */}
//       <Modal
//         visible={!!previewItem}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setPreviewItem(null)}
//       >
//         <View style={msgStyles.previewModal}>
//           <TouchableOpacity style={msgStyles.previewClose} onPress={() => setPreviewItem(null)}>
//             <Ionicons name="close" size={28} color="#fff" />
//           </TouchableOpacity>

//           {previewItem?.type === "image" ? (
//             <Image
//               source={{ uri: previewItem.uri }}
//               style={msgStyles.fullImage}
//               resizeMode="contain"
//             />
//           ) : (
//             <View style={msgStyles.filePreviewFull}>
//               <Ionicons name="document-outline" size={64} color="#fff" />
//               <Text style={msgStyles.filePreviewFullName}>{previewItem?.name ?? "File"}</Text>
//               <Text style={msgStyles.filePreviewFullSub}>Tap below to open</Text>
//               <TouchableOpacity
//                 style={msgStyles.openUrlBtn}
//                 onPress={() => {
//                   if (previewItem?.uri) {
//                     const { Linking } = require("react-native");
//                     Linking.openURL(previewItem.uri);
//                   }
//                 }}
//               >
//                 <Text style={msgStyles.openUrlText}>Open File ↗</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       </Modal>

//     </SafeAreaView>
//   );
// }

// const msgStyles = StyleSheet.create({
//   safe:                  { flex: 1, backgroundColor: "#F5F7FA" },
//    headerTop: { 
//     paddingTop: 50, 
//     paddingBottom: 20, 
//     paddingHorizontal: 16,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//   },
//   headerTopRow: { 
//     flexDirection: "row", 
//     alignItems: "center", 
//     justifyContent: "space-between", 
//     width: "100%" 
//   },
//   backBtn: { 
//     width: 40, 
//     height: 40, 
//     alignItems: "center", 
//     justifyContent: "center",
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//   },
//   backArrow: { 
//     color: "#fff", 
//     fontSize: 22, 
//     fontWeight: "600" 
//   },
  
//   // New avatar styles
//   avatarContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     flex: 1,
//     justifyContent: "center",
//   },
//   avatarCircle: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 2,
//     borderColor: "rgba(255,255,255,0.3)",
//   },
//   avatarInitials: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "800",
//   },
//   headerTextContainer: {
//     alignItems: "flex-start",
//   },
//   headerTitle: { 
//     color: "#fff", 
//     fontSize: 18, 
//     fontWeight: "800",
//     marginBottom: 4,
//   },
//   classBadge: {
//     backgroundColor: "rgba(255,255,255,0.2)",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//   },
//   classBadgeText: {
//     color: "rgba(255,255,255,0.95)",
//     fontSize: 11,
//     fontWeight: "600",
//   },
//     logoutBtn: {
//     width: 40,
//     height: 40,
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//   },
//   logoutIcon: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "600",
//   },

//   loadingWrapper:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
//   loadingText:           { fontSize: 13, color: "#6B7280", fontWeight: "600" },
//   list:                  { padding: 16, paddingBottom: 8 },
//   emptyWrapper:          { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
//   emptyEmoji:            { fontSize: 52, marginBottom: 12 },
//   emptyTitle:            { fontSize: 18, fontWeight: "800", color: "#111827" },
//   emptySub:              { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

//   // Bubbles
//   bubble:                { maxWidth: "78%", borderRadius: 16, padding: 12, marginBottom: 10 },
//   bubbleLeft:            { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },
//   bubbleRight:           { backgroundColor: "#0047AB", alignSelf: "flex-end", borderBottomRightRadius: 4 },
//   bubblePinned:          { borderWidth: 2, borderColor: "#F59E0B" },
//   pinIndicator:          { fontSize: 10, color: "#F59E0B", fontWeight: "700", marginBottom: 4 },
//   senderLabel:           { fontSize: 11, fontWeight: "700", color: "#6B7280", marginBottom: 4 },
//   msgText:               { fontSize: 14, color: "#111827", lineHeight: 20 },
//   timeText:              { fontSize: 10, color: "#9CA3AF", marginTop: 4, alignSelf: "flex-end" },
//   attachedImage:         { width: 200, height: 150, borderRadius: 8, marginTop: 6 },
//   fileChip:              { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
//   fileName:              { fontSize: 13, color: "#111827", flex: 1 },

//   // FIX 2: Reply reference inside bubble
//   replyReference:        { borderRadius: 8, padding: 8, marginBottom: 6, borderLeftWidth: 3 },
//   replyReferenceRight:   { backgroundColor: "rgba(255,255,255,0.15)", borderLeftColor: "rgba(255,255,255,0.6)" },
//   replyReferenceLeft:    { backgroundColor: "#F0F4FF", borderLeftColor: "#2563EB" },
//   replyReferenceLabel:   { fontSize: 10, fontWeight: "700", color: "#9CA3AF", marginBottom: 2 },
//   replyReferenceText:    { fontSize: 12, color: "#374151" },

//   // Pinned banner
//   pinnedBanner:          { backgroundColor: "#FFFBEB", borderBottomWidth: 1, borderBottomColor: "#FDE68A", paddingHorizontal: 16, paddingVertical: 8 },
//   pinnedBannerTitle:     { fontSize: 11, fontWeight: "700", color: "#92400E", marginBottom: 4 },
//   pinnedChip:            { backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, maxWidth: 180 },
//   pinnedChipText:        { fontSize: 12, color: "#78350F" },

//   // Reply / Edit banners
//   replyBanner:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#EFF6FF", borderTopWidth: 1, borderTopColor: "#BFDBFE", gap: 8 },
//   editBanner:            { backgroundColor: "#FFF7ED", borderTopColor: "#FDE68A" },
//   replyBannerLabel:      { fontSize: 11, fontWeight: "700", color: "#2563EB", marginBottom: 2 },
//   replyBannerText:       { fontSize: 13, color: "#374151" },

//   // Attachment strip
//   attachmentPreviewWrap: { backgroundColor: "#F0F4FF", borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingVertical: 4 },
//   attachmentPreview:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 6 },
//   previewImage:          { width: 50, height: 50, borderRadius: 8 },
//   filePreviewChip:       { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
//   filePreviewName:       { fontSize: 13, color: "#111827", flex: 1 },
//   removeAttachment:      { marginLeft: "auto", padding: 4 },

//   // Input bar
//   inputBar:              { flexDirection: "row", alignItems: "flex-end", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F0F0", gap: 8, marginBottom: 30 },
//   attachBtn:             { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
//   input:                 { flex: 1, backgroundColor: "#F9FAFB", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#111827", maxHeight: 100, borderWidth: 1, borderColor: "#E5E7EB" },
//   sendBtn:               { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
//   voiceBtn:              { width: 42, height: 42, borderRadius: 21, backgroundColor: "#6B7280", alignItems: "center", justifyContent: "center" },
//   voiceBtnActive:        { backgroundColor: "#EF4444" },

//   // Recording bar
//   recordingBar:          { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#FEE2E2" },
//   recordingDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
//   recordingText:         { fontSize: 12, color: "#B91C1C", fontWeight: "600" },

//   // Context menu
//   modalOverlay:          { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
//   contextMenu:           { backgroundColor: "#fff", borderRadius: 16, width: 260, paddingVertical: 8, paddingHorizontal: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
//   contextPreview:        { fontSize: 12, color: "#6B7280", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", fontStyle: "italic" },
//   contextItem:           { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
//   contextCancel:         { borderTopWidth: 1, borderTopColor: "#F3F4F6", marginTop: 4 },
//   contextItemText:       { fontSize: 15, color: "#111827", fontWeight: "500" },

//   // Preview modal
//   previewModal:          { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
//   previewClose:          { position: "absolute", top: 52, right: 20, zIndex: 10, padding: 8 },
//   fullImage:             { width: "100%", height: "80%" },
//   filePreviewFull:       { alignItems: "center", gap: 16, padding: 32 },
//   filePreviewFullName:   { fontSize: 18, fontWeight: "700", color: "#fff", textAlign: "center" },
//   filePreviewFullSub:    { fontSize: 13, color: "rgba(255,255,255,0.6)" },
//   openUrlBtn:            { marginTop: 8, backgroundColor: "#0047AB", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
//   openUrlText:           { color: "#fff", fontWeight: "700", fontSize: 14 },
// });



import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet,
  ActivityIndicator, Alert, Image, Modal, ScrollView,
  Pressable, Clipboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useTheme } from "../ThemeContext";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { VideoView, useVideoPlayer } from "expo-video";

const BASE_URL = "https://connect.schoolaid.in";

// ── Helper ───────────────────────────────────────────
const buildUrl = (url: string) =>
  url.startsWith("http") ? url : `${BASE_URL}${url}`;

// ── Types ────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  sender: "parent" | "teacher";
  createdAt: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "file" | "video";
  attachmentName?: string;
  replyToId?: string;
  replyToText?: string;
}

interface AttachmentItem {
  uri: string;
  type: "image" | "file" | "video";
  name: string;
  mimeType: string;
}

// ── Video Player Modal Component ─────────────────────
function VideoPlayerModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = false;
  });

  // Play after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try { player.play(); } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [player]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center" }}>
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute", top: 50, right: 16,
            zIndex: 10, backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 20, padding: 8,
          }}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Video */}
        <VideoView
          player={player}
          style={{ width: "100%", height: 350 }}
          contentFit="contain"
          nativeControls
        />
      </View>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────
export default function MessageScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { childId, childName, classname, sectionname } = useLocalSearchParams<{
    childId: string;
    childName: string;
    classname: string;
    sectionname: string;
  }>();

  // ── Core states ──────────────────────────────────────
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [inputText,   setInputText]   = useState("");
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [token,       setToken]       = useState("");
  const [threadId,    setThreadId]    = useState<number | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  // ── Feature states ───────────────────────────────────
  const [previewItem,  setPreviewItem]  = useState<{ uri: string; type: "image" | "file"; name?: string } | null>(null);
  const [contextMsg,   setContextMsg]   = useState<Message | null>(null);
  const [replyTo,      setReplyTo]      = useState<Message | null>(null);
  const [editingMsg,   setEditingMsg]   = useState<Message | null>(null);
  const [pinnedIds,    setPinnedIds]    = useState<string[]>([]);

  // ── Voice states ─────────────────────────────────────
  const [isRecording,    setIsRecording]    = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingId,      setPlayingId]      = useState<string | null>(null);
  const soundRef     = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // ── Video / Camera states ────────────────────────────
  const [showCamera,      setShowCamera]      = useState(false);
  const [cameraFacing,    setCameraFacing]    = useState<"front" | "back">("back");
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [previewVideo,    setPreviewVideo]    = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission,    requestMicPermission]    = useMicrophonePermissions();
  const cameraRef = useRef<CameraView>(null);

  // ── Refs ─────────────────────────────────────────────
  const flatListRef    = useRef<FlatList>(null);
  const inputRef       = useRef<TextInput>(null);
  const contextMsgRef  = useRef<Message | null>(null);
  const replyToRef     = useRef<Message | null>(null);
  const editingMsgRef  = useRef<Message | null>(null);
  const pinnedIdsRef   = useRef<string[]>([]);
  const inputTextRef   = useRef("");

  // Keep refs in sync
  useEffect(() => { contextMsgRef.current = contextMsg;  }, [contextMsg]);
  useEffect(() => { replyToRef.current    = replyTo;     }, [replyTo]);
  useEffect(() => { editingMsgRef.current = editingMsg;  }, [editingMsg]);
  useEffect(() => { pinnedIdsRef.current  = pinnedIds;   }, [pinnedIds]);
  useEffect(() => { inputTextRef.current  = inputText;   }, [inputText]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  // ── Load pinned IDs ──────────────────────────────────
  const loadPinned = async () => {
    try {
      const raw = await AsyncStorage.getItem(`pinnedMsgs_${childId}`);
      if (raw) setPinnedIds(JSON.parse(raw));
    } catch {}
  };

  // ── Fetch messages ───────────────────────────────────
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
        combined.map((m: any) => {
          const attachName = m.attachment_name ?? undefined;
          const attachUrl  = m.attachment_url  ?? undefined;

          // ✅ Detect video vs image vs file
          const isVideo = attachName?.endsWith(".mp4") || attachName?.startsWith("video_");
          const isVoice = attachName?.endsWith(".m4a") || attachName?.startsWith("voice_");
          const attachType = isVideo ? "video" : isVoice ? "file" : attachUrl ? "image" : undefined;

          return {
            id:             String(m.id ?? m._id ?? Math.random()),
            text:           m.message ?? m.body ?? m.text ?? "",
            sender:         m.sender_type === "teacher" ? "teacher" : "parent",
            createdAt:      m.created_at ?? m.createdAt ?? new Date().toISOString(),
            attachmentUrl:  attachUrl,
            attachmentType: attachType,
            attachmentName: attachName,
            replyToId:      m.reply_to_id ? String(m.reply_to_id) : undefined,
            replyToText:    m.reply_to_text ?? m.reply_message ?? undefined,
          };
        })
      );
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Focus Effect ─────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const t = await AsyncStorage.getItem("token");
        if (t) { setToken(t); fetchMessages(t); }
        await loadPinned();
      };
      init();
    }, [childId])
  );

  // ── Pick Images ──────────────────────────────────────
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newItems: AttachmentItem[] = result.assets.map((asset) => ({
        uri: asset.uri, type: "image",
        name: asset.fileName ?? "image.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
      }));
      setAttachments((prev) => [...prev, ...newItems]);
    }
  };

  // ── Pick Files ───────────────────────────────────────
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*", copyToCacheDirectory: true, multiple: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newItems: AttachmentItem[] = result.assets.map((asset) => ({
        uri: asset.uri, type: "file",
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
      }));
      setAttachments((prev) => [...prev, ...newItems]);
    }
  };

  // ── Open Camera ──────────────────────────────────────
  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert("Permission required", "Please allow camera access.");
        return;
      }
    }
    if (!micPermission?.granted) {
      const { granted } = await requestMicPermission();
      if (!granted) {
        Alert.alert("Permission required", "Please allow microphone access.");
        return;
      }
    }
    setShowCamera(true);
  };

  const showAttachmentOptions = () => {
    Alert.alert("Attach", "Choose attachment type", [
      { text: "📷 Photo",  onPress: pickImage   },
      { text: "📄 File",   onPress: pickFile    },
      { text: "🎥 Video",  onPress: openCamera  },
      { text: "Cancel",   style: "cancel"       },
    ]);
  };

  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  // ── Voice Recording ──────────────────────────────────
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Please allow microphone access.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error("Start recording error:", err);
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setIsTranscribing(true);
    try {
      const recording = recordingRef.current;
      recordingRef.current = null;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const tempUri = recording.getURI();
      if (!tempUri) throw new Error("No recording URI");

      const fileName = `voice_${Date.now()}.m4a`;
      // ✅ Using legacy API — documentDirectory works fine here
      const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) throw new Error("Recording file missing");
      const size = (fileInfo as any).size ?? 0;
      if (size === 0) throw new Error("Recording file is empty");

      const voiceAttachment: AttachmentItem = {
        uri: permanentUri,
        type: "file",
        name: fileName,
        mimeType: "audio/m4a",
      };
      setAttachments((prev) => [...prev, voiceAttachment]);
      Alert.alert("Voice recorded", "Your voice note has been attached.");
    } catch (err) {
      console.error("Stop recording error:", err);
      Alert.alert("Error", "Could not process recording.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // ── Video Recording ──────────────────────────────────
  const startVideoRecording = async () => {
    if (!cameraRef.current) return;
    try {
      setIsVideoRecording(true);
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (!video?.uri) throw new Error("No video URI");

      const fileName = `video_${Date.now()}.mp4`;
      const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: video.uri, to: permanentUri });

      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) throw new Error("Video file missing");

      const videoAttachment: AttachmentItem = {
        uri: permanentUri,
        type: "video",
        name: fileName,
        mimeType: "video/mp4",
      };
      setAttachments((prev) => [...prev, videoAttachment]);
      setShowCamera(false);
      Alert.alert("Video recorded", "Your video has been attached.");
    } catch (err) {
      console.error("Video recording error:", err);
      Alert.alert("Error", "Could not record video.");
    } finally {
      setIsVideoRecording(false);
    }
  };

  const stopVideoRecording = () => {
    cameraRef.current?.stopRecording();
  };

  // ── Voice Playback ───────────────────────────────────
  const handlePlayVoice = useCallback(async (url: string, msgId: string) => {
    try {
      if (playingId === msgId) {
        await soundRef.current?.stopAsync();
        await soundRef.current?.unloadAsync();
        soundRef.current = null;
        setPlayingId(null);
        return;
      }
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingId(null);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const fullUrl = buildUrl(url);
      const { sound } = await Audio.Sound.createAsync({ uri: fullUrl }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(msgId);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          setPlayingId(null);
        }
      });
    } catch (err) {
      console.error("Voice playback error:", err);
      Alert.alert("Error", "Could not play voice note.");
      setPlayingId(null);
    }
  }, [playingId]);

  const handleVoicePress = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording]);

  // ── Context Menu Actions ─────────────────────────────
  const handleCopy = useCallback(() => {
    const msg = contextMsgRef.current;
    if (msg?.text) Clipboard.setString(msg.text);
    setContextMsg(null);
  }, []);

  const handleReply = useCallback(() => {
    const msg = contextMsgRef.current;
    setReplyTo(msg);
    setEditingMsg(null);
    setContextMsg(null);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleEdit = useCallback(() => {
    const msg = contextMsgRef.current;
    if (!msg) return;
    setEditingMsg(msg);
    setReplyTo(null);
    setInputText(msg.text);
    setContextMsg(null);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handlePin = useCallback(async () => {
    const msg = contextMsgRef.current;
    if (!msg) return;
    const raw = await AsyncStorage.getItem(`pinnedMsgs_${childId}`);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const updated = ids.includes(msg.id)
      ? ids.filter((i) => i !== msg.id)
      : [...ids, msg.id];
    await AsyncStorage.setItem(`pinnedMsgs_${childId}`, JSON.stringify(updated));
    setPinnedIds(updated);
    setContextMsg(null);
  }, [childId]);

  const handleDelete = useCallback(async () => {
    const msg = contextMsgRef.current;
    if (!msg) return;
    setContextMsg(null);
    Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/api/parent-notes/messages/${msg.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            if (res.ok) {
              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
              setPinnedIds((prev) => {
                const updated = prev.filter((id) => id !== msg.id);
                AsyncStorage.setItem(`pinnedMsgs_${childId}`, JSON.stringify(updated));
                return updated;
              });
            } else {
              Alert.alert("Error", "Could not delete message.");
            }
          } catch {
            Alert.alert("Error", "Could not delete message.");
          }
        },
      },
    ]);
  }, [token, childId]);

  const cancelEdit = useCallback(() => {
    setEditingMsg(null);
    setInputText("");
    setSending(false);
  }, []);

  const cancelReply = useCallback(() => { setReplyTo(null); }, []);

  const scrollToMessage = useCallback((msgId: string) => {
    setMessages((current) => {
      const idx = current.findIndex((m) => m.id === msgId);
      if (idx !== -1) {
        flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
      }
      return current;
    });
  }, []);

  // ── Send Message ─────────────────────────────────────
  const sendMessage = async () => {
    if (!inputText.trim() && attachments.length === 0) return;
    setSending(true);

    const latestText     = inputTextRef.current.trim();
    const currentEditing = editingMsg;

    // EDIT MODE
    if (currentEditing) {
      setEditingMsg(null);
      setInputText("");
      try {
        const res = await fetch(`${BASE_URL}/api/parent-notes/messages/${currentEditing.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ message: latestText }),
        });
        if (res.ok) {
          setMessages((prev) =>
            prev.map((m) => m.id === currentEditing.id ? { ...m, text: latestText } : m)
          );
        } else {
          Alert.alert("Error", "Could not edit message.");
        }
      } catch {
        Alert.alert("Error", "Could not edit message.");
      } finally {
        setSending(false);
      }
      return;
    }

    // SEND MODE
    const sentText    = inputText.trim();
    const sentFiles   = [...attachments];
    const sentReplyTo = replyTo;

    setInputText("");
    setAttachments([]);
    setReplyTo(null);

    const tempMsg: Message = {
      id:             String(Date.now()),
      text:           sentText,
      sender:         "parent",
      createdAt:      new Date().toISOString(),
      attachmentUrl:  sentFiles[0]?.uri ?? undefined,
      attachmentType: sentFiles[0]?.type ?? undefined,
      attachmentName: sentFiles[0]?.name ?? undefined,
      replyToId:      sentReplyTo?.id,
      replyToText:    sentReplyTo?.text || (sentReplyTo?.attachmentName ? `📎 ${sentReplyTo.attachmentName}` : undefined),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      let lastThreadId = threadId;

      if (sentFiles.length > 0) {
        for (let i = 0; i < sentFiles.length; i++) {
          const f = sentFiles[i];
          const formData = new FormData();
          formData.append("student_id", String(Number(childId)));
          if (i === 0 && sentText) formData.append("message", sentText);
          if (i === 0 && sentReplyTo) formData.append("reply_to_id", sentReplyTo.id);
          formData.append("attachment", { uri: f.uri, type: f.mimeType, name: f.name } as any);

          const res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (!res.ok) {
            const errText = await res.text();
            console.log(`File ${i} upload failed:`, res.status, errText);
            throw new Error(`${res.status}`);
          }

          const data = JSON.parse(await res.text());
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
        const res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: Number(childId),
            message: sentText,
            ...(sentReplyTo ? { reply_to_id: sentReplyTo.id } : {}),
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.log("Text send failed:", res.status, errText);
          setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
          throw new Error(`${res.status}`);
        }

        const data = JSON.parse(await res.text());
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

  // ── Logout ───────────────────────────────────────────
  const handleLogout = () =>
    Alert.alert("Logout", "Do you really want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "selectedChild", "selectedYearId", "selectedYearLabel"]);
          router.replace("/login");
        },
      },
    ]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // ── Render Message ───────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isParent  = item.sender === "parent";
    const isPinned  = pinnedIds.includes(item.id);
    const isVoice   = item.attachmentName?.endsWith(".m4a") || item.attachmentName?.startsWith("voice_");
    const isVideo   = item.attachmentType === "video" || item.attachmentName?.endsWith(".mp4") || item.attachmentName?.startsWith("video_");
    const isPlaying = playingId === item.id;

    return (
      <Pressable onLongPress={() => setContextMsg(item)} delayLongPress={350}>
        <View style={[
          msgStyles.bubble,
          isParent ? msgStyles.bubbleRight : msgStyles.bubbleLeft,
          isPinned && msgStyles.bubblePinned,
        ]}>
          {isPinned && <Text style={msgStyles.pinIndicator}>📌 Pinned</Text>}
          {!isParent && <Text style={msgStyles.senderLabel}>🧑‍🏫 Teacher</Text>}

          {/* Reply reference */}
          {item.replyToId && item.replyToText && (
            <TouchableOpacity
              onPress={() => scrollToMessage(item.replyToId!)}
              style={[
                msgStyles.replyReference,
                isParent ? msgStyles.replyReferenceRight : msgStyles.replyReferenceLeft,
              ]}
            >
              <Text style={msgStyles.replyReferenceLabel}>↩ Reply to:</Text>
              <Text style={msgStyles.replyReferenceText} numberOfLines={2}>{item.replyToText}</Text>
            </TouchableOpacity>
          )}

          {/* Text */}
          {!!item.text && (
            <Text selectable style={[msgStyles.msgText, isParent && { color: "#fff" }]}>
              {item.text}
            </Text>
          )}

          {/* Image */}
          {item.attachmentType === "image" && item.attachmentUrl && (
            <TouchableOpacity
              onPress={() => setPreviewItem({ uri: buildUrl(item.attachmentUrl!), type: "image" })}
            >
              <Image
                source={{ uri: buildUrl(item.attachmentUrl) }}
                style={msgStyles.attachedImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {/* ✅ Video chip */}
          {isVideo && item.attachmentUrl && (
            <TouchableOpacity
              style={msgStyles.fileChip}
              onPress={() => setPreviewVideo(buildUrl(item.attachmentUrl!))}
            >
              <Ionicons name="videocam" size={20} color={isParent ? "#fff" : "#0047AB"} />
              <Text style={[msgStyles.fileName, isParent && { color: "#fff" }]}>
                🎥 Video — tap to play
              </Text>
              <Ionicons name="play-circle-outline" size={18} color={isParent ? "#fff" : "#0047AB"} />
            </TouchableOpacity>
          )}

          {/* Voice note */}
          {item.attachmentType === "file" && item.attachmentUrl && isVoice && !isVideo && (
            <TouchableOpacity
              style={msgStyles.fileChip}
              onPress={() => handlePlayVoice(item.attachmentUrl!, item.id)}
            >
              <Ionicons
                name={isPlaying ? "stop-circle" : "play-circle"}
                size={28}
                color={isParent ? "#fff" : "#0047AB"}
              />
              <Text style={[msgStyles.fileName, isParent && { color: "#fff" }]}>
                {isPlaying ? "Tap to stop" : "🎙 Voice note"}
              </Text>
              {isPlaying && <ActivityIndicator size="small" color={isParent ? "#fff" : "#0047AB"} />}
            </TouchableOpacity>
          )}

          {/* Generic file */}
          {item.attachmentType === "file" && item.attachmentUrl && !isVoice && !isVideo && (
            <TouchableOpacity
              style={msgStyles.fileChip}
              onPress={() => setPreviewItem({
                uri: buildUrl(item.attachmentUrl!),
                type: "file",
                name: item.attachmentName,
              })}
            >
              <Ionicons name="document-outline" size={16} color={isParent ? "#fff" : "#0047AB"} />
              <Text style={[msgStyles.fileName, isParent && { color: "#fff" }]} numberOfLines={1}>
                {item.attachmentName ?? "File"}
              </Text>
              <Ionicons name="eye-outline" size={14} color={isParent ? "rgba(255,255,255,0.7)" : "#6B7280"} />
            </TouchableOpacity>
          )}

          <Text style={[msgStyles.timeText, isParent && { color: "rgba(255,255,255,0.7)" }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </Pressable>
    );
  };

  const pinnedMessages = messages.filter((m) => pinnedIds.includes(m.id));

  // ── JSX ──────────────────────────────────────────────
  return (
    <SafeAreaView style={msgStyles.safe}>

      {/* Header */}
      <View style={[msgStyles.headerTop, { backgroundColor: theme.primary }]}>
        <View style={msgStyles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={msgStyles.backBtn}>
            <Text style={msgStyles.backArrow}>⬅</Text>
          </TouchableOpacity>
          <View style={msgStyles.avatarContainer}>
            <View style={[msgStyles.avatarCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={msgStyles.avatarInitials}>{getInitials(childName)}</Text>
            </View>
            <View style={msgStyles.headerTextContainer}>
              <Text style={msgStyles.headerTitle}>{childName}</Text>
              <View style={msgStyles.classBadge}>
                <Text style={msgStyles.classBadgeText}>
                  {classname} {sectionname && `· ${sectionname}`}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={msgStyles.logoutBtn}>
            <Text style={msgStyles.logoutIcon}>↪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pinned Banner */}
      {pinnedMessages.length > 0 && (
        <View style={msgStyles.pinnedBanner}>
          <Text style={msgStyles.pinnedBannerTitle}>
            📌 {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? "s" : ""}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pinnedMessages.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={msgStyles.pinnedChip}
                onPress={() => scrollToMessage(m.id)}
                activeOpacity={0.7}
              >
                <Text style={msgStyles.pinnedChipText} numberOfLines={1}>
                  {m.text || (m.attachmentName?.startsWith("voice_") ? "🎙 Voice note" : "📎 Attachment")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
            removeClippedSubviews
            contentContainerStyle={msgStyles.list}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              }, 300);
            }}
            ListEmptyComponent={
              <View style={msgStyles.emptyWrapper}>
                <Text style={msgStyles.emptyEmoji}>💬</Text>
                <Text style={msgStyles.emptyTitle}>No messages yet</Text>
                <Text style={msgStyles.emptySub}>Send a note to the teacher below</Text>
              </View>
            }
          />
        )}

        {/* Reply Banner */}
        {replyTo && (
          <View style={msgStyles.replyBanner}>
            <View style={{ flex: 1 }}>
              <Text style={msgStyles.replyBannerLabel}>↩ Replying to:</Text>
              <Text style={msgStyles.replyBannerText} numberOfLines={1}>
                {replyTo.text || (replyTo.attachmentName ? `📎 ${replyTo.attachmentName}` : "📎 Attachment")}
              </Text>
            </View>
            <TouchableOpacity onPress={cancelReply}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Banner */}
        {editingMsg && (
          <View style={[msgStyles.replyBanner, msgStyles.editBanner]}>
            <View style={{ flex: 1 }}>
              <Text style={[msgStyles.replyBannerLabel, { color: "#F59E0B" }]}>✏️ Editing message</Text>
              <Text style={msgStyles.replyBannerText} numberOfLines={1}>{editingMsg.text}</Text>
            </View>
            <TouchableOpacity onPress={cancelEdit}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Attachment Preview Strip */}
        {attachments.length > 0 && (
          <View style={msgStyles.attachmentPreviewWrap}>
            {attachments.map((att, idx) => (
              <View key={idx} style={msgStyles.attachmentPreview}>
                {att.type === "image" ? (
                  <Image source={{ uri: att.uri }} style={msgStyles.previewImage} />
                ) : att.mimeType === "audio/m4a" ? (
                  <View style={msgStyles.filePreviewChip}>
                    <Ionicons name="mic" size={18} color="#0047AB" />
                    <Text style={msgStyles.filePreviewName} numberOfLines={1}>🎙 Voice note</Text>
                  </View>
                ) : att.mimeType === "video/mp4" ? (
                  <View style={msgStyles.filePreviewChip}>
                    <Ionicons name="videocam" size={18} color="#0047AB" />
                    <Text style={msgStyles.filePreviewName} numberOfLines={1}>🎥 Video</Text>
                  </View>
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

        {/* Input Bar */}
        <View style={msgStyles.inputBar}>
          <TouchableOpacity onPress={showAttachmentOptions} style={msgStyles.attachBtn}>
            <Ionicons name="attach" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={msgStyles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              editingMsg ? "Edit message..." :
              replyTo    ? "Write a reply..."  :
                           "Type a message..."
            }
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          {!inputText.trim() && attachments.length === 0 && !editingMsg && (
            <TouchableOpacity
              style={[msgStyles.voiceBtn, isRecording && msgStyles.voiceBtnActive]}
              onPress={handleVoicePress}
              activeOpacity={0.8}
            >
              {isTranscribing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name={isRecording ? "stop" : "mic"} size={20} color="#fff" />
              }
            </TouchableOpacity>
          )}
          {(!!inputText.trim() || attachments.length > 0 || editingMsg) && (
            <TouchableOpacity
              style={[
                msgStyles.sendBtn,
                { backgroundColor: editingMsg ? "#F59E0B" : theme.primary },
                sending && { opacity: 0.5 },
              ]}
              onPress={sendMessage}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name={editingMsg ? "checkmark" : "send"} size={18} color="#fff" />
              }
            </TouchableOpacity>
          )}
        </View>

        {isRecording && (
          <View style={msgStyles.recordingBar}>
            <View style={msgStyles.recordingDot} />
            <Text style={msgStyles.recordingText}>Recording... tap 🛑 to stop</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Camera Modal ── (outside KeyboardAvoidingView) */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => {
          if (isVideoRecording) stopVideoRecording();
          setShowCamera(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {/* Camera fills the whole view */}
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={cameraFacing}
            mode="video"
          />

          {/* ✅ Overlay OUTSIDE CameraView using absolute positioning */}
          {/* Top bar */}
          <View style={{
            position: "absolute", top: 0, left: 0, right: 0,
            flexDirection: "row", justifyContent: "space-between",
            padding: 16, paddingTop: 50,
          }}>
            <TouchableOpacity
              onPress={() => {
                if (isVideoRecording) stopVideoRecording();
                setShowCamera(false);
              }}
              style={{ backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 8 }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCameraFacing((f) => f === "back" ? "front" : "back")}
              style={{ backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 8 }}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Record button */}
          <View style={{
            position: "absolute", bottom: 50, left: 0, right: 0,
            alignItems: "center",
          }}>
            {isVideoRecording && (
              <Text style={{ color: "#fff", marginBottom: 12, fontSize: 16 }}>🔴 Recording...</Text>
            )}
            <TouchableOpacity
              onPress={isVideoRecording ? stopVideoRecording : startVideoRecording}
              style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: isVideoRecording ? "#EF4444" : "#fff",
                borderWidth: 4,
                borderColor: isVideoRecording ? "#fff" : "#EF4444",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Ionicons
                name={isVideoRecording ? "stop" : "videocam"}
                size={30}
                color={isVideoRecording ? "#fff" : "#EF4444"}
              />
            </TouchableOpacity>
            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 12, fontSize: 13 }}>
              {isVideoRecording ? "Tap to stop" : "Tap to record video"}
            </Text>
          </View>
        </View>
      </Modal>

      {/* ── Video Preview Modal ── */}
      {previewVideo && (
        <VideoPlayerModal uri={previewVideo} onClose={() => setPreviewVideo(null)} />
      )}

      {/* ── Context Menu Modal ── */}
      <Modal
        visible={!!contextMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setContextMsg(null)}
      >
        <Pressable style={msgStyles.modalOverlay} onPress={() => setContextMsg(null)}>
          <View style={msgStyles.contextMenu}>
            <Text style={msgStyles.contextPreview} numberOfLines={2}>
              {contextMsg?.text || "📎 Attachment"}
            </Text>
            <TouchableOpacity style={msgStyles.contextItem} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color="#111827" />
              <Text style={msgStyles.contextItemText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={msgStyles.contextItem} onPress={handleReply}>
              <Ionicons name="arrow-undo-outline" size={20} color="#111827" />
              <Text style={msgStyles.contextItemText}>Reply</Text>
            </TouchableOpacity>
            {contextMsg?.sender === "parent" && (
              <TouchableOpacity style={msgStyles.contextItem} onPress={handleEdit}>
                <Ionicons name="pencil-outline" size={20} color="#111827" />
                <Text style={msgStyles.contextItemText}>Edit</Text>
              </TouchableOpacity>
            )}
            {contextMsg?.sender === "parent" && (
              <TouchableOpacity style={msgStyles.contextItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[msgStyles.contextItemText, { color: "#EF4444" }]}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={msgStyles.contextItem} onPress={handlePin}>
              <Ionicons
                name={pinnedIds.includes(contextMsg?.id ?? "") ? "pin" : "pin-outline"}
                size={20}
                color={pinnedIds.includes(contextMsg?.id ?? "") ? "#EF4444" : "#111827"}
              />
              <Text style={[
                msgStyles.contextItemText,
                pinnedIds.includes(contextMsg?.id ?? "") && { color: "#EF4444" },
              ]}>
                {pinnedIds.includes(contextMsg?.id ?? "") ? "Unpin" : "Pin"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[msgStyles.contextItem, msgStyles.contextCancel]}
              onPress={() => setContextMsg(null)}
            >
              <Ionicons name="close-outline" size={20} color="#9CA3AF" />
              <Text style={[msgStyles.contextItemText, { color: "#9CA3AF" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Attachment Preview Modal ── */}
      <Modal
        visible={!!previewItem}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewItem(null)}
      >
        <View style={msgStyles.previewModal}>
          <TouchableOpacity style={msgStyles.previewClose} onPress={() => setPreviewItem(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {previewItem?.type === "image" ? (
            <Image source={{ uri: previewItem.uri }} style={msgStyles.fullImage} resizeMode="contain" />
          ) : (
            <View style={msgStyles.filePreviewFull}>
              <Ionicons name="document-outline" size={64} color="#fff" />
              <Text style={msgStyles.filePreviewFullName}>{previewItem?.name ?? "File"}</Text>
              <Text style={msgStyles.filePreviewFullSub}>Tap below to open</Text>
              <TouchableOpacity
                style={msgStyles.openUrlBtn}
                onPress={() => {
                  if (previewItem?.uri) {
                    const { Linking } = require("react-native");
                    Linking.openURL(previewItem.uri);
                  }
                }}
              >
                <Text style={msgStyles.openUrlText}>Open File ↗</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── Styles placeholder (keep your existing msgStyles) ──
const msgStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  headerTop: { paddingBottom: 12 },
  headerTopRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8 },
  backBtn: { padding: 8 },
  backArrow: { fontSize: 22, color: "#fff" },
  avatarContainer: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 8 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: "#fff", fontWeight: "700", fontSize: 16 },
  headerTextContainer: { marginLeft: 10 },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  classBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  classBadgeText: { color: "#fff", fontSize: 11 },
  logoutBtn: { padding: 8 },
  logoutIcon: { fontSize: 20, color: "#fff" },
  pinnedBanner: { backgroundColor: "#FEF3C7", padding: 8, borderBottomWidth: 1, borderColor: "#FDE68A" },
  pinnedBannerTitle: { fontSize: 12, color: "#92400E", fontWeight: "600", marginBottom: 4 },
  pinnedChip: { backgroundColor: "#FDE68A", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  pinnedChipText: { fontSize: 12, color: "#92400E", maxWidth: 160 },
  loadingWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: "#6B7280" },
  list: { padding: 12, paddingBottom: 4 },
  emptyWrapper: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginTop: 12 },
  emptySub: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 10, marginBottom: 8 },
  bubbleLeft: { alignSelf: "flex-start", backgroundColor: "#F3F4F6", borderBottomLeftRadius: 4 },
  bubbleRight: { alignSelf: "flex-end", backgroundColor: "#0047AB", borderBottomRightRadius: 4 },
  bubblePinned: { borderWidth: 1.5, borderColor: "#F59E0B" },
  pinIndicator: { fontSize: 10, color: "#F59E0B", marginBottom: 2 },
  senderLabel: { fontSize: 11, color: "#6B7280", marginBottom: 2 },
  replyReference: { borderRadius: 8, padding: 6, marginBottom: 4 },
  replyReferenceRight: { backgroundColor: "rgba(255,255,255,0.15)" },
  replyReferenceLeft: { backgroundColor: "#E5E7EB" },
  replyReferenceLabel: { fontSize: 10, color: "#9CA3AF" },
  replyReferenceText: { fontSize: 12, color: "#374151" },
  msgText: { fontSize: 15, color: "#111827", lineHeight: 20 },
  attachedImage: { width: 200, height: 150, borderRadius: 10, marginTop: 6 },
  fileChip: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, backgroundColor: "rgba(0,0,0,0.07)", borderRadius: 8, padding: 6 },
  fileName: { fontSize: 13, color: "#374151", flex: 1 },
  timeText: { fontSize: 10, color: "#9CA3AF", marginTop: 4, alignSelf: "flex-end" },
  replyBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", padding: 10, borderTopWidth: 1, borderColor: "#E5E7EB" },
  replyBannerLabel: { fontSize: 11, color: "#6B7280" },
  replyBannerText: { fontSize: 13, color: "#111827" },
  editBanner: { backgroundColor: "#FEF3C7" },
  attachmentPreviewWrap: { flexDirection: "row", padding: 8, gap: 8, backgroundColor: "#F9FAFB", borderTopWidth: 1, borderColor: "#E5E7EB" },
  attachmentPreview: { position: "relative" },
  previewImage: { width: 60, height: 60, borderRadius: 8 },
  filePreviewChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E0E7FF", borderRadius: 8, padding: 8, maxWidth: 120 },
  filePreviewName: { fontSize: 11, color: "#1E40AF", flex: 1 },
  removeAttachment: { position: "absolute", top: -6, right: -6 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 8, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#E5E7EB" },
  attachBtn: { padding: 8 },
  input: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  voiceBtn: { backgroundColor: "#6B7280", borderRadius: 20, padding: 10, marginLeft: 6 },
  voiceBtnActive: { backgroundColor: "#EF4444" },
  sendBtn: { borderRadius: 20, padding: 10, marginLeft: 6 },
  recordingBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEE2E2", padding: 8, gap: 8 },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444" },
  recordingText: { fontSize: 13, color: "#991B1B" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  contextMenu: { backgroundColor: "#fff", borderRadius: 16, padding: 8, width: 260, elevation: 8 },
  contextPreview: { fontSize: 13, color: "#6B7280", padding: 10, borderBottomWidth: 1, borderColor: "#F3F4F6" },
  contextItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  contextItemText: { fontSize: 15, color: "#111827" },
  contextCancel: { borderTopWidth: 1, borderColor: "#F3F4F6", marginTop: 4 },
  previewModal: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  previewClose: { position: "absolute", top: 50, right: 16, zIndex: 10 },
  fullImage: { width: "100%", height: "80%" },
  filePreviewFull: { alignItems: "center", gap: 12 },
  filePreviewFullName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  filePreviewFullSub: { color: "#9CA3AF", fontSize: 13 },
  openUrlBtn: { backgroundColor: "#0047AB", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  openUrlText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});