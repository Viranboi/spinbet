import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu as MenuIcon, Search } from "lucide-react";
import { toast } from "react-toastify";
import Header from "../components/qwin/Header";
import "./HomePage.scss";

interface LobbyGame {
  id: string;
  name: string;
  provider: string;
  icon: string;
  grad: string;
  cat: "slots" | "table" | "live" | "crash" | "instant";
  hot?: boolean;
  isNew?: boolean;
}

const POPULAR: LobbyGame[] = [
  { id: "serpent", name: "Serpent Shrine", provider: "SpinBet Originals", icon: "🐍", grad: "linear-gradient(135deg,#065f46,#a3a847)", cat: "slots", hot: true },
  { id: "gates-ss", name: "Gates of Olympus Super Scatter", provider: "Pragmatic Play", icon: "⚡", grad: "linear-gradient(135deg,#4c1d95,#c026d3)", cat: "slots", hot: true },
  { id: "wanted", name: "Wanted Dead or a Wild", provider: "Hacksaw", icon: "🤠", grad: "linear-gradient(135deg,#7c2d12,#b45309)", cat: "slots" },
  { id: "coin-strike", name: "Coin Strike Hold and Win", provider: "Playson", icon: "🪙", grad: "linear-gradient(135deg,#1e3a8a,#f59e0b)", cat: "slots", isNew: true },
  { id: "hot-chilli", name: "Super Hot Chilli", provider: "Red Tiger", icon: "🌶️", grad: "linear-gradient(135deg,#991b1b,#f97316)", cat: "slots" },
  { id: "duck", name: "Duck Hunters", provider: "Nolimit City", icon: "🦆", grad: "linear-gradient(135deg,#0c4a6e,#22d3ee)", cat: "slots", isNew: true },
  { id: "gates-1000", name: "Gates of Olympus 1000", provider: "Pragmatic Play", icon: "🏛️", grad: "linear-gradient(135deg,#581c87,#fbbf24)", cat: "slots", hot: true },
];

const FEATURED: LobbyGame[] = [
  { id: "sweet", name: "Sweet Bonanza", provider: "Pragmatic Play", icon: "🍭", grad: "linear-gradient(135deg,#db2777,#f9a8d4)", cat: "slots", hot: true },
  { id: "bass", name: "Big Bass Splash", provider: "Pragmatic Play", icon: "🎣", grad: "linear-gradient(135deg,#0369a1,#34d399)", cat: "slots" },
  { id: "blackjack", name: "Blackjack Classic", provider: "Evolution", icon: "♠️", grad: "linear-gradient(135deg,#111827,#374151)", cat: "table" },
  { id: "roulette", name: "European Roulette", provider: "Evolution", icon: "🎡", grad: "linear-gradient(135deg,#7f1d1d,#ef4444)", cat: "table", isNew: true },
  { id: "crazy", name: "Crazy Time", provider: "Evolution", icon: "🎪", grad: "linear-gradient(135deg,#6d28d9,#ec4899)", cat: "live", hot: true },
  { id: "sugar", name: "Sugar Rush", provider: "Pragmatic Play", icon: "🍬", grad: "linear-gradient(135deg,#9333ea,#f0abfc)", cat: "slots", isNew: true },
];

const SIDEBAR: { label: string; icon: string; cat: string }[] = [
  { label: "Providers Spotlight", icon: "🌟", cat: "providers" },
  { label: "All Games", icon: "🎮", cat: "all" },
  { label: "New Games", icon: "🆕", cat: "new" },
  { label: "Drops and Wins", icon: "💧", cat: "all" },
  { label: "Live Casino", icon: "📹", cat: "live" },
  { label: "Blackjack", icon: "♠️", cat: "table" },
  { label: "Roulette", icon: "🎡", cat: "table" },
  { label: "Slots", icon: "🎰", cat: "slots" },
  { label: "Crash Games", icon: "🚀", cat: "crash" },
  { label: "Game Shows", icon: "🎪", cat: "live" },
  { label: "VIP Program", icon: "👑", cat: "all" },
  { label: "Wednesday Free Spins", icon: "🌀", cat: "all" },
  { label: "Challenges", icon: "🏁", cat: "all" },
  { label: "Blog", icon: "📰", cat: "all" },
  { label: "Support", icon: "💬", cat: "all" },
];

const TABS = ["All Games", "Popular", "Featured", "Provider Spotlight", "New Games", "Table Games"];

