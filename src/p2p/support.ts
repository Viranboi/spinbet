import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { emit, load, save, subscribe, uid } from "./storage";

const KEY = "support_threads";
export const ADMIN_UID = "letsbet_admin";

export interface SupportMessage {
  id: string;
  from: "user" | "admin";
  text: string;
  ts: number;
}

export interface SupportThread {
  userUid: string;
  userName: string;
  userEmail: string;
  messages: SupportMessage[];
  updatedAt: number;
  unreadForAdmin: number;
  unreadForUser: number;
}

type ThreadMap = Record<string, SupportThread>;

function readAll(): ThreadMap {
  return load<ThreadMap>(KEY, {});
}

function writeAll(all: ThreadMap) {
  save(KEY, all);
  emit(KEY);
}

/* ---------------- local (sync, instant UI) ---------------- */

export function getThread(userUid: string): SupportThread | undefined {
  return readAll()[userUid];
}

/** All threads for the admin inbox, newest activity first. */
export function getAllThreads(): SupportThread[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function totalUnreadForUser(userUid: string): number {
  return readAll()[userUid]?.unreadForUser || 0;
}

export function totalUnreadForAdmin(): number {
  return Object.values(readAll()).reduce((n, t) => n + t.unreadForAdmin, 0);
}

export function subscribeThreads(fn: () => void): () => void {
  return subscribe(KEY, fn);
}

/* ---------------- Firestore sync (cross-device) ---------------- */

function toDoc(t: SupportThread) {
  return {
    userUid: t.userUid,
    userName: t.userName || "",
    userEmail: t.userEmail || "",
    messages: t.messages.slice(-200),
    updatedAt: t.updatedAt,
    unreadForAdmin: t.unreadForAdmin,
    unreadForUser: t.unreadForUser,
  };
}

function fromDoc(data: any): SupportThread | null {
  if (!data || !data.userUid) return null;
  const msgs: SupportMessage[] = Array.isArray(data.messages)
    ? data.messages
        .filter((m: any) => m && typeof m.text === "string")
        .map((m: any) => ({
          id: String(m.id || uid("msg")),
          from: m.from === "admin" ? "admin" : "user",
          text: String(m.text).slice(0, 2000),
          ts: typeof m.ts === "number" ? m.ts : Date.now(),
        }))
        .sort((a: SupportMessage, b: SupportMessage) => a.ts - b.ts)
        .slice(-200)
    : [];
  return {
    userUid: String(data.userUid),
    userName: String(data.userName || ""),
    userEmail: String(data.userEmail || ""),
    messages: msgs,
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
    unreadForAdmin: typeof data.unreadForAdmin === "number" ? data.unreadForAdmin : 0,
    unreadForUser: typeof data.unreadForUser === "number" ? data.unreadForUser : 0,
  };
}

function mergeThread(local: SupportThread | undefined, remote: SupportThread): SupportThread {
  if (!local) return remote;
  const seen = new Map<string, SupportMessage>();
  for (const m of local.messages) seen.set(m.id, m);
  for (const m of remote.messages) {
    if (!seen.has(m.id)) seen.set(m.id, m);
  }
  const messages = Array.from(seen.values())
    .sort((a, b) => a.ts - b.ts)
    .slice(-200);
  const remoteIsNewer = remote.updatedAt >= local.updatedAt;
  return {
    userUid: local.userUid,
    userName: remote.userName || local.userName,
    userEmail: remote.userEmail || local.userEmail,
    messages,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    // Whoever has the newest write wins the counters; merged messages never lose data.
    unreadForAdmin: remoteIsNewer ? remote.unreadForAdmin : local.unreadForAdmin,
    unreadForUser: remoteIsNewer ? remote.unreadForUser : local.unreadForUser,
  };
}

/** Fire-and-forget mirror of one thread to Firestore. */
function pushThread(t: SupportThread) {
  try {
    setDoc(doc(db, "support_threads", t.userUid), toDoc(t), { merge: true }).catch(() => {});
  } catch {}
}

/** Pull one thread from Firestore into local cache. */
export async function fetchThreadRemote(userUid: string): Promise<SupportThread | undefined> {
  if (!userUid) return undefined;
  try {
    const snap = await getDoc(doc(db, "support_threads", userUid));
    if (!snap.exists()) return readAll()[userUid];
    const remote = fromDoc(snap.data());
    if (!remote) return readAll()[userUid];
    const all = readAll();
    const merged = mergeThread(all[userUid], remote);
    all[userUid] = merged;
    writeAll(all);
    return merged;
  } catch {
    return readAll()[userUid];
  }
}

/** Pull all threads (admin) from Firestore into local cache. */
export async function fetchAllThreadsRemote(count = 100): Promise<SupportThread[]> {
  try {
    const q = query(collection(db, "support_threads"), orderBy("updatedAt", "desc"), limit(count));
    const snap = await getDocs(q);
    const all = readAll();
    snap.forEach((d) => {
      const remote = fromDoc(d.data());
      if (!remote) return;
      all[remote.userUid] = mergeThread(all[remote.userUid], remote);
    });
    writeAll(all);
  } catch {}
  return getAllThreads();
}

export function sendMessage(
  userUid: string,
  userName: string,
  userEmail: string,
  from: "user" | "admin",
  text: string
) {
  const trimmed = text.trim();
  if (!trimmed || !userUid) return;
  const all = readAll();
  const thread =
    all[userUid] ||
    {
      userUid,
      userName,
      userEmail,
      messages: [],
      updatedAt: 0,
      unreadForAdmin: 0,
      unreadForUser: 0,
    };
  thread.userName = userName || thread.userName;
  thread.userEmail = userEmail || thread.userEmail;
  thread.messages.push({
    id: uid("msg"),
    from,
    text: trimmed.slice(0, 2000),
    ts: Date.now(),
  });
  thread.messages = thread.messages.slice(-200);
  thread.updatedAt = Date.now();
  if (from === "user") thread.unreadForAdmin += 1;
  else thread.unreadForUser += 1;
  all[userUid] = thread;
  writeAll(all);
  // Sync so the other side (other device/country) receives it.
  pushThread(thread);
}

export function markRead(userUid: string, who: "user" | "admin") {
  const all = readAll();
  const t = all[userUid];
  if (!t) return;
  if (who === "user") t.unreadForUser = 0;
  else t.unreadForAdmin = 0;
  writeAll(all);
  pushThread(t);
}

let userSyncUid: string | null = null;
let userSyncStop: (() => void) | null = null;

/** Live sync for the signed-in user's own thread. Returns unsubscribe. */
export function startUserSync(userUid: string): () => void {
  if (userSyncUid === userUid && userSyncStop) return userSyncStop;
  stopUserSync();
  userSyncUid = userUid;
  let stopFs: (() => void) | null = null;
  try {
    stopFs = onSnapshot(
      doc(db, "support_threads", userUid),
      (snap) => {
        if (!snap.exists()) return;
        const remote = fromDoc(snap.data());
        if (!remote) return;
        const all = readAll();
        all[userUid] = mergeThread(all[userUid], remote);
        writeAll(all);
      },
      () => {}
    );
  } catch {}
  const iv = setInterval(() => {
    fetchThreadRemote(userUid).catch(() => {});
  }, 6000);
  setTimeout(() => fetchThreadRemote(userUid).catch(() => {}), 800);
  const stop = () => {
    try { stopFs?.(); } catch {}
    clearInterval(iv);
    if (userSyncUid === userUid) {
      userSyncUid = null;
      userSyncStop = null;
    }
  };
  userSyncStop = stop;
  return stop;
}

export function stopUserSync() {
  try { userSyncStop?.(); } catch {}
  userSyncUid = null;
  userSyncStop = null;
}

let adminSyncOn = false;
let adminSyncStop: (() => void) | null = null;

/** Live sync for the admin inbox. Returns unsubscribe. */
export function startAdminSync(): () => void {
  if (adminSyncOn && adminSyncStop) return adminSyncStop;
  adminSyncOn = true;
  let stopFs: (() => void) | null = null;
  try {
    const q = query(collection(db, "support_threads"), orderBy("updatedAt", "desc"), limit(100));
    stopFs = onSnapshot(
      q,
      (snap) => {
        const all = readAll();
        snap.forEach((d) => {
          const remote = fromDoc(d.data());
          if (!remote) return;
          all[remote.userUid] = mergeThread(all[remote.userUid], remote);
        });
        writeAll(all);
      },
      () => {}
    );
  } catch {}
  const iv = setInterval(() => {
    fetchAllThreadsRemote().catch(() => {});
  }, 8000);
  setTimeout(() => fetchAllThreadsRemote().catch(() => {}), 800);
  const stop = () => {
    try { stopFs?.(); } catch {}
    clearInterval(iv);
    adminSyncOn = false;
    adminSyncStop = null;
  };
  adminSyncStop = stop;
  return stop;
}
