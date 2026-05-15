// import React, { useState, useRef, useCallback, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   Image,
//   Modal,
//   ScrollView,
//   Pressable,
//   Clipboard,
//   Dimensions,
//   StatusBar,
//   RefreshControl,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { useTheme } from "../ThemeContext";
// import * as ImagePicker from "expo-image-picker";
// import * as DocumentPicker from "expo-document-picker";
// import { Audio } from "expo-av";
// import * as FileSystem from "expo-file-system/legacy";
// import {
//   CameraView,
//   useCameraPermissions,
//   useMicrophonePermissions,
// } from "expo-camera";
// import { VideoView, useVideoPlayer } from "expo-video";
// import * as MediaLibrary from "expo-media-library";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { WebView } from "react-native-webview";

// const BASE_URL = "https://connect.schoolaid.in";
// const PRIMARY = "#0047AB";
// const SCREEN_W = Dimensions.get("window").width;

// const EMOJI_LIST = [
//   "😀",
//   "😁",
//   "😂",
//   "🤣",
//   "😊",
//   "😍",
//   "🥰",
//   "😘",
//   "😎",
//   "🤩",
//   "😅",
//   "😆",
//   "🙂",
//   "🙃",
//   "😉",
//   "😋",
//   "😜",
//   "🤪",
//   "😝",
//   "🤑",
//   "🤗",
//   "🤔",
//   "🤐",
//   "😐",
//   "😑",
//   "😶",
//   "😏",
//   "😒",
//   "🙄",
//   "😬",
//   "😌",
//   "😔",
//   "😪",
//   "🤤",
//   "😴",
//   "😷",
//   "🤒",
//   "🤕",
//   "🤧",
//   "🥵",
//   "❤️",
//   "🧡",
//   "💛",
//   "💚",
//   "💙",
//   "💜",
//   "🖤",
//   "💔",
//   "💕",
//   "💞",
//   "👍",
//   "👎",
//   "👏",
//   "🙌",
//   "🤝",
//   "🙏",
//   "💪",
//   "✌️",
//   "🤞",
//   "👌",
//   "🎉",
//   "🎊",
//   "🎈",
//   "🎁",
//   "🏆",
//   "⭐",
//   "🌟",
//   "✨",
//   "🔥",
//   "💯",
//   "😢",
//   "😭",
//   "😤",
//   "😠",
//   "😡",
//   "🤬",
//   "😈",
//   "👿",
//   "💀",
//   "☠️",
// ];

// // ── Interfaces ──────────────────────────────────────────────
// interface Message {
//   id: string;
//   text: string;
//   sender: "parent" | "teacher";
//   createdAt: string;
//   attachmentUrl?: string;
//   attachmentType?: "image" | "file" | "video";
//   attachmentName?: string;
//   replyToId?: string;
//   replyToText?: string;
//   threadId?: number; // ← ADD THIS
//   status?: "sending" | "sent" | "delivered" | "read";
// }

// interface AttachmentItem {
//   uri: string;
//   type: "image" | "file" | "video";
//   name: string;
//   mimeType: string;
// }

// interface DownloadedFile {
//   key: string;
//   url: string;
//   localUri: string;
//   name: string;
//   type: "file" | "video";
//   savedAt: string;
//   size?: number;
// }

// interface SearchResult {
//   type: "message" | "media" | "file" | "voice";
//   message: Message;
//   matchText: string;
// }

// type TabType = "chat" | "media" | "downloads";

// // ── Helpers ─────────────────────────────────────────────────
// const buildUrl = (url: string) =>
//   url?.startsWith("http")
//     ? url
//     : `${BASE_URL}/${url?.replace(/^\//, "") ?? ""}`;

// const formatTime = (iso: string) =>
//   new Date(iso).toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   });

// const formatDate = (iso: string) => {
//   const d = new Date(iso);
//   const today = new Date();
//   const yesterday = new Date(today);
//   yesterday.setDate(today.getDate() - 1);
//   if (d.toDateString() === today.toDateString()) return "Today";
//   if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
//   return d.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// };

// const getMimeType = (name: string): string => {
//   const ext = name.split(".").pop()?.toLowerCase() ?? "";
//   const map: Record<string, string> = {
//     pdf: "application/pdf",
//     doc: "application/msword",
//     docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     xls: "application/vnd.ms-excel",
//     xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     ppt: "application/vnd.ms-powerpoint",
//     pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//     txt: "text/plain",
//     jpg: "image/jpeg",
//     jpeg: "image/jpeg",
//     png: "image/png",
//     gif: "image/gif",
//     mp4: "video/mp4",
//     mp3: "audio/mpeg",
//     m4a: "audio/m4a",
//     zip: "application/zip",
//   };
//   return map[ext] ?? "application/octet-stream";
// };

// // ── VideoPlayerModal ─────────────────────────────────────────
// function VideoPlayerModal({
//   uri,
//   onClose,
// }: {
//   uri: string;
//   onClose: () => void;
// }) {
//   const player = useVideoPlayer({ uri }, (p) => {
//     p.loop = false;
//   });
//   useEffect(() => {
//     const t = setTimeout(() => {
//       try {
//         player.play();
//       } catch {}
//     }, 300);
//     return () => clearTimeout(t);
//   }, [player]);

//   return (
//     <Modal visible animationType="slide" onRequestClose={onClose}>
//       <View
//         style={{ flex: 1, backgroundColor: "#000", justifyContent: "center" }}
//       >
//         <TouchableOpacity onPress={onClose} style={styles.videoClose}>
//           <Ionicons name="close" size={26} color="#fff" />
//         </TouchableOpacity>
//         <VideoView
//           player={player}
//           style={{ width: "100%", height: 350 }}
//           contentFit="contain"
//           nativeControls
//         />
//       </View>
//     </Modal>
//   );
// }

// // ── AudioPlayerModal ─────────────────────────────────────────
// function AudioPlayerModal({
//   uri,
//   name,
//   onClose,
// }: {
//   uri: string;
//   name: string;
//   onClose: () => void;
// }) {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [duration, setDuration] = useState(0);
//   const [position, setPosition] = useState(0);
//   const soundRef = useRef<Audio.Sound | null>(null);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         await Audio.setAudioModeAsync({
//           allowsRecordingIOS: false,
//           playsInSilentModeIOS: true,
//           staysActiveInBackground: false,
//           shouldDuckAndroid: true,
//           playThroughEarpieceAndroid: false,
//         });
//         const { sound } = await Audio.Sound.createAsync(
//           { uri: uri.startsWith("http") ? buildUrl(uri) : uri },
//           { shouldPlay: false, volume: 1.0 },
//         );
//         soundRef.current = sound;
//         setIsLoading(false);
//         sound.setOnPlaybackStatusUpdate((status) => {
//           if (!status.isLoaded) return;
//           setIsPlaying(status.isPlaying);
//           setPosition(status.positionMillis ?? 0);
//           setDuration(status.durationMillis ?? 0);
//           if (status.didJustFinish) {
//             setIsPlaying(false);
//             setPosition(0);
//             sound.setPositionAsync(0);
//           }
//         });
//       } catch {
//         setIsLoading(false);
//       }
//     };
//     load();
//     return () => {
//       soundRef.current?.unloadAsync();
//     };
//   }, [uri]);

//   const togglePlay = async () => {
//     if (!soundRef.current) return;
//     if (isPlaying) await soundRef.current.pauseAsync();
//     else await soundRef.current.playAsync();
//   };

//   const formatMs = (ms: number) => {
//     const totalSec = Math.floor(ms / 1000);
//     const m = Math.floor(totalSec / 60);
//     const sec = totalSec % 60;
//     return `${m}:${sec.toString().padStart(2, "0")}`;
//   };

//   const progress = duration > 0 ? position / duration : 0;
//   const bars = [
//     4, 8, 14, 10, 6, 12, 16, 8, 5, 11, 9, 14, 7, 10, 6, 12, 8, 14, 5, 10,
//   ];

//   return (
//     <Modal visible animationType="slide" transparent onRequestClose={onClose}>
//       <View style={av.overlay}>
//         <View style={av.card}>
//           <TouchableOpacity onPress={onClose} style={av.closeBtn}>
//             <Ionicons name="close" size={20} color="#6B7280" />
//           </TouchableOpacity>
//           <View style={av.iconWrap}>
//             <Ionicons name="mic" size={32} color={PRIMARY} />
//           </View>
//           <Text style={av.title} numberOfLines={1}>
//             {name}
//           </Text>
//           <Text style={av.subtitle}>Voice Note</Text>
//           <View style={av.waveWrap}>
//             {bars.map((h, i) => (
//               <View
//                 key={i}
//                 style={[
//                   av.waveBar,
//                   {
//                     height: h * 2,
//                     backgroundColor:
//                       i / bars.length <= progress ? PRIMARY : "#E5E7EB",
//                   },
//                 ]}
//               />
//             ))}
//           </View>
//           <View style={av.timeRow}>
//             <Text style={av.timeText}>{formatMs(position)}</Text>
//             <Text style={av.timeText}>{formatMs(duration)}</Text>
//           </View>
//           {isLoading ? (
//             <ActivityIndicator
//               size="large"
//               color={PRIMARY}
//               style={{ marginTop: 16 }}
//             />
//           ) : (
//             <TouchableOpacity
//               onPress={togglePlay}
//               style={av.playBtn}
//               activeOpacity={0.85}
//             >
//               <Ionicons
//                 name={isPlaying ? "pause" : "play"}
//                 size={28}
//                 color="#fff"
//               />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const av = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//   },
//   card: {
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 24,
//     alignItems: "center",
//     paddingBottom: 40,
//   },
//   closeBtn: {
//     alignSelf: "flex-end",
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#F3F4F6",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 16,
//   },
//   iconWrap: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "#EEF3FF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 14,
//   },
//   title: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: "#1F2937",
//     marginBottom: 4,
//     maxWidth: 260,
//     textAlign: "center",
//   },
//   subtitle: { fontSize: 12, color: "#9CA3AF", marginBottom: 24 },
//   waveWrap: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 3,
//     height: 40,
//     marginBottom: 10,
//   },
//   waveBar: { width: 4, borderRadius: 3 },
//   timeRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     width: "100%",
//     marginBottom: 24,
//     paddingHorizontal: 4,
//   },
//   timeText: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
//   playBtn: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: PRIMARY,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });

// // ── InAppDocViewer ───────────────────────────────────────────

// // ── InAppDocViewer ───────────────────────────────────────────
// // function InAppDocViewer({
// //   uri,
// //   name,
// //   onClose,
// // }: {
// //   uri: string;
// //   name: string;
// //   onClose: () => void;
// // }) {
// //   const [status, setStatus] = useState<
// //     "idle" | "downloading" | "ready" | "error"
// //   >("idle");
// //   const [localUri, setLocalUri] = useState("");
// //   const [base64Data, setBase64] = useState("");
// //   const [progress, setProgress] = useState(0);
// //   const [webKey, setWebKey] = useState(0);
// //   const [blankCount, setBlankCount] = useState(0);

// //   const ext = name.split(".").pop()?.toLowerCase() ?? "";
// //   const isPdf = ext === "pdf";
// //   const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

// //   useEffect(() => {
// //     if (!uri) return;
// //     setStatus("idle");
// //     setLocalUri("");
// //     setBase64("");
// //     setProgress(0);
// //     setWebKey(0);
// //     setBlankCount(0);

// //     if (isPdf) {
// //       setStatus("ready"); // PDFs use Google Docs Viewer — no download needed
// //     } else {
// //       downloadAndLoad();
// //     }
// //   }, [uri]);

// //   const downloadAndLoad = async () => {
// //     try {
// //       setStatus("downloading");
// //       const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
// //       const baseDir = FileSystem.documentDirectory + "schoolaid_cache/";
// //       const cacheKey = `${baseDir}${safeName}`;

// //       const dirInfo = await FileSystem.getInfoAsync(baseDir);
// //       if (!dirInfo.exists) {
// //         await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
// //       }

// //       // Use cached file if already downloaded
// //       const fileInfo = await FileSystem.getInfoAsync(cacheKey);
// //       let fileUri = "";
// //       if (fileInfo.exists) {
// //         fileUri = cacheKey;
// //       } else {
// //         const task = FileSystem.createDownloadResumable(
// //           uri.startsWith("http")
// //             ? uri
// //             : `${BASE_URL}/${uri.replace(/^\//, "")}`,
// //           cacheKey,
// //           {},
// //           (dp: any) => {
// //             if (dp.totalBytesExpectedToWrite > 0) {
// //               setProgress(dp.totalBytesWritten / dp.totalBytesExpectedToWrite);
// //             }
// //           },
// //         );
// //         const result = await task.downloadAsync();
// //         if (!result?.uri) throw new Error("Download failed");
// //         fileUri = result.uri;
// //       }

// //       setLocalUri(fileUri);

// //       if (!isImage) {
// //         const b64 = await FileSystem.readAsStringAsync(fileUri, {
// //           encoding: "base64" as any,
// //         });
// //         setBase64(b64);
// //       }
// //       setStatus("ready");
// //     } catch (err) {
// //       console.error("InAppDocViewer download error:", err);
// //       setStatus("error");
// //     }
// //   };

// // //   const downloadAndLoad = async () => {
// // //   try {
// // //     setStatus("downloading");

// // //     // If URI is already a local file path — skip download entirely
// // //     const isLocal = uri.startsWith("file://") || uri.startsWith("/");

// // //     let fileUri = "";

// // //     if (isLocal) {
// // //       const info = await FileSystem.getInfoAsync(uri) as any;
// // //       if (!info.exists || (info.size ?? 0) === 0) {
// // //         throw new Error("Local file not found or empty");
// // //       }
// // //       fileUri = uri;
// // //     } else {
// // //       const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
// // //       const baseDir  = FileSystem.documentDirectory + "schoolaid_cache/";
// // //       const cacheKey = `${baseDir}${safeName}`;

// // //       const dirInfo = await FileSystem.getInfoAsync(baseDir);
// // //       if (!dirInfo.exists) {
// // //         await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
// // //       }

// // //       // Use cached file if already downloaded
// // //       const fileInfo = await FileSystem.getInfoAsync(cacheKey) as any;
// // //       if (fileInfo.exists && (fileInfo.size ?? 0) > 100) {
// // //         fileUri = cacheKey;
// // //       } else {
// // //         const task = FileSystem.createDownloadResumable(
// // //           uri.startsWith("http") ? uri : `${BASE_URL}/${uri.replace(/^\//, "")}`,
// // //           cacheKey,
// // //           {},
// // //           (dp: any) => {
// // //             if (dp.totalBytesExpectedToWrite > 0) {
// // //               setProgress(dp.totalBytesWritten / dp.totalBytesExpectedToWrite);
// // //             }
// // //           }
// // //         );
// // //         const result = await task.downloadAsync();
// // //         if (!result?.uri) throw new Error("Download failed");
// // //         fileUri = result.uri;
// // //       }
// // //     }

// // //     setLocalUri(fileUri);

// // //     if (!isImage) {
// // //       const b64 = await FileSystem.readAsStringAsync(fileUri, {
// // //         encoding: "base64" as any,
// // //       });
// // //       setBase64(b64);
// // //     }
// // //     setStatus("ready");
// // //   } catch (err) {
// // //     console.error("InAppDocViewer error:", err);
// // //     setStatus("error");
// // //   }
// // // };
// // // useEffect(() => {
// // //   if (!uri) return;
// // //   setStatus("idle");
// // //   setLocalUri("");
// // //   setBase64("");
// // //   setProgress(0);
// // //   setWebKey(0);
// // //   setBlankCount(0);

// // //   const isLocal = uri.startsWith("file://") || uri.startsWith("/");

// // //   if (isPdf && !isLocal) {
// // //     setStatus("ready");
// // //   } else {
// // //     downloadAndLoad();
// // //   }
// // // }, [uri]);

// //   const getDocHtml = () => {
// //     const mimeMap: Record<string, string> = {
// //       doc: "application/msword",
// //       docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// //       xls: "application/vnd.ms-excel",
// //       xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
// //       ppt: "application/vnd.ms-powerpoint",
// //       pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
// //     };
// //     const mime = mimeMap[ext] ?? "application/octet-stream";

// //     if (ext === "txt") {
// //       return `<!DOCTYPE html><html><head>
// //         <meta name="viewport" content="width=device-width,initial-scale=1">
// //         </head><body style="margin:16px;font-family:monospace;font-size:14px;
// //         color:#222;white-space:pre-wrap;word-break:break-word;">
// //         <script>
// //           try { document.body.innerText = decodeURIComponent(escape(atob("${base64Data}"))); }
// //           catch(e) { document.body.innerText = "Could not decode file."; }
// //         <\/script></body></html>`;
// //     }

// //     return `<!DOCTYPE html><html><head>
// //       <meta name="viewport" content="width=device-width,initial-scale=1.0">
// //       <style>*{margin:0;padding:0;}html,body{width:100%;height:100%;background:#fff;}
// //       iframe{width:100%;height:100%;border:none;display:block;}</style></head>
// //       <body><iframe src="data:${mime};base64,${base64Data}"></iframe></body></html>`;
// //   };

// //   const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
// //     uri.startsWith("http") ? uri : `${BASE_URL}/${uri.replace(/^\//, "")}`,
// //   )}&t=${webKey}`;

// //   return (
// //     <Modal visible animationType="slide" onRequestClose={onClose}>
// //       <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
// //         {/* Header */}
// //         <View style={dv.header}>
// //           <TouchableOpacity onPress={onClose} style={dv.closeBtn}>
// //             <Ionicons name="arrow-back" size={22} color="#fff" />
// //           </TouchableOpacity>
// //           <Text style={dv.title} numberOfLines={1}>
// //             {name}
// //           </Text>
// //           {isPdf ? (
// //             <TouchableOpacity
// //               onPress={() => {
// //                 setWebKey((k) => k + 1);
// //                 setBlankCount(0);
// //               }}
// //               style={dv.reloadBtn}
// //             >
// //               <Ionicons name="refresh" size={20} color="#fff" />
// //             </TouchableOpacity>
// //           ) : (
// //             <View style={{ width: 36 }} />
// //           )}
// //         </View>

// //         <View style={{ flex: 1, backgroundColor: "#fff" }}>
// //           {/* Downloading */}
// //           {status === "downloading" && (
// //             <View style={dv.overlay}>
// //               <ActivityIndicator size="large" color="#fff" />
// //               <Text style={dv.overlayText}>
// //                 {progress > 0
// //                   ? `Downloading… ${Math.round(progress * 100)}%`
// //                   : "Downloading…"}
// //               </Text>
// //               {progress > 0 && (
// //                 <View style={dv.progressBar}>
// //                   <View
// //                     style={[
// //                       dv.progressFill,
// //                       { width: `${Math.round(progress * 100)}%` as any },
// //                     ]}
// //                   />
// //                 </View>
// //               )}
// //             </View>
// //           )}

// //           {/* Error */}
// //           {status === "error" && (
// //             <View style={dv.overlay}>
// //               <Text style={{ fontSize: 48 }}>⚠️</Text>
// //               <Text style={[dv.overlayText, { marginTop: 12 }]}>
// //                 Could not open file
// //               </Text>
// //               <TouchableOpacity
// //                 onPress={
// //                   isPdf
// //                     ? () => {
// //                         setWebKey((k) => k + 1);
// //                         setStatus("ready");
// //                       }
// //                     : downloadAndLoad
// //                 }
// //                 style={dv.retryBtn}
// //               >
// //                 <Text style={dv.retryText}>Try Again</Text>
// //               </TouchableOpacity>
// //             </View>
// //           )}

// //           {/* Image */}
// //           {status === "ready" && isImage && (
// //             <ScrollView
// //               maximumZoomScale={4}
// //               minimumZoomScale={1}
// //               centerContent
// //               contentContainerStyle={{
// //                 flex: 1,
// //                 alignItems: "center",
// //                 justifyContent: "center",
// //               }}
// //             >
// //               <Image
// //                 source={{ uri: localUri }}
// //                 style={{ width: SCREEN_W, height: 400 }}
// //                 resizeMode="contain"
// //               />
// //             </ScrollView>
// //           )}

// //           {/* PDF via Google Docs Viewer */}
// //           {status === "ready" && isPdf && (
// //             <WebView
// //               key={`pdf-${webKey}`}
// //               source={{ uri: googleDocsUrl }}
// //               style={{ flex: 1 }}
// //               javaScriptEnabled
// //               domStorageEnabled
// //               startInLoadingState
// //               scalesPageToFit
// //               mixedContentMode="always"
// //               renderLoading={() => (
// //                 <View style={[dv.overlay, { backgroundColor: "#fff" }]}>
// //                   <ActivityIndicator size="large" color={PRIMARY} />
// //                   <Text style={[dv.overlayText, { color: "#333" }]}>
// //                     Loading PDF…
// //                   </Text>
// //                   {blankCount > 0 && (
// //                     <Text
// //                       style={{ color: "#9CA3AF", fontSize: 11, marginTop: 4 }}
// //                     >
// //                       Retrying… (attempt {blankCount + 1})
// //                     </Text>
// //                   )}
// //                 </View>
// //               )}
// //               injectedJavaScript={`
// //                 (function() {
// //                   setTimeout(function() {
// //                     var b = document.body;
// //                     if (!b || b.innerHTML.trim() === '' || b.innerText.trim() === '') {
// //                       window.ReactNativeWebView.postMessage('BLANK');
// //                     }
// //                   }, 3500);
// //                 })();
// //                 true;
// //               `}
// //               onMessage={(e) => {
// //                 if (e.nativeEvent.data === "BLANK" && blankCount < 4) {
// //                   setBlankCount((c) => c + 1);
// //                   setWebKey((k) => k + 1);
// //                 }
// //               }}
// //               onError={() => setStatus("error")}
// //             />
// //           )}

// //           {/* Other docs via base64 */}
// //           {status === "ready" && !isImage && !isPdf && base64Data !== "" && (
// //             <WebView
// //               key="doc-viewer"
// //               source={{ html: getDocHtml() }}
// //               style={{ flex: 1 }}
// //               javaScriptEnabled
// //               domStorageEnabled
// //               originWhitelist={["*"]}
// //               allowFileAccess
// //               allowUniversalAccessFromFileURLs
// //               mixedContentMode="always"
// //               scalesPageToFit
// //               startInLoadingState
// //               renderLoading={() => (
// //                 <View style={[dv.overlay, { backgroundColor: "#fff" }]}>
// //                   <ActivityIndicator size="large" color={PRIMARY} />
// //                   <Text style={[dv.overlayText, { color: "#333" }]}>
// //                     Rendering…
// //                   </Text>
// //                 </View>
// //               )}
// //             />
// //           )}
// //         </View>
// //       </SafeAreaView>
// //     </Modal>
// //   );
// // }

// const dv = StyleSheet.create({
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     backgroundColor: "#111",
//     gap: 10,
//   },
//   closeBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "rgba(255,255,255,0.15)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   reloadBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "rgba(255,255,255,0.15)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   title: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#fff",
//     textAlign: "center",
//   },
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "#000",
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 10,
//     gap: 12,
//   },
//   overlayText: { color: "#fff", fontSize: 13, fontWeight: "600" },
//   progressBar: {
//     width: 200,
//     height: 6,
//     backgroundColor: "rgba(255,255,255,0.2)",
//     borderRadius: 3,
//     overflow: "hidden",
//     marginTop: 4,
//   },
//   progressFill: {
//     height: "100%" as any,
//     backgroundColor: PRIMARY,
//     borderRadius: 3,
//   },
//   retryBtn: {
//     marginTop: 16,
//     backgroundColor: PRIMARY,
//     paddingHorizontal: 24,
//     paddingVertical: 10,
//     borderRadius: 10,
//   },
//   retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
//   loaderWrap: {
//     ...StyleSheet.absoluteFillObject,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#fff",
//     gap: 12,
//     zIndex: 10,
//   },
//   loaderText: { fontSize: 13, color: PRIMARY, fontWeight: "600" },
//   errorWrap: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 10,
//     padding: 30,
//   },
//   errorTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
//   errorSub: {
//     fontSize: 13,
//     color: "#9CA3AF",
//     textAlign: "center",
//     lineHeight: 20,
//   },
// });

// function InAppDocViewer({
//   uri,
//   name,
//   onClose,
// }: {
//   uri: string;
//   name: string;
//   onClose: () => void;
// }) {
//   const [status, setStatus] = useState<
//     "idle" | "downloading" | "ready" | "error"
//   >("idle");
//   const [localUri, setLocalUri] = useState("");
//   const [base64Data, setBase64] = useState("");
//   const [progress, setProgress] = useState(0);
//   const [webKey, setWebKey] = useState(0);
//   const [blankCount, setBlankCount] = useState(0);
//   const [errorMsg, setErrorMsg] = useState("");

//   // Detect extension from name first, fall back to URI
//   const ext =
//     (name.includes(".") ? name : uri).split(".").pop()?.toLowerCase() ?? "";
//   const isPdf = ext === "pdf";
//   const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

//   // A URI is local if it's a file:// path or an absolute device path
//   const isLocal =
//     uri.startsWith("file://") ||
//     uri.startsWith("/var/") || // iOS
//     uri.startsWith("/data/") || // Android
//     uri.startsWith("/storage/") || // Android SD
//     uri.startsWith("/user/") || // some Android variants
//     !uri.startsWith("http"); // ← SAFEST: anything that's not http is local

//   useEffect(() => {
//     if (!uri) return;
//     setStatus("idle");
//     setLocalUri("");
//     setBase64("");
//     setProgress(0);
//     setWebKey(0);
//     setBlankCount(0);
//     setErrorMsg("");

//     if (isPdf && !isLocal) {
//       // Remote PDF → Google Docs Viewer (online)
//       setStatus("ready");
//     } else {
//       // Local file OR non-PDF remote → download/read from disk
//       loadFile();
//     }
//   }, [uri]);

//   const loadFile = async () => {
//     try {
//       setStatus("downloading");
//       console.log("[DocViewer] uri:", uri, "isLocal:", isLocal, "ext:", ext);

//       let fileUri = "";

//       if (isLocal) {
//         const info = (await FileSystem.getInfoAsync(uri)) as any;
//         if (!info.exists) throw new Error("File not found on device");
//         if ((info.size ?? 0) === 0) throw new Error("File is empty");
//         fileUri = uri;
//       } else {
//         const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
//         const baseDir =
//           (FileSystem.documentDirectory ?? "") + "schoolaid_cache/";
//         const cacheKey = `${baseDir}${safeName}`;

//         const dirInfo = await FileSystem.getInfoAsync(baseDir);
//         if (!dirInfo.exists) {
//           await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
//         }

//         const cached = (await FileSystem.getInfoAsync(cacheKey)) as any;
//         if (cached.exists && (cached.size ?? 0) > 100) {
//           fileUri = cacheKey;
//         } else {
//           const fullUrl = uri.startsWith("http")
//             ? uri
//             : `${BASE_URL}/${uri.replace(/^\/+/, "")}`;

