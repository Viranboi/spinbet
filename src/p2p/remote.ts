import { db } from "../firebase";
import { doc, setDoc, getDoc, collection, getDocs, runTransaction } from "firebase/firestore";
import { load, save, emit } from "./storage";

const WALLET_KEY = "wallet";
let loopStarted = false;
let lastRemoteBalance: number | null = null;
let lastRemoteUid: string | null = null;
let pendingPushes = 0;
let uidGetter: () => string | null = () => {
  try {
    const s = localStorage.getItem("letsbet_current_user");
    return s ? JSON.parse(s)?.uid || null : null;
  } catch {
    return null;
  }
};

export function setUidGetter(fn: () => string | null) {
  uidGetter = fn;
}

interface WalletMap {
  [uid: string]: number;
}

function readLocal(): WalletMap {
  return load<WalletMap>(WALLET_KEY, {});
}

function applyRemoteBalance(uid: string, balance: number) {
  const all = readLocal();
  const rounded = Math.round(balance * 10000) / 10000;
  if (Math.round((all[uid] || 0) * 10000) / 10000 === rounded) return false;
  all[uid] = rounded;
  save(WALLET_KEY, all);
  emit(WALLET_KEY);
  return true;
}

/** Fire-and-forget: mirror local balance to Firestore so admin/other devices see it. */
export function pushBalance(uid: string, balance: number) {
  if (!uid) return;
  pendingPushes++;
  try {
    const rounded = Math.round(balance * 10000) / 10000;
    setDoc(
      doc(db, "users", uid),
      { balance: rounded, updatedAt: Date.now() },
      { merge: true }
    )
      .then(() => {
        if (lastRemoteUid === null || lastRemoteUid === uid) {
          lastRemoteUid = uid;
          lastRemoteBalance = rounded;
        }
      })
      .catch(() => {})
      .finally(() => {
        pendingPushes = Math.max(0, pendingPushes - 1);
      });
  } catch {
    pendingPushes = Math.max(0, pendingPushes - 1);
  }
}


/** Transactional delta push: serializes concurrent client updates so no writes are lost. */
export async function pushDelta(uid: string, delta: number) {
  if (!uid) return;
  pendingPushes++;
  try {
    await runTransaction(db, async (transaction) => {
      const ref = doc(db, "users", uid);
      const snap = await transaction.get(ref);
      const data: any = snap.exists() ? snap.data() : {};
      const current = typeof data?.balance === "number" ? data.balance : 0;
      const next = Math.round((current + delta) * 10000) / 10000;
      transaction.set(ref, { balance: next, updatedAt: Date.now() }, { merge: true });
      lastRemoteUid = uid;
      lastRemoteBalance = next;
    });
  } catch {
    /* offline / denied — local cache remains */
  } finally {
    pendingPushes = Math.max(0, pendingPushes - 1);
  }
}

export function mirrorProfile(user: { uid: string; email: string; displayName: string; phone?: string }) {
  if (!user?.uid) return;
  try {
    // Profile fields only — NEVER balance here, or login would overwrite admin top-ups with local 0.
    const payload: any = {
      email: user.email || "",
      displayName: user.displayName || "",
      phone: (user as any).phone || "",
      updatedAt: Date.now(),
    };
    setDoc(doc(db, "users", user.uid), payload, { merge: true }).catch(() => {});
  } catch {}
}

/** Poll Firestore for the current uid; applies remote admin edits within seconds. Works across countries. */
export function ensureRemoteLoop() {
  if (loopStarted) return;
  loopStarted = true;
  const tick = async () => {
    const uid = uidGetter();
    if (!uid) return;
    // Don't clobber in-flight local game balance pushes.
    if (pendingPushes > 0) return;
    if (lastRemoteUid !== uid) {
      lastRemoteUid = uid;
      lastRemoteBalance = null;
    }
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        // First time on this device: create doc from local balance so admin can see the user.
        const localBal = readLocal()[uid];
        const lb = typeof localBal === "number" ? localBal : 0;
        lastRemoteBalance = lb;
        mirrorProfileWithBalance(uid, lb);
        return;
      }
      const data: any = snap.data();
      if (typeof data?.balance === "number") {
        const remoteBal = Math.round(data.balance * 10000) / 10000;
        const localBal = Math.round((readLocal()[uid] || 0) * 10000) / 10000;
        // Only apply remote when local is in sync with last known remote,
        // so an in-flight/unsynced Aviator balance is never overwritten.
        if (lastRemoteBalance === null) {
          lastRemoteBalance = remoteBal;
          applyRemoteBalance(uid, remoteBal);
        } else if (
          localBal === Math.round(lastRemoteBalance * 10000) / 10000 &&
          Math.round(lastRemoteBalance * 10000) / 10000 !== remoteBal
        ) {
          lastRemoteBalance = remoteBal;
          applyRemoteBalance(uid, remoteBal);
        }
      }
      if (typeof data?.blocked === "boolean") {
        const { applyRemoteBlocked } = await import("./restrictions");
        applyRemoteBlocked(uid, data.blocked, data.blockedReason || "");
      }
    } catch {
      /* offline / no Firestore / denied — stay on localStorage */
    }
  };
  const t = setInterval(tick, 4000);
  (t as any)?.unref?.();
  setTimeout(tick, 1500);
}

function mirrorProfileWithBalance(uid: string, balance: number) {
  pendingPushes++;
  try {
    let email = "",
      displayName = "",
      phone = "";
    try {
      const cur = JSON.parse(localStorage.getItem("letsbet_current_user") || "null");
      if (cur?.uid === uid) {
        email = cur.email || "";
        displayName = cur.displayName || "";
        phone = cur.phone || "";
      }
    } catch {}
    if (!email) {
      try {
        const users = JSON.parse(localStorage.getItem("letsbet_users") || "{}");
        for (const k of Object.keys(users)) {
          if (users[k]?.user?.uid === uid) {
            email = users[k].user.email || k;
            displayName = users[k].user.displayName || "";
            phone = users[k].user.phone || "";
            break;
          }
        }
      } catch {}
    }
    const rounded = Math.round(balance * 10000) / 10000;
    setDoc(
      doc(db, "users", uid),
      { email, displayName, phone, balance: rounded, role: "user", suspended: false, phoneVerified: false, updatedAt: Date.now() },
      { merge: true }
    )
      .then(() => {
        if (lastRemoteUid === null || lastRemoteUid === uid) {
          lastRemoteUid = uid;
          lastRemoteBalance = rounded;
        }
      })
      .catch(() => {})
      .finally(() => {
        pendingPushes = Math.max(0, pendingPushes - 1);
      });
  } catch {
    pendingPushes = Math.max(0, pendingPushes - 1);
  }
}

export interface RemoteUser {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  balance: number;
  suspended: boolean;
}

export async function fetchRemoteUsers(): Promise<RemoteUser[]> {
  const snap = await getDocs(collection(db, "users"));
  const out: RemoteUser[] = [];
  snap.forEach((d) => {
    const v: any = d.data();
    out.push({
      uid: d.id,
      email: v.email || "",
      displayName: v.displayName || "",
       phone: v.phone || "",
       balance: typeof v.balance === "number" ? v.balance : 0,
       suspended: v.suspended === true,
     });
  });
  return out;
}
