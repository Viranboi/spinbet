import { db } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { emit, load, save, subscribe, uid } from "./storage";

export type NotificationKind = "info" | "bonus" | "warning" | "promo";

export interface AppNotification {
  id: string;
  uid: string; // target user uid, or "all" for broadcast
  title: string;
  message: string;
  kind: NotificationKind;
  ts: number;
  read: boolean;
  readAt?: number | null;
  createdBy?: string;
}

const KEY = "notifications";
const MAX_LOCAL = 300;

function readLocal(): AppNotification[] {
  return load<AppNotification[]>(KEY, []);
}

function writeLocal(list: AppNotification[]) {
  const sorted = [...list].sort((a, b) => b.ts - a.ts).slice(0, MAX_LOCAL);
  save(KEY, sorted);
  emit(KEY);
}

function upsertLocal(items: AppNotification[]) {
  if (!items.length) return;
  const map = new Map<string, AppNotification>();
  for (const n of readLocal()) map.set(n.id, n);
  for (const n of items) {
    const prev = map.get(n.id);
    // Don't resurrect a locally-read item as unread when Firestore lags behind.
    if (prev && prev.read && !n.read) {
      map.set(n.id, { ...n, read: true, readAt: prev.readAt || Date.now() });
    } else {
      map.set(n.id, n);
    }
  }
  writeLocal(Array.from(map.values()));
}

export function getCachedNotifications(forUid: string): AppNotification[] {
  if (!forUid) return [];
  return readLocal()
    .filter((n) => n.uid === forUid || n.uid === "all")
    .sort((a, b) => b.ts - a.ts);
}

export function getUnreadCount(forUid: string): number {
  return getCachedNotifications(forUid).filter((n) => !n.read).length;
}

export function subscribeNotifications(fn: () => void): () => void {
  return subscribe(KEY, fn);
}

/** Admin: send to one user. Writes Firestore first, mirrors locally so sender sees it instantly. */
export async function sendNotification(
  targetUid: string,
  title: string,
  message: string,
  kind: NotificationKind = "info",
  createdBy = "admin"
): Promise<AppNotification> {
  const t = title.trim();
  const m = message.trim();
  if (!targetUid) throw new Error("Choose a user");
  if (!t) throw new Error("Enter a title");
  if (!m) throw new Error("Enter a message");
  const item: AppNotification = {
    id: uid("ntf"),
    uid: targetUid,
    title: t.slice(0, 120),
    message: m.slice(0, 1000),
    kind,
    ts: Date.now(),
    read: false,
    createdBy,
  };
  // Local first (instant UI), then Firestore (cross-device).
  upsertLocal([item]);
  try {
    const ref = await addDoc(collection(db, "notifications"), {
      uid: item.uid,
      title: item.title,
      message: item.message,
      kind: item.kind,
      ts: item.ts,
      read: false,
      createdBy,
    });
    // Replace temp id with real doc id locally.
    const all = readLocal().filter((n) => n.id !== item.id);
    writeLocal([{ ...item, id: ref.id }, ...all]);
    return { ...item, id: ref.id };
  } catch {
    // Offline / no Firestore — local-only notification still works on this device.
    return item;
  }
}

export function sendBroadcast(title: string, message: string, kind: NotificationKind = "info") {
  return sendNotification("all", title, message, kind, "admin");
}

/** Pull this user's notifications (own + broadcast) from Firestore into local cache. */
export async function fetchMyNotifications(forUid: string): Promise<AppNotification[]> {
  if (!forUid) return [];
  try {
    const q = query(
      collection(db, "notifications"),
      where("uid", "in", [forUid, "all"]),
      orderBy("ts", "desc"),
      limit(100)
    );
    const snap = await getDocs(q);
    const out: AppNotification[] = [];
    snap.forEach((d) => {
      const v: any = d.data();
      out.push({
        id: d.id,
        uid: v.uid || "all",
        title: v.title || "Notification",
        message: v.message || "",
        kind: (v.kind as NotificationKind) || "info",
        ts: typeof v.ts === "number" ? v.ts : Date.now(),
        read: readFlagFor(d.id, forUid, !!v[`read_${forUid}`] || !!v.read),
        createdBy: v.createdBy || "admin",
      });
    });
    // Merge read state stored locally per-user.
    const localRead = readLocalReadMap();
    const merged = out.map((n) => {
      const key = `${forUid}:${n.id}`;
      if (localRead[key]) return { ...n, read: true, readAt: localRead[key] };
      return n;
    });
    upsertLocal(merged);
    return getCachedNotifications(forUid);
  } catch {
    // Firestore composite index missing / offline — fall back to local cache.
    return getCachedNotifications(forUid);
  }
}