//           const task = FileSystem.createDownloadResumable(
//             fullUrl,
//             cacheKey,
//             {},
//             (dp: any) => {
//               if (dp.totalBytesExpectedToWrite > 0) {
//                 setProgress(
//                   dp.totalBytesWritten / dp.totalBytesExpectedToWrite,
//                 );
//               }
//             },
//           );
//           const result = await task.downloadAsync();
//           if (!result?.uri)
//             throw new Error("Download failed — check your connection");

//           const info = (await FileSystem.getInfoAsync(result.uri)) as any;
//           if (!info.exists || (info.size ?? 0) === 0)
//             throw new Error("Downloaded file is empty");
//           fileUri = result.uri;
//         }
//       }

//       setLocalUri(fileUri);

//       // Read base64 for all non-image files
//       if (!isImage) {
//         const b64 = await FileSystem.readAsStringAsync(fileUri, {
//           encoding: "base64" as any,
//         });
//         if (!b64 || b64.length < 10)
//           throw new Error("Could not read file content");
//         setBase64(b64);
//       }

//       setStatus("ready");
//     } catch (err: any) {
//       console.error("[InAppDocViewer]", err?.message ?? err);
//       setErrorMsg(err?.message ?? "Unknown error");
//       setStatus("error");
//     }
//   };

//   // PDF rendered from base64 — no internet needed
//   const getPdfHtml = () => `<!DOCTYPE html>
// <html>
// <head>
//   <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes">
//   <style>
//     * { margin:0; padding:0; box-sizing:border-box; }
//     html, body { width:100%; height:100%; background:#525659; overflow:auto; }
//     #pdf-container { width:100%; padding:8px 0; }
//     canvas {
//       display:block;
//       margin:8px auto;
//       box-shadow:0 2px 8px rgba(0,0,0,0.4);
//       width:100%;
//       max-width:100%;
//     }
//     #loading {
//       color:#fff;
//       text-align:center;
//       padding:40px 20px;
//       font-family:sans-serif;
//       font-size:14px;
//     }
//     #error {
//       color:#ff6b6b;
//       text-align:center;
//       padding:40px 20px;
//       font-family:sans-serif;
//       font-size:14px;
//     }
//   </style>
// </head>
// <body>
//   <div id="loading">Loading PDF…</div>
//   <div id="pdf-container"></div>
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
//   <script>
//     pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

//     const base64 = "${base64Data}";
//     const raw = atob(base64);
//     const arr = new Uint8Array(raw.length);
//     for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

//     // High DPI scale — use devicePixelRatio for crisp rendering
//     const DPR = window.devicePixelRatio || 3;
//     const deviceWidth = window.innerWidth - 16;

//     pdfjsLib.getDocument({ data: arr }).promise.then(function(pdf) {
//       document.getElementById('loading').style.display = 'none';
//       const container = document.getElementById('pdf-container');
//       const totalPages = pdf.numPages;

//       const renderPage = function(pageNum) {
//         pdf.getPage(pageNum).then(function(page) {
//           const baseViewport = page.getViewport({ scale: 1 });

//           // Scale to fit device width, then multiply by DPR for sharpness
//           const baseScale = deviceWidth / baseViewport.width;
//           const renderScale = baseScale * DPR;

//           const renderViewport = page.getViewport({ scale: renderScale });

//           const canvas = document.createElement('canvas');
//           // Canvas pixel size = render size (high res)
//           canvas.width  = renderViewport.width;
//           canvas.height = renderViewport.height;
//           // CSS size = device size (scaled down to fit screen)
//           canvas.style.width  = deviceWidth + 'px';
//           canvas.style.height = (renderViewport.height / DPR) + 'px';

//           const ctx = canvas.getContext('2d');
//           page.render({
//             canvasContext: ctx,
//             viewport: renderViewport
//           }).promise.then(function() {
//             container.appendChild(canvas);
//           });
//         });
//       };

//       // Render all pages
//       for (let i = 1; i <= totalPages; i++) {
//         renderPage(i);
//       }
//     }).catch(function(err) {
//       document.getElementById('loading').style.display = 'none';
//       document.getElementById('error').innerText = 'Could not render PDF: ' + err.message;
//     });
//   </script>
// </body>
// </html>`;

//   const getDocHtml = () => {
//     const mimeMap: Record<string, string> = {
//       doc: "application/msword",
//       docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       xls: "application/vnd.ms-excel",
//       xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       ppt: "application/vnd.ms-powerpoint",
//       pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//     };
//     const mime = mimeMap[ext] ?? "application/octet-stream";

//     if (ext === "txt") {
//       return `<!DOCTYPE html><html><head>
//         <meta name="viewport" content="width=device-width,initial-scale=1">
//         </head><body style="margin:16px;font-family:monospace;font-size:14px;
//         color:#222;white-space:pre-wrap;word-break:break-word;">
//         <script>
//           try { document.body.innerText = decodeURIComponent(escape(atob("${base64Data}"))); }
//           catch(e) { document.body.innerText = "Could not decode file."; }
//         <\/script></body></html>`;
//     }

//     return `<!DOCTYPE html><html><head>
//       <meta name="viewport" content="width=device-width,initial-scale=1.0">
//       <style>*{margin:0;padding:0;}html,body{width:100%;height:100%;background:#fff;}
//       iframe{width:100%;height:100%;border:none;display:block;}</style></head>
//       <body><iframe src="data:${mime};base64,${base64Data}"></iframe></body></html>`;
//   };

//   // Remote PDF URL for Google Docs Viewer (online only)
//   const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
//     uri.startsWith("http") ? uri : `${BASE_URL}/${uri.replace(/^\//, "")}`,
//   )}&t=${webKey}`;

//   return (
//     <Modal visible animationType="slide" onRequestClose={onClose}>
//       <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
//         {/* Header */}
//         <View style={dv.header}>
//           <TouchableOpacity onPress={onClose} style={dv.closeBtn}>
//             <Ionicons name="arrow-back" size={22} color="#fff" />
//           </TouchableOpacity>
//           <Text style={dv.title} numberOfLines={1}>
//             {name}
//           </Text>
//           <TouchableOpacity
//             onPress={() => {
//               if (isLocal || !isPdf) {
//                 // Re-read from disk
//                 setBase64("");
//                 setLocalUri("");
//                 setErrorMsg("");
//                 loadFile();
//               } else {
//                 // Retry Google Docs Viewer
//                 setWebKey((k) => k + 1);
//                 setBlankCount(0);
//                 setStatus("ready");
//               }
//             }}
//             style={dv.reloadBtn}
//           >
//             <Ionicons name="refresh" size={20} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         <View style={{ flex: 1, backgroundColor: "#fff" }}>
//           {/* Downloading / Loading */}
//           {status === "downloading" && (
//             <View style={dv.overlay}>
//               <ActivityIndicator size="large" color="#fff" />
//               <Text style={dv.overlayText}>
//                 {isLocal
//                   ? "Opening file…"
//                   : progress > 0
//                     ? `Downloading… ${Math.round(progress * 100)}%`
//                     : "Downloading…"}
//               </Text>
//               {!isLocal && progress > 0 && (
//                 <View style={dv.progressBar}>
//                   <View
//                     style={[
//                       dv.progressFill,
//                       { width: `${Math.round(progress * 100)}%` as any },
//                     ]}
//                   />
//                 </View>
//               )}
//             </View>
//           )}

//           {/* Error */}
//           {status === "error" && (
//             <View style={dv.overlay}>
//               <Text style={{ fontSize: 48 }}>⚠️</Text>
//               <Text
//                 style={[dv.overlayText, { marginTop: 12, textAlign: "center" }]}
//               >
//                 Could not open file
//               </Text>
//               {!!errorMsg && (
//                 <Text
//                   style={{
//                     color: "rgba(255,255,255,0.6)",
//                     fontSize: 12,
//                     marginTop: 6,
//                     textAlign: "center",
//                     paddingHorizontal: 32,
//                   }}
//                 >
//                   {errorMsg}
//                 </Text>
//               )}
//               {!isLocal && (
//                 <Text
//                   style={{
//                     color: "rgba(255,255,255,0.45)",
//                     fontSize: 11,
//                     marginTop: 4,
//                     textAlign: "center",
//                   }}
//                 >
//                   Make sure you're connected to the internet
//                 </Text>
//               )}
//               <TouchableOpacity
//                 onPress={() => {
//                   setErrorMsg("");
//                   if (isPdf && !isLocal) {
//                     setWebKey((k) => k + 1);
//                     setStatus("ready");
//                   } else {
//                     loadFile();
//                   }
//                 }}
//                 style={dv.retryBtn}
//               >
//                 <Text style={dv.retryText}>Try Again</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* Image */}
//           {status === "ready" && isImage && (
//             <ScrollView
//               maximumZoomScale={4}
//               minimumZoomScale={1}
//               centerContent
//               contentContainerStyle={{
//                 flex: 1,
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <Image
//                 source={{ uri: localUri }}
//                 style={{ width: SCREEN_W, height: 400 }}
//                 resizeMode="contain"
//               />
//             </ScrollView>
//           )}

//           {/* Remote PDF via Google Docs Viewer (online) */}
//           {status === "ready" && isPdf && !isLocal && (
//             <WebView
//               key={`pdf-remote-${webKey}`}
//               source={{ uri: googleDocsUrl }}
//               style={{ flex: 1 }}
//               javaScriptEnabled
//               domStorageEnabled
//               startInLoadingState
//               scalesPageToFit
//               mixedContentMode="always"
//               renderLoading={() => (
//                 <View style={[dv.overlay, { backgroundColor: "#fff" }]}>
//                   <ActivityIndicator size="large" color={PRIMARY} />
//                   <Text style={[dv.overlayText, { color: "#333" }]}>
//                     Loading PDF…
//                   </Text>
//                   {blankCount > 0 && (
//                     <Text
//                       style={{ color: "#9CA3AF", fontSize: 11, marginTop: 4 }}
//                     >
//                       Retrying… (attempt {blankCount + 1})
//                     </Text>
//                   )}
//                 </View>
//               )}
//               injectedJavaScript={`
//                 (function() {
//                   setTimeout(function() {
//                     var b = document.body;
//                     if (!b || b.innerHTML.trim() === '' || b.innerText.trim() === '') {
//                       window.ReactNativeWebView.postMessage('BLANK');
//                     }
//                   }, 3500);
//                 })();
//                 true;
//               `}
//               onMessage={(e) => {
//                 if (e.nativeEvent.data === "BLANK" && blankCount < 4) {
//                   setBlankCount((c) => c + 1);
//                   setWebKey((k) => k + 1);
//                 }
//               }}
//               onError={() => setStatus("error")}
//             />
//           )}

//           {/* Local PDF via base64 (offline) */}
//           {/* Local PDF via direct file URI */}
//           {/* Local PDF via PDF.js */}
//           {status === "ready" && isPdf && isLocal && base64Data.length > 10 && (
//             <WebView
//               key={`pdf-local-${webKey}`}
//               source={{ html: getPdfHtml() }}
//               style={{ flex: 1 }}
//               javaScriptEnabled
//               domStorageEnabled
//               originWhitelist={["*"]}
//               allowFileAccess
//               allowUniversalAccessFromFileURLs
//               mixedContentMode="always"
//               scalesPageToFit={false}
//               startInLoadingState
//               renderLoading={() => (
//                 <View style={[dv.overlay, { backgroundColor: "#fff" }]}>
//                   <ActivityIndicator size="large" color={PRIMARY} />
//                   <Text style={[dv.overlayText, { color: "#333" }]}>
//                     Opening PDF…
//                   </Text>
//                 </View>
//               )}
//               onError={() => setStatus("error")}
//             />
//           )}

//           {/* Other docs via base64 */}
//           {status === "ready" &&
//             !isImage &&
//             !isPdf &&
//             base64Data.length > 10 && (
//               <WebView
//                 key={`doc-${webKey}`}
//                 source={{ html: getDocHtml() }}
//                 style={{ flex: 1 }}
//                 javaScriptEnabled
//                 domStorageEnabled
//                 originWhitelist={["*"]}
//                 allowFileAccess
//                 allowUniversalAccessFromFileURLs
//                 mixedContentMode="always"
//                 scalesPageToFit
//                 startInLoadingState
//                 renderLoading={() => (
//                   <View style={[dv.overlay, { backgroundColor: "#fff" }]}>
//                     <ActivityIndicator size="large" color={PRIMARY} />
//                     <Text style={[dv.overlayText, { color: "#333" }]}>
//                       Rendering…
//                     </Text>
//                   </View>
//                 )}
//                 onError={() => setStatus("error")}
//               />
//             )}
//         </View>
//       </SafeAreaView>
//     </Modal>
//   );
// }

// // ── GlobalSearchModal ────────────────────────────────────────
// function GlobalSearchModal({
//   results,
//   onClose,
//   onNavigate,
// }: {
//   results: SearchResult[];
//   onClose: () => void;
//   onNavigate: (result: SearchResult) => void;
// }) {
//   const getIcon = (type: SearchResult["type"]) => {
//     if (type === "media") return "image-outline";
//     if (type === "file") return "document-outline";
//     if (type === "voice") return "mic-outline";
//     return "chatbubble-outline";
//   };
//   const getColor = (type: SearchResult["type"]) => {
//     if (type === "media") return "#7C3AED";
//     if (type === "file") return "#EA580C";
//     if (type === "voice") return "#0891B2";
//     return PRIMARY;
//   };
//   const getLabel = (type: SearchResult["type"]) => {
//     if (type === "media") return "Photo/Video";
//     if (type === "file") return "File";
//     if (type === "voice") return "Voice Note";
//     return "Message";
//   };

//   return (
//     <Modal visible animationType="slide" onRequestClose={onClose}>
//       <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F4FB" }}>
//         <View style={gs.header}>
//           <TouchableOpacity onPress={onClose} style={gs.closeBtn}>
//             <Ionicons name="arrow-back" size={22} color="#1F2937" />
//           </TouchableOpacity>
//           <Text style={gs.title}>Search Results</Text>
//           <View style={gs.badge}>
//             <Text style={gs.badgeText}>{results.length}</Text>
//           </View>
//         </View>
//         {results.length === 0 ? (
//           <View style={gs.empty}>
//             <Ionicons name="search-outline" size={48} color="#D1D5DB" />
//             <Text style={gs.emptyTitle}>No results found</Text>
//             <Text style={gs.emptySub}>Try different keywords</Text>
//           </View>
//         ) : (
//           <FlatList
//             data={results}
//             keyExtractor={(_, i) => String(i)}
//             contentContainerStyle={{ padding: 14, gap: 10 }}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={gs.row}
//                 onPress={() => onNavigate(item)}
//                 activeOpacity={0.75}
//               >
//                 <View
//                   style={[
//                     gs.iconBox,
//                     { backgroundColor: getColor(item.type) + "18" },
//                   ]}
//                 >
//                   <Ionicons
//                     name={getIcon(item.type)}
//                     size={20}
//                     color={getColor(item.type)}
//                   />
//                 </View>
//                 <View style={{ flex: 1, minWidth: 0 }}>
//                   <View style={gs.topRow}>
//                     <View
//                       style={[
//                         gs.typeBadge,
//                         { backgroundColor: getColor(item.type) + "18" },
//                       ]}
//                     >
//                       <Text
//                         style={[gs.typeText, { color: getColor(item.type) }]}
//                       >
//                         {getLabel(item.type)}
//                       </Text>
//                     </View>
//                     <Text style={gs.timeText}>
//                       {formatTime(item.message.createdAt)}
//                     </Text>
//                   </View>
//                   <Text style={gs.matchText} numberOfLines={2}>
//                     {item.matchText || "Attachment"}
//                   </Text>
//                   <Text style={gs.fromText}>
//                     {item.message.sender === "teacher"
//                       ? "From Teacher"
//                       : "Sent by you"}{" "}
//                     · {formatDate(item.message.createdAt)}
//                   </Text>
//                 </View>
//                 <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
//               </TouchableOpacity>
//             )}
//           />
//         )}
//       </SafeAreaView>
//     </Modal>
//   );
// }

// const gs = StyleSheet.create({
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 14,
//     paddingVertical: 13,
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#E5E7EB",
//     gap: 10,
//   },
//   closeBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "#F3F4F6",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   title: { flex: 1, fontSize: 16, fontWeight: "800", color: "#1F2937" },
//   badge: {
//     backgroundColor: PRIMARY,
//     borderRadius: 12,
//     paddingHorizontal: 9,
//     paddingVertical: 3,
//   },
//   badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
//   empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
//   emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
//   emptySub: { fontSize: 13, color: "#9CA3AF" },
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     backgroundColor: "#fff",
//     borderRadius: 14,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: "#E8EFFA",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//   },
//   iconBox: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   topRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 3,
//   },
//   typeBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
//   typeText: { fontSize: 10, fontWeight: "700" },
//   timeText: { fontSize: 10, color: "#9CA3AF" },
//   matchText: {
//     fontSize: 13,
//     color: "#1F2937",
//     fontWeight: "600",
//     lineHeight: 18,
//   },
//   fromText: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
// });

// // ── StatusTick ───────────────────────────────────────────────
// function StatusTick({ status }: { status?: string }) {
//   if (!status || status === "sending")
//     return (
//       <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.5)" />
//     );
//   if (status === "sent")
//     return (
//       <Ionicons
//         name="checkmark-outline"
//         size={11}
//         color="rgba(255,255,255,0.7)"
//       />
//     );
//   if (status === "delivered")
//     return (
//       <Ionicons
//         name="checkmark-done-outline"
//         size={11}
//         color="rgba(255,255,255,0.7)"
//       />
//     );
//   if (status === "read")
//     return <Ionicons name="checkmark-done-outline" size={11} color="#60D4F7" />;
//   return null;
// }

// // ── Main Component ───────────────────────────────────────────
// export default function MessageScreen() {
//   const { theme } = useTheme();
//   const router = useRouter();
//   const { childId, childName, classname, sectionname } = useLocalSearchParams<{
//     childId: string;
//     childName: string;
//     classname: string;
//     sectionname: string;
//   }>();

//   // ── State ──────────────────────────────────────────────────
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [inputText, setInputText] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [token, setToken] = useState("");
//   const [threadId, setThreadId] = useState<number | null>(null);
//   const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
//   const [previewItem, setPreviewItem] = useState<{
//     uri: string;
//     type: "image";
//     name?: string;
//   } | null>(null);
//   const [contextMsg, setContextMsg] = useState<Message | null>(null);
//   const [replyTo, setReplyTo] = useState<Message | null>(null);
//   const [editingMsg, setEditingMsg] = useState<Message | null>(null);
//   const [pinnedIds, setPinnedIds] = useState<string[]>([]);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isTranscribing, setIsTranscribing] = useState(false);
//   const [showCamera, setShowCamera] = useState(false);
//   const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
//   const [isVideoRecording, setIsVideoRecording] = useState(false);
//   const [activeTab, setActiveTab] = useState<TabType>("chat");
//   const [mediaSubTab, setMediaSubTab] = useState<"photos" | "docs">("photos");
//   const [filesExpanded, setFilesExpanded] = useState(true);
//   const [voiceExpanded, setVoiceExpanded] = useState(true);
//   const [savedFiles, setSavedFiles] = useState<DownloadedFile[]>([]);
//   const [downloads, setDownloads] = useState<
//     Record<string, "downloading" | "done">
//   >({});
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [showSearch, setShowSearch] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showGlobalResults, setShowGlobalResults] = useState(false);
//   const [globalSearchResults, setGlobalSearchResults] = useState<
//     SearchResult[]
//   >([]);
//   const [refreshingMedia, setRefreshingMedia] = useState(false);
//   const [refreshingDownloads, setRefreshingDownloads] = useState(false);
//   const [threads, setThreads] = useState<{id: number; preview: string; createdAt: string; unread?: boolean}[]>([]);
// const [showHistory, setShowHistory] = useState(false);

//   // Viewer states — each null = closed
//   const [docViewer, setDocViewer] = useState<{
//     uri: string;
//     name: string;
//   } | null>(null);
//   const [previewVideo, setPreviewVideo] = useState<string | null>(null);
//   const [audioPlayer, setAudioPlayer] = useState<{
//     uri: string;
//     name: string;
//   } | null>(null);

//   const [cameraPermission, requestCameraPermission] = useCameraPermissions();
//   const [micPermission, requestMicPermission] = useMicrophonePermissions();

//   // ── Refs ───────────────────────────────────────────────────
//   const flatListRef = useRef<FlatList>(null);
//   const inputRef = useRef<TextInput>(null);
//   const contextMsgRef = useRef<Message | null>(null);
//   const editingMsgRef = useRef<Message | null>(null);
//   const pinnedIdsRef = useRef<string[]>([]);
//   const soundRef = useRef<Audio.Sound | null>(null);
//   const recordingRef = useRef<Audio.Recording | null>(null);
//   const cameraRef = useRef<CameraView>(null);

//   useEffect(() => {
//     contextMsgRef.current = contextMsg;
//   }, [contextMsg]);
//   useEffect(() => {
//     editingMsgRef.current = editingMsg;
//   }, [editingMsg]);
//   useEffect(() => {
//     pinnedIdsRef.current = pinnedIds;
//   }, [pinnedIds]);
//   useEffect(
//     () => () => {
//       soundRef.current?.unloadAsync();
//     },
//     [],
//   );

//   const DOWNLOADS_KEY = `savedFiles_${childId}`;

//   // ── Storage helpers ────────────────────────────────────────
//   const loadPinned = async () => {
//     try {
//       const raw = await AsyncStorage.getItem(`pinnedMsgs_${childId}`);
//       if (raw) setPinnedIds(JSON.parse(raw));
//     } catch {}
//   };

//   const loadSavedFiles = async () => {
//     try {
//       const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
//       if (raw) setSavedFiles(JSON.parse(raw));
//     } catch {}
//   };

//   const persistSavedFile = async (entry: DownloadedFile) => {
//     try {
//       const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
//       const current: DownloadedFile[] = raw ? JSON.parse(raw) : [];
//       const updated = [entry, ...current.filter((f) => f.url !== entry.url)];
//       await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
//       setSavedFiles(updated);
//     } catch {}
//   };

//   const removeSavedFile = async (key: string) => {
//     try {
//       const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
//       const current: DownloadedFile[] = raw ? JSON.parse(raw) : [];
//       const updated = current.filter((f) => f.key !== key);
//       await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
//       setSavedFiles(updated);
//     } catch {}
//   };

//   // ── Fetch messages ─────────────────────────────────────────
// // Load just one thread's messages
// const fetchThreadMessages = useCallback(async (t: string, tid: number) => {
//   setLoading(true);
//   try {
//     const yearId = (await AsyncStorage.getItem("selectedYearId")) ?? "16";
//     const res = await fetch(
//       `${BASE_URL}/api/parent-notes/threads/${tid}/messages`,
//       {
//         headers: {
//           Authorization: `Bearer ${t}`,
//           "Content-Type": "application/json",
//           "x-academic-year-id": yearId,
//         },
//       },
//     );
//     if (!res.ok) { setMessages([]); return; }
//     const data = await res.json();
//     const raw: any[] = data.data ?? data ?? [];

//     const mapped: Message[] = raw
//       .sort((a: any, b: any) =>
//         new Date(a.created_at ?? a.createdAt).getTime() -
//         new Date(b.created_at ?? b.createdAt).getTime()
//       )
//       .map((m: any) => {
//         const attachUrl = m.attachment_url ?? undefined;
//         const extractedName = attachUrl ? (attachUrl.split("/").pop() ?? undefined) : undefined;
//         const attachName = m.attachment_name ?? extractedName ?? undefined;
//         const nameExt = attachName?.split(".").pop()?.toLowerCase() ?? "";
//         const urlExt = attachUrl?.split(".").pop()?.toLowerCase() ?? "";
//         const ext = nameExt || urlExt;
//         const isImg = ["jpg","jpeg","png","gif","webp"].includes(ext);
//         const isVideo = ext === "mp4" || !!attachName?.includes("video_") || !!attachUrl?.endsWith(".mp4");
//         const isVoice = ext === "m4a" || !!attachName?.includes("voice_") || !!attachUrl?.endsWith(".m4a") || !!attachUrl?.includes("voice_");
//         const attachType = isVideo ? "video" : isVoice ? "file" : isImg ? "image" : attachUrl ? "file" : undefined;
//         const senderIsTeacher = m.sender_type === "teacher";
//         return {
//           id: String(m.id ?? m._id ?? Math.random()),
//           text: (() => { const r = m.message ?? m.body ?? m.text ?? ""; try { return decodeURIComponent(r); } catch { return r; } })(),
//           sender: senderIsTeacher ? "teacher" : "parent",
//           createdAt: m.created_at ?? m.createdAt ?? new Date().toISOString(),
//           attachmentUrl: attachUrl,
//           attachmentType: attachType,
//           attachmentName: attachName,
//           replyToId: m.reply_to_id ? String(m.reply_to_id) : undefined,
//           replyToText: m.reply_to_text ?? m.reply_message ?? undefined,
//           status: senderIsTeacher ? undefined : m.is_read ? "read" : m.is_delivered ? "delivered" : "sent",
//         };
//       });

//     setMessages(mapped);
//   } catch (err) {
//     console.error("fetchThreadMessages error:", err);
//   } finally {
//     setLoading(false);
//   }
// }, []);

// // Discover all threads for this student (server + local cache merged)
// const fetchThreads = useCallback(async (t: string) => {
//   try {
//     const yearId = (await AsyncStorage.getItem("selectedYearId")) ?? "16";

//     // Try server discovery first
//     let serverThreads: {id: number; preview: string; createdAt: string}[] = [];
//     try {
//       const res = await fetch(
//         `${BASE_URL}/api/parent-notes/threads?student_id=${childId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${t}`,
//             "Content-Type": "application/json",
//             "x-academic-year-id": yearId,
//           },
//         }
//       );
//       if (res.ok) {
//         const data = await res.json();
//         const list: any[] = data.data ?? data ?? [];
//         serverThreads = list.map((th: any) => ({
//           id: Number(th.id ?? th.thread_id),
//           preview: th.last_message ?? th.preview ?? "Conversation",
//           createdAt: th.created_at ?? th.createdAt ?? new Date().toISOString(),
//         }));
//       }
//     } catch {}

//     // Merge with local cache
//     const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
//     const localIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
//     const serverIds = serverThreads.map(th => th.id);
//     const missingIds = localIds.filter(id => !serverIds.includes(id));

//     // For locally-known threads not returned by server, keep them with placeholder preview
//     const savedPreviewsRaw = await AsyncStorage.getItem(`threadPreviews_${childId}`);
//     const savedPreviews: Record<number, {preview: string; createdAt: string}> =
//       savedPreviewsRaw ? JSON.parse(savedPreviewsRaw) : {};

//     const missingThreads = missingIds.map(id => ({
//       id,
//       preview: savedPreviews[id]?.preview ?? "Conversation",
//       createdAt: savedPreviews[id]?.createdAt ?? new Date().toISOString(),
//     }));

//     const allThreads = [...serverThreads, ...missingThreads]
//       .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

//     // Persist merged ID list
//     const allIds = allThreads.map(th => th.id);
//     await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(allIds));

//     setThreads(allThreads);
//     return allThreads;
//   } catch {
//     return [];
//   }
// }, [childId]);

// useFocusEffect(
//   useCallback(() => {
//     const init = async () => {
//       const t = await AsyncStorage.getItem("token");
//       if (!t) return;
//       setToken(t);

