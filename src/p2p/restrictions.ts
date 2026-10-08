import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { emit, load, save, subscribe } from "./storage";

const KEY = "blocked_uids";

export interface BlockInfo {
  at: number;
  reason: string;
}

function readAll(): Record<string, BlockInfo> {
  return load<Record<string, BlockInfo>>(KEY, {});
}

/** Sync check — true if this uid is currently locked by admin. */
export function isBlocked(userUid: string): boolean {
  if (!userUid) return false;
  return !!readAll()[userUid];
}

export function getBlockInfo(userUid: string): BlockInfo | null {
  return readAll()[userUid] || null;
}

export function subscribeRestrictions(fn: () => void): () => void {
  return subscribe(KEY, fn);
}

/** Apply a server-side flag into the local cache (called by the remote wallet loop). */
export function applyRemoteBlocked(userUid: string, blocked: boolean, reason = ""): boolean {
  if (!userUid) return false;
  const all = readAll();
  const has = !!all[userUid];
  if (blocked === has) return false;
  if (blocked) {
    all[userUid] = { at: Date.now(), reason: reason || "" };
  } else {
    delete all[userUid];
  }
  save(KEY, all);
  emit(KEY);
  return true;
}

/** Pull my own lock flag (users can read their own doc). */
export async function fetchMyRestriction(userUid: string): Promise<boolean> {
  if (!userUid) return false;
  try {
    const snap = await getDoc(doc(db, "users", userUid));
    const data: any = snap.exists() ? snap.data() : null;
    const blocked = data?.blocked === true;
    applyRemoteBlocked(userUid, blocked, data?.blockedReason || "");
    return blocked;
  } catch {
    return isBlocked(userUid);
  }
}

/** Admin: lock or unlock a user. Persists on users/{uid} so it works across devices. */
export async function setBlocked(userUid: string, blocked: boolean, reason = ""): Promise<void> {
  if (!userUid) throw new Error("Missing user");
  const payload: any = {
    blocked,
    blockedAt: blocked ? Date.now() : null,
    blockedReason: blocked ? reason || "Locked by admin" : "",
    updatedAt: Date.now(),
  };
  try {
    await setDoc(doc(db, "users", userUid), payload, { merge: true });
  } catch (e: any) {
    throw new Error(e?.message || "Failed — check Firestore rules allow admin writes on users");
  }
  applyRemoteBlocked(userUid, blocked, payload.blockedReason);
}
