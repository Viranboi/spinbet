import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useBlocked, useWallet } from "../../p2p/hooks";
import AuthModal from "../../auth/AuthModal";
import NotificationsBell from "../NotificationsBell";
import "./Navbar.scss";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  const blocked = useBlocked();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  function openLogin() { setAuthMode("login"); setAuthOpen(true); }
  function openRegister() { setAuthMode("register"); setAuthOpen(true); }

  return (
    <>
      <nav className="site-navbar">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <img src="/assets/spinbet-logo.png" alt="SpinBet logo" className="logo-img" />
          </Link>

          <div className="nav-right">
            {user ? (
              <>
                <div className="nav-balance">
                  <span className="balance-label">Balance</span>
                  <span className="balance-amount">{blocked ? "🔒 Locked" : `$${balance.toLocaleString()}`}</span>
                </div>
                <NotificationsBell />
                <Link to="/deposit" className="nav-deposit-btn">Deposit</Link>
                <Link to="/withdraw" className="nav-deposit-btn" style={{ background: "#fff" }}>Withdraw</Link>
                <button className="nav-user-btn">
                  <span className="user-avatar">{(user.displayName || user.email || "U")[0].toUpperCase()}</span>
                  <span className="user-name">{user.displayName || user.email?.split("@")[0] || "User"}</span>
                </button>
                <button className="nav-logout-btn" onClick={logout} title="Logout">⏻</button>
              </>
            ) : (
              <>
                <button className="nav-login-btn" onClick={openLogin}>Log In</button>
                <button className="nav-register-btn" onClick={openRegister}>Join</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}