//       // Load thread list
//       const allThreads = await fetchThreads(t);

//       // Load the most recent thread's messages (or stay empty for new chat)
//       if (allThreads.length > 0) {
//         const latest = allThreads[0]; // already sorted newest first
//         setThreadId(latest.id);
//         await fetchThreadMessages(t, latest.id);
//       } else {
//         // No threads yet — ready for new chat
//         setThreadId(null);
//         setMessages([]);
//         setLoading(false);
//       }

//       await loadPinned();
//       await loadSavedFiles();
//     };
//     init();
//   }, [childId]),
// );

//   // Auto-poll read status
//   useEffect(() => {
//     if (!token || !threadId) return;
//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/api/parent-notes/threads/${threadId}/messages`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//               "x-academic-year-id":
//                 (await AsyncStorage.getItem("selectedYearId")) ?? "16",
//             },
//           },
//         );
//         if (!res.ok) return;
//         const data = await res.json();
//         const msgs: any[] = data.data ?? data ?? [];
//         setMessages((prev) => {
//           const hasUnread = prev.some(
//             (m) => m.sender === "parent" && m.status !== "read",
//           );
//           if (!hasUnread) return prev;
//           return prev.map((m) => {
//             if (m.sender !== "parent" || m.status === "read") return m;
//             const sm = msgs.find((x) => String(x.id) === String(m.id));
//             if (!sm) return m;
//             const newStatus = sm.is_read
//               ? "read"
//               : sm.is_delivered
//                 ? "delivered"
//                 : "sent";
//             return newStatus !== m.status ? { ...m, status: newStatus } : m;
//           });
//         });
//       } catch {}
//     }, 5000);
//     return () => clearInterval(interval);
//   }, [token, threadId]);

//   // ── Global search ──────────────────────────────────────────
//   useEffect(() => {
//     if (!searchQuery.trim()) {
//       setGlobalSearchResults([]);
//       setShowGlobalResults(false);
//       return;
//     }

//     const q = searchQuery.toLowerCase().trim();
//     const results: SearchResult[] = [];

//     messages.forEach((m) => {
//       const isVoice =
//         m.attachmentName?.endsWith(".m4a") ||
//         m.attachmentName?.includes("voice_");
//       const isVideo = m.attachmentType === "video";
//       const isImage = m.attachmentType === "image";
//       const isFile = m.attachmentType === "file" && !isVoice;

//       const textMatch = m.text?.toLowerCase().includes(q);
//       const nameMatch = m.attachmentName?.toLowerCase().includes(q);
//       const dateMatch = formatDate(m.createdAt).toLowerCase().includes(q);

//       if (textMatch || nameMatch || dateMatch) {
//         let type: SearchResult["type"] = "message";
//         if (isVoice) type = "voice";
//         else if (isVideo || isImage) type = "media";
//         else if (isFile) type = "file";
//         results.push({
//           type,
//           message: m,
//           matchText: m.text || m.attachmentName || "",
//         });
//       }
//     });

//     setGlobalSearchResults(results);

//     // Auto-scroll to first match in chat tab
//     if (results.length > 0 && activeTab === "chat") {
//       const firstMatch = results[0].message;
//       const idx = messages.findIndex((m) => m.id === firstMatch.id);
//       if (idx !== -1) {
//         setTimeout(() => {
//           flatListRef.current?.scrollToIndex({
//             index: idx,
//             animated: true,
//             viewPosition: 0.3,
//           });
//         }, 100);
//       }
//     }
//   }, [searchQuery, messages, activeTab]);

//   // ── Open file helpers ──────────────────────────────────────
//   // FIX: Close all viewers first, then open the new one after a small delay
//   // This prevents "second file won't open" bug where old Modal was still mounted
//   const closeAllViewers = useCallback(() => {
//     setDocViewer(null);
//     setPreviewVideo(null);
//     setAudioPlayer(null);
//     setPreviewItem(null);
//   }, []);

//   const openInApp = useCallback(
//     async (uri: string, name: string) => {
//       if (!uri) {
//         Alert.alert("Error", "No file URL found.");
//         return;
//       }

//       const fullUrl = uri.startsWith("http")
//         ? uri
//         : `${BASE_URL}/${uri.replace(/^\/+/, "")}`;

//       // Use URL as fallback for extension detection
//       const n = (name ?? "").toLowerCase();
//       const urlN = uri.toLowerCase();
//       const ext = n.includes(".")
//         ? (n.split(".").pop() ?? "")
//         : (urlN.split(".").pop() ?? "");

//       const isVoice =
//         ext === "m4a" || n.includes("voice_") || urlN.includes("voice_");
//       const isVideo =
//         ext === "mp4" || n.includes("video_") || urlN.includes("video_");
//       const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

//       // Build a proper display name if the passed name has no extension
//       const displayName = n.includes(".")
//         ? name
//         : (fullUrl.split("/").pop() ?? name);

//       closeAllViewers();
//       await new Promise<void>((resolve) => setTimeout(resolve, 120));

//       if (isVideo) {
//         setPreviewVideo(fullUrl);
//         return;
//       }
//       if (isVoice) {
//         setAudioPlayer({ uri: fullUrl, name: displayName });
//         return;
//       }
//       if (isImage) {
//         setPreviewItem({ uri: fullUrl, type: "image", name: displayName });
//         return;
//       }
//       setDocViewer({ uri: fullUrl, name: displayName });
//     },
//     [closeAllViewers],
//   );

//   const openLocalFile = useCallback(
//     async (localUri: string, name: string) => {
//       const n = (name ?? "").toLowerCase();
//       const ext = n.split(".").pop() ?? "";
//       const isVoice = ext === "m4a" || n.includes("voice_");
//       const isVideo = ext === "mp4" || n.includes("video_");
//       const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

//       closeAllViewers();
//       await new Promise<void>((resolve) => setTimeout(resolve, 120));

//       if (isVideo) {
//         setPreviewVideo(localUri);
//         return;
//       }
//       if (isVoice) {
//         setAudioPlayer({ uri: localUri, name });
//         return;
//       }
//       if (isImage) {
//         setPreviewItem({ uri: localUri, type: "image", name });
//         return;
//       }

//       // For PDFs and docs — pass localUri directly to InAppDocViewer
//       // It will read the file from disk without any network call
//       setDocViewer({ uri: localUri, name });
//     },
//     [closeAllViewers],
//   );

//   // ── Download ───────────────────────────────────────────────
//   const downloadFile = async (
//     url: string,
//     name: string,
//     type: "file" | "video",
//   ) => {
//     const key = url;
//     if (downloads[key] === "downloading") return;
//     const fullUrl = url.startsWith("http")
//       ? url
//       : `${BASE_URL}/${url.replace(/^\//, "")}`;
//     setDownloads((prev) => ({ ...prev, [key]: "downloading" }));
//     try {
//       if (type === "video") {
//         const { status } = await MediaLibrary.requestPermissionsAsync();
//         if (status !== "granted") {
//           Alert.alert(
//             "Permission required",
//             "Please allow media library access to save videos.",
//           );
//           setDownloads((prev) => {
//             const n = { ...prev };
//             delete n[key];
//             return n;
//           });
//           return;
//         }
//       }
//       const folder = `${FileSystem.documentDirectory}SchoolAid/`;
//       await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
//       const safeFileName = `${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
//       const destUri = `${folder}${safeFileName}`;
//       const downloadRes = await FileSystem.downloadAsync(fullUrl, destUri, {
//         headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
//       });
//       if (downloadRes.status !== 200)
//         throw new Error(`HTTP ${downloadRes.status}`);
//       const fileInfo = (await FileSystem.getInfoAsync(downloadRes.uri)) as any;
//       if (!fileInfo.exists || (fileInfo.size ?? 0) === 0)
//         throw new Error("Downloaded file is empty");

//       if (type === "video") {
//         const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
//         let album = await MediaLibrary.getAlbumAsync("SchoolAid");
//         if (!album)
//           album = await MediaLibrary.createAlbumAsync(
//             "SchoolAid",
//             asset,
//             false,
//           );
//         else await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
//         setDownloads((prev) => ({ ...prev, [key]: "done" }));
//         await persistSavedFile({
//           key: `${url}_${Date.now()}`,
//           url,
//           localUri: downloadRes.uri,
//           name,
//           type: "video",
//           savedAt: new Date().toISOString(),
//         });
//         Alert.alert(
//           "Saved!",
//           "Video saved to Photos > SchoolAid album.\nAlso visible in the Downloads tab.",
//         );
//       } else {
//         setDownloads((prev) => ({ ...prev, [key]: "done" }));
//         await persistSavedFile({
//           key: `${url}_${Date.now()}`,
//           url,
//           localUri: downloadRes.uri,
//           name,
//           type: "file",
//           savedAt: new Date().toISOString(),
//           size: fileInfo.size,
//         });
//         Alert.alert(
//           "Downloaded!",
//           `"${name}" saved.\nFind it in the Downloads tab.`,
//         );
//       }
//     } catch (err: any) {
//       setDownloads((prev) => {
//         const n = { ...prev };
//         delete n[key];
//         return n;
//       });
//       Alert.alert("Download Failed", err?.message ?? "Unknown error");
//     }
//   };

//   // ── DownloadIcon ───────────────────────────────────────────
//   const DownloadIcon = ({
//     url,
//     name,
//     type,
//     tintColor,
//   }: {
//     url: string;
//     name: string;
//     type: "file" | "video";
//     tintColor: string;
//   }) => {
//     const state = downloads[url];
//     const alreadySaved = savedFiles.some((f) => f.url === url);
//     if (state === "downloading")
//       return <ActivityIndicator size="small" color={tintColor} />;
//     return (
//       <TouchableOpacity
//         onPress={() => downloadFile(url, name, type)}
//         style={styles.downloadBtn}
//         hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//       >
//         <Ionicons
//           name={
//             state === "done" || alreadySaved
//               ? "checkmark-circle"
//               : "arrow-down-circle-outline"
//           }
//           size={22}
//           color={state === "done" || alreadySaved ? "#22C55E" : tintColor}
//         />
//       </TouchableOpacity>
//     );
//   };

//   // ── Refresh handlers ───────────────────────────────────────
//   const handleRefreshMedia = async () => {
//     setRefreshingMedia(true);
//     await fetchMessages(token);
//     setRefreshingMedia(false);
//   };

//   const handleRefreshDownloads = async () => {
//     setRefreshingDownloads(true);
//     await loadSavedFiles();
//     setRefreshingDownloads(false);
//   };

//   // ── Pickers ────────────────────────────────────────────────
//   const pickImage = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permission.granted) {
//       Alert.alert(
//         "Permission required",
//         "Please allow access to your photo library.",
//       );
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ["images"],
//       quality: 0.8,
//       allowsMultipleSelection: true,
//     });
//     if (!result.canceled && result.assets.length > 0) {
//       setAttachments((prev) => [
//         ...prev,
//         ...result.assets.map((a) => ({
//           uri: a.uri,
//           type: "image" as const,
//           name: a.fileName ?? "image.jpg",
//           mimeType: a.mimeType ?? "image/jpeg",
//         })),
//       ]);
//     }
//   };

//   const pickFile = async () => {
//     const result = await DocumentPicker.getDocumentAsync({
//       type: "*/*",
//       copyToCacheDirectory: true,
//       multiple: true,
//     });
//     if (!result.canceled && result.assets.length > 0) {
//       setAttachments((prev) => [
//         ...prev,
//         ...result.assets.map((a) => ({
//           uri: a.uri,
//           type: "file" as const,
//           name: a.name,
//           mimeType: a.mimeType ?? "application/octet-stream",
//         })),
//       ]);
//     }
//   };

//   const openCamera = async () => {
//     if (!cameraPermission?.granted) {
//       const { granted } = await requestCameraPermission();
//       if (!granted) {
//         Alert.alert("Permission required", "Please allow camera access.");
//         return;
//       }
//     }
//     if (!micPermission?.granted) {
//       const { granted } = await requestMicPermission();
//       if (!granted) {
//         Alert.alert("Permission required", "Please allow microphone access.");
//         return;
//       }
//     }
//     setShowCamera(true);
//   };

//   const showAttachmentOptions = () =>
//     Alert.alert("Attach", "Choose attachment type", [
//       { text: "Photo", onPress: pickImage },
//       { text: "File", onPress: pickFile },
//       { text: "Video", onPress: openCamera },
//       { text: "Cancel", style: "cancel" },
//     ]);

//   const removeAttachment = (idx: number) =>
//     setAttachments((prev) => prev.filter((_, i) => i !== idx));

//   // ── Voice recording ────────────────────────────────────────
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
//       const { recording } = await Audio.Recording.createAsync({
//         android: {
//           extension: ".m4a",
//           outputFormat: Audio.AndroidOutputFormat.MPEG_4,
//           audioEncoder: Audio.AndroidAudioEncoder.AAC,
//           sampleRate: 44100,
//           numberOfChannels: 2,
//           bitRate: 128000,
//         },
//         ios: {
//           extension: ".m4a",
//           outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
//           audioQuality: Audio.IOSAudioQuality.HIGH,
//           sampleRate: 44100,
//           numberOfChannels: 2,
//           bitRate: 128000,
//           linearPCMBitDepth: 16,
//           linearPCMIsBigEndian: false,
//           linearPCMIsFloat: false,
//         },
//         web: {},
//       });
//       recordingRef.current = recording;
//       setIsRecording(true);
//     } catch {
//       Alert.alert("Error", "Could not start recording.");
//     }
//   };

//   const stopRecording = async () => {
//     if (!recordingRef.current) return;
//     setIsRecording(false);
//     setIsTranscribing(true);
//     try {
//       const recording = recordingRef.current;
//       recordingRef.current = null;
//       await recording.stopAndUnloadAsync();
//       await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
//       const tempUri = recording.getURI();
//       if (!tempUri) throw new Error("No recording URI");
//       const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
//       if (!baseDir) throw new Error("No writable directory");
//       const fileName = `voice_${Date.now()}.m4a`;
//       const permanentUri = `${baseDir}${fileName}`;
//       await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
//       const fileInfo = (await FileSystem.getInfoAsync(permanentUri)) as any;
//       if (!fileInfo.exists || (fileInfo.size ?? 0) === 0)
//         throw new Error("Recording file empty");
//       setAttachments((prev) => [
//         ...prev,
//         {
//           uri: permanentUri,
//           type: "file",
//           name: fileName,
//           mimeType: "audio/m4a",
//         },
//       ]);
//     } catch {
//       Alert.alert("Error", "Could not process recording.");
//     } finally {
//       setIsTranscribing(false);
//     }
//   };

//   const startVideoRecording = async () => {
//     if (!cameraRef.current) return;
//     try {
//       setIsVideoRecording(true);
//       const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
//       if (!video?.uri) throw new Error("No video URI");
//       const fileName = `video_${Date.now()}.mp4`;
//       const baseDir =
//         FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "";
//       const permanentUri = `${baseDir}${fileName}`;
//       await FileSystem.copyAsync({ from: video.uri, to: permanentUri });
//       const fileInfo = await FileSystem.getInfoAsync(permanentUri);
//       if (!fileInfo.exists) throw new Error("Video file missing");
//       setAttachments((prev) => [
//         ...prev,
//         {
//           uri: permanentUri,
//           type: "video",
//           name: fileName,
//           mimeType: "video/mp4",
//         },
//       ]);
//       setShowCamera(false);
//     } catch {
//       Alert.alert("Error", "Could not record video.");
//     } finally {
//       setIsVideoRecording(false);
//     }
//   };

//   const stopVideoRecording = () => cameraRef.current?.stopRecording();

//   // ── Context menu ───────────────────────────────────────────
//   const handleCopy = useCallback(() => {
//     const msg = contextMsgRef.current;
//     if (msg?.text) Clipboard.setString(msg.text);
//     setContextMsg(null);
//   }, []);

//   const handleReply = useCallback(() => {
//     setReplyTo(contextMsgRef.current);
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
//     await AsyncStorage.setItem(
//       `pinnedMsgs_${childId}`,
//       JSON.stringify(updated),
//     );
//     setPinnedIds(updated);
//     setContextMsg(null);
//   }, [childId]);

//   const handleDelete = useCallback(async () => {
//     const msg = contextMsgRef.current;
//     if (!msg) return;
//     setContextMsg(null);
//     Alert.alert("Delete Message", "Are you sure?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Delete",
//         style: "destructive",
//         onPress: async () => {
//           try {
//             const res = await fetch(
//               `${BASE_URL}/api/parent-notes/messages/${msg.id}`,
//               {
//                 method: "DELETE",
//                 headers: {
//                   Authorization: `Bearer ${token}`,
//                   "Content-Type": "application/json",
//                   "x-academic-year-id":
//                     (await AsyncStorage.getItem("selectedYearId")) ?? "16",
//                 },
//               },
//             );
//             if (res.ok) {
//               setMessages((prev) => prev.filter((m) => m.id !== msg.id));
//               setPinnedIds((prev) => {
//                 const updated = prev.filter((id) => id !== msg.id);
//                 AsyncStorage.setItem(
//                   `pinnedMsgs_${childId}`,
//                   JSON.stringify(updated),
//                 );
//                 return updated;
//               });
//             } else Alert.alert("Error", "Could not delete message.");
//           } catch {
//             Alert.alert("Error", "Could not delete message.");
//           }
//         },
//       },
//     ]);
//   }, [token, childId]);

//   const cancelEdit = useCallback(() => {
//     setEditingMsg(null);
//     setInputText("");
//     setSending(false);
//   }, []);
//   const cancelReply = useCallback(() => setReplyTo(null), []);

//   const scrollToMessage = useCallback((msgId: string) => {
//     setMessages((current) => {
//       const idx = current.findIndex((m) => m.id === msgId);
//       if (idx !== -1)
//         flatListRef.current?.scrollToIndex({
//           index: idx,
//           animated: true,
//           viewPosition: 0.3,
//         });
//       return current;
//     });
//   }, []);

//   // ── Send message ───────────────────────────────────────────
// const sendMessage = async () => {
//   if (!inputText.trim() && attachments.length === 0) return;
//   setSending(true);
//   const latestText = inputText.trim();
//   const currentEditing = editingMsg;

//   if (currentEditing) {
//     setEditingMsg(null);
//     setInputText("");
//     try {
//       const res = await fetch(
//         `${BASE_URL}/api/parent-notes/messages/${currentEditing.id}`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             "x-academic-year-id": (await AsyncStorage.getItem("selectedYearId")) ?? "16",
//           },
//           body: JSON.stringify({ message: encodeURIComponent(latestText) }),
//         },
//       );
//       if (res.ok)
//         setMessages((prev) =>
//           prev.map((m) => m.id === currentEditing.id ? { ...m, text: latestText } : m)
//         );
//       else Alert.alert("Error", "Could not edit message.");
//     } catch {
//       Alert.alert("Error", "Could not edit message.");
//     } finally {
//       setSending(false);
//     }
//     return;
//   }

//   const sentText = inputText.trim();
//   const sentFiles = [...attachments];
//   const sentReplyTo = replyTo;
//   setInputText("");
//   setAttachments([]);
//   setReplyTo(null);
//   setShowEmojiPicker(false);

//   const tempMsg: Message = {
//     id: String(Date.now()),
//     text: sentText,
//     sender: "parent",
//     createdAt: new Date().toISOString(),
//     attachmentUrl: sentFiles[0]?.uri,
//     attachmentType: sentFiles[0]?.type,
//     attachmentName: sentFiles[0]?.name,
//     replyToId: sentReplyTo?.id,
//     replyToText: sentReplyTo?.text || sentReplyTo?.attachmentName,
//     status: "sending",
//   };
//   setMessages((prev) => [...prev, tempMsg]);

//   try {
//     const yearId = (await AsyncStorage.getItem("selectedYearId")) ?? "16";
//     let finalThreadId = threadId;

//     if (sentFiles.length > 0) {
//       for (let i = 0; i < sentFiles.length; i++) {
//         const f = sentFiles[i];
//         const formData = new FormData();
//         if (threadId) {
//           // Continue existing thread
//           formData.append("thread_id", String(threadId));
//         } else {
//           // New thread
//           formData.append("student_id", String(Number(childId)));
//         }
//         if (i === 0 && sentText) formData.append("message", encodeURIComponent(sentText));
//         if (i === 0 && sentReplyTo) formData.append("reply_to_id", sentReplyTo.id);
//         formData.append("attachment", { uri: f.uri, type: f.mimeType, name: f.name } as any);

//         const url = threadId
//           ? `${BASE_URL}/api/parent-notes/messages`
//           : `${BASE_URL}/api/parent-notes/threads`;

//         const res = await fetch(url, {
//           method: "POST",
//           headers: { Authorization: `Bearer ${token}`, "x-academic-year-id": yearId },
//           body: formData,
//         });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = JSON.parse(await res.text());
//         const returned = data.thread_id ?? data.data?.thread_id;
//         if (returned) {
//           finalThreadId = returned;
//           setThreadId(returned);
//           await _saveThreadLocally(returned, sentText);
//         }
//       }
//     } else {
//       let res: Response;
//       if (threadId) {
//         res = await fetch(`${BASE_URL}/api/parent-notes/messages`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             "x-academic-year-id": yearId,
//           },
//           body: JSON.stringify({
//             thread_id: threadId,
//             message: encodeURIComponent(sentText),
//             ...(sentReplyTo ? { reply_to_id: sentReplyTo.id } : {}),
//           }),
//         });
//       } else {
//         res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             "x-academic-year-id": yearId,
//           },
//           body: JSON.stringify({
//             student_id: Number(childId),
//             message: encodeURIComponent(sentText),
//             ...(sentReplyTo ? { reply_to_id: sentReplyTo.id } : {}),
//           }),
//         });
//       }
//       if (!res.ok) {
//         setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
//         throw new Error(`HTTP ${res.status}`);
//       }
//       const data = JSON.parse(await res.text());
//       const returned = data.thread_id ?? data.data?.thread_id;
//       if (returned) {
//         finalThreadId = returned;
//         setThreadId(returned);
//         await _saveThreadLocally(returned, sentText);
//       }
//     }

//     setMessages((prev) =>
//       prev.map((m) => (m.id === tempMsg.id ? { ...m, status: "sent" } : m))
//     );
//     if (finalThreadId) await fetchThreadMessages(token, finalThreadId);
//     // Refresh thread list so new thread appears in history
//     await fetchThreads(token);
//     setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
//   } catch {
//     setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
//     Alert.alert("Error", "Could not send message. Please try again.");
//   } finally {
//     setSending(false);
//   }
// };

// const startNewChat = () => {
//   setThreadId(null);
//   setMessages([]);
//   setReplyTo(null);
//   setEditingMsg(null);
//   setInputText("");
//   setActiveTab("chat");
//   setTimeout(() => inputRef.current?.focus(), 150);
// };

// // Helper — persist thread ID + preview locally
// const _saveThreadLocally = async (tid: number, previewText: string) => {
//   try {
//     const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
//     const ids: number[] = savedRaw ? JSON.parse(savedRaw) : [];
//     if (!ids.includes(tid)) {
//       ids.push(tid);
//       await AsyncStorage.setItem(`allThreadIds_${childId}`, JSON.stringify(ids));
//     }
//     const previewsRaw = await AsyncStorage.getItem(`threadPreviews_${childId}`);
//     const previews: Record<number, {preview: string; createdAt: string}> =
//       previewsRaw ? JSON.parse(previewsRaw) : {};
//     if (!previews[tid]) {
//       // Only set preview on creation, not on every message
//       previews[tid] = { preview: previewText.slice(0, 60), createdAt: new Date().toISOString() };
//       await AsyncStorage.setItem(`threadPreviews_${childId}`, JSON.stringify(previews));
//     }
//   } catch {}
// };

//   const startNewChat = () => {
//     Alert.alert("New Chat", "Start a new conversation with the teacher?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Start New Chat",
//         onPress: () => {
//           setThreadId(null); // clears active thread → next send uses threads API
//           setReplyTo(null);
//           setEditingMsg(null);
//           setInputText("");
//           setTimeout(() => inputRef.current?.focus(), 150);
//         },
//       },
//     ]);
//   };

//   // ── Derived data ───────────────────────────────────────────
//   const getInitials = (name: string) => {
//     const parts = (name ?? "").trim().split(" ");
//     return parts.length >= 2
//       ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
//       : (name ?? "U").substring(0, 2).toUpperCase();
//   };

//   const filteredMessages = searchQuery.trim()
//     ? messages.filter((m) => {
//         const q = searchQuery.toLowerCase();
//         return (
//           m.text?.toLowerCase().includes(q) ||
//           m.attachmentName?.toLowerCase().includes(q) ||
//           formatDate(m.createdAt).toLowerCase().includes(q)
//         );
//       })
//     : messages;

//   const groupedMessages = () => {
//     const result: (Message | { type: "date"; label: string; id: string })[] =
//       [];
//     let lastDate = "";
//     filteredMessages.forEach((m) => {
//       const dateLabel = formatDate(m.createdAt);
//       if (dateLabel !== lastDate) {
//         result.push({
//           type: "date",
//           label: dateLabel,
//           id: `date_${dateLabel}`,
//         });
//         lastDate = dateLabel;
//       }
//       result.push(m);
//     });
//     return result;
//   };

//   const mediaMessages = messages.filter(
//     (m) =>
//       m.attachmentUrl &&
//       (m.attachmentType === "image" || m.attachmentType === "video"),
//   );
//   const fileMessages = messages.filter(
//     (m) =>
//       m.attachmentUrl &&
//       m.attachmentType === "file" &&
//       !m.attachmentName?.includes("voice_") &&
//       !m.attachmentName?.endsWith(".m4a"),
//   );
//   const voiceMessages = messages.filter(
//     (m) =>
//       m.attachmentName?.endsWith(".m4a") ||
//       m.attachmentName?.includes("voice_") ||
//       m.attachmentUrl?.endsWith(".m4a") ||
//       m.attachmentUrl?.includes("voice_"),
//   );
//   const pinnedMessages = messages.filter((m) => pinnedIds.includes(m.id));

//   // ── Render message ─────────────────────────────────────────
//   const renderMessage = ({ item }: { item: any }) => {
//     if (item.type === "date") {
//       return (
//         <View style={styles.dateSeparator}>
//           <View style={styles.dateLine} />
//           <Text style={styles.dateLabel}>{item.label}</Text>
//           <View style={styles.dateLine} />
//         </View>
//       );
//     }

//     const msg: Message = item;
//     const isParent = msg.sender === "parent";
//     const isPinned = pinnedIds.includes(msg.id);
//     const isVoice =
//       msg.attachmentName?.endsWith(".m4a") ||
//       msg.attachmentName?.includes("voice_") ||
//       msg.attachmentUrl?.endsWith(".m4a") ||
//       msg.attachmentUrl?.includes("voice_");
//     const isVideo =
//       msg.attachmentType === "video" ||
//       msg.attachmentName?.endsWith(".mp4") ||
//       msg.attachmentName?.includes("video_");
//     const dlTint = isParent ? "rgba(255,255,255,0.85)" : PRIMARY;

