import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import "./AuthModal.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, initialMode = "register" }: Props) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) setReferralCode(ref);
    } catch {}
  }, []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(email, password, name, phone, referralCode);
        setSuccess(true);
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "").replace(/\(auth\/.*?\)\.?/, "") || "An error occurred");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    }
    setGoogleLoading(false);
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>×</button>

        <div className="auth-header">
          <span className="auth-logo">⚡</span>
          <h2>{mode === "register" ? "Create Account" : "Welcome Back"}</h2>
          <p>{mode === "register" ? "Join thousands of players across Africa" : "Sign in to continue playing"}</p>
        </div>

        {mode === "register" && !success && (
          <div className="auth-bonus-banner">
            <span className="bonus-icon">🎁</span>
            <div>
              <strong>100% Welcome Bonus</strong>
              <p>Get up to $100,000 on your first deposit!</p>
            </div>
          </div>
        )}

        {success ? (
          <div className="auth-success">
            <span className="success-icon">✅</span>
            <h3>Account Created!</h3>
            <p>Welcome to SpinBet. You can now log in.</p>
            <button className="auth-submit" onClick={() => { setSuccess(false); setMode("login"); setEmail(""); setPassword(""); }}>
              Continue to Login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              {mode === "register" && (
                <>
                  <div className="auth-field">
                    <label>Full Name</label>
                    <input type="text" placeholder="John Mwangi" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="auth-field">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="+250 7XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="auth-field">
                    <label>Referral Code (optional)</label>
                    <input type="text" placeholder="REF..." value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
                  </div>
                </>
              )}
              <div className="auth-field">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              {error && <div className="auth-error">{error}</div>}

              {mode === "register" && (
                <label className="auth-checkbox">
                  <input type="checkbox" required />
                  <span>I agree to the <a href="/terms">Terms & Conditions</a> and confirm I am 18+</span>
                </label>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button className="auth-google" onClick={handleGoogle} disabled={loading || googleLoading}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {googleLoading ? "Connecting..." : "Sign in with Google"}
            </button>

            <p className="auth-switch">
              {mode === "register" ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => { setError(""); setMode(mode === "register" ? "login" : "register"); }}>
                {mode === "register" ? "Sign In" : "Register Now"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
