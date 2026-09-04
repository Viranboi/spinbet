import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  photoURL: string | null;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

function getUsers(): Record<string, { password: string; user: LocalUser }> {
  try {
    return JSON.parse(localStorage.getItem("letsbet_users") || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { password: string; user: LocalUser }>) {
  localStorage.setItem("letsbet_users", JSON.stringify(users));
}

function generateUid() {
  return "lb_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("letsbet_current_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("letsbet_current_user");
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const users = getUsers();
    const entry = users[email.toLowerCase()];
    if (!entry || entry.password !== password) {
      throw new Error("Invalid email or password");
    }
    setUser(entry.user);
    localStorage.setItem("letsbet_current_user", JSON.stringify(entry.user));
  }

  async function register(email: string, password: string, displayName: string, phone?: string) {
    const users = getUsers();
    if (users[email.toLowerCase()]) {
      throw new Error("An account with this email already exists");
    }
    const newUser: LocalUser = {
      uid: generateUid(),
      email: email.toLowerCase(),
      displayName,
      phone: phone || "",
      photoURL: null,
    };
    users[email.toLowerCase()] = { password, user: newUser };
    saveUsers(users);
    setUser(newUser);
    localStorage.setItem("letsbet_current_user", JSON.stringify(newUser));
  }

  function adoptFirebaseUser(fu: any): LocalUser {
    if (!fu.email) throw new Error("Google account has no email");
    const users = getUsers();
    const key = fu.email.toLowerCase();
    const existing = users[key];
    if (existing) {
      setUser(existing.user);
      localStorage.setItem("letsbet_current_user", JSON.stringify(existing.user));
      return existing.user;
    }
    const newUser: LocalUser = {
      uid: fu.uid,
      email: key,
      displayName: fu.displayName || key.split("@")[0],
      phone: fu.phoneNumber || "",
      photoURL: fu.photoURL || null,
    };
    users[key] = { password: "google_oauth", user: newUser };
    saveUsers(users);
    setUser(newUser);
    localStorage.setItem("letsbet_current_user", JSON.stringify(newUser));
    return newUser;
  }

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) adoptFirebaseUser(result.user);
      })
      .catch(() => {});
  }, []);

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
      if (code === "auth/configuration-not-found") {
        throw new Error(
          "Google sign-in is not configured yet. Please register with email & password, or contact support."
        );
      }
      if (code === "auth/unauthorized-domain") {
        throw new Error("This domain is not authorized for Google sign-in yet.");
      }
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        throw new Error("Google sign-in was cancelled before completion.");
      }
      throw err;
    }
    adoptFirebaseUser(fu);
  }

  async function logout() {
    setUser(null);
    localStorage.removeItem("letsbet_current_user");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