//     return (
//       <Pressable onLongPress={() => setContextMsg(msg)} delayLongPress={350}>
//         <View style={[styles.msgRow, isParent && styles.msgRowRight]}>
//           {!isParent && (
//             <View style={styles.teacherAvatar}>
//               <Ionicons name="person" size={14} color={PRIMARY} />
//             </View>
//           )}
//           <View style={{ maxWidth: "78%" }}>
//             {isPinned && (
//               <View
//                 style={[styles.pinRow, isParent && { alignSelf: "flex-end" }]}
//               >
//                 <Ionicons name="pin" size={10} color="#F59E0B" />
//                 <Text style={styles.pinText}>Pinned</Text>
//               </View>
//             )}
//             {!isParent && <Text style={styles.teacherLabel}>Teacher</Text>}
//             <View
//               style={[
//                 styles.bubble,
//                 isParent ? styles.bubbleRight : styles.bubbleLeft,
//                 isPinned && styles.bubblePinned,
//               ]}
//             >
//               {msg.replyToId && msg.replyToText && (
//                 <TouchableOpacity
//                   onPress={() => scrollToMessage(msg.replyToId!)}
//                   style={[
//                     styles.replyRef,
//                     isParent ? styles.replyRefRight : styles.replyRefLeft,
//                   ]}
//                 >
//                   <View style={styles.replyRefBar} />
//                   <View style={{ flex: 1 }}>
//                     <Text
//                       style={[
//                         styles.replyRefLabel,
//                         isParent && { color: "rgba(255,255,255,0.7)" },
//                       ]}
//                     >
//                       Reply
//                     </Text>
//                     <Text
//                       style={[
//                         styles.replyRefText,
//                         isParent && { color: "rgba(255,255,255,0.9)" },
//                       ]}
//                       numberOfLines={1}
//                     >
//                       {msg.replyToText}
//                     </Text>
//                   </View>
//                 </TouchableOpacity>
//               )}

//               {!!msg.text && (
//                 <Text
//                   selectable
//                   style={[styles.msgText, isParent && { color: "#fff" }]}
//                 >
//                   {msg.text}
//                 </Text>
//               )}

//               {/* Image */}
//               {msg.attachmentType === "image" && msg.attachmentUrl && (
//                 <TouchableOpacity
//                   onPress={() =>
//                     openInApp(
//                       msg.attachmentUrl!,
//                       msg.attachmentName ?? "image.jpg",
//                     )
//                   }
//                 >
//                   <Image
//                     source={{ uri: buildUrl(msg.attachmentUrl) }}
//                     style={styles.attachedImage}
//                     resizeMode="cover"
//                   />
//                 </TouchableOpacity>
//               )}

//               {/* Video */}
//               {isVideo && msg.attachmentUrl && (
//                 <View
//                   style={[styles.mediaChip, isParent && styles.mediaChipRight]}
//                 >
//                   <TouchableOpacity
//                     style={{
//                       flexDirection: "row",
//                       alignItems: "center",
//                       gap: 10,
//                       flex: 1,
//                     }}
//                     onPress={() =>
//                       openInApp(
//                         msg.attachmentUrl!,
//                         msg.attachmentName ?? "video.mp4",
//                       )
//                     }
//                   >
//                     <View style={styles.videoThumb}>
//                       <Ionicons name="play-circle" size={32} color="#fff" />
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <Text
//                         style={[
//                           styles.mediaChipText,
//                           isParent && { color: "#fff" },
//                         ]}
//                       >
//                         Video
//                       </Text>
//                       <Text
//                         style={[
//                           styles.mediaChipSub,
//                           isParent && { color: "rgba(255,255,255,0.6)" },
//                         ]}
//                       >
//                         Tap to play
//                       </Text>
//                     </View>
//                   </TouchableOpacity>
//                   <DownloadIcon
//                     url={msg.attachmentUrl}
//                     name={msg.attachmentName ?? `video_${msg.id}.mp4`}
//                     type="video"
//                     tintColor={dlTint}
//                   />
//                 </View>
//               )}

//               {/* Voice */}
//               {isVoice && !isVideo && msg.attachmentUrl && (
//                 <TouchableOpacity
//                   style={[styles.voiceChip, isParent && styles.voiceChipRight]}
//                   onPress={() =>
//                     openInApp(
//                       msg.attachmentUrl!,
//                       msg.attachmentName ?? "voice.m4a",
//                     )
//                   }
//                 >
//                   <Ionicons
//                     name="play-circle"
//                     size={30}
//                     color={isParent ? "#fff" : PRIMARY}
//                   />
//                   <View style={styles.waveform}>
//                     {[4, 8, 12, 6, 10, 14, 8, 5, 11, 7].map((h, i) => (
//                       <View
//                         key={i}
//                         style={[
//                           styles.waveBar,
//                           {
//                             height: h,
//                             backgroundColor: isParent
//                               ? "rgba(255,255,255,0.7)"
//                               : `${PRIMARY}80`,
//                           },
//                         ]}
//                       />
//                     ))}
//                   </View>
//                   <Text
//                     style={[
//                       styles.voiceLabel,
//                       isParent && { color: "rgba(255,255,255,0.8)" },
//                     ]}
//                   >
//                     Voice note
//                   </Text>
//                 </TouchableOpacity>
//               )}

//               {/* File */}
//               {msg.attachmentType === "file" &&
//                 !isVoice &&
//                 !isVideo &&
//                 msg.attachmentUrl && (
//                   <View
//                     style={[styles.fileChip, isParent && styles.fileChipRight]}
//                   >
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         alignItems: "center",
//                         gap: 10,
//                         flex: 1,
//                       }}
//                     >
//                       <View
//                         style={[
//                           styles.fileIconBox,
//                           {
//                             backgroundColor: isParent
//                               ? "rgba(255,255,255,0.2)"
//                               : "#EEF3FF",
//                           },
//                         ]}
//                       >
//                         <Ionicons
//                           name="document-outline"
//                           size={20}
//                           color={isParent ? "#fff" : PRIMARY}
//                         />
//                       </View>
//                       <TouchableOpacity
//                         style={{ flex: 1 }}
//                         onPress={() =>
//                           openInApp(
//                             msg.attachmentUrl!,
//                             msg.attachmentName ?? "file",
//                           )
//                         }
//                       >
//                         <Text
//                           style={[
//                             styles.fileName,
//                             isParent && { color: "#fff" },
//                           ]}
//                           numberOfLines={1}
//                         >
//                           {msg.attachmentName ?? "File"}
//                         </Text>
//                         <Text
//                           style={[
//                             styles.fileSub,
//                             isParent && { color: "rgba(255,255,255,0.6)" },
//                           ]}
//                         >
//                           {downloads[msg.attachmentUrl] === "downloading"
//                             ? "Downloading..."
//                             : downloads[msg.attachmentUrl] === "done"
//                               ? "✓ Saved offline"
//                               : "Tap to open"}
//                         </Text>
//                       </TouchableOpacity>
//                       <DownloadIcon
//                         url={msg.attachmentUrl}
//                         name={msg.attachmentName ?? `file_${msg.id}`}
//                         type="file"
//                         tintColor={dlTint}
//                       />
//                     </View>
//                   </View>
//                 )}

//               <View
//                 style={[
//                   styles.timeRow,
//                   isParent && { justifyContent: "flex-end" },
//                 ]}
//               >
//                 <Text
//                   style={[
//                     styles.timeText,
//                     isParent && { color: "rgba(255,255,255,0.6)" },
//                   ]}
//                 >
//                   {formatTime(msg.createdAt)}
//                 </Text>
//                 {isParent && <StatusTick status={msg.status} />}
//               </View>
//             </View>
//           </View>
//         </View>
//       </Pressable>
//     );
//   };

//   // ── Media gallery tab ──────────────────────────────────────
//   const renderMediaGallery = () => (
//     <View style={{ flex: 1, backgroundColor: "#F0F4FB" }}>
//       <View style={styles.subTabBar}>
//         <TouchableOpacity
//           style={[
//             styles.subTab,
//             mediaSubTab === "photos" && styles.subTabActive,
//           ]}
//           onPress={() => setMediaSubTab("photos")}
//         >
//           <Ionicons
//             name="images-outline"
//             size={14}
//             color={mediaSubTab === "photos" ? "#fff" : "#6B7280"}
//           />
//           <Text
//             style={[
//               styles.subTabText,
//               mediaSubTab === "photos" && styles.subTabTextActive,
//             ]}
//           >
//             Photos & Videos
//             {mediaMessages.length > 0 ? ` (${mediaMessages.length})` : ""}
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.subTab, mediaSubTab === "docs" && styles.subTabActive]}
//           onPress={() => setMediaSubTab("docs")}
//         >
//           <Ionicons
//             name="document-outline"
//             size={14}
//             color={mediaSubTab === "docs" ? "#fff" : "#6B7280"}
//           />
//           <Text
//             style={[
//               styles.subTabText,
//               mediaSubTab === "docs" && styles.subTabTextActive,
//             ]}
//           >
//             Files & Voice
//             {fileMessages.length + voiceMessages.length > 0
//               ? ` (${fileMessages.length + voiceMessages.length})`
//               : ""}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {mediaSubTab === "photos" && (
//         <ScrollView
//           contentContainerStyle={styles.paneScroll}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshingMedia}
//               onRefresh={handleRefreshMedia}
//               colors={[PRIMARY]}
//               tintColor={PRIMARY}
//             />
//           }
//         >
//           {mediaMessages.length === 0 ? (
//             <View style={styles.empty}>
//               <View style={styles.emptyIconWrap}>
//                 <Ionicons name="images-outline" size={36} color={PRIMARY} />
//               </View>
//               <Text style={styles.emptyTitle}>No photos or videos yet</Text>
//               <Text style={styles.emptySub}>
//                 Media shared in this chat will appear here.
//               </Text>
//             </View>
//           ) : (
//             <View style={styles.grid}>
//               {mediaMessages.map((m) => (
//                 <TouchableOpacity
//                   key={m.id}
//                   style={styles.thumb}
//                   activeOpacity={0.85}
//                   onPress={() =>
//                     openInApp(
//                       buildUrl(m.attachmentUrl!),
//                       m.attachmentName ??
//                         (m.attachmentType === "video"
//                           ? "video.mp4"
//                           : "image.jpg"),
//                     )
//                   }
//                 >
//                   <Image
//                     source={{ uri: buildUrl(m.attachmentUrl!) }}
//                     style={styles.thumbImg}
//                     resizeMode="cover"
//                   />
//                   {m.attachmentType === "video" && (
//                     <View style={styles.playOverlay}>
//                       <Ionicons name="play-circle" size={30} color="#fff" />
//                     </View>
//                   )}
//                   {m.attachmentType === "video" && m.attachmentUrl && (
//                     <TouchableOpacity
//                       style={styles.thumbDlBtn}
//                       onPress={() =>
//                         downloadFile(
//                           m.attachmentUrl!,
//                           m.attachmentName ?? `video_${m.id}.mp4`,
//                           "video",
//                         )
//                       }
//                     >
//                       {downloads[m.attachmentUrl] === "downloading" ? (
//                         <ActivityIndicator size="small" color="#fff" />
//                       ) : (
//                         <Ionicons
//                           name={
//                             downloads[m.attachmentUrl] === "done"
//                               ? "checkmark-circle"
//                               : "arrow-down-circle"
//                           }
//                           size={18}
//                           color={
//                             downloads[m.attachmentUrl] === "done"
//                               ? "#22C55E"
//                               : "#fff"
//                           }
//                         />
//                       )}
//                     </TouchableOpacity>
//                   )}
//                   <Text style={styles.thumbTime}>
//                     {formatTime(m.createdAt)}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}
//         </ScrollView>
//       )}

//       {mediaSubTab === "docs" && (
//         <ScrollView
//           contentContainerStyle={styles.paneScroll}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshingMedia}
//               onRefresh={handleRefreshMedia}
//               colors={[PRIMARY]}
//               tintColor={PRIMARY}
//             />
//           }
//         >
//           {fileMessages.length === 0 && voiceMessages.length === 0 ? (
//             <View style={styles.empty}>
//               <View style={styles.emptyIconWrap}>
//                 <Ionicons name="document-outline" size={36} color={PRIMARY} />
//               </View>
//               <Text style={styles.emptyTitle}>No files or voice notes yet</Text>
//               <Text style={styles.emptySub}>
//                 Documents and voice messages will appear here.
//               </Text>
//             </View>
//           ) : (
//             <>
//               {fileMessages.length > 0 && (
//                 <View style={styles.section}>
//                   <TouchableOpacity
//                     style={styles.sectionHeader}
//                     onPress={() => setFilesExpanded((v) => !v)}
//                     activeOpacity={0.7}
//                   >
//                     <View style={styles.sectionHeaderLeft}>
//                       <View
//                         style={[
//                           styles.sectionDot,
//                           { backgroundColor: PRIMARY },
//                         ]}
//                       />
//                       <Text style={styles.sectionTitle}>Files</Text>
//                       <View style={styles.sectionBadge}>
//                         <Text style={styles.sectionBadgeText}>
//                           {fileMessages.length}
//                         </Text>
//                       </View>
//                     </View>
//                     <Ionicons
//                       name={filesExpanded ? "chevron-up" : "chevron-down"}
//                       size={16}
//                       color="#9CA3AF"
//                     />
//                   </TouchableOpacity>
//                   {filesExpanded &&
//                     fileMessages.map((m) => (
//                       <TouchableOpacity
//                         key={m.id}
//                         style={styles.fileRow}
//                         activeOpacity={0.75}
//                         onPress={() =>
//                           openInApp(
//                             buildUrl(m.attachmentUrl!),
//                             m.attachmentName ?? "file",
//                           )
//                         }
//                       >
//                         <View
//                           style={[
//                             styles.fileIconBox,
//                             { backgroundColor: "#EEF3FF" },
//                           ]}
//                         >
//                           <Ionicons
//                             name="document-outline"
//                             size={20}
//                             color={PRIMARY}
//                           />
//                         </View>
//                         <View style={{ flex: 1, minWidth: 0 }}>
//                           <Text style={styles.fileName} numberOfLines={1}>
//                             {m.attachmentName ?? "File"}
//                           </Text>
//                           <Text style={styles.fileMeta}>
//                             {m.sender === "teacher"
//                               ? "From Teacher"
//                               : "Sent by you"}{" "}
//                             · {formatTime(m.createdAt)}
//                           </Text>
//                         </View>
//                         <DownloadIcon
//                           url={m.attachmentUrl!}
//                           name={m.attachmentName ?? `file_${m.id}`}
//                           type="file"
//                           tintColor={PRIMARY}
//                         />
//                       </TouchableOpacity>
//                     ))}
//                 </View>
//               )}

//               {voiceMessages.length > 0 && (
//                 <View style={styles.section}>
//                   <TouchableOpacity
//                     style={styles.sectionHeader}
//                     onPress={() => setVoiceExpanded((v) => !v)}
//                     activeOpacity={0.7}
//                   >
//                     <View style={styles.sectionHeaderLeft}>
//                       <View
//                         style={[
//                           styles.sectionDot,
//                           { backgroundColor: "#7C3AED" },
//                         ]}
//                       />
//                       <Text style={styles.sectionTitle}>Voice Notes</Text>
//                       <View
//                         style={[
//                           styles.sectionBadge,
//                           { backgroundColor: "#EDE9FE" },
//                         ]}
//                       >
//                         <Text
//                           style={[
//                             styles.sectionBadgeText,
//                             { color: "#7C3AED" },
//                           ]}
//                         >
//                           {voiceMessages.length}
//                         </Text>
//                       </View>
//                     </View>
//                     <Ionicons
//                       name={voiceExpanded ? "chevron-up" : "chevron-down"}
//                       size={16}
//                       color="#9CA3AF"
//                     />
//                   </TouchableOpacity>
//                   {voiceExpanded &&
//                     voiceMessages.map((m) => (
//                       <TouchableOpacity
//                         key={m.id}
//                         style={styles.fileRow}
//                         activeOpacity={0.75}
//                         onPress={() =>
//                           openInApp(
//                             buildUrl(m.attachmentUrl!),
//                             m.attachmentName ?? "voice.m4a",
//                           )
//                         }
//                       >
//                         <View
//                           style={[
//                             styles.fileIconBox,
//                             { backgroundColor: "#F5F3FF" },
//                           ]}
//                         >
//                           <Ionicons name="mic" size={20} color="#7C3AED" />
//                         </View>
//                         <View style={{ flex: 1 }}>
//                           <Text style={styles.fileName}>Voice note</Text>
//                           <Text style={styles.fileMeta}>
//                             {m.sender === "teacher"
//                               ? "From Teacher"
//                               : "Sent by you"}{" "}
//                             · {formatTime(m.createdAt)}
//                           </Text>
//                         </View>
//                         <View style={styles.playBtn}>
//                           <Ionicons name="play" size={14} color="#7C3AED" />
//                         </View>
//                       </TouchableOpacity>
//                     ))}
//                 </View>
//               )}
//             </>
//           )}
//         </ScrollView>
//       )}
//     </View>
//   );

//   // ── Downloads tab ──────────────────────────────────────────
//   const renderDownloads = () => {
//     const formatSize = (bytes?: number) => {
//       if (!bytes) return "";
//       if (bytes < 1024) return `${bytes} B`;
//       if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
//       return `${(bytes / 1048576).toFixed(1)} MB`;
//     };

//     const formatSavedDate = (iso: string) => {
//       const d = new Date(iso);
//       return (
//         d.toLocaleDateString("en-IN", {
//           day: "numeric",
//           month: "short",
//           year: "numeric",
//         }) +
//         " · " +
//         d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
//       );
//     };

//     const openDownloadedFile = async (file: DownloadedFile) => {
//       try {
//         // Check file still exists on disk
//         const info = (await FileSystem.getInfoAsync(file.localUri)) as any;
//         if (!info.exists) {
//           Alert.alert(
//             "File not found",
//             "This file was cleared from device storage.",
//             [
//               {
//                 text: "Remove from list",
//                 onPress: () => removeSavedFile(file.key),
//                 style: "destructive",
//               },
//               { text: "OK", style: "cancel" },
//             ],
//           );
//           return;
//         }

//         if ((info.size ?? 0) === 0) {
//           Alert.alert(
//             "Error",
//             "File appears to be empty. Try downloading again.",
//           );
//           return;
//         }

//         const n = (file.name ?? "").toLowerCase();
//         const ext = n.split(".").pop() ?? "";

//         const isImageFile = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
//         const isVideoFile =
//           ext === "mp4" || file.type === "video" || n.includes("video_");
//         const isVoiceFile = ext === "m4a" || n.includes("voice_");

//         closeAllViewers();
//         await new Promise<void>((resolve) => setTimeout(resolve, 120));

//         if (isVideoFile) {
//           setPreviewVideo(file.localUri);
//           return;
//         }

//         if (isVoiceFile) {
//           setAudioPlayer({ uri: file.localUri, name: file.name });
//           return;
//         }

//         if (isImageFile) {
//           setPreviewItem({
//             uri: file.localUri,
//             type: "image",
//             name: file.name,
//           });
//           return;
//         }

//         // PDFs and docs — pass localUri directly
//         // InAppDocViewer detects file:// and reads from disk (no network needed)
//         setDocViewer({ uri: file.localUri, name: file.name });
//       } catch (err: any) {
//         Alert.alert(
//           "Error",
//           `Could not open file: ${err?.message ?? "unknown error"}`,
//         );
//       }
//     };

//     const deleteFile = (file: DownloadedFile) => {
//       Alert.alert("Remove Download", `Remove "${file.name}" from Downloads?`, [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Remove",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               const info = await FileSystem.getInfoAsync(file.localUri);
//               if (info.exists)
//                 await FileSystem.deleteAsync(file.localUri, {
//                   idempotent: true,
//                 });
//             } catch {}
//             await removeSavedFile(file.key);
//           },
//         },
//       ]);
//     };

//     // FIX: refreshControl on BOTH empty and non-empty states
//     const refreshControl = (
//       <RefreshControl
//         refreshing={refreshingDownloads}
//         onRefresh={handleRefreshDownloads}
//         colors={[PRIMARY]}
//         tintColor={PRIMARY}
//       />
//     );

//     if (savedFiles.length === 0) {
//       return (
//         <ScrollView
//           contentContainerStyle={{ flexGrow: 1 }}
//           refreshControl={refreshControl}
//         >
//           <View style={[styles.emptyGallery, { marginTop: 60 }]}>
//             <View style={styles.dlEmptyIconWrap}>
//               <Ionicons
//                 name="cloud-download-outline"
//                 size={40}
//                 color={PRIMARY}
//               />
//             </View>
//             <Text style={styles.emptyGalleryTitle}>No downloads yet</Text>
//             <Text style={styles.emptyGalleryText}>
//               Files and videos you download from chat will appear here for
//               offline access.
//             </Text>
//           </View>
//         </ScrollView>
//       );
//     }

//     return (
//       <ScrollView
//         contentContainerStyle={[styles.galleryScroll, { paddingBottom: 40 }]}
//         showsVerticalScrollIndicator={false}
//         refreshControl={refreshControl}
//       >
//         <View style={styles.dlHeader}>
//           <View style={styles.dlHeaderLeft}>
//             <Ionicons name="cloud-download" size={18} color={PRIMARY} />
//             <Text style={styles.dlHeaderTitle}>
//               {savedFiles.length} downloaded item
//               {savedFiles.length !== 1 ? "s" : ""}
//             </Text>
//           </View>
//           <Text style={styles.dlHeaderSub}>Tap to open · Pull to refresh</Text>
//         </View>

//         {savedFiles.map((file) => (
//           <View key={file.key} style={styles.dlRow}>
//             <View
//               style={[
//                 styles.dlIconBox,
//                 {
//                   backgroundColor:
//                     file.type === "video" ? "#1F2937" : "#EEF3FF",
//                 },
//               ]}
//             >
//               <Ionicons
//                 name={file.type === "video" ? "videocam" : "document-outline"}
//                 size={22}
//                 color={file.type === "video" ? "#fff" : PRIMARY}
//               />
//             </View>
//             <TouchableOpacity
//               style={{ flex: 1 }}
//               onPress={() => openDownloadedFile(file)}
//             >
//               <Text style={styles.dlName} numberOfLines={1}>
//                 {file.name}
//               </Text>
//               <Text style={styles.dlMeta}>
//                 {file.type === "video" ? "Video" : "Document"}
//                 {file.size ? `  ·  ${formatSize(file.size)}` : ""}
//                 {"  ·  "}
//                 {formatSavedDate(file.savedAt)}
//               </Text>
//               <View style={styles.dlOfflineBadge}>
//                 <Ionicons name="checkmark-circle" size={11} color="#16A34A" />
//                 <Text style={styles.dlOfflineText}>Available offline</Text>
//               </View>
//             </TouchableOpacity>
//             <View style={styles.dlActions}>
//               <TouchableOpacity
//                 onPress={() => deleteFile(file)}
//                 style={styles.dlActionBtn}
//                 hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//               >
//                 <Ionicons name="trash-outline" size={19} color="#EF4444" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//       </ScrollView>
//     );
//   };

//   // ── JSX ────────────────────────────────────────────────────
//   return (
//     <SafeAreaView style={styles.safe}>
//       <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

//       {/* Header */}
//       <View style={[styles.header, { backgroundColor: PRIMARY }]}>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.headerBtn}
//         >
//           <Ionicons name="arrow-back-outline" size={20} color="#fff" />
//         </TouchableOpacity>
//         <View style={styles.headerCenter}>
//           <View style={styles.headerAvatar}>
//             <Text style={styles.headerAvatarText}>
//               {getInitials(childName ?? "")}
//             </Text>
//           </View>
//           <View>
//             <Text style={styles.headerName}>{childName}</Text>
//             <Text style={styles.headerSub}>
//               {classname}
//               {sectionname ? ` · ${sectionname}` : ""}
//             </Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.headerBtn} onPress={startNewChat}>
//           <Ionicons name="add-circle-outline" size={20} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* Tab bar */}
//       <View style={styles.tabBar}>
//         {(["chat", "media", "downloads"] as TabType[]).map((tab) => (
//           <TouchableOpacity
//             key={tab}
//             style={[styles.tab, activeTab === tab && styles.tabActive]}
//             onPress={() => setActiveTab(tab)}
//           >
//             <Ionicons
//               name={
//                 tab === "chat"
//                   ? "chatbubbles-outline"
//                   : tab === "media"
//                     ? "images-outline"
//                     : "cloud-download-outline"
//               }
//               size={15}
//               color={activeTab === tab ? PRIMARY : "#9CA3AF"}
//             />
//             <Text
//               style={[
//                 styles.tabText,
//                 activeTab === tab && styles.tabTextActive,
//               ]}
//             >
//               {tab === "chat"
//                 ? "Chat"
//                 : tab === "media"
//                   ? `Media${mediaMessages.length + fileMessages.length + voiceMessages.length > 0 ? ` (${mediaMessages.length + fileMessages.length + voiceMessages.length})` : ""}`
//                   : `Downloads${savedFiles.length > 0 ? ` (${savedFiles.length})` : ""}`}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Search bar */}
//       {showSearch && (
//         <View style={styles.searchBar}>
//           <Ionicons name="search-outline" size={16} color="#9CA3AF" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search messages, files, media..."
//             placeholderTextColor="#9CA3AF"
//             value={searchQuery}
//             onChangeText={(text) => {
//               setSearchQuery(text);
//               // Only show global results modal when user explicitly taps the results button
//               // Live filtering happens in the chat list directly
//               if (!text.trim()) setShowGlobalResults(false);
//             }}
//             autoFocus
//           />
//           {searchQuery.length > 0 && (
//             <>
//               <TouchableOpacity
//                 onPress={() => {
//                   setSearchQuery("");
//                   setShowGlobalResults(false);
//                 }}
//               >
//                 <Ionicons name="close-circle" size={16} color="#9CA3AF" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.searchResultsBtn}
//                 onPress={() => {
//                   if (globalSearchResults.length > 0)
//                     setShowGlobalResults(true);
//                 }}
//               >
//                 <Text style={styles.searchCount}>
//                   {filteredMessages.length} in chat
//                 </Text>
//                 <Ionicons name="chevron-forward" size={12} color={PRIMARY} />
//               </TouchableOpacity>
//             </>
//           )}
//         </View>
//       )}

//       {/* Pinned banner */}
//       {pinnedMessages.length > 0 && activeTab === "chat" && (
//         <View style={styles.pinnedBanner}>
//           <Ionicons name="pin" size={12} color="#92400E" />
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             style={{ flex: 1, marginLeft: 8 }}
//           >
//             {pinnedMessages.map((m) => (
//               <TouchableOpacity
//                 key={m.id}
//                 style={styles.pinnedChip}
//                 onPress={() => scrollToMessage(m.id)}
//               >
//                 <Text style={styles.pinnedChipText} numberOfLines={1}>
//                   {m.text ||
//                     (m.attachmentName?.includes("voice_")
//                       ? "Voice note"
//                       : "Attachment")}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>
//       )}

