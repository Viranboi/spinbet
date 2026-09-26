import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu as MenuIcon, Search } from "lucide-react";
import Header from "../components/qwin/Header";
import "./HomePage.scss";

interface LobbyGame {
  id: string;
  name: string;
  provider: string;
  icon: string;
  grad: string;
  rtp: string;
  live?: boolean;
  to?: string;
  soon?: boolean;
}

const PLAYABLE: LobbyGame[] = [
  {
    id: "aviator", name: "Aviator", provider: "Spribe", icon: "✈️",
    grad: "linear-gradient(135deg,#7C3AED,#DB2777)", rtp: "97% RTP", live: true, to: "/aviator",
  },
  {
    id: "mines", name: "Mines", provider: "Spribe", icon: "💣",
    grad: "linear-gradient(135deg,#059669,#0EA5E9)", rtp: "97% RTP", live: true, to: "/mines",
  },
];

const COMING_SOON: LobbyGame[] = [
  { id: "jetx", name: "JetX", provider: "SmartSoft", icon: "🛩️", grad: "linear-gradient(135deg,#DC2626,#F59E0B)", rtp: "97% RTP", soon: true },
  { id: "dice", name: "Dice", provider: "Spribe", icon: "🎲", grad: "linear-gradient(135deg,#2563EB,#7C3AED)", rtp: "98% RTP", soon: true },
  { id: "plinko", name: "Plinko", provider: "BGaming", icon: "🔮", grad: "linear-gradient(135deg,#D97706,#EF4444)", rtp: "97% RTP", soon: true },
  { id: "hilo", name: "Hi-Lo", provider: "Spribe", icon: "🃏", grad: "linear-gradient(135deg,#DB2777,#7C3AED)", rtp: "97% RTP", soon: true },
];

const SIDEBAR = [
  { label: "All Games", icon: "🎮", tab: "all" },
  { label: "Aviator", icon: "✈️", to: "/aviator" },
  { label: "Mines", icon: "💣", to: "/mines" },
  { label: "Casino", icon: "🎰", to: "/casino" },
  { label: "Crash Games", icon: "🚀", to: "/crash-games" },
  { label: "Promotions", icon: "🎁", to: "/promotions" },
  { label: "Deposit", icon: "💰", to: "/deposit" },
  { label: "Support", icon: "💬", tab: "support" },
];

const TABS = ["All Games", "Popular", "Featured", "New Games"];

