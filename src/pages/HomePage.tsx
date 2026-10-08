import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu as MenuIcon, Search } from "lucide-react";
import Header from "../components/qwin/Header";
import { openSupportChat } from "../components/SupportChat";
import { CASINO_GAMES, type CasinoGame } from "./casinoGames";
import { SportsDataService, type SportMatch } from "../sports/sportsData";
import "./HomePage.scss";
import "./SportsPage.scss";

const SIDEBAR: { label: string; icon: string; cat: string }[] = [
  { label: "Providers Spotlight", icon: "🌟", cat: "providers" },
  { label: "All Games", icon: "🎮", cat: "all" },
  { label: "Sports Betting", icon: "⚽", cat: "sports" },
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

const TABS = ["All Games", "Popular", "New Games", "Provider Spotlight", "Crash", "Table Games"];

const TABLE_CATS = ["Table", "Card", "Roulette", "Blackjack", "Poker", "Baccarat"];
const CRASH_CATS = ["Crash", "Instant", "Dice"];

function GameThumb({ g, onClick }: { g: CasinoGame; onClick: () => void }) {
  return (
    <div className="ref-card" onClick={onClick}>
      <div className="ref-art" style={{ background: g.gradient }}>
        <span className="ref-emoji">{g.icon}</span>
        {g.thumb && (
          <img
            className="ref-thumb"
            src={g.thumb}
            alt={g.name}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        {g.hot && <span className="ref-badge hot">HOT</span>}
        {g.new && <span className="ref-badge new">NEW</span>}
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
  const [sportMatches, setSportMatches] = useState<SportMatch[]>([]);

  useEffect(() => {
    let on = true;
    SportsDataService.getFixtures().then((ms) => {
      if (on) setSportMatches(ms);
    }).catch(() => {});
    return () => { on = false; };
  }, []);

  function matchTab(g: CasinoGame): boolean {
    switch (activeTab) {
      case "Popular": return g.hot;
      case "New Games": return g.new;
      case "Provider Spotlight": return g.provider === "Pragmatic Play";
      case "Crash": return CRASH_CATS.includes(g.cat);
      case "Table Games": return TABLE_CATS.includes(g.cat);
      default: return true;
    }
  }

  function matchSide(g: CasinoGame): boolean {
    if (sideCat === "all" || sideCat === "providers") return true;
    if (sideCat === "new") return g.new;
    if (sideCat === "crash") return false;
    if (sideCat === "table") return TABLE_CATS.includes(g.cat);
    return g.cat.toLowerCase() === sideCat;
  }

  function matchQuery(g: CasinoGame): boolean {
    const q = query.trim().toLowerCase();
    return !q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q);
  }

  const filtered = CASINO_GAMES.filter((g) => matchTab(g) && matchSide(g) && matchQuery(g));
  const first10 = filtered.slice(0, 10);

  function play(g: CasinoGame) {
    if (g.id === "aviator") { navigate("/aviator"); return; }
    if (g.id === "mines") { navigate("/mines"); return; }
    navigate("/casino");
  }

  function sideClick(item: { label: string; icon: string; tab?: string; to?: string; cat: string }) {
    if (item.label === "Support") {
      openSupportChat();
      setDrawerOpen(false);
      return;
    }
    if (item.cat === "sports") {
      navigate("/sports");
    } else if (item.cat === "crash") {
      document.getElementById("crash-instant")?.scrollIntoView({ behavior: "smooth" });
    } else {
      setSideCat(item.cat);
      setActiveTab("All Games");
    }
    setDrawerOpen(false);
  }

  const sideNav = (
    <nav className="sb-sidenav">
      {SIDEBAR.map((s) => (
        <button
          key={s.label}
          className={`sb-side-item${sideCat === s.cat && s.cat !== "crash" ? " active" : ""}`}
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

          {/* ===== Top 10 casino games ===== */}
          <section className="sb-section">
            <div className="sb-section-head">
              <h3>🎰 Casino Games</h3>
              <button onClick={() => navigate("/casino")}>View All</button>
            </div>
            <div className="ref-grid">
              {first10.map((g) => <GameThumb key={g.id} g={g} onClick={() => play(g)} />)}
            </div>
            {filtered.length === 0 && <div className="sb-empty">No games in this section.</div>}
            {filtered.length > 10 && (
              <button className="sb-see-more" onClick={() => navigate("/casino")}>
                SEE MORE — {filtered.length - 10} MORE GAMES
                <span>→</span>
              </button>
            )}
          </section>

          {/* ===== Top 15 sports matches ===== */}
          <section className="sb-section">
            <div className="sb-section-head">
              <h3>⚽ Sports Matches</h3>
              <button onClick={() => navigate("/sports")}>View All</button>
            </div>
            <div className="sp-grid">
              {sportMatches.slice(0, 15).map((m) => (
                <div key={m.id} className={`sp-match${m.isLive ? " is-live" : ""}`} onClick={() => navigate("/sports")} style={{ cursor: "pointer" }}>
                  <div className="sp-match-head">
                    <span className="sp-league">{m.flag} {m.league}</span>
                    {m.isLive ? (
                      <span className="sp-live-badge"><i />LIVE {m.minute}&prime;</span>
                    ) : (
                      <span className="sp-time">{m.date} • {m.time}</span>
                    )}
                  </div>
                  <div className="sp-teams">
                    <div className="sp-team">
                      {m.homeLogo && <img src={m.homeLogo} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                      <span>{m.homeTeam}</span>
                    </div>
                    <div className="sp-score">{m.isLive ? `${m.liveScore.home} - ${m.liveScore.away}` : "vs"}</div>
                    <div className="sp-team right">
                      <span>{m.awayTeam}</span>
                      {m.awayLogo && <img src={m.awayLogo} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    </div>
                  </div>
                  <div className="sp-odds">
                    <button onClick={(e) => { e.stopPropagation(); navigate("/sports"); }}><i>1</i><em>{m.odds.home.toFixed(2)}</em></button>
                    <button onClick={(e) => { e.stopPropagation(); navigate("/sports"); }}><i>X</i><em>{m.odds.draw.toFixed(2)}</em></button>
                    <button onClick={(e) => { e.stopPropagation(); navigate("/sports"); }}><i>2</i><em>{m.odds.away.toFixed(2)}</em></button>
                  </div>
                </div>
              ))}
            </div>
            {sportMatches.length === 0 && <div className="sb-empty">Loading matches…</div>}
            <button className="sb-see-more" onClick={() => navigate("/sports")}>
              SEE MORE — ALL SPORTS MATCHES
              <span>→</span>
            </button>
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
        <button className="qw-tab" type="button" onClick={() => navigate("/notifications")}><span>🔔</span><span>Alerts</span></button>
        <button className="qw-tab" type="button" onClick={() => setDrawerOpen(true)}><MenuIcon size={20} /><span>Menu</span></button>
      </nav>
    </div>
  );
}