//       {/* Tab content */}
//       {activeTab === "media" ? (
//         renderMediaGallery()
//       ) : activeTab === "downloads" ? (
//         renderDownloads()
//       ) : (
//         <KeyboardAvoidingView
//           style={{ flex: 1 }}
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//           keyboardVerticalOffset={0}
//         >
//           {loading ? (
//             <View style={styles.loadingWrap}>
//               <ActivityIndicator size="large" color={PRIMARY} />
//               <Text style={styles.loadingText}>Loading messages...</Text>
//             </View>
//           ) : (
//             <FlatList
//               ref={flatListRef}
//               data={groupedMessages()}
//               keyExtractor={(item) => (item as any).id}
//               renderItem={renderMessage}
//               removeClippedSubviews
//               contentContainerStyle={styles.list}
//               onContentSizeChange={() =>
//                 flatListRef.current?.scrollToEnd({ animated: false })
//               }
//               onScrollToIndexFailed={(info) =>
//                 setTimeout(
//                   () =>
//                     flatListRef.current?.scrollToIndex({
//                       index: info.index,
//                       animated: true,
//                     }),
//                   300,
//                 )
//               }
//               onTouchStart={() => {
//                 if (showEmojiPicker) setShowEmojiPicker(false);
//               }}
//               ListEmptyComponent={
//                 <View style={styles.emptyWrap}>
//                   <View style={styles.emptyIconWrap}>
//                     <Ionicons
//                       name="chatbubbles-outline"
//                       size={40}
//                       color={PRIMARY}
//                     />
//                   </View>
//                   <Text style={styles.emptyTitle}>No messages yet</Text>
//                   <Text style={styles.emptySub}>
//                     Send a note to the teacher below
//                   </Text>
//                 </View>
//               }
//             />
//           )}

//           {threadId === null && messages.length > 0 && (
//             <View style={styles.newChatBanner}>
//               <Ionicons name="add-circle-outline" size={14} color="#0047AB" />
//               <Text style={styles.newChatBannerText}>
//                 Starting a new conversation — previous messages are above
//               </Text>
//             </View>
//           )}

//           {replyTo && (
//             <View style={styles.replyBanner}>
//               <View style={styles.replyBannerBar} />
//               <View style={{ flex: 1 }}>
//                 <Text style={styles.replyBannerLabel}>
//                   Replying to{" "}
//                   {replyTo.sender === "teacher" ? "Teacher" : "yourself"}
//                 </Text>
//                 <Text style={styles.replyBannerText} numberOfLines={1}>
//                   {replyTo.text || replyTo.attachmentName || "Attachment"}
//                 </Text>
//               </View>
//               <TouchableOpacity onPress={cancelReply} style={styles.replyClose}>
//                 <Ionicons name="close" size={18} color="#6B7280" />
//               </TouchableOpacity>
//             </View>
//           )}

//           {editingMsg && (
//             <View style={[styles.replyBanner, styles.editBanner]}>
//               <View
//                 style={[styles.replyBannerBar, { backgroundColor: "#F59E0B" }]}
//               />
//               <View style={{ flex: 1 }}>
//                 <Text style={[styles.replyBannerLabel, { color: "#B45309" }]}>
//                   Editing message
//                 </Text>
//                 <Text style={styles.replyBannerText} numberOfLines={1}>
//                   {editingMsg.text}
//                 </Text>
//               </View>
//               <TouchableOpacity onPress={cancelEdit} style={styles.replyClose}>
//                 <Ionicons name="close" size={18} color="#6B7280" />
//               </TouchableOpacity>
//             </View>
//           )}

//           {attachments.length > 0 && (
//             <View style={styles.attachStrip}>
//               <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={{ gap: 8, padding: 8 }}
//               >
//                 {attachments.map((att, idx) => (
//                   <View key={idx} style={styles.attachThumb}>
//                     {att.type === "image" ? (
//                       <Image
//                         source={{ uri: att.uri }}
//                         style={styles.attachThumbImg}
//                       />
//                     ) : (
//                       <View style={styles.attachThumbFile}>
//                         <Ionicons
//                           name={
//                             att.mimeType === "audio/m4a"
//                               ? "mic"
//                               : att.mimeType === "video/mp4"
//                                 ? "videocam"
//                                 : "document-outline"
//                           }
//                           size={22}
//                           color={PRIMARY}
//                         />
//                         <Text style={styles.attachThumbName} numberOfLines={1}>
//                           {att.mimeType === "audio/m4a"
//                             ? "Voice"
//                             : att.mimeType === "video/mp4"
//                               ? "Video"
//                               : att.name.split(".")[0]}
//                         </Text>
//                       </View>
//                     )}
//                     <TouchableOpacity
//                       onPress={() => removeAttachment(idx)}
//                       style={styles.attachRemove}
//                     >
//                       <Ionicons name="close-circle" size={20} color="#EF4444" />
//                     </TouchableOpacity>
//                   </View>
//                 ))}
//               </ScrollView>
//             </View>
//           )}

//           {showEmojiPicker && (
//             <View style={styles.emojiPanel}>
//               <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.emojiScrollContent}
//               >
//                 {EMOJI_LIST.map((emoji, i) => (
//                   <TouchableOpacity
//                     key={i}
//                     style={styles.emojiBtn}
//                     onPress={() => setInputText((p) => p + emoji)}
//                   >
//                     <Text style={styles.emojiText}>{emoji}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>
//             </View>
//           )}

//           <View style={styles.inputBar}>
//             <TouchableOpacity
//               onPress={showAttachmentOptions}
//               style={styles.attachBtn}
//             >
//               <Ionicons name="add-circle-outline" size={26} color={PRIMARY} />
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={() => {
//                 setShowEmojiPicker((v) => !v);
//                 if (!showEmojiPicker) inputRef.current?.blur();
//               }}
//               style={styles.attachBtn}
//             >
//               <Text style={styles.emojiToggleIcon}>
//                 {showEmojiPicker ? "⌨️" : "☻"}
//               </Text>
//             </TouchableOpacity>
//             <TextInput
//               ref={inputRef}
//               style={styles.input}
//               value={inputText}
//               onChangeText={setInputText}
//               placeholder={
//                 editingMsg
//                   ? "Edit message..."
//                   : replyTo
//                     ? "Write a reply..."
//                     : "Type a message..."
//               }
//               placeholderTextColor="#9CA3AF"
//               multiline
//               maxLength={500}
//               onFocus={() => setShowEmojiPicker(false)}
//             />
//             {!inputText.trim() && attachments.length === 0 && !editingMsg && (
//               <TouchableOpacity
//                 style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
//                 onPress={isRecording ? stopRecording : startRecording}
//                 activeOpacity={0.8}
//               >
//                 {isTranscribing ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Ionicons
//                     name={isRecording ? "stop" : "mic"}
//                     size={20}
//                     color="#fff"
//                   />
//                 )}
//               </TouchableOpacity>
//             )}
//             {(!!inputText.trim() || attachments.length > 0 || editingMsg) && (
//               <TouchableOpacity
//                 style={[
//                   styles.sendBtn,
//                   { backgroundColor: editingMsg ? "#F59E0B" : PRIMARY },
//                   sending && { opacity: 0.5 },
//                 ]}
//                 onPress={sendMessage}
//                 disabled={sending}
//                 activeOpacity={0.8}
//               >
//                 {sending ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Ionicons
//                     name={editingMsg ? "checkmark" : "send"}
//                     size={18}
//                     color="#fff"
//                   />
//                 )}
//               </TouchableOpacity>
//             )}
//           </View>

//           {isRecording && (
//             <View style={styles.recordingBar}>
//               <View style={styles.recordingDot} />
//               <Text style={styles.recordingText}>
//                 Recording... tap stop to finish
//               </Text>
//               <TouchableOpacity
//                 onPress={stopRecording}
//                 style={styles.recordingStop}
//               >
//                 <Ionicons name="stop-circle" size={22} color="#991B1B" />
//               </TouchableOpacity>
//             </View>
//           )}
//         </KeyboardAvoidingView>
//       )}

//       {/* Camera modal */}
//       <Modal
//         visible={showCamera}
//         animationType="slide"
//         onRequestClose={() => {
//           if (isVideoRecording) stopVideoRecording();
//           setShowCamera(false);
//         }}
//       >
//         <View style={{ flex: 1, backgroundColor: "#000" }}>
//           <CameraView
//             ref={cameraRef}
//             style={StyleSheet.absoluteFillObject}
//             facing={cameraFacing}
//             mode="video"
//           />
//           <View style={styles.cameraTopBar}>
//             <TouchableOpacity
//               onPress={() => {
//                 if (isVideoRecording) stopVideoRecording();
//                 setShowCamera(false);
//               }}
//               style={styles.cameraBtn}
//             >
//               <Ionicons name="close" size={24} color="#fff" />
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={() =>
//                 setCameraFacing((f) => (f === "back" ? "front" : "back"))
//               }
//               style={styles.cameraBtn}
//             >
//               <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
//             </TouchableOpacity>
//           </View>
//           <View style={styles.cameraBottomBar}>
//             {isVideoRecording && (
//               <Text style={styles.recordingLabel}>Recording...</Text>
//             )}
//             <TouchableOpacity
//               onPress={
//                 isVideoRecording ? stopVideoRecording : startVideoRecording
//               }
//               style={[
//                 styles.cameraRecord,
//                 {
//                   backgroundColor: isVideoRecording ? "#EF4444" : "#fff",
//                   borderColor: isVideoRecording ? "#fff" : "#EF4444",
//                 },
//               ]}
//             >
//               <Ionicons
//                 name={isVideoRecording ? "stop" : "videocam"}
//                 size={30}
//                 color={isVideoRecording ? "#fff" : "#EF4444"}
//               />
//             </TouchableOpacity>
//             <Text style={styles.cameraHint}>
//               {isVideoRecording ? "Tap to stop" : "Tap to record video"}
//             </Text>
//           </View>
//         </View>
//       </Modal>

//       {/* ── Viewers — key prop forces remount when URI changes ── */}
//       {previewVideo && (
//         <VideoPlayerModal
//           uri={previewVideo}
//           onClose={() => setPreviewVideo(null)}
//         />
//       )}

//       {audioPlayer && (
//         <AudioPlayerModal
//           key={audioPlayer.uri}
//           uri={audioPlayer.uri}
//           name={audioPlayer.name}
//           onClose={() => setAudioPlayer(null)}
//         />
//       )}

//       {docViewer && (
//         <InAppDocViewer
//           key={docViewer.uri}
//           uri={docViewer.uri}
//           name={docViewer.name}
//           onClose={() => setDocViewer(null)}
//         />
//       )}

//       {previewItem?.type === "image" && (
//         <Modal
//           visible
//           animationType="slide"
//           transparent
//           onRequestClose={() => setPreviewItem(null)}
//         >
//           <View style={styles.previewModal}>
//             <TouchableOpacity
//               style={styles.previewClose}
//               onPress={() => setPreviewItem(null)}
//             >
//               <Ionicons name="close" size={28} color="#fff" />
//             </TouchableOpacity>
//             <Image
//               source={{ uri: previewItem.uri }}
//               style={styles.fullImage}
//               resizeMode="contain"
//             />
//           </View>
//         </Modal>
//       )}

//       {/* Context menu */}
//       <Modal
//         visible={!!contextMsg}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setContextMsg(null)}
//       >
//         <Pressable
//           style={styles.modalOverlay}
//           onPress={() => setContextMsg(null)}
//         >
//           <View style={styles.contextMenu}>
//             <Text style={styles.contextPreview} numberOfLines={2}>
//               {contextMsg?.text || "Attachment"}
//             </Text>
//             <TouchableOpacity style={styles.contextItem} onPress={handleCopy}>
//               <Ionicons name="copy-outline" size={18} color="#374151" />
//               <Text style={styles.contextItemText}>Copy</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.contextItem} onPress={handleReply}>
//               <Ionicons name="arrow-undo-outline" size={18} color="#374151" />
//               <Text style={styles.contextItemText}>Reply</Text>
//             </TouchableOpacity>
//             {contextMsg?.sender === "parent" && (
//               <TouchableOpacity style={styles.contextItem} onPress={handleEdit}>
//                 <Ionicons name="pencil-outline" size={18} color="#374151" />
//                 <Text style={styles.contextItemText}>Edit</Text>
//               </TouchableOpacity>
//             )}
//             <TouchableOpacity style={styles.contextItem} onPress={handlePin}>
//               <Ionicons
//                 name={
//                   pinnedIds.includes(contextMsg?.id ?? "")
//                     ? "pin"
//                     : "pin-outline"
//                 }
//                 size={18}
//                 color="#374151"
//               />
//               <Text style={styles.contextItemText}>
//                 {pinnedIds.includes(contextMsg?.id ?? "") ? "Unpin" : "Pin"}
//               </Text>
//             </TouchableOpacity>
//             {contextMsg?.sender === "parent" && (
//               <TouchableOpacity
//                 style={[
//                   styles.contextItem,
//                   {
//                     borderTopWidth: 1,
//                     borderTopColor: "#F3F4F6",
//                     marginTop: 4,
//                   },
//                 ]}
//                 onPress={handleDelete}
//               >
//                 <Ionicons name="trash-outline" size={18} color="#EF4444" />
//                 <Text style={[styles.contextItemText, { color: "#EF4444" }]}>
//                   Delete
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </Pressable>
//       </Modal>

//       {/* Global search results */}
//       {showGlobalResults && (
//         <GlobalSearchModal
//           results={globalSearchResults}
//           onClose={() => {
//             setShowGlobalResults(false);
//             setSearchQuery("");
//             setShowSearch(false);
//           }}
//           onNavigate={(result) => {
//             setShowGlobalResults(false);
//             setShowSearch(false);
//             setSearchQuery("");
//             const m = result.message;
//             if (result.type === "message") {
//               setActiveTab("chat");
//               setTimeout(() => scrollToMessage(m.id), 300);
//             } else {
//               setActiveTab("media");
//               setTimeout(() => {
//                 if (m.attachmentUrl)
//                   openInApp(m.attachmentUrl, m.attachmentName ?? "file");
//               }, 300);
//             }
//           }}
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// // ── Styles ───────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: "#F0F4FB" },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingTop: 14,
//     paddingBottom: 14,
//     gap: 8,
//   },
//   headerBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "rgba(255,255,255,0.15)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   headerCenter: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },
//   headerAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(255,255,255,0.2)",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1.5,
//     borderColor: "rgba(255,255,255,0.3)",
//   },
//   headerAvatarText: { color: "#fff", fontSize: 15, fontWeight: "800" },
//   headerName: { color: "#fff", fontSize: 15, fontWeight: "800" },
//   headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 11 },
//   headerActions: { flexDirection: "row", gap: 6 },
//   tabBar: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#E5E7EB",
//   },
//   tab: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 5,
//     paddingVertical: 11,
//     paddingHorizontal: 4,
//     borderBottomWidth: 2.5,
//     borderBottomColor: "transparent",
//   },

//   newChatBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 7,
//     backgroundColor: "#EEF3FF",
//     paddingHorizontal: 14,
//     paddingVertical: 9,
//     borderTopWidth: 1,
//     borderTopColor: "#C7D9F8",
//   },
//   newChatBannerText: {
//     fontSize: 12,
//     color: PRIMARY,
//     fontWeight: "600",
//     flex: 1,
//   },
//   tabActive: { borderBottomColor: PRIMARY },
//   tabText: { fontSize: 12, fontWeight: "600", color: "#9CA3AF" },
//   tabTextActive: { color: PRIMARY, fontWeight: "700" },
//   searchBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     backgroundColor: "#fff",
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E5E7EB",
//   },
//   searchInput: { flex: 1, fontSize: 14, color: "#1F2937" },
//   searchResultsBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 3,
//     backgroundColor: "#EEF3FF",
//     borderRadius: 10,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   searchCount: { fontSize: 12, color: PRIMARY, fontWeight: "700" },
//   pinnedBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFFBEB",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: "#FDE68A",
//   },
//   pinnedChip: {
//     backgroundColor: "#FDE68A",
//     borderRadius: 10,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     marginRight: 8,
//   },
//   pinnedChipText: {
//     fontSize: 11,
//     color: "#92400E",
//     maxWidth: 150,
//     fontWeight: "600",
//   },
//   loadingWrap: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 12,
//   },
//   loadingText: { color: PRIMARY, fontSize: 14, fontWeight: "600" },
//   emptyWrap: { alignItems: "center", paddingTop: 80 },
//   list: { padding: 12, paddingBottom: 8 },
//   dateSeparator: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 12,
//     gap: 8,
//   },
//   dateLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
//   dateLabel: {
//     fontSize: 11,
//     color: "#9CA3AF",
//     fontWeight: "600",
//     paddingHorizontal: 4,
//   },
//   msgRow: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     marginBottom: 6,
//     gap: 8,
//   },
//   msgRowRight: { flexDirection: "row-reverse" },
//   teacherAvatar: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: "#EEF3FF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 4,
//   },
//   teacherLabel: {
//     fontSize: 10,
//     color: "#9CA3AF",
//     marginBottom: 2,
//     marginLeft: 2,
//   },
//   pinRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 3,
//     marginBottom: 2,
//   },
//   pinText: { fontSize: 10, color: "#F59E0B", fontWeight: "600" },
//   bubble: { borderRadius: 18, padding: 10, maxWidth: "100%" },
//   bubbleLeft: {
//     backgroundColor: "#fff",
//     borderBottomLeftRadius: 4,
//     borderWidth: 1,
//     borderColor: "#F0F0F0",
//     elevation: 1,
//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//   },
//   bubbleRight: {
//     backgroundColor: PRIMARY,
//     borderBottomRightRadius: 4,
//     elevation: 2,
//     shadowColor: PRIMARY,
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//   },
//   bubblePinned: { borderWidth: 1.5, borderColor: "#F59E0B" },
//   replyRef: {
//     flexDirection: "row",
//     borderRadius: 10,
//     padding: 8,
//     marginBottom: 6,
//     gap: 8,
//   },
//   replyRefRight: { backgroundColor: "rgba(255,255,255,0.15)" },
//   replyRefLeft: { backgroundColor: "#F3F4F6" },
//   replyRefBar: { width: 3, borderRadius: 2, backgroundColor: "#60A5FA" },
//   replyRefLabel: { fontSize: 10, color: "#9CA3AF", marginBottom: 1 },
//   replyRefText: { fontSize: 12, color: "#374151", fontWeight: "600" },
//   msgText: { fontSize: 15, color: "#111827", lineHeight: 21 },
//   attachedImage: { width: 200, height: 150, borderRadius: 12, marginTop: 6 },
//   mediaChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//     marginTop: 6,
//     backgroundColor: "#F3F4F6",
//     borderRadius: 12,
//     padding: 10,
//   },
//   mediaChipRight: { backgroundColor: "rgba(255,255,255,0.15)" },
//   mediaChipText: { fontSize: 13, color: "#374151", flex: 1 },
//   mediaChipSub: { fontSize: 11, color: "#6B7280" },
//   videoThumb: {
//     width: 44,
//     height: 44,
//     borderRadius: 10,
//     backgroundColor: "#1F2937",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   voiceChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     marginTop: 6,
//     backgroundColor: "#F3F4F6",
//     borderRadius: 12,
//     padding: 10,
//   },
//   voiceChipRight: { backgroundColor: "rgba(255,255,255,0.15)" },
//   waveform: { flexDirection: "row", alignItems: "center", gap: 2, flex: 1 },
//   waveBar: { width: 3, borderRadius: 2 },
//   voiceLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
//   fileChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 6,
//     backgroundColor: "#F3F4F6",
//     borderRadius: 12,
//     padding: 10,
//     minWidth: 200,
//   },
//   fileChipRight: { backgroundColor: "rgba(255,255,255,0.15)" },
//   fileIconBox: {
//     width: 40,
//     height: 40,
//     borderRadius: 10,
//     backgroundColor: "#EEF3FF",
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   fileName: { fontSize: 13, color: "#374151", fontWeight: "600" },
//   fileSub: { fontSize: 10, color: "#9CA3AF", marginTop: 1 },
//   fileMeta: { fontSize: 11, color: "#9CA3AF" },
//   timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
//   timeText: { fontSize: 10, color: "#9CA3AF" },
//   replyBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F9FAFB",
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderTopWidth: 1,
//     borderTopColor: "#E5E7EB",
//     gap: 10,
//   },
//   replyBannerBar: {
//     width: 3,
//     height: 36,
//     borderRadius: 2,
//     backgroundColor: PRIMARY,
//   },
//   replyBannerLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
//   replyBannerText: { fontSize: 13, color: "#1F2937" },
//   replyClose: { padding: 4 },
//   editBanner: { backgroundColor: "#FFFBEB" },
//   attachStrip: {
//     backgroundColor: "#F9FAFB",
//     borderTopWidth: 1,
//     borderTopColor: "#E5E7EB",
//   },
//   attachThumb: { position: "relative" },
//   attachThumbImg: { width: 64, height: 64, borderRadius: 10 },
//   attachThumbFile: {
//     width: 64,
//     height: 64,
//     borderRadius: 10,
//     backgroundColor: "#EEF3FF",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 4,
//   },
//   attachThumbName: {
//     fontSize: 9,
//     color: PRIMARY,
//     fontWeight: "600",
//     maxWidth: 60,
//     textAlign: "center",
//   },
//   attachRemove: { position: "absolute", top: -6, right: -6 },
//   // emojiPanel:         { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E5E7EB", height: 220, paddingHorizontal: 8, paddingTop: 8 },
//   // emojiGrid:          { flexDirection: "row", flexWrap: "wrap" },
//   // emojiGridBtn:       { width: (SCREEN_W - 16) / 8, height: 44, alignItems: "center", justifyContent: "center" },
//   // emojiGridText:      { fontSize: 24 },
//   emojiToggleIcon: { fontSize: 24 },

//   emojiPanel: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 8,
//     marginTop: 8,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   emojiScrollContent: {
//     flexDirection: "row",
//     paddingHorizontal: 4,
//   },
//   emojiBtn: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#F3F4F6",
//     marginHorizontal: 4,
//   },
//   emojiText: {
//     fontSize: 24,
//   },
//   inputBar: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     padding: 8,
//     gap: 8,
//     backgroundColor: "#fff",
//     borderTopWidth: 1,
//     borderTopColor: "#E5E7EB",
//   },
//   attachBtn: { padding: 4 },
//   input: {
//     flex: 1,
//     backgroundColor: "#F3F4F6",
//     borderRadius: 22,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     fontSize: 15,
//     maxHeight: 100,
//     color: "#1F2937",
//   },
//   voiceBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#6B7280",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   voiceBtnActive: { backgroundColor: "#EF4444" },
//   sendBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   downloadBtn: { padding: 6 },
//   recordingBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FEE2E2",
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     gap: 10,
//   },
//   recordingDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: "#EF4444",
//   },
//   recordingText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "600" },
//   recordingStop: { padding: 4 },
//   cameraTopBar: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 16,
//     paddingTop: 50,
//   },
//   cameraBtn: {
//     backgroundColor: "rgba(0,0,0,0.5)",
//     borderRadius: 20,
//     padding: 8,
//   },
//   cameraBottomBar: {
//     position: "absolute",
//     bottom: 50,
//     left: 0,
//     right: 0,
//     alignItems: "center",
//     gap: 12,
//   },
//   cameraRecord: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     borderWidth: 4,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   cameraHint: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
//   recordingLabel: { color: "#fff", fontSize: 15, fontWeight: "700" },
//   videoClose: {
//     position: "absolute",
//     top: 50,
//     right: 16,
//     zIndex: 10,
//     backgroundColor: "rgba(0,0,0,0.6)",
//     borderRadius: 20,
//     padding: 8,
//   },
//   previewModal: {
//     flex: 1,
//     backgroundColor: "#000",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   previewClose: {
//     position: "absolute",
//     top: 50,
//     right: 16,
//     zIndex: 10,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     borderRadius: 20,
//     padding: 6,
//   },
//   fullImage: { width: "100%", height: "80%" },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.45)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   contextMenu: {
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     width: 280,
//     overflow: "hidden",
//     elevation: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 12,
//   },
//   contextPreview: {
//     fontSize: 12,
//     color: "#9CA3AF",
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F4F6",
//   },
//   contextItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 13,
//   },
//   contextItemText: { fontSize: 15, color: "#111827", fontWeight: "500" },
//   galleryScroll: { padding: 16, paddingBottom: 40 },
//   emptyGallery: { alignItems: "center", paddingTop: 60, gap: 12 },
//   emptyGalleryTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
//   emptyGalleryText: {
//     fontSize: 13,
//     color: "#9CA3AF",
//     textAlign: "center",
//     lineHeight: 20,
//     paddingHorizontal: 30,
//   },
//   dlHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 14,
//     paddingHorizontal: 2,
//   },
//   dlHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
//   dlHeaderTitle: { fontSize: 14, fontWeight: "700", color: PRIMARY },
//   dlHeaderSub: { fontSize: 11, color: "#9CA3AF" },
//   dlRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     backgroundColor: "#fff",
//     borderRadius: 14,
//     padding: 14,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: "#E8EFFA",
//     elevation: 2,
//     shadowColor: PRIMARY,
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   dlIconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 13,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   dlName: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#1F2937",
//     marginBottom: 3,
//   },
//   dlMeta: { fontSize: 11, color: "#9CA3AF", marginBottom: 5 },
//   dlOfflineBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
//   dlOfflineText: { fontSize: 10, color: "#16A34A", fontWeight: "600" },
//   dlActions: { flexDirection: "row", gap: 2 },
//   dlActionBtn: { padding: 8, borderRadius: 8 },
//   dlEmptyIconWrap: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "#EEF3FF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 4,
//   },
//   subTabBar: {
//     flexDirection: "row",
//     gap: 8,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     backgroundColor: "#F0F4FB",
//     borderBottomWidth: 1,
//     borderBottomColor: "#E5E7EB",
//   },
//   subTab: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     paddingHorizontal: 14,
//     paddingVertical: 7,
//     borderRadius: 20,
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   subTabActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
//   subTabText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
//   subTabTextActive: { color: "#fff" },
//   paneScroll: { padding: 14, paddingBottom: 40 },
//   grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
//   thumb: {
//     width: (SCREEN_W - 44) / 3,
//     height: (SCREEN_W - 44) / 3,
//     borderRadius: 10,
//     overflow: "hidden",
//     position: "relative",
//   },
//   thumbImg: { width: "100%", height: "100%" },
//   playOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(0,0,0,0.28)",
//   },
//   thumbDlBtn: {
//     position: "absolute",
//     top: 5,
//     right: 5,
//     backgroundColor: "rgba(0,0,0,0.48)",
//     borderRadius: 12,
//     padding: 3,
//   },
//   thumbTime: {
//     position: "absolute",
//     bottom: 4,
//     right: 6,
//     fontSize: 9,
//     color: "#fff",
//     fontWeight: "700",
//   },
//   section: {
//     marginBottom: 10,
//     backgroundColor: "#fff",
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: "#E8EFFA",
//     overflow: "hidden",
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 14,
//     paddingVertical: 13,
//   },
//   sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
//   sectionDot: { width: 8, height: 8, borderRadius: 4 },
//   sectionTitle: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
//   sectionBadge: {
//     backgroundColor: "#EEF3FF",
//     borderRadius: 10,
//     paddingHorizontal: 7,
//     paddingVertical: 2,
//   },
//   sectionBadgeText: { fontSize: 11, fontWeight: "700", color: PRIMARY },
//   fileRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     paddingHorizontal: 14,
//     paddingVertical: 11,
//     borderTopWidth: 0.5,
//     borderTopColor: "#F3F4F6",
//   },
//   playBtn: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: "#EDE9FE",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   empty: { alignItems: "center", paddingTop: 60, gap: 10 },
//   emptyIconWrap: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     backgroundColor: "#EEF3FF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 4,
//   },
//   emptyTitle: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
//   emptySub: {
//     fontSize: 13,
//     color: "#9CA3AF",
//     textAlign: "center",
//     lineHeight: 19,
//     paddingHorizontal: 28,
//   },
// });

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Pressable,
  Clipboard,
  Dimensions,
  StatusBar,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { VideoView, useVideoPlayer } from "expo-video";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const BASE_URL = "https://connect.schoolaid.in";
const PRIMARY = "#0047AB";
const SCREEN_W = Dimensions.get("window").width;

const EMOJI_LIST = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "🥰",
  "😘",
  "😎",
  "🤩",
  "😅",
  "😆",
  "🙂",
  "🙃",
  "😉",
  "😋",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤔",
  "🤐",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "😌",
  "😔",
  "😪",
  "🤤",
  "😴",
  "😷",
  "🤒",
  "🤕",
  "🤧",
  "🥵",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "💔",
  "💕",
  "💞",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🤝",
  "🙏",
  "💪",
  "✌️",
  "🤞",
  "👌",
  "🎉",
  "🎊",
  "🎈",
  "🎁",
  "🏆",
  "⭐",
  "🌟",
  "✨",
  "🔥",
  "💯",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "😈",
  "👿",
  "💀",
  "☠️",
];

// ── Interfaces ───────────────────────────────────────────────
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
  threadId?: number;
  status?: "sending" | "sent" | "delivered" | "read";
}

interface ThreadItem {
  id: number;
  preview: string;
  createdAt: string;
}

interface AttachmentItem {
  uri: string;
  type: "image" | "file" | "video";
  name: string;
  mimeType: string;
}

interface DownloadedFile {
  key: string;
  url: string;
  localUri: string;
  name: string;
  type: "file" | "video";
  savedAt: string;
  size?: number;
}

interface SearchResult {
  type: "message" | "media" | "file" | "voice";
  message: Message;
  matchText: string;
}

type TabType = "chat" | "media" | "downloads";

// ── Helpers ──────────────────────────────────────────────────
const buildUrl = (url: string) =>
  url?.startsWith("http")
    ? url
    : `${BASE_URL}/${url?.replace(/^\//, "") ?? ""}`;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ── Map raw API message to Message interface ─────────────────
const mapRawMessage = (m: any): Message => {
  const attachUrl = m.attachment_url ?? undefined;
  const extractedName = attachUrl
    ? (attachUrl.split("/").pop() ?? undefined)
    : undefined;
  const attachName = m.attachment_name ?? extractedName ?? undefined;
  const nameExt = attachName?.split(".").pop()?.toLowerCase() ?? "";
  const urlExt = attachUrl?.split(".").pop()?.toLowerCase() ?? "";
  const ext = nameExt || urlExt;
  const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isVideo =
    ext === "mp4" ||
    !!attachName?.includes("video_") ||
    !!attachUrl?.endsWith(".mp4");
  const isVoice =
    ext === "m4a" ||
    !!attachName?.includes("voice_") ||
    !!attachUrl?.endsWith(".m4a") ||
    !!attachUrl?.includes("voice_");
  const attachType = isVideo
    ? "video"
    : isVoice
      ? "file"
      : isImg
        ? "image"
        : attachUrl
          ? "file"
          : undefined;
  const senderIsTeacher = m.sender_type === "teacher";
  return {
    id: String(m.id ?? m._id ?? Math.random()),
    text: (() => {
      const r = m.message ?? m.body ?? m.text ?? "";
      try {
        return decodeURIComponent(r);
      } catch {
        return r;
      }
    })(),
    sender: senderIsTeacher ? "teacher" : "parent",
    createdAt: m.created_at ?? m.createdAt ?? new Date().toISOString(),
    attachmentUrl: attachUrl,
    attachmentType: attachType,
    attachmentName: attachName,
    replyToId: m.reply_to_id ? String(m.reply_to_id) : undefined,
    replyToText: m.reply_to_text ?? m.reply_message ?? undefined,
    status: senderIsTeacher
      ? undefined
      : m.is_read
        ? "read"
        : m.is_delivered
          ? "delivered"
          : "sent",
  };
};

// ── VideoPlayerModal ─────────────────────────────────────────
function VideoPlayerModal({
  uri,
  onClose,
}: {
  uri: string;
  onClose: () => void;
}) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = false;
  });
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        player.play();
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [player]);
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View
        style={{ flex: 1, backgroundColor: "#000", justifyContent: "center" }}
      >
        <TouchableOpacity onPress={onClose} style={styles.videoClose}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
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

