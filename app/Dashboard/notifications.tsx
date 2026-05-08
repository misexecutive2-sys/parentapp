// Dashboard/notifications.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppNotification,
  aggregateAndStoreNotifications,
  loadStoredNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../utils/notificationHelper";

const PRIMARY = "#0047AB";

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const TYPE_CONFIG = {
  notice:   { icon: "megaphone-outline",     color: "#0047AB", bg: "#EEF3FF", label: "Notice Board" },
  homework: { icon: "book-outline",          color: "#7C3AED", bg: "#F5F3FF", label: "Homework" },
  comment:  { icon: "chatbubble-outline",    color: "#059669", bg: "#ECFDF5", label: "Teacher Comment" },
} as const;

// ── Filter config — NO emojis, only Ionicons ──────────────
const FILTERS = [
  { key: "all",      label: "All",      icon: "notifications-outline" as const,  color: PRIMARY   },
  { key: "notice",   label: "Notices",  icon: "megaphone-outline" as const,       color: "#0047AB" },
  { key: "homework", label: "Homework", icon: "book-outline" as const,            color: "#7C3AED" },
  { key: "comment",  label: "Comments", icon: "chatbubble-outline" as const,      color: "#059669" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

// ── Single notification row ────────────────────────────────
const NotifRow = ({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
}) => {
  const cfg = TYPE_CONFIG[item.type];

  return (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      {!item.read && (
        <View style={[styles.unreadBar, { backgroundColor: cfg.color }]} />
      )}

      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowTopRow}>
          <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typePillText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
          <View style={styles.rightMeta}>
            <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
            {!item.read && <View style={styles.redDot} />}
          </View>
        </View>

        <Text
          style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        {!!item.body && (
          <Text style={styles.rowBody} numberOfLines={2}>
            {item.body}
          </Text>
        )}

        {item.type === "homework" && item.dueDate && (
          <View style={styles.dueChip}>
            <Ionicons name="calendar-outline" size={10} color="#7C3AED" />
            <Text style={styles.dueChipText}>
              Due{" "}
              {new Date(item.dueDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward-outline" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
};

// ── Main screen ────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [activeFilter,  setActiveFilter]  = useState<FilterKey>("all");

  useEffect(() => {
    const init = async () => {
      const stored = await loadStoredNotifications();
      if (stored.length > 0) setNotifications(stored);
      await doFetch();
      setLoading(false);
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStoredNotifications().then((stored) => {
        if (stored.length > 0) setNotifications(stored);
      });
    }, [])
  );

  const doFetch = async () => {
    try {
      const fresh = await aggregateAndStoreNotifications();
      setNotifications(fresh);
    } catch {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await doFetch();
    setRefreshing(false);
  }, []);

  const handlePress = async (item: AppNotification) => {
    if (!item.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      await markNotificationRead(item.id);
    }
    router.push({ pathname: item.route });
  };

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead();
  };

  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── Header ── */}
      <View style={styles.header}>
       <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                  <Text style={styles.backArrow}>⬅</Text>
                </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f, index) => {
          const isActive = activeFilter === f.key;
          const chipUnread =
            f.key === "all"
              ? notifications.filter((n) => !n.read).length
              : notifications.filter((n) => n.type === f.key && !n.read).length;

          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                isActive && { backgroundColor: f.color, borderColor: f.color },
                { marginRight: index < FILTERS.length - 1 ? 8 : 0 },
              ]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.8}
            >
              {/* Icon — Ionicons, never emoji */}
              <Ionicons
                name={f.icon}
                size={14}
                color={isActive ? "#fff" : f.color}
              />

              {/* Label */}
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>

              {/* Unread badge */}
              {chipUnread > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    isActive && styles.filterBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      isActive && { color: f.color },
                    ]}
                  >
                    {chipUnread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>
                No {activeFilter === "all" ? "" : activeFilter + " "}
                notifications yet. Pull down to refresh.
              </Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {filtered.map((item) => (
                <NotifRow key={item.id} item={item} onPress={handlePress} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F6FB" },

  // Header
  header:            { backgroundColor: PRIMARY, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 12 },
  backBtn: { 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  backArrow: { 
    color: "#fff", 
    fontSize: 22, 
    fontWeight: "600" 
  },  headerCenter:      { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:       { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerBadge:       { backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  headerBadgeText:   { fontSize: 11, color: "#fff", fontWeight: "800" },
  markAllBtn:        { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  markAllText:       { fontSize: 11, color: "#fff", fontWeight: "700" },

  // Filter chips — KEY FIXES:
  // 1. Replaced all emojis with Ionicons (no more Android glyph-image overflow)
  // 2. Reduced paddingVertical so chips don't stretch
  // 3. gap: 5 keeps icon + label + badge neatly spaced
  // 4. Fixed height: 36 ensures all chips are same size regardless of content
  filterRow:             { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center" },
  filterChip:            { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E5E7EB" },
  filterChipText:        { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  filterChipTextActive:  { color: "#fff" },
  filterBadge:           { backgroundColor: "#EF4444", borderRadius: 8, minWidth: 17, height: 17, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  filterBadgeActive:     { backgroundColor: "#fff" },
  filterBadgeText:       { fontSize: 9, color: "#fff", fontWeight: "900" },

  // Rows
  listWrap:          { paddingHorizontal: 16, gap: 10 },
  row:               { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: "#F0F0F0", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, overflow: "hidden" },
  rowUnread:         { borderColor: "#DBEAFE", backgroundColor: "#FAFBFF" },
  unreadBar:         { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  iconWrap:          { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rowContent:        { flex: 1, gap: 3 },
  rowTopRow:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typePill:          { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  typePillText:      { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  rightMeta:         { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText:          { fontSize: 10, color: "#9CA3AF" },
  redDot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  rowTitle:          { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  rowTitleUnread:    { fontWeight: "800", color: "#1F2937" },
  rowBody:           { fontSize: 12, color: "#6B7280", lineHeight: 17 },
  dueChip:           { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, alignSelf: "flex-start", backgroundColor: "#F5F3FF", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  dueChipText:       { fontSize: 10, fontWeight: "700", color: "#7C3AED" },

  // Empty / loading
  centered:          { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  loadingText:       { fontSize: 14, color: "#9CA3AF", fontWeight: "600" },
  emptyWrap:         { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle:        { fontSize: 20, fontWeight: "800", color: "#1F2937", marginBottom: 8, marginTop: 16 },
  emptySubtitle:     { fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },
});