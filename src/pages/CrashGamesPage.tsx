import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Header from "../components/qwin/Header";
import SubNavbar from "../components/qwin/SubNavbar";
import HeroBanner from "../components/qwin/HeroBanner";
import {
  engineFor,
  CrashEngine,
  SlotEngine,
  MinesEngine,
  WheelEngine,
  FlipEngine,
  PlinkoEngine,
} from "../games/CasinoEngines";
import { credit, debit as walletDebit } from "../p2p/wallet";
import { toast } from "react-toastify";
import "./CrashGamesPage.scss";

type FilterTab = "all" | "slots" | "favourite" | "crash" | "spinners";

interface CrashGame {
  id: string;
  name: string;
  image: string;
  category: "crash" | "instant" | "slots" | "fishing" | "virtual" | "spinners";
}

const GAMES: CrashGame[] = [
  { id: "aviator", name: "Aviator", image: "/assets/games/aviator.jpg", category: "crash" },
  { id: "mines", name: "Mines", image: "/assets/games/mines.jpg", category: "instant" },
];

const FAV_KEY = "letsbet_crash_favs";

function loadFavs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function CrashGamesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [favs, setFavs] = useState<string[]>(loadFavs);
  const [launching, setLaunching] = useState<CrashGame | null>(null);

  const filtered = useMemo(() => {
    return GAMES.filter((g) => {
      const matchTab =
        activeTab === "all" ||
        (activeTab === "crash" && g.category === "crash") ||
        (activeTab === "slots" && g.category === "slots") ||
        (activeTab === "spinners" && g.category === "spinners") ||
        (activeTab === "favourite" && favs.includes(g.id));
      const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [activeTab, searchQuery, favs]);

  function toggleFav(id: string) {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  }

  function openGame(g: CrashGame) {
    if (g.id === "aviator") {
      navigate("/aviator");
      return;
    }
    if (g.id === "mines") {
      navigate("/mines");
      return;
    }
    setLaunching(g);
  }

  return (
    <div className="cg-page">
      <Header onMenu={() => setDrawerOpen(true)} />
      <SubNavbar onMenu={() => setDrawerOpen(true)} />

      <HeroBanner />

      {/* Search + Filters */}
      <div className="cg-toolbar">
        <div className="cg-toolbar-inner">
          {searchOpen ? (
            <div className="cg-search-expanded">
              <svg className="cg-search-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search Games"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="cg-search-input"
              />
              <button className="cg-search-close" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ) : (
            <>
              <button className="cg-search-btn" onClick={() => setSearchOpen(true)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </button>
              <div className="cg-tabs">
                <button className={`cg-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                  All
                </button>
                <button className={`cg-tab ${activeTab === "slots" ? "active" : ""}`} onClick={() => setActiveTab("slots")}>
                  <img src="/assets/games/slots-icon.svg" alt="" className="cg-tab-icon" />
                  Slots
                </button>
                <button className={`cg-tab ${activeTab === "favourite" ? "active" : ""}`} onClick={() => setActiveTab("favourite")}>
                  <img src="/assets/games/favorite-icon.svg" alt="" className="cg-tab-icon" />
                  Favourite
                </button>
                <button className={`cg-tab ${activeTab === "crash" ? "active" : ""}`} onClick={() => setActiveTab("crash")}>
                  <img src="/assets/games/crash-icon.svg" alt="" className="cg-tab-icon" />
                  Crash Games
                </button>
                <button className={`cg-tab ${activeTab === "spinners" ? "active" : ""}`} onClick={() => setActiveTab("spinners")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  Spinners
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Game Grid */}
      <div className="cg-grid-wrap">
        <div className="cg-grid">
          {filtered.map((g) => (
            <div key={g.id} className="cg-card" onClick={() => openGame(g)}>
              <img src={g.image} alt={g.name} className="cg-card-img" loading="lazy" />
              <button
                className={`cg-fav-btn ${favs.includes(g.id) ? "on" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleFav(g.id); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={favs.includes(g.id) ? "#fcd535" : "none"} stroke={favs.includes(g.id) ? "#fcd535" : "#fff"} strokeWidth="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="cg-empty">
            <span className="cg-empty-icon">🎮</span>
            <p>No games found</p>
          </div>
        )}
      </div>

      {/* Game Launch Modal */}
      {launching && (
        <div className="cg-modal-overlay" onClick={() => setLaunching(null)}>
          <div className="cg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-head">
              <span>{launching.name}</span>
              <button onClick={() => setLaunching(null)}>×</button>
            </div>
            {!user ? (
              <div className="cg-modal-gate">
                <span>🔒</span>
                <h3>Login required</h3>
                <p>Log in to play with your coin balance.</p>
              </div>
            ) : (
              (() => {
                const engineProps = {
                  game: { id: launching.id, name: launching.name, cat: "Crash" as const, icon: "🎮", rtp: 97, provider: "Various", gradient: "#1a1a2e", hot: false, new: false, players: 0 },
                  debit: (amount: number, note: string) => {
                    try { walletDebit(user.uid, amount, "casino_bet", launching.id, note); return true; }
                    catch (err: any) { toast.error(err.message); return false; }
                  },
                  creditWin: (amount: number, note: string) => {
                    credit(user.uid, amount, "casino_win", launching.id, note);
                    toast.success(`+${amount.toLocaleString()} coins`);
                  },
                };
                const e = engineFor(engineProps.game);
                if (e === "crash") return <CrashEngine {...engineProps} />;
                if (e === "slot") return <SlotEngine {...engineProps} />;
                if (e === "mines") return <MinesEngine {...engineProps} />;
                if (e === "wheel") return <WheelEngine {...engineProps} />;
                if (e === "plinko") return <PlinkoEngine {...engineProps} />;
                if (e === "flip") return <FlipEngine {...engineProps} />;
                return <CrashEngine {...engineProps} />;
              })()
            )}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="qw-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="qw-drawer">
            <div className="qw-drawer-head">
              <span>All Sports</span>
              <button onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