function Thumb({ g, onClick }: { g: LobbyGame; onClick: () => void }) {
  return (
    <div className="ref-card" onClick={onClick}>
      <div className="ref-art" style={{ background: g.grad }}>
        <span className="ref-emoji">{g.icon}</span>
        {g.hot && <span className="ref-badge hot">HOT</span>}
        {g.isNew && <span className="ref-badge new">NEW</span>}
        <span className="ref-hover">▶ Play now</span>
      </div>
      <div className="ref-name">{g.name}</div>
      <div className="ref-sub">{g.provider}</div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All Games");
  const [sideCat, setSideCat] = useState("all");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function matchTab(g: LobbyGame): boolean {
    switch (activeTab) {
      case "Popular": return !!g.hot;
      case "Featured": return true;
      case "Provider Spotlight": return g.provider === "Pragmatic Play";
      case "New Games": return !!g.isNew;
      case "Table Games": return g.cat === "table" || g.cat === "live";
      default: return true;
    }
  }

  function matchSide(g: LobbyGame): boolean {
    if (sideCat === "all" || sideCat === "providers") return true;
    if (sideCat === "new") return !!g.isNew;
    if (sideCat === "crash") return false; // crash lives in its own section below
    return g.cat === sideCat;
  }

  function matchQuery(g: LobbyGame): boolean {
    const q = query.trim().toLowerCase();
    return !q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q);
  }

  const popular = POPULAR.filter((g) => matchTab(g) && matchSide(g) && matchQuery(g));
  const featured = FEATURED.filter((g) => matchTab(g) && matchSide(g) && matchQuery(g));

  function soon(g: LobbyGame) {
    toast.info(`${g.name} is coming soon to SpinBet — try Aviator & Mines below!`);
  }

  function goCrash(id: string) {
    document.getElementById("crash-instant")?.scrollIntoView({ behavior: "smooth" });
    if (id === "aviator") setTimeout(() => navigate("/aviator"), 600);
    if (id === "mines") setTimeout(() => navigate("/mines"), 600);
  }

  const sideNav = (
    <nav className="sb-sidenav">
      {SIDEBAR.map((s) => (
        <button
          key={s.label}
          className={`sb-side-item${sideCat === s.cat && s.cat !== "crash" ? " active" : ""}`}
          onClick={() => {
            if (s.cat === "crash") {
              document.getElementById("crash-instant")?.scrollIntoView({ behavior: "smooth" });
            } else {
              setSideCat(s.cat);
              setActiveTab("All Games");
            }
            setDrawerOpen(false);
          }}
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
          {/* ===== 3 promo banners ===== */}
          <section className="sb-banners">
            <div className="sb-banner">
              <div className="sb-banner-kicker">SPINBET EXCLUSIVE</div>
              <h2>MORE WAYS<br />TO WIN</h2>
              <p>New drops every week with huge prizes</p>
              <button className="sb-btn-gold" onClick={() => navigate("/aviator")}>Join Now</button>
              <span className="sb-banner-art">🎰</span>
            </div>
            <div className="sb-banner">
              <div className="sb-banner-kicker">PRAGMATIC PLAY</div>
              <h2>PROVIDER<br />SPOTLIGHT</h2>
              <p>Gates of Olympus &amp; Sweet Bonanza</p>
              <button className="sb-btn-ghost" onClick={() => { setActiveTab("Provider Spotlight"); }}>Play Now</button>
              <span className="sb-banner-art">🏆</span>
            </div>
            <div className="sb-banner">
              <div className="sb-banner-kicker">EVERY WEDNESDAY</div>
              <h2>WEEKLY<br />FREE SPINS</h2>
              <p>Deposit &amp; get rewarded on SpinBet</p>
              <button className="sb-btn-ghost" onClick={() => navigate("/promotions")}>Learn More</button>
              <span className="sb-banner-art">🪙</span>
            </div>
          </section>

          {/* ===== filter tabs ===== */}
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
            <button className="sb-btn-gold sb-prov-btn" onClick={() => setActiveTab("Provider Spotlight")}>PROVIDERS</button>
          </section>

          {/* ===== Popular ===== */}
          <section className="sb-section">
            <div className="sb-section-head">
              <h3>🔥 Popular</h3>
              <button onClick={() => { setActiveTab("All Games"); setSideCat("all"); }}>View All</button>
            </div>
            <div className="ref-grid">
              {popular.map((g) => <Thumb key={g.id} g={g} onClick={() => soon(g)} />)}
            </div>
            {popular.length === 0 && <div className="sb-empty">No games in this section.</div>}
          </section>

          {/* ===== Featured ===== */}
          <section className="sb-section">
            <div className="sb-section-head">
              <h3>⭐ Featured</h3>
              <button onClick={() => navigate("/casino")}>View All</button>
            </div>
            <div className="ref-grid">
              {featured.map((g) => <Thumb key={g.id} g={g} onClick={() => soon(g)} />)}
            </div>
            {featured.length === 0 && <div className="sb-empty">No games in this section.</div>}
          </section>

          {/* ===== Crash & Instant — Aviator + Mines playable on scroll ===== */}
          <section className="sb-section" id="crash-instant">
            <div className="sb-section-head">
              <h3>🚀 Crash &amp; Instant — Play Now</h3>
              <button onClick={() => navigate("/casino")}>View All</button>
            </div>
            <div className="sb-featured">
              <button className="sb-feat" style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)" }} onClick={() => navigate("/aviator")}>
                <span className="sb-feat-emoji">✈️</span>
                <span className="sb-feat-body"><b>Aviator</b><i>Spribe • 97% RTP • Cash out before fly-away</i></span>
                <span className="sb-feat-cta">PLAY NOW</span>
              </button>
              <button className="sb-feat" style={{ background: "linear-gradient(135deg,#059669,#0EA5E9)" }} onClick={() => navigate("/mines")}>
                <span className="sb-feat-emoji">💣</span>
                <span className="sb-feat-body"><b>Mines</b><i>Spribe • 97% RTP • Find gems, avoid bombs</i></span>
                <span className="sb-feat-cta">PLAY NOW</span>
              </button>
            </div>
            {/* quick launch tiles */}
            <div className="ref-grid crash-tiles">
              <Thumb g={{ id: "aviator", name: "Aviator", provider: "Spribe • Crash", icon: "✈️", grad: "linear-gradient(135deg,#7C3AED,#DB2777)", cat: "crash", hot: true }} onClick={() => goCrash("aviator")} />
              <Thumb g={{ id: "mines", name: "Mines", provider: "Spribe • Instant", icon: "💣", grad: "linear-gradient(135deg,#059669,#0EA5E9)", cat: "instant", hot: true }} onClick={() => goCrash("mines")} />
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