/** Live subscription for a user. Returns unsubscribe. */
export function subscribeMyNotifications(forUid: string, onUpdate: () => void): () => void {
  if (!forUid) return () => {};
  let stopFs: (() => void) | null = null;
  try {
    const q = query(
      collection(db, "notifications"),
      where("uid", "in", [forUid, "all"]),
      orderBy("ts", "desc"),
      limit(100)
    );
    stopFs = onSnapshot(
      q,
      (snap) => {
        const out: AppNotification[] = [];
        snap.forEach((d) => {
          const v: any = d.data();
          out.push({
            id: d.id,
            uid: v.uid || "all",
            title: v.title || "Notification",
            message: v.message || "",
            kind: (v.kind as NotificationKind) || "info",
            ts: typeof v.ts === "number" ? v.ts : Date.now(),
            read: readFlagFor(d.id, forUid, !!v[`read_${forUid}`] || !!v.read),
            createdBy: v.createdBy || "admin",
          });
        });
        const localRead = readLocalReadMap();
        upsertLocal(
          out.map((n) => {
            const key = `${forUid}:${n.id}`;
            return localRead[key] ? { ...n, read: true, readAt: localRead[key] } : n;
          })
        );
        onUpdate();
      },
      () => {}
    );
  } catch {}
  const stopLocal = subscribeNotifications(onUpdate);
  const iv = setInterval(() => {
    fetchMyNotifications(forUid).then(() => onUpdate()).catch(() => {});
  }, 15000);
  return () => {
    try { stopFs?.(); } catch {}
    stopLocal();
    clearInterval(iv);
  };
}

const READ_KEY = "notifications_read";

function readLocalReadMap(): Record<string, number> {
  return load<Record<string, number>>(READ_KEY, {});
}

function readFlagFor(docId: string, forUid: string, fsRead: boolean): boolean {
  if (fsRead) return true;
  const m = readLocalReadMap();
  return !!m[`${forUid}:${docId}`] || !!m[`all:${docId}`];
}

function markLocalRead(forUid: string, id: string) {
  const m = readLocalReadMap();
  m[`${forUid}:${id}`] = Date.now();
  save(READ_KEY, m);
  const all = readLocal().map((n) =>
    n.id === id ? { ...n, read: true, readAt: Date.now() } : n
  );
  writeLocal(all);
}

export async function markNotificationRead(forUid: string, id: string) {
  markLocalRead(forUid, id);
  try {
    // Per-user read flag so one user reading doesn't mark it read for everyone.
    await updateDoc(doc(db, "notifications", id), {
      [`read_${forUid}`]: true,
    } as any).catch(async () => {
      // Old docs without per-user flags: only mark global read for 1:1 messages.
      const cur = readLocal().find((n) => n.id === id);
      if (cur && cur.uid === forUid) {
        await updateDoc(doc(db, "notifications", id), { read: true } as any).catch(() => {});
      }
    });
  } catch {}
}

export async function markAllRead(forUid: string) {
  const list = getCachedNotifications(forUid).filter((n) => !n.read);
  const m = readLocalReadMap();
  for (const n of list) m[`${forUid}:${n.id}`] = Date.now();
  save(READ_KEY, m);
  writeLocal(readLocal().map((n) => (n.uid === forUid || n.uid === "all") ? { ...n, read: true, readAt: Date.now() } : n));
  // Best-effort Firestore sync (fire-and-forget, one by one).
  for (const n of list.slice(0, 50)) {
    try {
      await updateDoc(doc(db, "notifications", n.id), { [`read_${forUid}`]: true } as any).catch(() => {});
    } catch {}
  }
}

/** Admin: recent notifications across all users. */
export async function fetchRecentNotifications(count = 50): Promise<AppNotification[]> {
  try {
    const q = query(collection(db, "notifications"), orderBy("ts", "desc"), limit(count));
    const snap = await getDocs(q);
    const out: AppNotification[] = [];
    snap.forEach((d) => {
      const v: any = d.data();
      out.push({
        id: d.id,
        uid: v.uid || "all",
        title: v.title || "",
        message: v.message || "",
        kind: (v.kind as NotificationKind) || "info",
        ts: typeof v.ts === "number" ? v.ts : 0,
        read: !!v.read,
        createdBy: v.createdBy || "admin",
      });
    });
    upsertLocal(out.filter((n) => n.uid === "all"));
    return out;
  } catch {
    return readLocal().sort((a, b) => b.ts - a.ts).slice(0, count);
  }
}

export async function deleteNotification(id: string) {
  writeLocal(readLocal().filter((n) => n.id !== id));
  try {
    await deleteDoc(doc(db, "notifications", id)).catch(() => {});
  } catch {}
}