function GameCard({ g, onPlay }: { g: LobbyGame; onPlay: (g: LobbyGame) => void }) {
  return (
    <div className={`sb-card${g.soon ? " is-soon" : ""}`} onClick={() => onPlay(g)}>
      <div className="sb-art" style={{ background: g.grad }}>
        <span className="sb-emoji">{g.icon}</span>
        {g.live && <span className="sb-hot">HOT</span>}
        {g.soon && <span className="sb-soon-tag">SOON</span>}
        {!g.soon && <span className="sb-play">▶ Play now</span>}
      </div>
      <div className="sb-meta">
        <span className="sb-name">{g.name}</span>
        <span className="sb-provider">{g.provider} • {g.rtp}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Popular");
  const [query, setQuery] = useState("");
  const [sideTab, setSideTab] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allGames = useMemo(() => [...PLAYABLE, ...COMING_SOON], []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allGames.filter((g) => {
      if (activeTab === "Popular" && g.soon) return false;
      if (activeTab === "Featured" && g.soon) return false;
      if (activeTab === "New Games" && !g.soon) return false;
      if (q && !g.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allGames, activeTab, query]);

  function play(g: LobbyGame) {
    if (g.soon || !g.to) return;
    navigate(g.to);
  }

  function sideClick(item: { label: string; icon: string; tab?: string; to?: string }) {
    if (item.to) {
      navigate(item.to);
    } else {
      setSideTab(item.tab || "all");
      setActiveTab("All Games");
    }
    setDrawerOpen(false);
  }

  const sideNav = (
    <nav className="sb-sidenav">
      <div className="sb-side-search">
        <Search size={15} />
        <input placeholder="Search games…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {SIDEBAR.map((s) => (
        <button
          key={s.label}
          className={`sb-side-item${!s.to && sideTab === s.tab ? " active" : ""}`}
          onClick={() => sideClick(s)}
        >
          <span className="sb-side-ico">{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
      <div className="sb-side-promo">
        <div className="sb-side-promo-title">WEEKLY FREE SPINS</div>
        <div className="sb-side-promo-sub">Every Wednesday on SpinBet</div>
        <button onClick={() => navigate("/promotions")}>Learn More</button>
      </div>
    </nav>
  );

  return (
    <div className="sb-app">
      <Header onMenu={() => setDrawerOpen(true)} />

      <div className="sb-layout">
        <aside className="sb-left">{sideNav}</aside>

        <main className="sb-main">
          {/* promo banners */}
          <section className="sb-banners">
            <div className="sb-banner">
              <div className="sb-banner-kicker">SPINBET EXCLUSIVE</div>
              <h2>MORE WAYS<br />TO WIN</h2>
              <p>Aviator &amp; Mines with instant payouts</p>
              <button className="sb-btn-gold" onClick={() => navigate("/aviator")}>Play Now</button>
              <span className="sb-banner-art">🎰</span>
            </div>
            <div className="sb-banner">
              <div className="sb-banner-kicker">SPRIBE</div>
              <h2>PROVIDER<br />SPOTLIGHT</h2>
              <p>Provably fair crash &amp; instant games</p>
              <button className="sb-btn-ghost" onClick={() => navigate("/casino")}>Play Now</button>
              <span className="sb-banner-art">🏆</span>
            </div>
            <div className="sb-banner">
              <div className="sb-banner-kicker">EVERY WEEK</div>
              <h2>WEEKLY<br />FREE SPINS</h2>
              <p>Deposit &amp; get rewarded on SpinBet</p>
              <button className="sb-btn-ghost" onClick={() => navigate("/promotions")}>Learn More</button>
              <span className="sb-banner-art">🪙</span>
            </div>
          </section>

          {/* filter tabs */}
          <section className="sb-toolbar">
            <div className="sb-tabs">
              {TABS.map((t) => (
                <button key={t} className={`sb-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="sb-tool-search">
              <Search size={15} />
              <input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </section>

          {/* popular */}
          <section className="sb-section">
            <div className="sb-section-head">
              <h3>🔥 Popular</h3>
              <button onClick={() => { setActiveTab("All Games"); }}>View All</button>
            </div>
            <div className="sb-grid">
              {filtered.map((g) => (
                <GameCard key={g.id} g={g} onPlay={play} />
              ))}
            </div>
            {filtered.length === 0 && <div className="sb-empty">No games found.</div>}
          </section>

          {/* featured */}
          <section className="sb-section">
            <div className="sb-section-head">
              <h3>⭐ Featured</h3>
              <button onClick={() => navigate("/casino")}>View All</button>
            </div>
            <div className="sb-featured">
              {PLAYABLE.map((g) => (
                <button key={g.id} className="sb-feat" style={{ background: g.grad }} onClick={() => play(g)}>
                  <span className="sb-feat-emoji">{g.icon}</span>
                  <span className="sb-feat-body">
                    <b>{g.name}</b>
                    <i>{g.provider} • {g.rtp}</i>
                  </span>
                  <span className="sb-feat-cta">PLAY NOW</span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>

      <footer className="sb-footer">
        <span className="sb-f-brand">SPINBET © {new Date().getFullYear()}</span>
        <span>18+ Play responsibly. Aviator &amp; Mines — provably fair.</span>
      </footer>

      {drawerOpen && (
        <>
          <div className="qw-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="qw-drawer sb-drawer">
            <div className="qw-drawer-head">
              <span>Menu</span>
              <button onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            {sideNav}
          </aside>
        </>
      )}

      <nav className="qw-tabbar sb-tabbar">
        <button className="qw-tab active" type="button" onClick={() => navigate("/")}><MenuIcon size={20} /><span>Home</span></button>
        <button className="qw-tab" type="button" onClick={() => navigate("/casino")}><span>🎰</span><span>Casino</span></button>
        <button className="qw-tab" type="button" onClick={() => navigate("/aviator")}><span>✈️</span><span>Aviator</span></button>
        <button className="qw-tab" type="button" onClick={() => navigate("/mines")}><span>💣</span><span>Mines</span></button>
        <button className="qw-tab" type="button" onClick={() => setDrawerOpen(true)}><MenuIcon size={20} /><span>Menu</span></button>
      </nav>
    </div>
  );
}
