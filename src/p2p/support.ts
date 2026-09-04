import { emit, load, save, subscribe, uid } from "./storage";

const KEY = "support_threads";
const ADMIN_UID = "letsbet_admin";

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

export function getThread(userUid: string): SupportThread | undefined {
  return readAll()[userUid];
}

export function sendMessage(
  userUid: string,
  userName: string,
  userEmail: string,
  from: "user" | "admin",
  text: string
) {
  const trimmed = text.trim();
  if (!trimmed) return;
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
  thread.messages.push({
    id: uid("msg"),
    from,
    text: trimmed,
    ts: Date.now(),
  });
  thread.updatedAt = Date.now();
  if (from === "user") thread.unreadForAdmin += 1;
  else thread.unreadForUser += 1;
  all[userUid] = thread;
  save(KEY, all);
  emit(KEY);
}

export function markRead(userUid: string, who: "user" | "admin") {
  const all = readAll();
  const t = all[userUid];
  if (!t) return;
  if (who === "user") t.unreadForUser = 0;
  else t.unreadForAdmin = 0;
  save(KEY, all);
  emit(KEY);
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

export { ADMIN_UID };
