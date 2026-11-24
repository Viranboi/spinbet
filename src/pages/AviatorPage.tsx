import React from "react";
import "./AviatorPage.scss";
import "./AviatorPremium.scss";
import { Provider } from "../context";
import Header from "../components/header";
import BetsUsers from "../components/bet-users";
import Main from "../components/Main";
import Context from "../context";
import { useAuth } from "../auth/AuthContext";
import { useBlocked } from "../p2p/hooks";
import { useNavigate } from "react-router-dom";
import AuthModal from "../auth/AuthModal";

// Legacy hardcoded list (kept as fallback) — prefer the 🔒 Lock button in /admin.
const BLOCKED_AVIATOR_EMAILS = ["shyakairatuzi@gmail.com"];

function BlockedConnection() {
  return (
    <div className="main-container">
      <Header />
      <div className="game-container">
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            textAlign: "center",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 56 }}>📡</div>
          <h2 style={{ marginTop: 16 }}>Connection lost</h2>
          <p style={{ marginTop: 8, color: "#9aa3b5", fontSize: 16 }}>
            Your connection are not stable. Please check your internet and try again.
          </p>
          <button
            style={{
              marginTop: 24,
              padding: "12px 40px",
              borderRadius: 10,
              border: 0,
              background: "#e0261b",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            RETRY
          </button>
        </div>
      </div>
    </div>
  );
}

function AviatorGame() {
  const { unityLoading, rechargeState, currentProgress } =
    React.useContext(Context);

  return (
    <div className="main-container">
      {!unityLoading && (
        <div className="spribe-splash">
          <img src="/assets/spribe-loading.png" alt="Powered by Spribe" className="spribe-loading-img" />
          <div className="spribe-progress">
            <div className="spribe-progress-bar" style={{ width: `${Math.max(2, currentProgress)}%` }} />
          </div>
          <div className="spribe-progress-text">{Math.round(currentProgress)}%</div>
          <div className="spribe-dots">
            <i /><i /><i />
          </div>
          <div className="spribe-progress-hint">Loading game engine… large 3D assets may take a moment on slow connections.</div>
        </div>
      )}
      {rechargeState && (
        <div className="recharge">
          <div className="recharge-body">
            <div className="recharge-body-font">
              Insufficient balance amount
            </div>
          </div>
        </div>
      )}
      <Header />
      <div className="game-container">
        <BetsUsers />
        <Main />
      </div>
    </div>
  );
}

export default function AviatorPage() {
  return (
    <div className="aviator-page">
      <Provider>
        <AviatorGate />
      </Provider>
    </div>
  );
}

function AviatorGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const locked = useBlocked();
  const [authOpen, setAuthOpen] = React.useState(true);
  if (!user) {
    return (
      <div className="main-container">
        <Header />
        <div className="game-container" style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#1a1d24", padding: 32, borderRadius: 12, textAlign: "center", color: "#fff", maxWidth: 360 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✈️</div>
            <h3 style={{ marginBottom: 8 }}>Login required</h3>
            <p style={{ color: "#9aa3b5", marginBottom: 16 }}>Create an account or log in to play Aviator.</p>
            <button onClick={() => navigate("/casino")} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#333", color: "#fff", cursor: "pointer" }}>Browse Casino</button>
          </div>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => { setAuthOpen(false); navigate("/casino"); }} initialMode="register" />
      </div>
    );
  }
  const blocked =
    locked ||
    (!!user?.email &&
      BLOCKED_AVIATOR_EMAILS.includes(user.email.toLowerCase()));
  if (blocked) return <BlockedConnection />;
  return <AviatorGame />;
}
