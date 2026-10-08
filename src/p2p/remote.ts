import { db } from "../firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { load, save, emit } from "./storage";

const WALLET_KEY = "wallet";
let loopStarted = false;
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
  const rounded = Math.round(balance * 100) / 100;
  if (Math.round((all[uid] || 0) * 100) / 100 === rounded) return false;
  all[uid] = rounded;
  save(WALLET_KEY, all);
  emit(WALLET_KEY);
  return true;
}

/** Fire-and-forget: mirror local balance to Firestore so admin/other devices see it. */
export function pushBalance(uid: string, balance: number) {
  if (!uid) return;
  try {
    const rounded = Math.round(balance * 100) / 100;
    setDoc(
      doc(db, "users", uid),
      { balance: rounded, updatedAt: Date.now() },
      { merge: true }
    ).catch(() => {});
  } catch {}
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
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        // First time on this device: create doc from local balance so admin can see the user.
        const localBal = readLocal()[uid];
        mirrorProfileWithBalance(uid, typeof localBal === "number" ? localBal : 0);
        return;
      }
      const data: any = snap.data();
      if (typeof data?.balance === "number") applyRemoteBalance(uid, data.balance);
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
    setDoc(
      doc(db, "users", uid),
      { email, displayName, phone, balance: Math.round(balance * 100) / 100, updatedAt: Date.now() },
      { merge: true }
    ).catch(() => {});
  } catch {}
}

export interface RemoteUser {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  balance: number;
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
    });
  });
  return out;
}
