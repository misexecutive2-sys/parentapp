import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://connect.schoolaid.in";
const NOTIF_KEY = "aggregatedNotifications";
const READ_IDS_KEY = "notif_read_ids"; // ← separate key for read state

export interface AppNotification {
  id: string;
  type: "notice" | "homework" | "comment";
  title: string;
  body: string;
  subject?: string;
  dueDate?: string | null;
  fileUrl?: string | null;
  createdAt: string;
  read: boolean;
  route: "/Dashboard/noticeboard" | "/Dashboard/schooldiary";
}

const fetchNotices = async (token: string, studentId: string): Promise<AppNotification[]> => {
  try {
    const res = await fetch(
      `${BASE_URL}/api/notices/student?student_id=${studentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const raw: any[] = Array.isArray(json.data) ? json.data : [];

    return raw.map((n) => ({
      id: `notice_${n.id}`,
      type: "notice" as const,
      title: n.title ?? "Notice",
      body: n.message ?? "",
      subject: undefined,
      dueDate: null,
      fileUrl: n.file_url ?? null,
      createdAt: n.created_at ?? new Date().toISOString(),
      read: n.is_read === 1,
      route: "/Dashboard/noticeboard" as const,
    }));
  } catch {
    return [];
  }
};

const fetchDiary = async (token: string, studentId: string): Promise<AppNotification[]> => {
  try {
    const res = await fetch(`${BASE_URL}/api/diary/student/${studentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw: any[] = data.success ? data.data : Array.isArray(data) ? data : [];

    return raw.map((n) => {
      const isComment =
        n.type === "comment" ||
        (n.type === "" && (n.comment != null || (!n.due_date && !n.dueDate)));
      const type: "homework" | "comment" = isComment ? "comment" : "homework";
      const subject = n.subject ?? n.subject_name ?? "General";

      return {
        id: `diary_${n.id ?? n._id ?? Math.random()}`,
        type,
        title: type === "homework"
          ? `Homework – ${subject}`
          : `Comment – ${subject}`,
        body: n.body ?? n.description ?? n.comment ?? "",
        subject,
        dueDate: n.dueDate ?? n.due_date ?? null,
        fileUrl: null,
        createdAt: n.createdAt ?? n.created_at ?? new Date().toISOString(),
        read: false,
        route: "/Dashboard/schooldiary" as const,
      };
    });
  } catch {
    return [];
  }
};

// ─── Get saved read IDs ───────────────────────────────────
const getReadIds = async (): Promise<Set<string>> => {
  try {
    const str = await AsyncStorage.getItem(READ_IDS_KEY);
    const arr: string[] = str ? JSON.parse(str) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
};

// ─── Save read IDs ────────────────────────────────────────
const saveReadIds = async (ids: Set<string>): Promise<void> => {
  try {
    await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
  } catch {}
};

// ─── Main aggregate ───────────────────────────────────────
export const aggregateAndStoreNotifications = async (): Promise<AppNotification[]> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const childStr = await AsyncStorage.getItem("selectedChild");
    if (!token || !childStr) return [];

    const child = JSON.parse(childStr);
    const studentId = String(child.id ?? "");
    if (!studentId) return [];

    const [notices, diary] = await Promise.all([
      fetchNotices(token, studentId),
      fetchDiary(token, studentId),
    ]);

    const fresh = [...notices, ...diary].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // ✅ Use separate READ_IDS_KEY — survives re-fetch, cleared on logout
    const readIds = await getReadIds();

    const merged = fresh.map((n) => ({
      ...n,
      read: readIds.has(n.id) ? true : n.read,
    }));

    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error("aggregateNotifications error:", err);
    return [];
  }
};

// ─── Mark one as read ─────────────────────────────────────
export const markNotificationRead = async (id: string): Promise<void> => {
  try {
    // Update the list
    const str = await AsyncStorage.getItem(NOTIF_KEY);
    const list: AppNotification[] = str ? JSON.parse(str) : [];
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));

    // ✅ Also persist to READ_IDS_KEY
    const readIds = await getReadIds();
    readIds.add(id);
    await saveReadIds(readIds);
  } catch {}
};

// ─── Mark all as read ─────────────────────────────────────
export const markAllNotificationsRead = async (): Promise<void> => {
  try {
    const str = await AsyncStorage.getItem(NOTIF_KEY);
    const list: AppNotification[] = str ? JSON.parse(str) : [];
    const updated = list.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));

    // ✅ Persist all IDs to READ_IDS_KEY
    const readIds = new Set(list.map((n) => n.id));
    await saveReadIds(readIds);
  } catch {}
};

// ─── Load stored (no fetch) ───────────────────────────────
export const loadStoredNotifications = async (): Promise<AppNotification[]> => {
  try {
    const str = await AsyncStorage.getItem(NOTIF_KEY);
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
};

// ─── Clear all notification data (call on logout) ─────────
export const clearNotificationData = async (): Promise<void> => {
  await AsyncStorage.multiRemove([NOTIF_KEY, READ_IDS_KEY]);
};