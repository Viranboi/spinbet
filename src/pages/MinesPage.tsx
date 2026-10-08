import React, { useState, useEffect, useContext, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Context, { Provider } from "../context";
import "./MinesPage.scss";
import { playGemSound, playMineExplodeSound, playCashoutSoundMines } from "../sounds";
import { useBlocked } from "../p2p/hooks";
import { openSupportChat } from "../components/SupportChat";

const GRID = 25;
const QUICK_BETS = [0.20, 0.30, 0.50, 1, 2, 3, 5, 8, 12, 20, 50, 100];

function placeMines(count: number) {
  const positions = new Set<number>();
  while (positions.size < count) {
    positions.add(Math.floor(Math.random() * GRID));
  }
  return positions;
}

function calcMultiplier(gems: number, mines: number) {
  if (gems === 0) return 1;
  const safe = GRID - mines;
  let mult = 1;
  for (let i = 0; i < gems; i++) {
    mult *= (safe - i) / (GRID - i);
  }
  return parseFloat((0.97 / mult).toFixed(2));
}

function calcNextMultiplier(gems: number, mines: number) {
  return calcMultiplier(gems + 1, mines);
}

function fmtUSD(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

type Phase = "idle" | "playing" | "done";

function MinesGame() {
  const { state, update } = useContext(Context);
  const balance = state.userInfo?.balance || 0;
  const setBalance = useCallback((value: number | ((prev: number) => number)) => {
    const newBal = typeof value === 'function' ? (value as Function)(balance) : value;
    update({ userInfo: { ...state.userInfo, balance: newBal } });
  }, [balance, state.userInfo, update]);
  const navigate = useNavigate();
  const [loadStage, setLoadStage] = useState<1 | 2 | 0>(1);
  const [bet, setBet] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [phase, setPhase] = useState<Phase>("idle");
  const [mineSet, setMineSet] = useState<Set<number> | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [exploded, setExploded] = useState<number | null>(null);
  const [cashedOut, setCashedOut] = useState(false);
  const [autoGame, setAutoGame] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showQuickBets, setShowQuickBets] = useState(false);
  const [lastPayout, setLastPayout] = useState(0);
  const minBet = 10;
  const betStep = 10;
  const gems = revealed.length;
  const currentMult = calcMultiplier(gems, mineCount);
  const nextMult = calcNextMultiplier(gems, mineCount);
  const cashoutAmount = bet * currentMult;
  const canCashout = phase === "playing" && gems > 0 && !cashedOut;
  const safeTotal = GRID - mineCount;
  const safeFound = revealed.length - (exploded !== null ? 1 : 0);
  const progressPct = safeTotal > 0 ? Math.min(100, Math.max(0, (safeFound / safeTotal) * 100)) : 0;
  const quickBetValues = QUICK_BETS.map((v) => Math.max(10, Math.round(v * 1000)));

  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    } catch {}
  }

  useEffect(() => {
    const t1 = setTimeout(() => setLoadStage(2), 3000);
    const t2 = setTimeout(() => setLoadStage(0), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Broadcast the live round so the secret mirror tab shows the same bombs.
  useEffect(() => {
    try {
      localStorage.setItem("liveMinesRound", JSON.stringify({
        mines: mineSet ? Array.from(mineSet) : [],
        mineCount,
        revealed,
        status: phase,
        ts: Date.now(),
      }));
    } catch {}
  }, [mineSet, mineCount, revealed, phase]);

   function startGame() {
     if (balance < 10) { toast.error("You need at least $10 to play Mines"); return; }
     if (bet < minBet) { toast.error("Minimum bet on Mines is $10"); return; }
     if (bet > balance) { toast.error("Your balance is not enough"); return; }
     setBalance((b) => b - bet);
     setMineSet(placeMines(mineCount));
     setRevealed([]);
     setExploded(null);
     setCashedOut(false);
     setPhase("playing");
     setAutoGame(false);
     setLastPayout(0);
     setShowQuickBets(false);
   }

  const revealCell = useCallback((idx: number) => {
    if (phase !== "playing" || revealed.includes(idx) || cashedOut) return;
    playGemSound();
    if (mineSet!.has(idx)) {
      playMineExplodeSound();
      setExploded(idx);
      setPhase("done");
      setLastPayout(0);
      setRevealed((prev) => [...prev, idx]);
      toast.error("Mine hit!");
    } else {
      const newRevealed = [...revealed, idx];
      setRevealed(newRevealed);
      const newGems = newRevealed.length;
      const safe = GRID - mineCount;
      if (newGems >= safe) {
        playCashoutSoundMines();
        const payout = parseFloat((bet * calcMultiplier(newGems, mineCount)).toFixed(2));
        setBalance((b) => parseFloat((b + payout).toFixed(2)));
        setLastPayout(payout);
        setPhase("done");
        toast.success(`All gems found! +$${fmtUSD(payout)}`);
      }
    }
  }, [phase, revealed, cashedOut, mineSet, bet, mineCount, setBalance]);

  const cashOut = useCallback(() => {
    if (!canCashout) return;
    playCashoutSoundMines();
    const payout = parseFloat((bet * currentMult).toFixed(2));
    setBalance((b) => parseFloat((b + payout).toFixed(2)));
    setLastPayout(payout);
    setCashedOut(true);
    setPhase("done");
    toast.success(`Cashed out ${currentMult}x — +$${fmtUSD(payout)}`);
  }, [canCashout, bet, currentMult, setBalance]);

  useEffect(() => {
    if (autoGame && phase === "playing" && !cashedOut) {
      const timer = setTimeout(() => {
        if (mineSet) {
          const unrevealed = Array.from({ length: GRID }, (_, i) => i).filter(
            (i) => !revealed.includes(i)
          );
          if (unrevealed.length > 0) {
            const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            revealCell(pick);
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoGame, phase, revealed, mineSet, cashedOut, revealCell]);

  function resetGame() {
    setPhase("idle");
    setRevealed([]);
    setExploded(null);
    setCashedOut(false);
    setMineSet(null);
    setAutoGame(false);
    setLastPayout(0);
    setShowQuickBets(false);
    setShowMenu(false);
  }

  function adjustBet(dir: "up" | "down") {
    const steps = quickBetValues;
    const idx = steps.findIndex((v) => v >= bet);
    if (dir === "up") {
      if (idx < steps.length - 1 && idx !== -1) setBet(steps[idx + 1]);
      else if (idx === -1) setBet(steps[steps.length - 1]);
      else setBet(steps[steps.length - 1]);
    } else {
      if (idx > 0) setBet(steps[idx - 1]);
      else if (idx === 0) setBet(steps[0]);
      else setBet(steps[0]);
    }
  }

  function pickRandom() {
    if (phase !== "playing" || cashedOut) return;
    const unrevealed = Array.from({ length: GRID }, (_, i) => i).filter(
      (i) => !revealed.includes(i)
    );
    if (unrevealed.length === 0) return;
    const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    revealCell(pick);
  }

  function getCellView(idx: number): "hidden" | "hidden-active" | "star-playing" | "star-done" | "mine" | "mine-exploded" {
    const isRevealed = revealed.includes(idx);
    const isMine = mineSet?.has(idx);
    const isExploded = idx === exploded;
    const gameEnded = phase === "done";

    if (phase === "idle") return "hidden";

    // The cell you clicked that was a mine - red explosion
    if (isExploded) return "mine-exploded";

    // If game is still playing, revealed gems are yellow
    if (!gameEnded && isRevealed && !isMine) return "star-playing";

    // If game ended, all unrevealed mines show as dark bombs
    if (gameEnded && isMine && !isExploded) return "mine";

    // Game over: all safe tiles show white stars (plus bombs and fire)
    if (gameEnded && !isMine) return "star-done";

    // During play, unrevealed safe cells are clickable
    if (!gameEnded) return "hidden-active";

    // Fallback
    return "hidden-active";
  }

  function SiteBar() {
    return (
      <div className="mines-sitebar">
        <button className="mines-lobby-btn" onClick={() => navigate(-1)}>
          <span className="mines-lobby-arrow">‹</span> <span>Lobby</span>
        </button>
        <div className="mines-sitebar-right">
          <span className="mines-sitebar-bal">${fmtUSD(balance)}</span>
          <button className="mines-deposit-btn" onClick={() => navigate("/deposit")}>
            Deposit
          </button>
          <button className="mines-fullscreen-btn" onClick={toggleFullscreen} title="Fullscreen">
            ⛶
          </button>
          <div className="mines-menu-wrap">
            <button className="mines-menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            {showMenu && (
              <div className="mines-dropdown right">
                <button onClick={() => { setShowMenu(false); setShowHowToPlay(true); }}>❓ How to Play?</button>
                <button onClick={() => { setShowMenu(false); resetGame(); }}>↻ New Round</button>
                <button onClick={() => navigate("/crash-games")}>🎮 All Games</button>
                <button onClick={() => navigate("/")}>🏠 Lobby</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loadStage === 1) {
    return (
      <div className="spribe-splash">
        <img src="/assets/spribe-loading.png" alt="Powered by Spribe" className="spribe-loading-img" />
        <div className="spribe-dots">
          <i /><i /><i />
        </div>
      </div>
    );
  }

  if (loadStage === 2) {
    return (
      <div className="mines-loader-connecting">
        <SiteBar />
        <div className="mines-connecting-frame">
          <div className="mines-connecting-text">
            connecting<span className="mines-connecting-ellipsis"><i>.</i><i>.</i><i>.</i></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mines-page">
      <SiteBar />
      {/* Decorative background stars */}
      <div className="mines-bg-stars">
        <div className="mines-bg-star s1" />
        <div className="mines-bg-star s2" />
        <div className="mines-bg-star s3" />
        <svg className="mines-puzzle" viewBox="0 0 100 100" width="230" height="230">
          <path d="M36 12 h22 c2 0 3 1 3 3 v9 c0 2 1 3 3 3 h5 c5 0 9 4 9 9 s-4 9 -9 9 h-5 c-2 0 -3 1 -3 3 v25 c0 2 -1 3 -3 3 H36 c-2 0 -3 -1 -3 -3 V61 c0 -2 -1 -3 -3 -3 h-5 c-5 0 -9 -4 -9 -9 s4 -9 9 -9 h5 c2 0 3 -1 3 -3 v-9 c0 -2 1 -3 3 -3 z" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="50" cy="55" r="10" fill="none" stroke="#ffffff" strokeWidth="4" />
        </svg>
      </div>

      <div className="mines-game-frame">
        {/* Mine Count + Next Multiplier */}
        <div className="mines-selector-row">
          <div className="mines-mine-select">
            <label>Mines:</label>
            <select
              value={mineCount}
              onChange={(e) => setMineCount(Number(e.target.value))}
              disabled={phase === "playing"}
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="mines-next-mult">
            Next: {nextMult.toFixed(2)}x
          </div>
        </div>
        {/* Round progress - gems found vs safe tiles */}
        <div className="mines-progress">
          <div className="mines-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Grid */}
        <div className="mines-grid">
          {Array.from({ length: GRID }).map((_, idx) => {
            const view = getCellView(idx);
            return (
              <div
                key={idx}
                className={`mines-cell ${view}`}
                onClick={() => {
                  if (phase === "idle") return;
                  if (view === "hidden-active") revealCell(idx);
                }}
              >
                {/* Hidden cell - blue tile with dot (idle) */}
                {view === "hidden" && (
                  <div className="mines-tile">
                    <div className="mines-dot" />
                  </div>
                )}
                {/* Active hidden - clickable, blue tile with dot (same as idle, no star until clicked) */}
                {view === "hidden-active" && (
                  <div className="mines-tile active">
                    <div className="mines-tile-shine" />
                    <div className="mines-dot" />
                  </div>
                )}
                {/* Star revealed DURING PLAY - yellow/orange bg */}
                {view === "star-playing" && (
                  <div className="mines-reveal star-playing-bg">
                    <svg viewBox="0 0 60 60" width="44" height="44">
                      <polygon
                        points="30,6 36,22 54,22 40,33 45,50 30,39 15,50 20,33 6,22 24,22"
                        fill="#ffffff"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="0.5"
                      />
                    </svg>
                  </div>
                )}
                {/* Star revealed AFTER GAME END - blue bg */}
                {view === "star-done" && (
                  <div className="mines-reveal star-done-bg">
                    <svg viewBox="0 0 60 60" width="44" height="44">
                      <polygon
                        points="30,6 36,22 54,22 40,33 45,50 30,39 15,50 20,33 6,22 24,22"
                        fill="#ffffff"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="0.5"
                      />
                    </svg>
                  </div>
                )}
                {/* Mine revealed (unrevealed bomb on loss) */}
                {view === "mine" && (
                  <div className="mines-reveal mine-bg">
                    <svg viewBox="0 0 60 60" width="42" height="42">
                      <circle cx="30" cy="32" r="13" fill="#0d1b2a" stroke="#1b2838" strokeWidth="1" />
                      <circle cx="26" cy="28" r="3" fill="rgba(255,255,255,0.08)" />
                      <line x1="30" y1="19" x2="30" y2="12" stroke="#4a5568" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="30" cy="10" r="2.5" fill="#6b7280" />
                      <line x1="38" y1="24" x2="44" y2="18" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" />
                      <line x1="42" y1="32" x2="48" y2="32" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                {/* Mine exploded (the one you clicked - red tile with burst) */}
                {view === "mine-exploded" && (
                  <div className="mines-reveal exploded-bg">
                    <svg viewBox="0 0 60 60" width="46" height="46">
                      <polygon
                        points="56,30 43.5,33.6 52.5,43 39.9,39.9 43,52.5 33.6,43.5 30,56 26.4,43.5 17,52.5 20.1,39.9 7.5,43 16.5,33.6 4,30 16.5,26.4 7.5,17 20.1,20.1 17,7.5 26.4,16.5 30,4 33.6,16.5 43,7.5 39.9,20.1 52.5,17 43.5,26.4"
                        fill="#b71c1c"
                        stroke="#7f1d1d"
                        strokeWidth="0.5"
                      />
                      <polygon
                        points="47,30 39.2,33.8 42,42 33.8,39.2 30,47 26.2,39.2 18,42 20.8,33.8 13,30 20.8,26.2 18,18 26.2,20.8 30,13 33.8,20.8 42,18 39.2,26.2"
                        fill="#ff9800"
                      />
                      <circle cx="30" cy="30" r="7" fill="#ffeb3b" />
                      <circle cx="30" cy="30" r="3.5" fill="#ffffff" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Controls */}
        <div className="mines-bottom">
          <div className="mines-controls-row">
            <button className="mines-random-btn" onClick={pickRandom} disabled={phase !== "playing" || cashedOut}>
              RANDOM
            </button>
            <div className="mines-controls-right">
              <button className="mines-refresh-btn" onClick={resetGame} disabled={phase === "idle"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              </button>
              <div className="mines-auto-toggle">
                <span>Auto Game</span>
                <button
                  className={`mines-toggle ${autoGame ? "on" : ""}`}
                  onClick={() => setAutoGame(!autoGame)}
                >
                  <div className="mines-toggle-knob" />
                </button>
              </div>
            </div>
          </div>

          <div className="mines-action-row">
            {/* Bet capsule: amount + minus + chips + plus in one curve */}
            <div className="mines-bet-section">
              <div className="mines-bet-controls pill">
                <div className="mines-bet-amount-col">
                  <div className="mines-bet-label">
                    Bet $
                  </div>
                  <input
                    type="number"
                    step={betStep}
                    min={minBet}
                    value={bet}
                    onChange={(e) => setBet(Math.max(minBet, Math.round(Number(e.target.value) || 0)))}
                    disabled={phase === "playing"}
                    className="mines-bet-input"
                  />
                </div>
                <button className="mines-bet-adj" onClick={() => adjustBet("down")} disabled={phase === "playing"}>-</button>
                <button
                  className="mines-bet-adj mines-chip-btn"
                  onClick={() => setShowQuickBets(!showQuickBets)}
                  disabled={phase === "playing"}
                  title="Quick bet amounts"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>
                </button>
                <button className="mines-bet-adj" onClick={() => adjustBet("up")} disabled={phase === "playing"}>+</button>
                {showQuickBets && phase !== "playing" && (
                  <div className="mines-quickbets">
                    {quickBetValues.map((v) => (
                      <button key={v} className={bet === v ? "active" : ""} onClick={() => { setBet(v); setShowQuickBets(false); }}>
                        {fmtUSD(v)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Repeat-bet circular button */}
            <button
              className="mines-rebet-btn"
              onClick={startGame}
              disabled={phase === "playing" || bet > balance || bet < minBet}
              title="Repeat bet"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            </button>

            {/* BET when not playing (idle OR round finished) / CASHOUT while playing */}
            {(phase === "idle" || phase === "done") && (
              <button
                className="mines-main-btn bet"
                onClick={startGame}
                disabled={bet > balance || bet < minBet}
                title={phase === "done" ? `Last result: $${fmtUSD(lastPayout)}` : "Place bet"}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21" /></svg>
                BET
              </button>
            )}

            {phase === "playing" && canCashout && (
              <button className="mines-main-btn cashout" onClick={cashOut}>
                CASH OUT
                <span className="mines-cashout-amt">${fmtUSD(cashoutAmount)}</span>
              </button>
            )}

            {phase === "playing" && !canCashout && (
              <button className="mines-main-btn cashout" onClick={pickRandom}>
                CASH OUT
                <span className="mines-cashout-amt">tap RANDOM to start</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="mines-howto-overlay" onClick={() => setShowHowToPlay(false)}>
          <div className="mines-howto-modal" onClick={e => e.stopPropagation()}>
            <h3>How to Play Mines</h3>
            <p>• Find 💎 gems and avoid 💣 mines on a 5x5 grid</p>
            <p>• Choose the number of mines before each round</p>
            <p>• Click tiles to reveal them — gems increase your multiplier</p>
            <p>• Cash out anytime to lock in your winnings</p>
            <p>• Hit a mine and you lose your bet</p>
            <p>• Clear all safe tiles for the maximum payout!</p>
            <p>• Use RANDOM to auto-pick a tile</p>
            <p>• Enable AUTO GAME for automatic play</p>
            <button onClick={() => setShowHowToPlay(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MinesPage() {
  return (
    <Provider>
      <MinesGate />
    </Provider>
  );
}

function MinesGate() {
  const blocked = useBlocked();
  if (blocked) {
    return (
      <div className="mines-page locked">
        <div className="mines-locked-card">
          <div style={{ fontSize: 52 }}>🔒</div>
          <h2>Balance locked</h2>
          <p>
            Your balance was temporarily locked after our system flagged unusual
            activity. To unlock it, verify your account with Support.
          </p>
          <button className="mines-main-btn bet" onClick={openSupportChat}>
            CONTACT SUPPORT
          </button>
        </div>
      </div>
    );
  }
  return <MinesGame />;
}
