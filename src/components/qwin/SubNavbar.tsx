import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Video, Gamepad2, HelpCircle, Trophy, TrendingUp, Gift,
} from "lucide-react";

const MAIN_ITEMS = [
  { label: "Sports", image: "/assets/nav/sports.png", path: "/", active: true },
  { label: "Live", image: "/assets/nav/live.png", live: true },
  { label: "Casino", image: "/assets/nav/casino.png", path: "/casino" },
  { label: "Aviator", image: "/assets/nav/aviator.png", path: "/aviator" },
  { label: "Free2Play", image: "/assets/nav/free2play.png" },
  { label: "SpinBet Leagues", image: "/assets/nav/leagues.png" },
  { label: "Crash Games", image: "/assets/nav/crash.png", path: "/crash-games" },
];

const MORE_ITEMS = [
  { label: "Promos", icon: <Gift size={15} />, path: "/promotions" },
  { label: "Live Casino", icon: <Video size={15} /> },
  { label: "Virtuals", icon: <Gamepad2 size={15} /> },
  { label: "How To", icon: <HelpCircle size={15} /> },
  { label: "Jackpot", icon: <Trophy size={15} /> },
  { label: "Big Wins", icon: <TrendingUp size={15} /> },
];

const UTILITIES = [
  { label: "Prepaid", image: "/assets/nav/prepaid.png" },
  { label: "Check Betslip", image: "/assets/nav/check-betslip.png" },
  { label: "Virtual Shop", image: "/assets/nav/virtual-shop.png" },
];

export default function SubNavbar({ onMenu }: { onMenu?: () => void }) {
  const [moreOpen, setMoreOpen] = useState(false);

  const renderItem = (it: {
    label: string; image: string; path?: string; live?: boolean; active?: boolean;
  }) => {
    const inner = (
      <>
        <span className={`wn-nav-ico ${it.active ? "ringed" : ""}`}>
          <img className="wn-nav-image" src={it.image} alt="" />
        </span>
        <span className="wn-nav-label">{it.label}</span>
        {it.live && <i className="wn-live-dot" />}
      </>
    );
    return it.path ? (
      <Link key={it.label} to={it.path} className={`wn-nav-item ${it.active ? "active" : ""}`}>{inner}</Link>
    ) : (
      <button key={it.label} type="button" className={`wn-nav-item ${it.active ? "active" : ""}`}>{inner}</button>
    );
  };

  return (
    <nav className="wn-nav">
      <div className="wn-nav-scroll">
        <ul className="wn-nav-main">
          <li key="menu">
            <button type="button" className="wn-nav-item" onClick={onMenu}>
              <span className="wn-nav-ico"><img className="wn-nav-image" src="/assets/nav/menu.png" alt="" /></span>
              <span className="wn-nav-label">Menu</span>
            </button>
          </li>
          {MAIN_ITEMS.map((it) => (
            <li key={it.label}>{renderItem(it)}</li>
          ))}
          <li className={`wn-more ${moreOpen ? "open" : ""}`}>
            <button
              type="button"
              className="wn-nav-item"
              onClick={() => setMoreOpen((o) => !o)}
              onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
            >
              <span className="wn-nav-ico"><img className="wn-nav-image" src="/assets/nav/more.png" alt="" /></span>
              <span className="wn-nav-label">More</span>
            </button>
            <ul className="wn-more-menu">
              {MORE_ITEMS.map((m) => (
                <li key={m.label}>
                  {m.path ? (
                    <Link to={m.path} onClick={() => setMoreOpen(false)}>
                      <span className="wn-more-ico">{m.icon}</span>{m.label}
                    </Link>
                  ) : (
                    <button type="button">
                      <span className="wn-more-ico">{m.icon}</span>{m.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </li>
        </ul>

        <div className="wn-nav-utils">
          {UTILITIES.map((u) => (
            <button key={u.label} type="button" className="wn-nav-item">
              <span className="wn-nav-ico plain"><img className="wn-nav-image" src={u.image} alt="" /></span>
              <span className="wn-nav-label">{u.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
