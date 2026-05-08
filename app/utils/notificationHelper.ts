import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://connect.schoolaid.in";
const NOTIF_KEY = "aggregatedNotifications";

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
  // used for redirecting
  route: "/Dashboard/noticeboard" | "/Dashboard/schooldiary";
}

// ─── Fetch notices from API ───────────────────────────────
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

// ─── Fetch diary (homework + comments) from API ───────────
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
        title: type === "homework" ? `📚 Homework – ${subject}` : `💬 Comment – ${subject}`,
        body: n.body ?? n.description ?? n.comment ?? "",
        subject,
        dueDate: n.dueDate ?? n.due_date ?? null,
        fileUrl: null,
        createdAt: n.createdAt ?? n.created_at ?? new Date().toISOString(),
        read: false, // diary items don't have server-side read state
        route: "/Dashboard/schooldiary" as const,
      };
    });
  } catch {
    return [];
  }
};

// ─── Main: aggregate both APIs, merge with existing read state ─
export const aggregateAndStoreNotifications = async (): Promise<AppNotification[]> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const childStr = await AsyncStorage.getItem("selectedChild");
    if (!token || !childStr) return [];

    const child = JSON.parse(childStr);
    const studentId = String(child.id ?? "");
    if (!studentId) return [];

    // Fetch both in parallel
    const [notices, diary] = await Promise.all([
      fetchNotices(token, studentId),
      fetchDiary(token, studentId),
    ]);

    const fresh = [...notices, ...diary].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Preserve read state from previously stored notifications
    const existingStr = await AsyncStorage.getItem(NOTIF_KEY);
    const existing: AppNotification[] = existingStr ? JSON.parse(existingStr) : [];
    const readIds = new Set(existing.filter((n) => n.read).map((n) => n.id));

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

// ─── Mark one notification as read ───────────────────────
export const markNotificationRead = async (id: string): Promise<void> => {
  try {
    const str = await AsyncStorage.getItem(NOTIF_KEY);
    const list: AppNotification[] = str ? JSON.parse(str) : [];
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  } catch {}
};

// ─── Mark all as read ─────────────────────────────────────
export const markAllNotificationsRead = async (): Promise<void> => {
  try {
    const str = await AsyncStorage.getItem(NOTIF_KEY);
    const list: AppNotification[] = str ? JSON.parse(str) : [];
    const updated = list.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  } catch {}
};

// ─── Load stored notifications (no fetch) ─────────────────
export const loadStoredNotifications = async (): Promise<AppNotification[]> => {
  try {
    const str = await AsyncStorage.getItem(NOTIF_KEY);
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
};