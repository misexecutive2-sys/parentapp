import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet,
  ActivityIndicator, Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/build/Ionicons";

const BASE_URL = "https://connect.schoolaid.in";

interface Message {
  id: string;
  text: string;
  sender: "parent" | "teacher";
  createdAt: string;
}

export default function MessageScreen() {
  const router = useRouter();
  const { childId, childName } = useLocalSearchParams<{
    childId: string;
    childName: string;
  }>();

  const [messages, setMessages]   = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [token, setToken]         = useState("");
  const flatListRef               = useRef<FlatList>(null);

  useEffect(() => {
    const init = async () => {
      const t = await AsyncStorage.getItem("token");
      if (t) { setToken(t); fetchMessages(t); }
    };
    init();
  }, []);

  const fetchMessages = async (t: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/messages/student/${childId}`, {
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const list: any[] = data.data ?? data ?? [];
      setMessages(list.map((m: any) => ({
        id:        String(m.id ?? m._id ?? Math.random()),
        text:      m.message ?? m.body ?? m.text ?? "",
        sender:    m.sender_type === "teacher" ? "teacher" : "parent",
        createdAt: m.created_at ?? m.createdAt ?? new Date().toISOString(),
      })));
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/api/messages/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: childId,
          message:    inputText.trim(),
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();

      // Optimistically add message to UI
      const newMsg: Message = {
        id:        String(data.id ?? data.data?.id ?? Date.now()),
        text:      inputText.trim(),
        sender:    "parent",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setInputText("");
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert("Error", "Could not send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isParent = item.sender === "parent";
    return (
      <View style={[msgStyles.bubble, isParent ? msgStyles.bubbleRight : msgStyles.bubbleLeft]}>
        {!isParent && (
          <Text style={msgStyles.senderLabel}>🧑‍🏫 Teacher</Text>
        )}
        <Text style={[msgStyles.msgText, isParent && { color: "#fff" }]}>
          {item.text}
        </Text>
        <Text style={[msgStyles.timeText, isParent && { color: "rgba(255,255,255,0.7)" }]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={msgStyles.safe}>

      {/* Header */}
      <View style={msgStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={msgStyles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={msgStyles.headerTitle}>Message Teacher</Text>
          <Text style={msgStyles.headerSub}>{childName}</Text>
        </View>
        <View style={msgStyles.onlineDot} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {loading ? (
          <View style={msgStyles.loadingWrapper}>
            <ActivityIndicator size="large" color="#0047AB" />
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

        {/* Input bar */}
        <View style={msgStyles.inputBar}>
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
            style={[msgStyles.sendBtn, (!inputText.trim() || sending) && { opacity: 0.5 }]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
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
  safe:          { flex: 1, backgroundColor: "#F5F7FA" },
  header:        { backgroundColor: "#0047AB", paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:       { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle:   { color: "#fff", fontSize: 17, fontWeight: "800" },
  headerSub:     { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 1 },
  onlineDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: "#4ADE80", borderWidth: 2, borderColor: "#fff" },

  loadingWrapper:{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText:   { fontSize: 13, color: "#6B7280", fontWeight: "600" },

  list:          { padding: 16, paddingBottom: 8 },
  emptyWrapper:  { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
  emptyEmoji:    { fontSize: 52, marginBottom: 12 },
  emptyTitle:    { fontSize: 18, fontWeight: "800", color: "#111827" },
  emptySub:      { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

  bubble:        { maxWidth: "78%", borderRadius: 16, padding: 12, marginBottom: 10 },
  bubbleLeft:    { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },
  bubbleRight:   { backgroundColor: "#0047AB", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  senderLabel:   { fontSize: 11, fontWeight: "700", color: "#6B7280", marginBottom: 4 },
  msgText:       { fontSize: 14, color: "#111827", lineHeight: 20 },
  timeText:      { fontSize: 10, color: "#9CA3AF", marginTop: 4, alignSelf: "flex-end" },

  inputBar:      { flexDirection: "row", alignItems: "flex-end", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F0F0", gap: 10 , marginBottom: 30 },
  input:         { flex: 1, backgroundColor: "#F9FAFB", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#111827", maxHeight: 100, borderWidth: 1, borderColor: "#E5E7EB" },
  sendBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: "#0047AB", alignItems: "center", justifyContent: "center" },
});