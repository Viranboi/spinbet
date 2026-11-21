import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase";
import { mirrorProfile, ensureRemoteLoop } from "../p2p/remote";

interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  photoURL: string | null;
  suspended?: boolean;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, phone?: string, referralCode?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

function getLocalUsers(): Record<string, { password: string; user: LocalUser }> {
  try {
    return JSON.parse(localStorage.getItem("letsbet_users") || "{}");
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, { password: string; user: LocalUser }>) {
  localStorage.setItem("letsbet_users", JSON.stringify(users));
}

function cacheLocalUser(u: LocalUser) {
  setLocalCache(u);
  try {
    const users = getLocalUsers();
    const key = u.email.toLowerCase();
    if (!users[key]) {
      users[key] = { password: "firebase_auth", user: u };
      saveLocalUsers(users);
    } else if (users[key].user.uid !== u.uid) {
      users[key] = { password: users[key].password, user: u };
      saveLocalUsers(users);
    }
  } catch {}
}

function setLocalCache(u: LocalUser) {
  localStorage.setItem("letsbet_current_user", JSON.stringify(u));
}

async function syncFirebaseUser(fu: FirebaseUser, fallback?: { displayName?: string; phone?: string }): Promise<LocalUser> {
  const email = (fu.email || "").toLowerCase();
  if (!email) throw new Error("Account has no email");
  let phone = (fu as any).phoneNumber || fallback?.phone || "";
  let displayName = fu.displayName || fallback?.displayName || email.split("@")[0];
  let photoURL: string | null = fu.photoURL || null;
  try {
    const ref = doc(db, "users", fu.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d: any = snap.data();
       if (d.suspended === true) {
         try { await signOut(auth); } catch {}
         const err: any = new Error("Your account has been banned.");
         err.code = "account-banned";
         throw err;
       }
      if (d.displayName) displayName = d.displayName;
      if (d.phone) phone = d.phone;
      if (d.photoURL !== undefined) photoURL = d.photoURL || photoURL;
      await setDoc(
        ref,
        { email, displayName, phone, photoURL, updatedAt: Date.now() },
        { merge: true }
      ).catch(() => {});
    } else {
      await setDoc(ref, {
        email,
        displayName,
        phone,
        photoURL,
        balance: 0,
        role: "user",
        suspended: false,
        phoneVerified: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  } catch {}
  const u: LocalUser = { uid: fu.uid, email, displayName, phone: phone || "", photoURL, suspended: false };
  cacheLocalUser(u);
  try {
    mirrorProfile(u);
  } catch {}
  return u;
}

function friendlyAuthError(err: any): Error {
  const code = err?.code || "";
  if (code === "account-banned") return new Error("Your account has been banned.");
  if (code === "auth/email-already-in-use") return new Error("An account with this email already exists");
  if (code === "auth/invalid-email") return new Error("Invalid email address");
  if (code === "auth/weak-password") return new Error("Password should be at least 6 characters");
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential")
    return new Error("Invalid email or password");
  if (code === "auth/operation-not-allowed")
    return new Error("Email/password sign-in is not enabled in Firebase Console. Enable it under Authentication > Sign-in method.");
  if (code === "auth/configuration-not-found")
    return new Error("Google sign-in is not configured yet. Enable Google provider in Firebase Console.");
  if (code === "auth/unauthorized-domain") return new Error("This domain is not authorized for sign-in yet. Add aviator-crash-rose.vercel.app in Firebase Auth > Authorized domains.");
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request")
    return new Error("Sign-in was cancelled before completion.");
  if (err?.message) return new Error(String(err.message).replace("Firebase: ", "").replace(/\(auth\/.*?\)\.?/, ""));
  return new Error("Authentication failed");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureRemoteLoop();
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          try {
            const u = await syncFirebaseUser(result.user);
            setUser(u);
          } catch {}
        }
      })
      .catch(() => {});
    const unsub = onAuthStateChanged(auth, async (fu) => {
      if (fu) {
        try {
          const u = await syncFirebaseUser(fu);
          setUser(u);
         } catch (err: any) {
           if (err?.code === "account-banned") {
             try { signOut(auth); } catch {}
             setUser(null);
             localStorage.removeItem("letsbet_current_user");
             setLoading(false);
             return;
           }
           const email = (fu.email || "").toLowerCase();
          setUser({
            uid: fu.uid,
            email,
            displayName: fu.displayName || email.split("@")[0],
            phone: (fu as any).phoneNumber || "",
            photoURL: fu.photoURL || null,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

   // Auto-logout if an admin bans this account while session is active.
   useEffect(() => {
     if (!user?.uid) return;
     const ref = doc(db, "users", user.uid);
     const unsub = onSnapshot(
       ref,
       (snap) => {
         if (snap.exists() && snap.data()?.suspended === true) {
           try { signOut(auth); } catch {}
           setUser(null);
           localStorage.removeItem("letsbet_current_user");
         }
       },
       () => {}
     );
     return () => unsub();
   }, [user?.uid]);

   async function register(email: string, password: string, displayName: string, phone?: string, referralCode?: string) {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (displayName) {
        try {
          await updateProfile(cred.user, { displayName });
        } catch {}
      }
      const u = await syncFirebaseUser(cred.user, { displayName, phone });
      // Referral setup
      try {
        const { generateReferralCode, setReferrer } = await import("../p2p/referrals");
        generateReferralCode(u.uid);
        if (referralCode) setReferrer(u.uid, referralCode);
        // persist referral code on user doc
        try {
          const { doc, setDoc } = await import("firebase/firestore");
          const { db } = await import("../firebase");
          await setDoc(doc(db, "users", u.uid), { referralCode: generateReferralCode(u.uid), referredBy: referralCode || null }, { merge: true }).catch(() => {});
        } catch {}
      } catch {}
      setUser(u);
    } catch (err: any) {
      throw friendlyAuthError(err);
    }
  }

  async function login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const u = await syncFirebaseUser(cred.user);
      setUser(u);
    } catch (err: any) {
      const code = err?.code || "";
      // Backward compat: old local-only accounts created before Firebase migration.
      if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password") {
        try {
          const users = getLocalUsers();
           const entry = users[cleanEmail];
           if (entry && entry.password === password) {
             if (entry.user?.suspended) {
               const err: any = new Error("Your account has been banned.");
               err.code = "account-banned";
               throw err;
             }
             setUser(entry.user);
            setLocalCache(entry.user);
            try {
              mirrorProfile(entry.user);
            } catch {}
            return;
          }
        } catch {}
      }
      throw friendlyAuthError(err);
    }
  }

  async function loginWithGoogle() {
    let fu;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      fu = result.user;
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw friendlyAuthError(err);
    }
    const u = await syncFirebaseUser(fu as FirebaseUser);
    setUser(u);
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    localStorage.removeItem("letsbet_current_user");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
