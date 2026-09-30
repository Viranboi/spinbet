import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";
import { CASINO_GAMES, PROVIDERS, CATEGORY_ICONS, CasinoGame } from "./casinoGames";
import { credit, debit as walletDebit } from "../p2p/wallet";
import { useWallet } from "../p2p/hooks";
import {
  engineFor,
  SlotEngine,
  CrashEngine,
  MinesEngine,
  WheelEngine,
  FlipEngine,
  PlinkoEngine,
  DriveItEngine,
} from "../games/CasinoEngines";
import "./CasinoPage.scss";

const CATEGORIES = ["All", "Instant", "Crash", "Slots", "Live", "Table", "Card", "Roulette", "Blackjack", "Poker", "Baccarat", "Dice", "Jackpot", "Fishing", "Virtual"];
const FAV_KEY = "letsbet_fav_games";
const UNLOCK_THRESHOLD = 10_000;
const LOW_THRESHOLD = 10;

function isLowMinGame(gameId: string) {
  return gameId === "aviator" || gameId === "mines" || gameId === "drive-it";
}

function loadFavs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function CasinoPage() {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [provider, setProvider] = useState("All");
  const [favs, setFavs] = useState<string[]>(loadFavs);
  const [launching, setLaunching] = useState<CasinoGame | null>(null);

  const filtered = useMemo(
    () =>
      CASINO_GAMES.filter((g) => {
        const matchCat = activeCat === "All" || g.cat === activeCat;
        const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchProvider = provider === "All" || g.provider === provider;
        return matchCat && matchSearch && matchProvider;
      }),
    [activeCat, searchQuery, provider]
  );

  function toggleFav(id: string) {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  }

  function openGame(g: CasinoGame) {
    if (g.id === "aviator") {
      navigate("/aviator");
      return;
    }
    setLaunching(g);
  }

  return (
    <div className="casino-page">
      <div className="casino-inner">
        <div className="casino-hero">
          <h1>Casino</h1>
          <p>{CASINO_GAMES.length} provably fair games from {PROVIDERS.length} top providers — instant $ payouts</p>
          <div className="casino-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search games…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="casino-categories">
          {CATEGORIES.map((cat) => (
            <button key={cat} className={`cat-btn ${activeCat === cat ? "active" : ""}`} onClick={() => setActiveCat(cat)}>
              <span className="cat-icon">{CATEGORY_ICONS[cat]}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>

        <div className="provider-row">
          <button className={`prov-chip ${provider === "All" ? "sel" : ""}`} onClick={() => setProvider("All")}>All providers</button>
          {PROVIDERS.map((p) => (
            <button key={p} className={`prov-chip ${provider === p ? "sel" : ""}`} onClick={() => setProvider(p)}>{p}</button>
          ))}
        </div>

        <div className="casino-count">Showing {filtered.length} of {CASINO_GAMES.length} games</div>

        <div className="casino-grid">
          {filtered.map((g) => (
            <div key={g.id} className={`casino-card ${g.hot ? "is-hot" : ""}`} onClick={() => openGame(g)}>
              {g.hot && <span className="hot-tag">HOT</span>}
              {g.new && <span className="new-tag">NEW</span>}
              <button
                className={`fav-btn ${favs.includes(g.id) ? "on" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleFav(g.id); }}
                title="Add to favourites"
              >
                ★
              </button>
              <div className="card-art" style={{ background: g.gradient }}>
                <span className="card-icon">{g.icon}</span>
                <img className="card-thumb" src={g.thumb} alt={g.name} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="card-provider">{g.provider}</span>
                <span className="card-play">▶ Play now</span>
              </div>
              <div className="card-body">
                <span className="card-name">{g.name}</span>
                <span className="card-cat">{g.cat}</span>
              </div>
              <div className="card-footer">
                <span className="card-players">{g.players.toLocaleString()} playing</span>
                <span className="card-rtp">{g.rtp}% RTP</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="casino-empty"><span>No games found matching your search.</span></div>
        )}
      </div>

      {launching && (
        <GameModal game={launching} index={CASINO_GAMES.findIndex((g) => g.id === launching.id)} onClose={() => setLaunching(null)} />
      )}
    </div>
  );
}

/* ---------------- launch modal ---------------- */

function GameModal({ game, index, onClose }: { game: CasinoGame; index: number; onClose: () => void }) {
  const { user } = useAuth();
  const { balance } = useWallet();
  const lowGame = isLowMinGame(game.id);
  const required = lowGame ? LOW_THRESHOLD : UNLOCK_THRESHOLD;
  const locked = balance < required;

  function debit(amount: number, note: string): boolean {
    if (!user) return false;
    try {
      walletDebit(user.uid, amount, "casino_bet", game.id, note);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Insufficient balance");
      return false;
    }
  }

  function creditWin(amount: number, note: string) {
    if (!user) return;
    credit(user.uid, amount, "casino_win", game.id, note);
    toast.success(`+${amount.toLocaleString()}`);
  }

  const engineProps = { game, debit, creditWin };

  return (
    <div className="game-modal-overlay" onClick={onClose}>
      <div className="game-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gm-head">
          <span className="gm-title">{game.icon} {game.name}</span>
          <button className="gm-close" onClick={onClose}>×</button>
        </div>

        {!user ? (
          <div className="gm-login-gate">
            <span>🔒</span>
            <h3>Login required</h3>
            <p>Log in or create an account to play with your $ balance.</p>
          </div>
        ) : locked ? (
          <div className="gm-locked">
            <span>🔒</span>
            <h3>{lowGame ? "Minimum $10 Required" : "VIP Game Locked"}</h3>
            <p>
              {lowGame ? (
                <>You need at least <b>$10</b> to play <b>{game.name}</b> — you currently hold <b>${Math.floor(balance).toLocaleString()}</b>.</>
              ) : (
                <>You need at least <b>${UNLOCK_THRESHOLD.toLocaleString()}</b> to play <b>{game.name}</b> — you currently hold <b>${Math.floor(balance).toLocaleString()}</b>.</>
              )}
            </p>
            <p className="lock-hint">Deposit via Crypto to top up your balance.</p>
          </div>
        ) : game.id === "drive-it" ? (
          <DriveItEngine {...engineProps} />
        ) : engineFor(game) === "slot" ? (
          <SlotEngine {...engineProps} />
        ) : engineFor(game) === "crash" ? (
          <CrashEngine {...engineProps} />
        ) : engineFor(game) === "mines" ? (
          <MinesEngine {...engineProps} />
        ) : engineFor(game) === "wheel" ? (
          <WheelEngine {...engineProps} />
        ) : engineFor(game) === "plinko" ? (
          <PlinkoEngine {...engineProps} />
        ) : engineFor(game) === "flip" ? (
          <FlipEngine {...engineProps} />
        ) : (
          <DiceGame />
        )}
      </div>
    </div>
  );
}

/* ---------------- playable dice ---------------- */

function DiceGame() {
  const { user } = useAuth();
  const uid = user!.uid;
  const [bet, setBet] = useState("100");
  const [target, setTarget] = useState(50);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ roll: number; win: boolean; payout: number } | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const chance = target;
  const multiplier = Math.max(1.01, Math.floor((99 / chance) * 100) / 100);

  async function roll() {
    const amount = Number(bet);
    if (!amount || amount <= 0) return toast.error("Enter a bet amount");
    try {
      walletDebit(uid, amount, "casino_bet", "dice", `Dice bet (under ${target})`);
    } catch (err: any) {
      return toast.error(err.message || "Insufficient balance");
    }
    setRolling(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 900));
    const roll = Math.round(Math.random() * 10000) / 100;
    const win = roll < target;
    const payout = win ? Math.round(amount * multiplier * 100) / 100 : 0;
    if (win) credit(uid, payout, "casino_win", "dice", `Dice win ${multiplier}x`);
    setResult({ roll, win, payout });
    setHistory((h) => [roll, ...h].slice(0, 12));
    setRolling(false);
  }

  return (
    <div className="dice-game">
      <div className="dice-track">
        <div className="dice-fill" style={{ width: `${target}%` }} />
        {result && (
          <span className={`dice-marker ${result.win ? "win" : "lose"}`} style={{ left: `${result.roll}%` }}>
            {result.roll.toFixed(2)}
          </span>
        )}
        <input
          type="range" min={2} max={98} value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          disabled={rolling}
        />
      </div>
      <div className="dice-stats">
        <div><span>Roll under</span><b>{target}</b></div>
        <div><span>Multiplier</span><b>{multiplier.toFixed(2)}×</b></div>
        <div><span>Win chance</span><b>{chance}%</b></div>
      </div>
      <div className="dice-controls">
        <input type="number" min={1} value={bet} onChange={(e) => setBet(e.target.value)} disabled={rolling} />
        <button className="btn-gold" onClick={roll} disabled={rolling}>
          {rolling ? "Rolling…" : "Roll dice"}
        </button>
      </div>
      {result && (
        <div className={`dice-result ${result.win ? "win" : "lose"}`}>
          {result.win ? `🎉 Won $${result.payout.toLocaleString()} (${multiplier}×)` : `😢 Rolled ${result.roll.toFixed(2)} — you lost`}
        </div>
      )}
      {history.length > 0 && (
        <div className="dice-history">
          {history.map((h, i) => (
            <span key={i} className={h < target ? "win" : "lose"}>{h.toFixed(2)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
