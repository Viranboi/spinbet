import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useWallet } from "../../p2p/hooks";
import AuthModal from "../../auth/AuthModal";
import NotificationsBell from "../NotificationsBell";
import { UserPersonIcon } from "./icons";

function UkFlag() {
  return (
    <svg className="wn-flag" viewBox="0 0 60 30" width="20" height="14" aria-hidden="true">
      <clipPath id="wn-uk-c"><rect width="60" height="30" rx="2" /></clipPath>
      <g clipPath="url(#wn-uk-c)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 60,30M60,0 0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 60,30M60,0 0,30" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export default function Header({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  function openLogin() { setAuthMode("login"); setAuthOpen(true); }
  function openJoin() { setAuthMode("register"); setAuthOpen(true); }

  const balanceText =
    typeof balance === "number"
      ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : String(balance);

  return (
    <>
      <header className="wn-header">
        <div className="wn-header-left">
          <Link to="/" className="wn-logo" aria-label="SpinBet home">
            <img src="/assets/spinbet-logo.png" alt="SpinBet" />
          </Link>
        </div>

        <div className="wn-header-right">
          <button className="wn-lang">
            <UkFlag />
            <span>English</span>
            <ChevronDown size={13} />
          </button>

          {user ? (
            <>
               <div className="wn-balance" aria-label="Account balances">
                  <div className="wn-bal-metric">
                    <span className="lbl">Balance</span>
                    <strong>${balanceText}</strong>
                  </div>
                  <div className="wn-bal-metric">
                    <span className="lbl">Free Bet</span>
                    <strong>$0</strong>
                  </div>
                </div>
              <Link to="/deposit" className="wn-btn accent">Deposit</Link>
              <NotificationsBell dark />
              <button className="wn-avatar" onClick={logout} title="Logout">
                <UserPersonIcon size={22} />
                <i className="dot" />
              </button>
            </>
          ) : (
            <>
              <button className="wn-btn login" onClick={openLogin}>LOGIN</button>
              <button className="wn-btn accent join" onClick={openJoin}>JOIN</button>
            </>
          )}
        </div>
      </header>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}