// ── AudioPlayerModal ─────────────────────────────────────────
function AudioPlayerModal({
  uri,
  name,
  onClose,
}: {
  uri: string;
  name: string;
  onClose: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: uri.startsWith("http") ? buildUrl(uri) : uri },
          { shouldPlay: false, volume: 1.0 },
        );
        soundRef.current = sound;
        setIsLoading(false);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setIsPlaying(status.isPlaying);
          setPosition(status.positionMillis ?? 0);
          setDuration(status.durationMillis ?? 0);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            sound.setPositionAsync(0);
          }
        });
      } catch {
        setIsLoading(false);
      }
    };
    load();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, [uri]);

  const togglePlay = async () => {
    if (!soundRef.current) return;
    if (isPlaying) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  };

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? position / duration : 0;
  const bars = [
    4, 8, 14, 10, 6, 12, 16, 8, 5, 11, 9, 14, 7, 10, 6, 12, 8, 14, 5, 10,
  ];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={av.overlay}>
        <View style={av.card}>
          <TouchableOpacity onPress={onClose} style={av.closeBtn}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
          <View style={av.iconWrap}>
            <Ionicons name="mic" size={32} color={PRIMARY} />
          </View>
          <Text style={av.title} numberOfLines={1}>
            {name}
          </Text>
          <Text style={av.subtitle}>Voice Note</Text>
          <View style={av.waveWrap}>
            {bars.map((h, i) => (
              <View
                key={i}
                style={[
                  av.waveBar,
                  {
                    height: h * 2,
                    backgroundColor:
                      i / bars.length <= progress ? PRIMARY : "#E5E7EB",
                  },
                ]}
              />
            ))}
          </View>
          <View style={av.timeRow}>
            <Text style={av.timeText}>{formatMs(position)}</Text>
            <Text style={av.timeText}>{formatMs(duration)}</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={PRIMARY}
              style={{ marginTop: 16 }}
            />
          ) : (
            <TouchableOpacity
              onPress={togglePlay}
              style={av.playBtn}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const av = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
    paddingBottom: 40,
  },
  closeBtn: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
    maxWidth: 260,
    textAlign: "center",
  },
  subtitle: { fontSize: 12, color: "#9CA3AF", marginBottom: 24 },
  waveWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 40,
    marginBottom: 10,
  },
  waveBar: { width: 4, borderRadius: 3 },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  timeText: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ── InAppDocViewer ───────────────────────────────────────────
const dv = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#111",
    gap: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: 12,
  },
  overlayText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%" as any,
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

function InAppDocViewer({
  uri,
  name,
  onClose,
}: {
  uri: string;
  name: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<
    "idle" | "downloading" | "ready" | "error"
  >("idle");
  const [localUri, setLocalUri] = useState("");
  const [base64Data, setBase64] = useState("");
  const [progress, setProgress] = useState(0);
  const [webKey, setWebKey] = useState(0);
  const [blankCount, setBlankCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const ext =
    (name.includes(".") ? name : uri).split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isLocal =
    uri.startsWith("file://") ||
    uri.startsWith("/var/") ||
    uri.startsWith("/data/") ||
    uri.startsWith("/storage/") ||
    uri.startsWith("/user/") ||
    !uri.startsWith("http");

  useEffect(() => {
    if (!uri) return;
    setStatus("idle");
    setLocalUri("");
    setBase64("");
    setProgress(0);
    setWebKey(0);
    setBlankCount(0);
    setErrorMsg("");
    if (isPdf && !isLocal) setStatus("ready");
    else loadFile();
  }, [uri]);

  const loadFile = async () => {
    try {
      setStatus("downloading");
      let fileUri = "";
      if (isLocal) {
        const info = (await FileSystem.getInfoAsync(uri)) as any;
        if (!info.exists) throw new Error("File not found on device");
        if ((info.size ?? 0) === 0) throw new Error("File is empty");
        fileUri = uri;
      } else {
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const baseDir =
          (FileSystem.documentDirectory ?? "") + "schoolaid_cache/";
        const cacheKey = `${baseDir}${safeName}`;
        const dirInfo = await FileSystem.getInfoAsync(baseDir);
        if (!dirInfo.exists)
          await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
        const cached = (await FileSystem.getInfoAsync(cacheKey)) as any;
        if (cached.exists && (cached.size ?? 0) > 100) {
          fileUri = cacheKey;
        } else {
          const fullUrl = uri.startsWith("http")
            ? uri
            : `${BASE_URL}/${uri.replace(/^\/+/, "")}`;
          const task = FileSystem.createDownloadResumable(
            fullUrl,
            cacheKey,
            {},
            (dp: any) => {
              if (dp.totalBytesExpectedToWrite > 0)
                setProgress(
                  dp.totalBytesWritten / dp.totalBytesExpectedToWrite,
                );
            },
          );
          const result = await task.downloadAsync();
          if (!result?.uri)
            throw new Error("Download failed — check your connection");
          const info = (await FileSystem.getInfoAsync(result.uri)) as any;
          if (!info.exists || (info.size ?? 0) === 0)
            throw new Error("Downloaded file is empty");
          fileUri = result.uri;
        }
      }
      setLocalUri(fileUri);
      if (!isImage) {
        const b64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: "base64" as any,
        });
        if (!b64 || b64.length < 10)
          throw new Error("Could not read file content");
        setBase64(b64);
      }
      setStatus("ready");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error");
      setStatus("error");
    }
  };

  const getPdfHtml = () =>
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes"><style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:100%;height:100%;background:#525659;overflow:auto;}#pdf-container{width:100%;padding:8px 0;}canvas{display:block;margin:8px auto;box-shadow:0 2px 8px rgba(0,0,0,0.4);width:100%;max-width:100%;}#loading{color:#fff;text-align:center;padding:40px 20px;font-family:sans-serif;font-size:14px;}#error{color:#ff6b6b;text-align:center;padding:40px 20px;font-family:sans-serif;font-size:14px;}</style></head><body><div id="loading">Loading PDF…</div><div id="pdf-container"></div><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script><script>pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const base64="${base64Data}";const raw=atob(base64);const arr=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);const DPR=window.devicePixelRatio||3;const deviceWidth=window.innerWidth-16;pdfjsLib.getDocument({data:arr}).promise.then(function(pdf){document.getElementById('loading').style.display='none';const container=document.getElementById('pdf-container');for(let i=1;i<=pdf.numPages;i++){pdf.getPage(i).then(function(page){const bv=page.getViewport({scale:1});const bs=deviceWidth/bv.width;const rv=page.getViewport({scale:bs*DPR});const canvas=document.createElement('canvas');canvas.width=rv.width;canvas.height=rv.height;canvas.style.width=deviceWidth+'px';canvas.style.height=(rv.height/DPR)+'px';page.render({canvasContext:canvas.getContext('2d'),viewport:rv}).promise.then(()=>container.appendChild(canvas));});}}).catch(function(err){document.getElementById('loading').style.display='none';document.getElementById('error').innerText='Could not render PDF: '+err.message;});<\/script></body></html>`;

  const getDocHtml = () => {
    const mimeMap: Record<string, string> = {
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
    const mime = mimeMap[ext] ?? "application/octet-stream";
    if (ext === "txt")
      return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:16px;font-family:monospace;font-size:14px;color:#222;white-space:pre-wrap;word-break:break-word;"><script>try{document.body.innerText=decodeURIComponent(escape(atob("${base64Data}")))}catch(e){document.body.innerText="Could not decode file."}<\/script></body></html>`;
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>*{margin:0;padding:0;}html,body{width:100%;height:100%;background:#fff;}iframe{width:100%;height:100%;border:none;display:block;}</style></head><body><iframe src="data:${mime};base64,${base64Data}"></iframe></body></html>`;
  };

  const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri.startsWith("http") ? uri : `${BASE_URL}/${uri.replace(/^\//, "")}`)}&t=${webKey}`;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={dv.header}>
          <TouchableOpacity onPress={onClose} style={dv.closeBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={dv.title} numberOfLines={1}>
            {name}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (isLocal || !isPdf) {
                setBase64("");
                setLocalUri("");
                setErrorMsg("");
                loadFile();
              } else {
                setWebKey((k) => k + 1);
                setBlankCount(0);
                setStatus("ready");
              }
            }}
            style={dv.reloadBtn}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          {status === "downloading" && (
            <View style={dv.overlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={dv.overlayText}>
                {isLocal
                  ? "Opening file…"
                  : progress > 0
                    ? `Downloading… ${Math.round(progress * 100)}%`
                    : "Downloading…"}
              </Text>
              {!isLocal && progress > 0 && (
                <View style={dv.progressBar}>
                  <View
                    style={[
                      dv.progressFill,
                      { width: `${Math.round(progress * 100)}%` as any },
                    ]}
                  />
                </View>
              )}
            </View>
          )}
          {status === "error" && (
            <View style={dv.overlay}>
              <Text style={{ fontSize: 48 }}>⚠️</Text>
              <Text
                style={[dv.overlayText, { marginTop: 12, textAlign: "center" }]}
              >
                Could not open file
              </Text>
              {!!errorMsg && (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    marginTop: 6,
                    textAlign: "center",
                    paddingHorizontal: 32,
                  }}
                >
                  {errorMsg}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => {
                  setErrorMsg("");
                  if (isPdf && !isLocal) {
                    setWebKey((k) => k + 1);
                    setStatus("ready");
                  } else loadFile();
                }}
                style={dv.retryBtn}
              >
                <Text style={dv.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
          {status === "ready" && isImage && (
            <ScrollView
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
              contentContainerStyle={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri: localUri }}
                style={{ width: SCREEN_W, height: 400 }}
                resizeMode="contain"
              />
            </ScrollView>
          )}
          {status === "ready" && isPdf && !isLocal && (
            <WebView
              key={`pdf-remote-${webKey}`}
              source={{ uri: googleDocsUrl }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              scalesPageToFit
              mixedContentMode="always"
              renderLoading={() => (
                <View style={[dv.overlay, { backgroundColor: "#fff" }]}>
                  <ActivityIndicator size="large" color={PRIMARY} />
                  <Text style={[dv.overlayText, { color: "#333" }]}>
                    Loading PDF…
                  </Text>
                  {blankCount > 0 && (
                    <Text
                      style={{ color: "#9CA3AF", fontSize: 11, marginTop: 4 }}
                    >
                      Retrying… (attempt {blankCount + 1})
                    </Text>
                  )}
                </View>
              )}
              injectedJavaScript={`(function(){setTimeout(function(){var b=document.body;if(!b||b.innerHTML.trim()===''||b.innerText.trim()===''){window.ReactNativeWebView.postMessage('BLANK');}},3500);})();true;`}
              onMessage={(e) => {
                if (e.nativeEvent.data === "BLANK" && blankCount < 4) {
                  setBlankCount((c) => c + 1);
                  setWebKey((k) => k + 1);
                }
              }}
              onError={() => setStatus("error")}
            />
          )}
          {status === "ready" && isPdf && isLocal && base64Data.length > 10 && (
            <WebView
              key={`pdf-local-${webKey}`}
              source={{ html: getPdfHtml() }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              allowFileAccess
              allowUniversalAccessFromFileURLs
              mixedContentMode="always"
              scalesPageToFit={false}
              startInLoadingState
              renderLoading={() => (
                <View style={[dv.overlay, { backgroundColor: "#fff" }]}>
                  <ActivityIndicator size="large" color={PRIMARY} />
                  <Text style={[dv.overlayText, { color: "#333" }]}>
                    Opening PDF…
                  </Text>
                </View>
              )}
              onError={() => setStatus("error")}
            />
          )}
          {status === "ready" &&
            !isImage &&
            !isPdf &&
            base64Data.length > 10 && (
              <WebView
                key={`doc-${webKey}`}
                source={{ html: getDocHtml() }}
                style={{ flex: 1 }}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                allowFileAccess
                allowUniversalAccessFromFileURLs
                mixedContentMode="always"
                scalesPageToFit
                startInLoadingState
                renderLoading={() => (
                  <View style={[dv.overlay, { backgroundColor: "#fff" }]}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                    <Text style={[dv.overlayText, { color: "#333" }]}>
                      Rendering…
                    </Text>
                  </View>
                )}
                onError={() => setStatus("error")}
              />
            )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── GlobalSearchModal ────────────────────────────────────────
function GlobalSearchModal({
  results,
  onClose,
  onNavigate,
}: {
  results: SearchResult[];
  onClose: () => void;
  onNavigate: (result: SearchResult) => void;
}) {
  const getIcon = (type: SearchResult["type"]) =>
    type === "media"
      ? "image-outline"
      : type === "file"
        ? "document-outline"
        : type === "voice"
          ? "mic-outline"
          : "chatbubble-outline";
  const getColor = (type: SearchResult["type"]) =>
    type === "media"
      ? "#7C3AED"
      : type === "file"
        ? "#EA580C"
        : type === "voice"
          ? "#0891B2"
          : PRIMARY;
  const getLabel = (type: SearchResult["type"]) =>
    type === "media"
      ? "Photo/Video"
      : type === "file"
        ? "File"
        : type === "voice"
          ? "Voice Note"
          : "Message";
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F4FB" }}>
        <View style={gs.header}>
          <TouchableOpacity onPress={onClose} style={gs.closeBtn}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={gs.title}>Search Results</Text>
          <View style={gs.badge}>
            <Text style={gs.badgeText}>{results.length}</Text>
          </View>
        </View>
        {results.length === 0 ? (
          <View style={gs.empty}>
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text style={gs.emptyTitle}>No results found</Text>
            <Text style={gs.emptySub}>Try different keywords</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 14, gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={gs.row}
                onPress={() => onNavigate(item)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    gs.iconBox,
                    { backgroundColor: getColor(item.type) + "18" },
                  ]}
                >
                  <Ionicons
                    name={getIcon(item.type)}
                    size={20}
                    color={getColor(item.type)}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={gs.topRow}>
                    <View
                      style={[
                        gs.typeBadge,
                        { backgroundColor: getColor(item.type) + "18" },
                      ]}
                    >
                      <Text
                        style={[gs.typeText, { color: getColor(item.type) }]}
                      >
                        {getLabel(item.type)}
                      </Text>
                    </View>
                    <Text style={gs.timeText}>
                      {formatTime(item.message.createdAt)}
                    </Text>
                  </View>
                  <Text style={gs.matchText} numberOfLines={2}>
                    {item.matchText || "Attachment"}
                  </Text>
                  <Text style={gs.fromText}>
                    {item.message.sender === "teacher"
                      ? "From Teacher"
                      : "Sent by you"}{" "}
                    · {formatDate(item.message.createdAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const gs = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: 16, fontWeight: "800", color: "#1F2937" },
  badge: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  emptySub: { fontSize: 13, color: "#9CA3AF" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8EFFA",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  typeBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  typeText: { fontSize: 10, fontWeight: "700" },
  timeText: { fontSize: 10, color: "#9CA3AF" },
  matchText: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
    lineHeight: 18,
  },
  fromText: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
});

// ── StatusTick ───────────────────────────────────────────────
function StatusTick({ status }: { status?: string }) {
  if (!status || status === "sending")
    return (
      <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.5)" />
    );
  if (status === "sent")
    return (
      <Ionicons
        name="checkmark-outline"
        size={11}
        color="rgba(255,255,255,0.7)"
      />
    );
  if (status === "delivered")
    return (
      <Ionicons
        name="checkmark-done-outline"
        size={11}
        color="rgba(255,255,255,0.7)"
      />
    );
  if (status === "read")
    return <Ionicons name="checkmark-done-outline" size={11} color="#60D4F7" />;
  return null;
}

// ── Main Component ───────────────────────────────────────────
export default function MessageScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { childId, childName, classname, sectionname } = useLocalSearchParams<{
    childId: string;
    childName: string;
    classname: string;
    sectionname: string;
  }>();

  // ── State ─────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState("");
  const [threadId, setThreadId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [previewItem, setPreviewItem] = useState<{
    uri: string;
    type: "image";
    name?: string;
  } | null>(null);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [mediaSubTab, setMediaSubTab] = useState<"photos" | "docs">("photos");
  const [filesExpanded, setFilesExpanded] = useState(true);
  const [voiceExpanded, setVoiceExpanded] = useState(true);
  const [savedFiles, setSavedFiles] = useState<DownloadedFile[]>([]);
  const [downloads, setDownloads] = useState<
    Record<string, "downloading" | "done">
  >({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGlobalResults, setShowGlobalResults] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<
    SearchResult[]
  >([]);
  const [refreshingMedia, setRefreshingMedia] = useState(false);
  const [refreshingDownloads, setRefreshingDownloads] = useState(false);
  const [docViewer, setDocViewer] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<{
    uri: string;
    name: string;
  } | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // ── Refs ──────────────────────────────────────────────────
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const contextMsgRef = useRef<Message | null>(null);
  const editingMsgRef = useRef<Message | null>(null);
  const pinnedIdsRef = useRef<string[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    contextMsgRef.current = contextMsg;
  }, [contextMsg]);
  useEffect(() => {
    editingMsgRef.current = editingMsg;
  }, [editingMsg]);
  useEffect(() => {
    pinnedIdsRef.current = pinnedIds;
  }, [pinnedIds]);
  useEffect(
    () => () => {
      soundRef.current?.unloadAsync();
    },
    [],
  );

  const DOWNLOADS_KEY = `savedFiles_${childId}`;

  // ── Storage helpers ───────────────────────────────────────
  const loadPinned = async () => {
    try {
      const raw = await AsyncStorage.getItem(`pinnedMsgs_${childId}`);
      if (raw) setPinnedIds(JSON.parse(raw));
    } catch {}
  };

  const loadSavedFiles = async () => {
    try {
      const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (raw) setSavedFiles(JSON.parse(raw));
    } catch {}
  };

  const persistSavedFile = async (entry: DownloadedFile) => {
    try {
      const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
      const current: DownloadedFile[] = raw ? JSON.parse(raw) : [];
      const updated = [entry, ...current.filter((f) => f.url !== entry.url)];
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
      setSavedFiles(updated);
    } catch {}
  };

  const removeSavedFile = async (key: string) => {
    try {
      const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
      const current: DownloadedFile[] = raw ? JSON.parse(raw) : [];
      const updated = current.filter((f) => f.key !== key);
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
      setSavedFiles(updated);
    } catch {}
  };

  // ── Save thread locally ───────────────────────────────────
  const saveThreadLocally = async (tid: number, previewText: string) => {
    try {
      const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
      const ids: number[] = savedRaw ? JSON.parse(savedRaw) : [];
      if (!ids.includes(tid)) {
        ids.push(tid);
        await AsyncStorage.setItem(
          `allThreadIds_${childId}`,
          JSON.stringify(ids),
        );
      }
      const previewsRaw = await AsyncStorage.getItem(
        `threadPreviews_${childId}`,
      );
      const previews: Record<number, { preview: string; createdAt: string }> =
        previewsRaw ? JSON.parse(previewsRaw) : {};
      if (!previews[tid]) {
        previews[tid] = {
          preview: previewText.slice(0, 60),
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(
          `threadPreviews_${childId}`,
          JSON.stringify(previews),
        );
      }
    } catch {}
  };

  // ── Fetch single thread's messages ────────────────────────
  const fetchThreadMessages = useCallback(async (t: string, tid: number) => {
    setLoading(true);
    try {
      const yearId = (await AsyncStorage.getItem("selectedYearId")) ?? "16";
      const res = await fetch(
        `${BASE_URL}/api/parent-notes/threads/${tid}/messages`,
        {
          headers: {
            Authorization: `Bearer ${t}`,
            "Content-Type": "application/json",
            "x-academic-year-id": yearId,
          },
        },
      );
      if (!res.ok) {
        setMessages([]);
        return;
      }
      const data = await res.json();
      const raw: any[] = data.data ?? data ?? [];
      const mapped = raw
        .sort(
          (a: any, b: any) =>
            new Date(a.created_at ?? a.createdAt).getTime() -
            new Date(b.created_at ?? b.createdAt).getTime(),
        )
        .map(mapRawMessage);
      setMessages(mapped);
    } catch (err) {
      console.error("fetchThreadMessages error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch all threads for this student ────────────────────
  const fetchThreads = useCallback(
    async (t: string): Promise<ThreadItem[]> => {
      try {
        const yearId = (await AsyncStorage.getItem("selectedYearId")) ?? "16";
        let serverThreads: ThreadItem[] = [];
        try {
          const res = await fetch(
            `${BASE_URL}/api/parent-notes/threads?student_id=${childId}`,
            {
              headers: {
                Authorization: `Bearer ${t}`,
                "Content-Type": "application/json",
                "x-academic-year-id": yearId,
              },
            },
          );
          if (res.ok) {
            const data = await res.json();
            const list: any[] = data.data ?? data ?? [];
            serverThreads = list.map((th: any) => ({
              id: Number(th.id ?? th.thread_id),
              preview: th.last_message ?? th.preview ?? "Conversation",
              createdAt:
                th.created_at ?? th.createdAt ?? new Date().toISOString(),
            }));
          }
        } catch {}

        const savedRaw = await AsyncStorage.getItem(`allThreadIds_${childId}`);
        const localIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
        const serverIds = serverThreads.map((th) => th.id);
        const missingIds = localIds.filter((id) => !serverIds.includes(id));
        const previewsRaw = await AsyncStorage.getItem(
          `threadPreviews_${childId}`,
        );
        const savedPreviews: Record<
          number,
          { preview: string; createdAt: string }
        > = previewsRaw ? JSON.parse(previewsRaw) : {};
        const missingThreads: ThreadItem[] = missingIds.map((id) => ({
          id,
          preview: savedPreviews[id]?.preview ?? "Conversation",
          createdAt: savedPreviews[id]?.createdAt ?? new Date().toISOString(),
        }));

        const allThreads = [...serverThreads, ...missingThreads].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        await AsyncStorage.setItem(
          `allThreadIds_${childId}`,
          JSON.stringify(allThreads.map((th) => th.id)),
        );
        setThreads(allThreads);
        return allThreads;
      } catch {
        return [];
      }
    },
    [childId],
  );

  // ── Init on focus ─────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const t = await AsyncStorage.getItem("token");
        if (!t) return;
        setToken(t);
        const allThreads = await fetchThreads(t);
        if (allThreads.length > 0) {
          const latest = allThreads[0];
          setThreadId(latest.id);
          await fetchThreadMessages(t, latest.id);
        } else {
          setThreadId(null);
          setMessages([]);
          setLoading(false);
        }
        await loadPinned();
        await loadSavedFiles();
      };
      init();
    }, [childId]),
  );

  // ── Auto-poll read status ─────────────────────────────────
  useEffect(() => {
    if (!token || !threadId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/parent-notes/threads/${threadId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "x-academic-year-id":
                (await AsyncStorage.getItem("selectedYearId")) ?? "16",
            },
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        const msgs: any[] = data.data ?? data ?? [];
        setMessages((prev) => {
          const hasUnread = prev.some(
            (m) => m.sender === "parent" && m.status !== "read",
          );
          if (!hasUnread) return prev;
          return prev.map((m) => {
            if (m.sender !== "parent" || m.status === "read") return m;
            const sm = msgs.find((x) => String(x.id) === String(m.id));
            if (!sm) return m;
            const newStatus = sm.is_read
              ? "read"
              : sm.is_delivered
                ? "delivered"
                : "sent";
            return newStatus !== m.status ? { ...m, status: newStatus } : m;
          });
        });
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [token, threadId]);

  // ── Search ────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setGlobalSearchResults([]);
      setShowGlobalResults(false);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];
    messages.forEach((m) => {
      const isVoice =
        m.attachmentName?.endsWith(".m4a") ||
        m.attachmentName?.includes("voice_");
      const isVideo = m.attachmentType === "video";
      const isImage = m.attachmentType === "image";
      const isFile = m.attachmentType === "file" && !isVoice;
      const textMatch = m.text?.toLowerCase().includes(q);
      const nameMatch = m.attachmentName?.toLowerCase().includes(q);
      const dateMatch = formatDate(m.createdAt).toLowerCase().includes(q);
      if (textMatch || nameMatch || dateMatch) {
        let type: SearchResult["type"] = "message";
        if (isVoice) type = "voice";
        else if (isVideo || isImage) type = "media";
        else if (isFile) type = "file";
        results.push({
          type,
          message: m,
          matchText: m.text || m.attachmentName || "",
        });
      }
    });
    setGlobalSearchResults(results);
    if (results.length > 0 && activeTab === "chat") {
      const idx = messages.findIndex((m) => m.id === results[0].message.id);
      if (idx !== -1)
        setTimeout(
          () =>
            flatListRef.current?.scrollToIndex({
              index: idx,
              animated: true,
              viewPosition: 0.3,
            }),
          100,
        );
    }
  }, [searchQuery, messages, activeTab]);

  // ── File viewers ──────────────────────────────────────────
  const closeAllViewers = useCallback(() => {
    setDocViewer(null);
    setPreviewVideo(null);
    setAudioPlayer(null);
    setPreviewItem(null);
  }, []);

  const openInApp = useCallback(
    async (uri: string, name: string) => {
      if (!uri) {
        Alert.alert("Error", "No file URL found.");
        return;
      }
      const fullUrl = uri.startsWith("http")
        ? uri
        : `${BASE_URL}/${uri.replace(/^\/+/, "")}`;
      const n = (name ?? "").toLowerCase();
      const urlN = uri.toLowerCase();
      const ext = n.includes(".")
        ? (n.split(".").pop() ?? "")
        : (urlN.split(".").pop() ?? "");
      const isVoice =
        ext === "m4a" || n.includes("voice_") || urlN.includes("voice_");
      const isVideo =
        ext === "mp4" || n.includes("video_") || urlN.includes("video_");
      const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
      const displayName = n.includes(".")
        ? name
        : (fullUrl.split("/").pop() ?? name);
      closeAllViewers();
      await new Promise<void>((resolve) => setTimeout(resolve, 120));
      if (isVideo) {
        setPreviewVideo(fullUrl);
        return;
      }
      if (isVoice) {
        setAudioPlayer({ uri: fullUrl, name: displayName });
        return;
      }
      if (isImage) {
        setPreviewItem({ uri: fullUrl, type: "image", name: displayName });
        return;
      }
      setDocViewer({ uri: fullUrl, name: displayName });
    },
    [closeAllViewers],
  );

  // ── Download ──────────────────────────────────────────────
  const downloadFile = async (
    url: string,
    name: string,
    type: "file" | "video",
  ) => {
    const key = url;
    if (downloads[key] === "downloading") return;
    const fullUrl = url.startsWith("http")
      ? url
      : `${BASE_URL}/${url.replace(/^\//, "")}`;
    setDownloads((prev) => ({ ...prev, [key]: "downloading" }));
    try {
      if (type === "video") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Please allow media library access to save videos.",
          );
          setDownloads((prev) => {
            const n = { ...prev };
            delete n[key];
            return n;
          });
          return;
        }
      }
      const folder = `${FileSystem.documentDirectory}SchoolAid/`;
      await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      const safeFileName = `${Date.now()}_${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const destUri = `${folder}${safeFileName}`;
      const downloadRes = await FileSystem.downloadAsync(fullUrl, destUri, {
        headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
      });
      if (downloadRes.status !== 200)
        throw new Error(`HTTP ${downloadRes.status}`);
      const fileInfo = (await FileSystem.getInfoAsync(downloadRes.uri)) as any;
      if (!fileInfo.exists || (fileInfo.size ?? 0) === 0)
        throw new Error("Downloaded file is empty");
      if (type === "video") {
        const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
        let album = await MediaLibrary.getAlbumAsync("SchoolAid");
        if (!album)
          album = await MediaLibrary.createAlbumAsync(
            "SchoolAid",
            asset,
            false,
          );
        else await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        setDownloads((prev) => ({ ...prev, [key]: "done" }));
        await persistSavedFile({
          key: `${url}_${Date.now()}`,
          url,
          localUri: downloadRes.uri,
          name,
          type: "video",
          savedAt: new Date().toISOString(),
        });
        Alert.alert(
          "Saved!",
          "Video saved to Photos > SchoolAid album.\nAlso visible in the Downloads tab.",
        );
      } else {
        setDownloads((prev) => ({ ...prev, [key]: "done" }));
        await persistSavedFile({
          key: `${url}_${Date.now()}`,
          url,
          localUri: downloadRes.uri,
          name,
          type: "file",
          savedAt: new Date().toISOString(),
          size: fileInfo.size,
        });
        Alert.alert(
          "Downloaded!",
          `"${name}" saved.\nFind it in the Downloads tab.`,
        );
      }
    } catch (err: any) {
      setDownloads((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
      Alert.alert("Download Failed", err?.message ?? "Unknown error");
    }
  };

  const DownloadIcon = ({
    url,
    name,
    type,
    tintColor,
  }: {
    url: string;
    name: string;
    type: "file" | "video";
    tintColor: string;
  }) => {
    const state = downloads[url];
    const alreadySaved = savedFiles.some((f) => f.url === url);
    if (state === "downloading")
      return <ActivityIndicator size="small" color={tintColor} />;
    return (
      <TouchableOpacity
        onPress={() => downloadFile(url, name, type)}
        style={styles.downloadBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={
            state === "done" || alreadySaved
              ? "checkmark-circle"
              : "arrow-down-circle-outline"
          }
          size={22}
          color={state === "done" || alreadySaved ? "#22C55E" : tintColor}
        />
      </TouchableOpacity>
    );
  };

  // ── Refresh ───────────────────────────────────────────────
  const handleRefreshMedia = async () => {
    setRefreshingMedia(true);
    if (threadId) await fetchThreadMessages(token, threadId);
    setRefreshingMedia(false);
  };

  const handleRefreshDownloads = async () => {
    setRefreshingDownloads(true);
    await loadSavedFiles();
    setRefreshingDownloads(false);
  };

  // ── Pickers ───────────────────────────────────────────────
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0)
      setAttachments((prev) => [
        ...prev,
        ...result.assets.map((a) => ({
          uri: a.uri,
          type: "image" as const,
          name: a.fileName ?? "image.jpg",
          mimeType: a.mimeType ?? "image/jpeg",
        })),
      ]);
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!result.canceled && result.assets.length > 0)
      setAttachments((prev) => [
        ...prev,
        ...result.assets.map((a) => ({
          uri: a.uri,
          type: "file" as const,
          name: a.name,
          mimeType: a.mimeType ?? "application/octet-stream",
        })),
      ]);
  };

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

  const showAttachmentOptions = () =>
    Alert.alert("Attach", "Choose attachment type", [
      { text: "Photo", onPress: pickImage },
      { text: "File", onPress: pickFile },
      { text: "Video", onPress: openCamera },
      { text: "Cancel", style: "cancel" },
    ]);
  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  // ── Recording ─────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Please allow microphone access.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
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
    } catch {
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
      const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (!baseDir) throw new Error("No writable directory");
      const fileName = `voice_${Date.now()}.m4a`;
      const permanentUri = `${baseDir}${fileName}`;
      await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
      const fileInfo = (await FileSystem.getInfoAsync(permanentUri)) as any;
      if (!fileInfo.exists || (fileInfo.size ?? 0) === 0)
        throw new Error("Recording file empty");
      setAttachments((prev) => [
        ...prev,
        {
          uri: permanentUri,
          type: "file",
          name: fileName,
          mimeType: "audio/m4a",
        },
      ]);
    } catch {
      Alert.alert("Error", "Could not process recording.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const startVideoRecording = async () => {
    if (!cameraRef.current) return;
    try {
      setIsVideoRecording(true);
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (!video?.uri) throw new Error("No video URI");
      const fileName = `video_${Date.now()}.mp4`;
      const baseDir =
        FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "";
      const permanentUri = `${baseDir}${fileName}`;
      await FileSystem.copyAsync({ from: video.uri, to: permanentUri });
      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (!fileInfo.exists) throw new Error("Video file missing");
      setAttachments((prev) => [
        ...prev,
        {
          uri: permanentUri,
          type: "video",
          name: fileName,
          mimeType: "video/mp4",
        },
      ]);
      setShowCamera(false);
    } catch {
      Alert.alert("Error", "Could not record video.");
    } finally {
      setIsVideoRecording(false);
    }
  };

  const stopVideoRecording = () => cameraRef.current?.stopRecording();

  // ── Context menu ──────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const msg = contextMsgRef.current;
    if (msg?.text) Clipboard.setString(msg.text);
    setContextMsg(null);
  }, []);
  const handleReply = useCallback(() => {
    setReplyTo(contextMsgRef.current);
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
    await AsyncStorage.setItem(
      `pinnedMsgs_${childId}`,
      JSON.stringify(updated),
    );
    setPinnedIds(updated);
    setContextMsg(null);
  }, [childId]);
  const handleDelete = useCallback(async () => {
    const msg = contextMsgRef.current;
    if (!msg) return;
    setContextMsg(null);
    Alert.alert("Delete Message", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `${BASE_URL}/api/parent-notes/messages/${msg.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                  "x-academic-year-id":
                    (await AsyncStorage.getItem("selectedYearId")) ?? "16",
                },
              },
            );
            if (res.ok) {
              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
              setPinnedIds((prev) => {
                const updated = prev.filter((id) => id !== msg.id);
                AsyncStorage.setItem(
                  `pinnedMsgs_${childId}`,
                  JSON.stringify(updated),
                );
                return updated;
              });
            } else Alert.alert("Error", "Could not delete message.");
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
  const cancelReply = useCallback(() => setReplyTo(null), []);

  const scrollToMessage = useCallback((msgId: string) => {
    setMessages((current) => {
      const idx = current.findIndex((m) => m.id === msgId);
      if (idx !== -1)
        flatListRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.3,
        });
      return current;
    });
  }, []);

  // ── New chat ──────────────────────────────────────────────
  const startNewChat = () => {
    setThreadId(null);
    setMessages([]);
    setReplyTo(null);
    setEditingMsg(null);
    setInputText("");
    setAttachments([]);
    setActiveTab("chat");
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // ── Send message ──────────────────────────────────────────
  const sendMessage = async () => {
    if (!inputText.trim() && attachments.length === 0) return;
    setSending(true);
    const latestText = inputText.trim();
    const currentEditing = editingMsg;

    // Edit path
    if (currentEditing) {
      setEditingMsg(null);
      setInputText("");
      try {
        const res = await fetch(
          `${BASE_URL}/api/parent-notes/messages/${currentEditing.id}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "x-academic-year-id":
                (await AsyncStorage.getItem("selectedYearId")) ?? "16",
            },
            body: JSON.stringify({ message: encodeURIComponent(latestText) }),
          },
        );
        if (res.ok)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === currentEditing.id ? { ...m, text: latestText } : m,
            ),
          );
        else Alert.alert("Error", "Could not edit message.");
      } catch {
        Alert.alert("Error", "Could not edit message.");
      } finally {
        setSending(false);
      }
      return;
    }

    const sentText = inputText.trim();
    const sentFiles = [...attachments];
    const sentReplyTo = replyTo;
    setInputText("");
    setAttachments([]);
    setReplyTo(null);
    setShowEmojiPicker(false);

    const tempMsg: Message = {
      id: String(Date.now()),
      text: sentText,
      sender: "parent",
      createdAt: new Date().toISOString(),
      attachmentUrl: sentFiles[0]?.uri,
      attachmentType: sentFiles[0]?.type,
      attachmentName: sentFiles[0]?.name,
      replyToId: sentReplyTo?.id,
      replyToText: sentReplyTo?.text || sentReplyTo?.attachmentName,
      status: "sending",
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const yearId = (await AsyncStorage.getItem("selectedYearId")) ?? "16";
      let finalThreadId = threadId;

      if (sentFiles.length > 0) {
        for (let i = 0; i < sentFiles.length; i++) {
          const f = sentFiles[i];
          const formData = new FormData();
          if (threadId) formData.append("thread_id", String(threadId));
          else formData.append("student_id", String(Number(childId)));
          if (i === 0 && sentText)
            formData.append("message", encodeURIComponent(sentText));
          if (i === 0 && sentReplyTo)
            formData.append("reply_to_id", sentReplyTo.id);
          formData.append("attachment", {
            uri: f.uri,
            type: f.mimeType,
            name: f.name,
          } as any);
          const url = threadId
            ? `${BASE_URL}/api/parent-notes/messages`
            : `${BASE_URL}/api/parent-notes/threads`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "x-academic-year-id": yearId,
            },
            body: formData,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = JSON.parse(await res.text());
          const returned = data.thread_id ?? data.data?.thread_id;
          if (returned) {
            finalThreadId = returned;
            setThreadId(returned);
            await saveThreadLocally(returned, sentText);
          }
        }
      } else {
        let res: Response;
        if (threadId) {
          res = await fetch(`${BASE_URL}/api/parent-notes/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "x-academic-year-id": yearId,
            },
            body: JSON.stringify({
              thread_id: threadId,
              message: encodeURIComponent(sentText),
              ...(sentReplyTo ? { reply_to_id: sentReplyTo.id } : {}),
            }),
          });
        } else {
          res = await fetch(`${BASE_URL}/api/parent-notes/threads`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "x-academic-year-id": yearId,
            },
            body: JSON.stringify({
              student_id: Number(childId),
              message: encodeURIComponent(sentText),
              ...(sentReplyTo ? { reply_to_id: sentReplyTo.id } : {}),
            }),
          });
        }
        if (!res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
          throw new Error(`HTTP ${res.status}`);
        }
        const data = JSON.parse(await res.text());
        const returned = data.thread_id ?? data.data?.thread_id;
        if (returned) {
          finalThreadId = returned;
          setThreadId(returned);
          await saveThreadLocally(returned, sentText);
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...m, status: "sent" } : m)),
      );
      if (finalThreadId) await fetchThreadMessages(token, finalThreadId);
      await fetchThreads(token);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      Alert.alert("Error", "Could not send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────
  const getInitials = (name: string) => {
    const parts = (name ?? "").trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (name ?? "U").substring(0, 2).toUpperCase();
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => {
        const q = searchQuery.toLowerCase();
        return (
          m.text?.toLowerCase().includes(q) ||
          m.attachmentName?.toLowerCase().includes(q) ||
          formatDate(m.createdAt).toLowerCase().includes(q)
        );
      })
    : messages;

  const groupedMessages = () => {
    const result: (Message | { type: "date"; label: string; id: string })[] =
      [];
    let lastDate = "";
    filteredMessages.forEach((m) => {
      const dateLabel = formatDate(m.createdAt);
      if (dateLabel !== lastDate) {
        result.push({
          type: "date",
          label: dateLabel,
          id: `date_${dateLabel}`,
        });
        lastDate = dateLabel;
      }
      result.push(m);
    });
    return result;
  };

  const mediaMessages = messages.filter(
    (m) =>
      m.attachmentUrl &&
      (m.attachmentType === "image" || m.attachmentType === "video"),
  );
  const fileMessages = messages.filter(
    (m) =>
      m.attachmentUrl &&
      m.attachmentType === "file" &&
      !m.attachmentName?.includes("voice_") &&
      !m.attachmentName?.endsWith(".m4a"),
  );
  const voiceMessages = messages.filter(
    (m) =>
      m.attachmentName?.endsWith(".m4a") ||
      m.attachmentName?.includes("voice_") ||
      m.attachmentUrl?.endsWith(".m4a") ||
      m.attachmentUrl?.includes("voice_"),
  );
  const pinnedMessages = messages.filter((m) => pinnedIds.includes(m.id));

  // ── Render message ────────────────────────────────────────
  const renderMessage = ({ item }: { item: any }) => {
    if (item.type === "date")
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateLabel}>{item.label}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    const msg: Message = item;
    const isParent = msg.sender === "parent";
    const isPinned = pinnedIds.includes(msg.id);
    const isVoice =
      msg.attachmentName?.endsWith(".m4a") ||
      msg.attachmentName?.includes("voice_") ||
      msg.attachmentUrl?.endsWith(".m4a") ||
      msg.attachmentUrl?.includes("voice_");
    const isVideo =
      msg.attachmentType === "video" ||
      msg.attachmentName?.endsWith(".mp4") ||
      msg.attachmentName?.includes("video_");
    const dlTint = isParent ? "rgba(255,255,255,0.85)" : PRIMARY;
    return (
      <Pressable onLongPress={() => setContextMsg(msg)} delayLongPress={350}>
        <View style={[styles.msgRow, isParent && styles.msgRowRight]}>
          {!isParent && (
            <View style={styles.teacherAvatar}>
              <Ionicons name="person" size={14} color={PRIMARY} />
            </View>
          )}
          <View style={{ maxWidth: "78%" }}>
            {isPinned && (
              <View
                style={[styles.pinRow, isParent && { alignSelf: "flex-end" }]}
              >
                <Ionicons name="pin" size={10} color="#F59E0B" />
                <Text style={styles.pinText}>Pinned</Text>
              </View>
            )}
            {!isParent && <Text style={styles.teacherLabel}>Teacher</Text>}
            <View
              style={[
                styles.bubble,
                isParent ? styles.bubbleRight : styles.bubbleLeft,
                isPinned && styles.bubblePinned,
              ]}
            >
              {msg.replyToId && msg.replyToText && (
                <TouchableOpacity
                  onPress={() => scrollToMessage(msg.replyToId!)}
                  style={[
                    styles.replyRef,
                    isParent ? styles.replyRefRight : styles.replyRefLeft,
                  ]}
                >
                  <View style={styles.replyRefBar} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.replyRefLabel,
                        isParent && { color: "rgba(255,255,255,0.7)" },
                      ]}
                    >
                      Reply
                    </Text>
                    <Text
                      style={[
                        styles.replyRefText,
                        isParent && { color: "rgba(255,255,255,0.9)" },
                      ]}
                      numberOfLines={1}
                    >
                      {msg.replyToText}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              {!!msg.text && (
                <Text
                  selectable
                  style={[styles.msgText, isParent && { color: "#fff" }]}
                >
                  {msg.text}
                </Text>
              )}
              {msg.attachmentType === "image" && msg.attachmentUrl && (
                <TouchableOpacity
                  onPress={() =>
                    openInApp(
                      msg.attachmentUrl!,
                      msg.attachmentName ?? "image.jpg",
                    )
                  }
                >
                  <Image
                    source={{ uri: buildUrl(msg.attachmentUrl) }}
                    style={styles.attachedImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              {isVideo && msg.attachmentUrl && (
                <View
                  style={[styles.mediaChip, isParent && styles.mediaChipRight]}
                >
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                    }}
                    onPress={() =>
                      openInApp(
                        msg.attachmentUrl!,
                        msg.attachmentName ?? "video.mp4",
                      )
                    }
                  >
                    <View style={styles.videoThumb}>
                      <Ionicons name="play-circle" size={32} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.mediaChipText,
                          isParent && { color: "#fff" },
                        ]}
                      >
                        Video
                      </Text>
                      <Text
                        style={[
                          styles.mediaChipSub,
                          isParent && { color: "rgba(255,255,255,0.6)" },
                        ]}
                      >
                        Tap to play
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <DownloadIcon
                    url={msg.attachmentUrl}
                    name={msg.attachmentName ?? `video_${msg.id}.mp4`}
                    type="video"
                    tintColor={dlTint}
                  />
                </View>
              )}
              {isVoice && !isVideo && msg.attachmentUrl && (
                <TouchableOpacity
                  style={[styles.voiceChip, isParent && styles.voiceChipRight]}
                  onPress={() =>
                    openInApp(
                      msg.attachmentUrl!,
                      msg.attachmentName ?? "voice.m4a",
                    )
                  }
                >
                  <Ionicons
                    name="play-circle"
                    size={30}
                    color={isParent ? "#fff" : PRIMARY}
                  />
                  <View style={styles.waveform}>
                    {[4, 8, 12, 6, 10, 14, 8, 5, 11, 7].map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveBar,
                          {
                            height: h,
                            backgroundColor: isParent
                              ? "rgba(255,255,255,0.7)"
                              : `${PRIMARY}80`,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.voiceLabel,
                      isParent && { color: "rgba(255,255,255,0.8)" },
                    ]}
                  >
                    Voice note
                  </Text>
                </TouchableOpacity>
              )}
              {msg.attachmentType === "file" &&
                !isVoice &&
                !isVideo &&
                msg.attachmentUrl && (
                  <View
                    style={[styles.fileChip, isParent && styles.fileChipRight]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      <View
                        style={[
                          styles.fileIconBox,
                          {
                            backgroundColor: isParent
                              ? "rgba(255,255,255,0.2)"
                              : "#EEF3FF",
                          },
                        ]}
                      >
                        <Ionicons
                          name="document-outline"
                          size={20}
                          color={isParent ? "#fff" : PRIMARY}
                        />
                      </View>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() =>
                          openInApp(
                            msg.attachmentUrl!,
                            msg.attachmentName ?? "file",
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.fileName,
                            isParent && { color: "#fff" },
                          ]}
                          numberOfLines={1}
                        >
                          {msg.attachmentName ?? "File"}
                        </Text>
                        <Text
                          style={[
                            styles.fileSub,
                            isParent && { color: "rgba(255,255,255,0.6)" },
                          ]}
                        >
                          {downloads[msg.attachmentUrl] === "downloading"
                            ? "Downloading..."
                            : downloads[msg.attachmentUrl] === "done"
                              ? "✓ Saved offline"
                              : "Tap to open"}
                        </Text>
                      </TouchableOpacity>
                      <DownloadIcon
                        url={msg.attachmentUrl}
                        name={msg.attachmentName ?? `file_${msg.id}`}
                        type="file"
                        tintColor={dlTint}
                      />
                    </View>
                  </View>
                )}
              <View
                style={[
                  styles.timeRow,
                  isParent && { justifyContent: "flex-end" },
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    isParent && { color: "rgba(255,255,255,0.6)" },
                  ]}
                >
                  {formatTime(msg.createdAt)}
                </Text>
                {isParent && <StatusTick status={msg.status} />}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  // ── Media tab ─────────────────────────────────────────────
  const renderMediaGallery = () => (
    <View style={{ flex: 1, backgroundColor: "#F0F4FB" }}>
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[
            styles.subTab,
            mediaSubTab === "photos" && styles.subTabActive,
          ]}
          onPress={() => setMediaSubTab("photos")}
        >
          <Ionicons
            name="images-outline"
            size={14}
            color={mediaSubTab === "photos" ? "#fff" : "#6B7280"}
          />
          <Text
            style={[
              styles.subTabText,
              mediaSubTab === "photos" && styles.subTabTextActive,
            ]}
          >
            Photos & Videos
            {mediaMessages.length > 0 ? ` (${mediaMessages.length})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, mediaSubTab === "docs" && styles.subTabActive]}
          onPress={() => setMediaSubTab("docs")}
        >
          <Ionicons
            name="document-outline"
            size={14}
            color={mediaSubTab === "docs" ? "#fff" : "#6B7280"}
          />
          <Text
            style={[
              styles.subTabText,
              mediaSubTab === "docs" && styles.subTabTextActive,
            ]}
          >
            Files & Voice
            {fileMessages.length + voiceMessages.length > 0
              ? ` (${fileMessages.length + voiceMessages.length})`
              : ""}
          </Text>
        </TouchableOpacity>
      </View>
      {mediaSubTab === "photos" && (
        <ScrollView
          contentContainerStyle={styles.paneScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshingMedia}
              onRefresh={handleRefreshMedia}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        >
          {mediaMessages.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="images-outline" size={36} color={PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>No photos or videos yet</Text>
              <Text style={styles.emptySub}>
                Media shared in this chat will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {mediaMessages.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.thumb}
                  activeOpacity={0.85}
                  onPress={() =>
                    openInApp(
                      buildUrl(m.attachmentUrl!),
                      m.attachmentName ??
                        (m.attachmentType === "video"
                          ? "video.mp4"
                          : "image.jpg"),
                    )
                  }
                >
                  <Image
                    source={{ uri: buildUrl(m.attachmentUrl!) }}
                    style={styles.thumbImg}
                    resizeMode="cover"
                  />
                  {m.attachmentType === "video" && (
                    <View style={styles.playOverlay}>
                      <Ionicons name="play-circle" size={30} color="#fff" />
                    </View>
                  )}
                  {m.attachmentType === "video" && m.attachmentUrl && (
                    <TouchableOpacity
                      style={styles.thumbDlBtn}
                      onPress={() =>
                        downloadFile(
                          m.attachmentUrl!,
                          m.attachmentName ?? `video_${m.id}.mp4`,
                          "video",
                        )
                      }
                    >
                      {downloads[m.attachmentUrl] === "downloading" ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons
                          name={
                            downloads[m.attachmentUrl] === "done"
                              ? "checkmark-circle"
                              : "arrow-down-circle"
                          }
                          size={18}
                          color={
                            downloads[m.attachmentUrl] === "done"
                              ? "#22C55E"
                              : "#fff"
                          }
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  <Text style={styles.thumbTime}>
                    {formatTime(m.createdAt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
      {mediaSubTab === "docs" && (
        <ScrollView
          contentContainerStyle={styles.paneScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshingMedia}
              onRefresh={handleRefreshMedia}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        >
          {fileMessages.length === 0 && voiceMessages.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="document-outline" size={36} color={PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>No files or voice notes yet</Text>
              <Text style={styles.emptySub}>
                Documents and voice messages will appear here.
              </Text>
            </View>
          ) : (
            <>
              {fileMessages.length > 0 && (
                <View style={styles.section}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setFilesExpanded((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <View
                        style={[
                          styles.sectionDot,
                          { backgroundColor: PRIMARY },
                        ]}
                      />
                      <Text style={styles.sectionTitle}>Files</Text>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>
                          {fileMessages.length}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={filesExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                  {filesExpanded &&
                    fileMessages.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.fileRow}
                        activeOpacity={0.75}
                        onPress={() =>
                          openInApp(
                            buildUrl(m.attachmentUrl!),
                            m.attachmentName ?? "file",
                          )
                        }
                      >
                        <View
                          style={[
                            styles.fileIconBox,
                            { backgroundColor: "#EEF3FF" },
                          ]}
                        >
                          <Ionicons
                            name="document-outline"
                            size={20}
                            color={PRIMARY}
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.fileName} numberOfLines={1}>
                            {m.attachmentName ?? "File"}
                          </Text>
                          <Text style={styles.fileMeta}>
                            {m.sender === "teacher"
                              ? "From Teacher"
                              : "Sent by you"}{" "}
                            · {formatTime(m.createdAt)}
                          </Text>
                        </View>
                        <DownloadIcon
                          url={m.attachmentUrl!}
                          name={m.attachmentName ?? `file_${m.id}`}
                          type="file"
                          tintColor={PRIMARY}
                        />
                      </TouchableOpacity>
                    ))}
                </View>
              )}
              {voiceMessages.length > 0 && (
                <View style={styles.section}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setVoiceExpanded((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <View
                        style={[
                          styles.sectionDot,
                          { backgroundColor: "#7C3AED" },
                        ]}
                      />
                      <Text style={styles.sectionTitle}>Voice Notes</Text>
                      <View
                        style={[
                          styles.sectionBadge,
                          { backgroundColor: "#EDE9FE" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectionBadgeText,
                            { color: "#7C3AED" },
                          ]}
                        >
                          {voiceMessages.length}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={voiceExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                  {voiceExpanded &&
                    voiceMessages.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.fileRow}
                        activeOpacity={0.75}
                        onPress={() =>
                          openInApp(
                            buildUrl(m.attachmentUrl!),
                            m.attachmentName ?? "voice.m4a",
                          )
                        }
                      >
                        <View
                          style={[
                            styles.fileIconBox,
                            { backgroundColor: "#F5F3FF" },
                          ]}
                        >
                          <Ionicons name="mic" size={20} color="#7C3AED" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fileName}>Voice note</Text>
                          <Text style={styles.fileMeta}>
                            {m.sender === "teacher"
                              ? "From Teacher"
                              : "Sent by you"}{" "}
                            · {formatTime(m.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.playBtn}>
                          <Ionicons name="play" size={14} color="#7C3AED" />
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );

  // ── Downloads tab ─────────────────────────────────────────
  const renderDownloads = () => {
    const formatSize = (bytes?: number) => {
      if (!bytes) return "";
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1048576).toFixed(1)} MB`;
    };
    const formatSavedDate = (iso: string) => {
      const d = new Date(iso);
      return (
        d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        " · " +
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      );
    };
    const openDownloadedFile = async (file: DownloadedFile) => {
      try {
        const info = (await FileSystem.getInfoAsync(file.localUri)) as any;
        if (!info.exists) {
          Alert.alert(
            "File not found",
            "This file was cleared from device storage.",
            [
              {
                text: "Remove from list",
                onPress: () => removeSavedFile(file.key),
                style: "destructive",
              },
              { text: "OK", style: "cancel" },
            ],
          );
          return;
        }
        if ((info.size ?? 0) === 0) {
          Alert.alert(
            "Error",
            "File appears to be empty. Try downloading again.",
          );
          return;
        }
        const n = (file.name ?? "").toLowerCase();
        const ext = n.split(".").pop() ?? "";
        const isImageFile = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
        const isVideoFile =
          ext === "mp4" || file.type === "video" || n.includes("video_");
        const isVoiceFile = ext === "m4a" || n.includes("voice_");
        closeAllViewers();
        await new Promise<void>((resolve) => setTimeout(resolve, 120));
        if (isVideoFile) {
          setPreviewVideo(file.localUri);
          return;
        }
        if (isVoiceFile) {
          setAudioPlayer({ uri: file.localUri, name: file.name });
          return;
        }
        if (isImageFile) {
          setPreviewItem({
            uri: file.localUri,
            type: "image",
            name: file.name,
          });
          return;
        }
        setDocViewer({ uri: file.localUri, name: file.name });
      } catch (err: any) {
        Alert.alert(
          "Error",
          `Could not open file: ${err?.message ?? "unknown error"}`,
        );
      }
    };
    const deleteFile = (file: DownloadedFile) =>
      Alert.alert("Remove Download", `Remove "${file.name}" from Downloads?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const info = await FileSystem.getInfoAsync(file.localUri);
              if (info.exists)
                await FileSystem.deleteAsync(file.localUri, {
                  idempotent: true,
                });
            } catch {}
            await removeSavedFile(file.key);
          },
        },
      ]);
    const refreshControl = (
      <RefreshControl
        refreshing={refreshingDownloads}
        onRefresh={handleRefreshDownloads}
        colors={[PRIMARY]}
        tintColor={PRIMARY}
      />
    );
    if (savedFiles.length === 0)
      return (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={refreshControl}
        >
          <View style={[styles.emptyGallery, { marginTop: 60 }]}>
            <View style={styles.dlEmptyIconWrap}>
              <Ionicons
                name="cloud-download-outline"
                size={40}
                color={PRIMARY}
              />
            </View>
            <Text style={styles.emptyGalleryTitle}>No downloads yet</Text>
            <Text style={styles.emptyGalleryText}>
              Files and videos you download from chat will appear here for
              offline access.
            </Text>
          </View>
        </ScrollView>
      );
    return (
      <ScrollView
        contentContainerStyle={[styles.galleryScroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <View style={styles.dlHeader}>
          <View style={styles.dlHeaderLeft}>
            <Ionicons name="cloud-download" size={18} color={PRIMARY} />
            <Text style={styles.dlHeaderTitle}>
              {savedFiles.length} downloaded item
              {savedFiles.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={styles.dlHeaderSub}>Tap to open · Pull to refresh</Text>
        </View>
        {savedFiles.map((file) => (
          <View key={file.key} style={styles.dlRow}>
            <View
              style={[
                styles.dlIconBox,
                {
                  backgroundColor:
                    file.type === "video" ? "#1F2937" : "#EEF3FF",
                },
              ]}
            >
              <Ionicons
                name={file.type === "video" ? "videocam" : "document-outline"}
                size={22}
                color={file.type === "video" ? "#fff" : PRIMARY}
              />
            </View>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => openDownloadedFile(file)}
            >
              <Text style={styles.dlName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.dlMeta}>
                {file.type === "video" ? "Video" : "Document"}
                {file.size ? `  ·  ${formatSize(file.size)}` : ""}
                {"  ·  "}
                {formatSavedDate(file.savedAt)}
              </Text>
              <View style={styles.dlOfflineBadge}>
                <Ionicons name="checkmark-circle" size={11} color="#16A34A" />
                <Text style={styles.dlOfflineText}>Available offline</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.dlActions}>
              <TouchableOpacity
                onPress={() => deleteFile(file)}
                style={styles.dlActionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={19} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  // ── JSX ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {getInitials(childName ?? "")}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{childName}</Text>
            <Text style={styles.headerSub}>
              {classname}
              {sectionname ? ` · ${sectionname}` : ""}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* History */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowHistory(true)}
          >
            <Ionicons name="time-outline" size={20} color="#fff" />
          </TouchableOpacity>
          {/* New chat */}
          <TouchableOpacity style={styles.headerBtn} onPress={startNewChat}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
          </TouchableOpacity>
          {/* Search */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              setShowSearch((v) => !v);
              setSearchQuery("");
              setShowGlobalResults(false);
            }}
          >
            <Ionicons
              name={showSearch ? "close-outline" : "search-outline"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
          {/* Media toggle */}
          {/* <TouchableOpacity
            style={styles.headerBtn}
            onPress={() =>
              setActiveTab((t) => (t === "chat" ? "media" : "chat"))
            }
          >
            <Ionicons
              name={
                activeTab === "chat" ? "images-outline" : "chatbubbles-outline"
              }
              size={20}
              color="#fff"
            />
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["chat", "media", "downloads"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={
                tab === "chat"
                  ? "chatbubbles-outline"
                  : tab === "media"
                    ? "images-outline"
                    : "cloud-download-outline"
              }
              size={15}
              color={activeTab === tab ? PRIMARY : "#9CA3AF"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "chat"
                ? "Chat"
                : tab === "media"
                  ? `Media${mediaMessages.length + fileMessages.length + voiceMessages.length > 0 ? ` (${mediaMessages.length + fileMessages.length + voiceMessages.length})` : ""}`
                  : `Downloads${savedFiles.length > 0 ? ` (${savedFiles.length})` : ""}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages, files, media..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (!text.trim()) setShowGlobalResults(false);
            }}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setShowGlobalResults(false);
                }}
              >
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.searchResultsBtn}
                onPress={() => {
                  if (globalSearchResults.length > 0)
                    setShowGlobalResults(true);
                }}
              >
                <Text style={styles.searchCount}>
                  {filteredMessages.length} in chat
                </Text>
                <Ionicons name="chevron-forward" size={12} color={PRIMARY} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Pinned banner */}
      {pinnedMessages.length > 0 && activeTab === "chat" && (
        <View style={styles.pinnedBanner}>
          <Ionicons name="pin" size={12} color="#92400E" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1, marginLeft: 8 }}
          >
            {pinnedMessages.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.pinnedChip}
                onPress={() => scrollToMessage(m.id)}
              >
                <Text style={styles.pinnedChipText} numberOfLines={1}>
                  {m.text ||
                    (m.attachmentName?.includes("voice_")
                      ? "Voice note"
                      : "Attachment")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tab content */}
      {activeTab === "media" ? (
        renderMediaGallery()
      ) : activeTab === "downloads" ? (
        renderDownloads()
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={groupedMessages()}
              keyExtractor={(item) => (item as any).id}
              renderItem={renderMessage}
              removeClippedSubviews
              contentContainerStyle={styles.list}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              onScrollToIndexFailed={(info) =>
                setTimeout(
                  () =>
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                    }),
                  300,
                )
              }
              onTouchStart={() => {
                if (showEmojiPicker) setShowEmojiPicker(false);
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={40}
                      color={PRIMARY}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {threadId === null ? "New conversation" : "No messages yet"}
                  </Text>
                  <Text style={styles.emptySub}>
                    {threadId === null
                      ? "Send your first message to the teacher"
                      : "Send a note to the teacher below"}
                  </Text>
                </View>
              }
            />
          )}

          {/* New chat banner */}
          {threadId === null && messages.length === 0 && (
            <View style={styles.newChatBanner}>
              <Ionicons name="chatbubble-outline" size={14} color={PRIMARY} />
              <Text style={styles.newChatBannerText}>
                New conversation — your message will start a fresh chat
              </Text>
            </View>
          )}

          {replyTo && (
            <View style={styles.replyBanner}>
              <View style={styles.replyBannerBar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.replyBannerLabel}>
                  Replying to{" "}
                  {replyTo.sender === "teacher" ? "Teacher" : "yourself"}
                </Text>
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  {replyTo.text || replyTo.attachmentName || "Attachment"}
                </Text>
              </View>
              <TouchableOpacity onPress={cancelReply} style={styles.replyClose}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          {editingMsg && (
            <View style={[styles.replyBanner, styles.editBanner]}>
              <View
                style={[styles.replyBannerBar, { backgroundColor: "#F59E0B" }]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.replyBannerLabel, { color: "#B45309" }]}>
                  Editing message
                </Text>
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  {editingMsg.text}
                </Text>
              </View>
              <TouchableOpacity onPress={cancelEdit} style={styles.replyClose}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          {attachments.length > 0 && (
            <View style={styles.attachStrip}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, padding: 8 }}
              >
                {attachments.map((att, idx) => (
                  <View key={idx} style={styles.attachThumb}>
                    {att.type === "image" ? (
                      <Image
                        source={{ uri: att.uri }}
                        style={styles.attachThumbImg}
                      />
                    ) : (
                      <View style={styles.attachThumbFile}>
                        <Ionicons
                          name={
                            att.mimeType === "audio/m4a"
                              ? "mic"
                              : att.mimeType === "video/mp4"
                                ? "videocam"
                                : "document-outline"
                          }
                          size={22}
                          color={PRIMARY}
                        />
                        <Text style={styles.attachThumbName} numberOfLines={1}>
                          {att.mimeType === "audio/m4a"
                            ? "Voice"
                            : att.mimeType === "video/mp4"
                              ? "Video"
                              : att.name.split(".")[0]}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => removeAttachment(idx)}
                      style={styles.attachRemove}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {showEmojiPicker && (
            <View style={styles.emojiPanel}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiScrollContent}
              >
                {EMOJI_LIST.map((emoji, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.emojiBtn}
                    onPress={() => setInputText((p) => p + emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputBar}>
            <TouchableOpacity
              onPress={showAttachmentOptions}
              style={styles.attachBtn}
            >
              <Ionicons name="add-circle-outline" size={26} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowEmojiPicker((v) => !v);
                if (!showEmojiPicker) inputRef.current?.blur();
              }}
              style={styles.attachBtn}
            >
              <Text style={styles.emojiToggleIcon}>
                {showEmojiPicker ? "⌨️" : "☻"}
              </Text>
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                editingMsg
                  ? "Edit message..."
                  : replyTo
                    ? "Write a reply..."
                    : threadId === null
                      ? "Start a new conversation..."
                      : "Type a message..."
              }
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              onFocus={() => setShowEmojiPicker(false)}
            />
            {!inputText.trim() && attachments.length === 0 && !editingMsg && (
              <TouchableOpacity
                style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name={isRecording ? "stop" : "mic"}
                    size={20}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
            )}
            {(!!inputText.trim() || attachments.length > 0 || editingMsg) && (
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: editingMsg ? "#F59E0B" : PRIMARY },
                  sending && { opacity: 0.5 },
                ]}
                onPress={sendMessage}
                disabled={sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name={editingMsg ? "checkmark" : "send"}
                    size={18}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>

          {isRecording && (
            <View style={styles.recordingBar}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>
                Recording... tap stop to finish
              </Text>
              <TouchableOpacity
                onPress={stopRecording}
                style={styles.recordingStop}
              >
                <Ionicons name="stop-circle" size={22} color="#991B1B" />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      {/* Camera modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => {
          if (isVideoRecording) stopVideoRecording();
          setShowCamera(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={cameraFacing}
            mode="video"
          />
          <View style={styles.cameraTopBar}>
            <TouchableOpacity
              onPress={() => {
                if (isVideoRecording) stopVideoRecording();
                setShowCamera(false);
              }}
              style={styles.cameraBtn}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setCameraFacing((f) => (f === "back" ? "front" : "back"))
              }
              style={styles.cameraBtn}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.cameraBottomBar}>
            {isVideoRecording && (
              <Text style={styles.recordingLabel}>Recording...</Text>
            )}
            <TouchableOpacity
              onPress={
                isVideoRecording ? stopVideoRecording : startVideoRecording
              }
              style={[
                styles.cameraRecord,
                {
                  backgroundColor: isVideoRecording ? "#EF4444" : "#fff",
                  borderColor: isVideoRecording ? "#fff" : "#EF4444",
                },
              ]}
            >
              <Ionicons
                name={isVideoRecording ? "stop" : "videocam"}
                size={30}
                color={isVideoRecording ? "#fff" : "#EF4444"}
              />
            </TouchableOpacity>
            <Text style={styles.cameraHint}>
              {isVideoRecording ? "Tap to stop" : "Tap to record video"}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Viewers */}
      {previewVideo && (
        <VideoPlayerModal
          uri={previewVideo}
          onClose={() => setPreviewVideo(null)}
        />
      )}
      {audioPlayer && (
        <AudioPlayerModal
          key={audioPlayer.uri}
          uri={audioPlayer.uri}
          name={audioPlayer.name}
          onClose={() => setAudioPlayer(null)}
        />
      )}
      {docViewer && (
        <InAppDocViewer
          key={docViewer.uri}
          uri={docViewer.uri}
          name={docViewer.name}
          onClose={() => setDocViewer(null)}
        />
      )}
      {previewItem?.type === "image" && (
        <Modal
          visible
          animationType="slide"
          transparent
          onRequestClose={() => setPreviewItem(null)}
        >
          <View style={styles.previewModal}>
            <TouchableOpacity
              style={styles.previewClose}
              onPress={() => setPreviewItem(null)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: previewItem.uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}

      {/* Context menu */}
      <Modal
        visible={!!contextMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setContextMsg(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setContextMsg(null)}
        >
          <View style={styles.contextMenu}>
            <Text style={styles.contextPreview} numberOfLines={2}>
              {contextMsg?.text || "Attachment"}
            </Text>
            <TouchableOpacity style={styles.contextItem} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={18} color="#374151" />
              <Text style={styles.contextItemText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contextItem} onPress={handleReply}>
              <Ionicons name="arrow-undo-outline" size={18} color="#374151" />
              <Text style={styles.contextItemText}>Reply</Text>
            </TouchableOpacity>
            {contextMsg?.sender === "parent" && (
              <TouchableOpacity style={styles.contextItem} onPress={handleEdit}>
                <Ionicons name="pencil-outline" size={18} color="#374151" />
                <Text style={styles.contextItemText}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.contextItem} onPress={handlePin}>
              <Ionicons
                name={
                  pinnedIds.includes(contextMsg?.id ?? "")
                    ? "pin"
                    : "pin-outline"
                }
                size={18}
                color="#374151"
              />
              <Text style={styles.contextItemText}>
                {pinnedIds.includes(contextMsg?.id ?? "") ? "Unpin" : "Pin"}
              </Text>
            </TouchableOpacity>
            {contextMsg?.sender === "parent" && (
              <TouchableOpacity
                style={[
                  styles.contextItem,
                  {
                    borderTopWidth: 1,
                    borderTopColor: "#F3F4F6",
                    marginTop: 4,
                  },
                ]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={[styles.contextItemText, { color: "#EF4444" }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Global search */}
      {showGlobalResults && (
        <GlobalSearchModal
          results={globalSearchResults}
          onClose={() => {
            setShowGlobalResults(false);
            setSearchQuery("");
            setShowSearch(false);
          }}
          onNavigate={(result) => {
            setShowGlobalResults(false);
            setShowSearch(false);
            setSearchQuery("");
            const m = result.message;
            if (result.type === "message") {
              setActiveTab("chat");
              setTimeout(() => scrollToMessage(m.id), 300);
            } else {
              setActiveTab("media");
              setTimeout(() => {
                if (m.attachmentUrl)
                  openInApp(m.attachmentUrl, m.attachmentName ?? "file");
              }, 300);
            }
          }}
        />
      )}

      {/* ── Chat History Modal ─────────────────────────────── */}
      <Modal
        visible={showHistory}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F4FB" }}>
          {/* History header */}
          <View style={[styles.header, { backgroundColor: PRIMARY }]}>
            <TouchableOpacity
              onPress={() => setShowHistory(false)}
              style={styles.headerBtn}
            >
              <Ionicons name="arrow-back-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerName, { flex: 1 }]}>Chat History</Text>
              {threads.length > 0 && (
                <View style={histStyles.countBadge}>
                  <Text style={histStyles.countBadgeText}>
                    {threads.length}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => {
                setShowHistory(false);
                startNewChat();
              }}
            >
              <Ionicons name="add-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {threads.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={40}
                  color={PRIMARY}
                />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>
                Tap + to start a new chat with the teacher
              </Text>
            </View>
          ) : (
            <FlatList
              data={threads}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 14, gap: 10 }}
              renderItem={({ item, index }) => {
                const isActive = item.id === threadId;
                return (
                  <TouchableOpacity
                    style={[
                      histStyles.threadRow,
                      isActive && histStyles.threadRowActive,
                    ]}
                    onPress={async () => {
                      setThreadId(item.id);
                      setMessages([]);
                      setShowHistory(false);
                      setActiveTab("chat");
                      await fetchThreadMessages(token, item.id);
                    }}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        histStyles.threadIcon,
                        isActive && { backgroundColor: PRIMARY },
                      ]}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={18}
                        color={isActive ? "#fff" : PRIMARY}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 3,
                        }}
                      >
                        <Text style={histStyles.threadNum}>
                          Conversation {threads.length - index}
                        </Text>
                        {isActive && (
                          <View style={histStyles.activeBadge}>
                            <Text style={histStyles.activeBadgeText}>
                              Active
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={histStyles.threadPreview} numberOfLines={1}>
                        {item.preview || "Tap to load messages"}
                      </Text>
                      <Text style={histStyles.threadDate}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#D1D5DB"
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F4FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerAvatarText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  headerName: { color: "#fff", fontSize: 15, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 11 },
  headerActions: { flexDirection: "row", gap: 4 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: PRIMARY },
  tabText: { fontSize: 12, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: PRIMARY, fontWeight: "700" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1F2937" },
  searchResultsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EEF3FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchCount: { fontSize: 12, color: PRIMARY, fontWeight: "700" },
  pinnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  pinnedChip: {
    backgroundColor: "#FDE68A",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  pinnedChipText: {
    fontSize: 11,
    color: "#92400E",
    maxWidth: 150,
    fontWeight: "600",
  },
  newChatBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#EEF3FF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#C7D9F8",
  },
  newChatBannerText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: "600",
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: PRIMARY, fontSize: 14, fontWeight: "600" },
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  list: { padding: 12, paddingBottom: 8 },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 8,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dateLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6,
    gap: 8,
  },
  msgRowRight: { flexDirection: "row-reverse" },
  teacherAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  teacherLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginBottom: 2,
    marginLeft: 2,
  },
  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 2,
  },
  pinText: { fontSize: 10, color: "#F59E0B", fontWeight: "600" },
  bubble: { borderRadius: 18, padding: 10, maxWidth: "100%" },
  bubbleLeft: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  bubbleRight: {
    backgroundColor: PRIMARY,
    borderBottomRightRadius: 4,
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  bubblePinned: { borderWidth: 1.5, borderColor: "#F59E0B" },
  replyRef: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    gap: 8,
  },
  replyRefRight: { backgroundColor: "rgba(255,255,255,0.15)" },
  replyRefLeft: { backgroundColor: "#F3F4F6" },
  replyRefBar: { width: 3, borderRadius: 2, backgroundColor: "#60A5FA" },
  replyRefLabel: { fontSize: 10, color: "#9CA3AF", marginBottom: 1 },
  replyRefText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  msgText: { fontSize: 15, color: "#111827", lineHeight: 21 },
  attachedImage: { width: 200, height: 150, borderRadius: 12, marginTop: 6 },
  mediaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 10,
  },
  mediaChipRight: { backgroundColor: "rgba(255,255,255,0.15)" },
  mediaChipText: { fontSize: 13, color: "#374151", flex: 1 },
  mediaChipSub: { fontSize: 11, color: "#6B7280" },
  videoThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 10,
  },
  voiceChipRight: { backgroundColor: "rgba(255,255,255,0.15)" },
  waveform: { flexDirection: "row", alignItems: "center", gap: 2, flex: 1 },
  waveBar: { width: 3, borderRadius: 2 },
  voiceLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 10,
    minWidth: 200,
  },
  fileChipRight: { backgroundColor: "rgba(255,255,255,0.15)" },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fileName: { fontSize: 13, color: "#374151", fontWeight: "600" },
  fileSub: { fontSize: 10, color: "#9CA3AF", marginTop: 1 },
  fileMeta: { fontSize: 11, color: "#9CA3AF" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  timeText: { fontSize: 10, color: "#9CA3AF" },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 10,
  },
  replyBannerBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: PRIMARY,
  },
  replyBannerLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  replyBannerText: { fontSize: 13, color: "#1F2937" },
  replyClose: { padding: 4 },
  editBanner: { backgroundColor: "#FFFBEB" },
  attachStrip: {
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  attachThumb: { position: "relative" },
  attachThumbImg: { width: 64, height: 64, borderRadius: 10 },
  attachThumbFile: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  attachThumbName: {
    fontSize: 9,
    color: PRIMARY,
    fontWeight: "600",
    maxWidth: 60,
    textAlign: "center",
  },
  attachRemove: { position: "absolute", top: -6, right: -6 },
  emojiToggleIcon: { fontSize: 24 },
  emojiPanel: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiScrollContent: { flexDirection: "row", paddingHorizontal: 4 },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginHorizontal: 4,
  },
  emojiText: { fontSize: 24 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    gap: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  attachBtn: { padding: 4 },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: "#1F2937",
  },
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBtnActive: { backgroundColor: "#EF4444" },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadBtn: { padding: 6 },
  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  recordingText: { flex: 1, fontSize: 13, color: "#991B1B", fontWeight: "600" },
  recordingStop: { padding: 4 },
  cameraTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 50,
  },
  cameraBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  cameraBottomBar: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 12,
  },
  cameraRecord: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraHint: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  recordingLabel: { color: "#fff", fontSize: 15, fontWeight: "700" },
  videoClose: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8,
  },
  previewModal: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  previewClose: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 6,
  },
  fullImage: { width: "100%", height: "80%" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  contextMenu: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: 280,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  contextPreview: {
    fontSize: 12,
    color: "#9CA3AF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  contextItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  contextItemText: { fontSize: 15, color: "#111827", fontWeight: "500" },
  galleryScroll: { padding: 16, paddingBottom: 40 },
  emptyGallery: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyGalleryTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  emptyGalleryText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  dlHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  dlHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  dlHeaderTitle: { fontSize: 14, fontWeight: "700", color: PRIMARY },
  dlHeaderSub: { fontSize: 11, color: "#9CA3AF" },
  dlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8EFFA",
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  dlIconBox: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  dlName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 3,
  },
  dlMeta: { fontSize: 11, color: "#9CA3AF", marginBottom: 5 },
  dlOfflineBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  dlOfflineText: { fontSize: 10, color: "#16A34A", fontWeight: "600" },
  dlActions: { flexDirection: "row", gap: 2 },
  dlActionBtn: { padding: 8, borderRadius: 8 },
  dlEmptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  subTabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F0F4FB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  subTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  subTabActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  subTabText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  subTabTextActive: { color: "#fff" },
  paneScroll: { padding: 14, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  thumb: {
    width: (SCREEN_W - 44) / 3,
    height: (SCREEN_W - 44) / 3,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%" },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  thumbDlBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderRadius: 12,
    padding: 3,
  },
  thumbTime: {
    position: "absolute",
    bottom: 4,
    right: 6,
    fontSize: 9,
    color: "#fff",
    fontWeight: "700",
  },
  section: {
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EFFA",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  sectionBadge: {
    backgroundColor: "#EEF3FF",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionBadgeText: { fontSize: 11, fontWeight: "700", color: PRIMARY },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 0.5,
    borderTopColor: "#F3F4F6",
  },
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  emptySub: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 28,
  },
});

const histStyles = StyleSheet.create({
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  threadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8EFFA",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  threadRowActive: { borderColor: PRIMARY, backgroundColor: "#EEF3FF" },
  threadIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  threadNum: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  threadPreview: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  threadDate: { fontSize: 11, color: "#9CA3AF" },
  activeBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  activeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
