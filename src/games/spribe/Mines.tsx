import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import GameLayout, { Panel, BetInput, ActionButton } from './GameLayout';
import { playBetSound, playGemSound, playMineExplodeSound, playCashoutSoundMines } from '../../sounds';

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

const MINE_COUNTS = [1, 3, 5, 10, 15, 20, 24];

export default function Mines({ balance, setBalance }: { balance: number; setBalance: (b: number | ((prev: number) => number)) => void }) {
  const [loadStage, setLoadStage] = useState<1 | 2 | 0>(1);
  const [bet, setBet] = useState(10);
  const [mineCount, setMineCount] = useState(5);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [mineSet, setMineSet] = useState<Set<number> | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [exploded, setExploded] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; win: boolean } | null>(null);
  const [cashedOut, setCashedOut] = useState(false);
  const [autoGame, setAutoGame] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const gems = revealed.length;
  const currentMult = calcMultiplier(gems, mineCount);
  const nextMult = calcMultiplier(gems + 1, mineCount);
  const canCashout = phase === 'playing' && gems > 0 && !cashedOut;

  useEffect(() => {
    const t1 = setTimeout(() => setLoadStage(2), 3000);
    const t2 = setTimeout(() => setLoadStage(0), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function startGame() {
    if (bet > balance || bet < 0.01) return;
    setBalance(b => b - bet);
    setMineSet(placeMines(mineCount));
    setRevealed([]);
    setExploded(null);
    setMessage(null);
    setCashedOut(false);
    setPhase('playing');
    setAutoGame(false);
    playBetSound();
  }

  const revealCell = useCallback((idx: number) => {
    if (phase !== 'playing' || revealed.includes(idx) || cashedOut) return;
    playGemSound();
    if (mineSet!.has(idx)) {
      playMineExplodeSound();
      setExploded(idx);
      setMessage({ text: `Mine! You lost $${bet.toFixed(2)}`, win: false });
      setPhase('done');
      setRevealed([...revealed, idx]);
      setAutoGame(false);
      toast.error("Mine hit!");
    } else {
      const newRevealed = [...revealed, idx];
      setRevealed(newRevealed);
      const newGems = newRevealed.length;
      const safe = GRID - mineCount;
      if (newGems >= safe) {
        const payout = parseFloat((bet * calcMultiplier(newGems, mineCount)).toFixed(2));
        setBalance(b => parseFloat((b + payout).toFixed(2)));
        setMessage({ text: `All gems found! ${calcMultiplier(newGems, mineCount)}× — $${payout.toFixed(2)}! 🏆`, win: true });
        setPhase('done');
        setAutoGame(false);
      } else {
        setMessage({ text: `Gem! +${calcMultiplier(newGems, mineCount)}× so far`, win: true });
      }
    }
  }, [phase, revealed, cashedOut, mineSet, bet, mineCount]);

  useEffect(() => {
    if (autoGame && phase === 'playing' && !cashedOut && message && message.win) {
      const timer = setTimeout(() => {
        const unrevealed = Array.from({ length: GRID }, (_, i) => i).filter(
          (i) => !revealed.includes(i)
        );
        if (unrevealed.length > 0 && mineSet && !mineSet.has(unrevealed[0])) {
          const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          revealCell(pick);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoGame, phase, message, revealed, mineSet, cashedOut, revealCell]);

  function cashOut() {
    if (!canCashout) return;
    playCashoutSoundMines();
    const payout = parseFloat((bet * currentMult).toFixed(2));
    setBalance(b => parseFloat((b + payout).toFixed(2)));
    setCashedOut(true);
    setPhase('done');
    setAutoGame(false);
    toast.success(`Cashed out ${currentMult}× — +$${payout.toFixed(2)}`);
  }

  function resetGame() {
    setPhase('idle');
    setRevealed([]);
    setExploded(null);
    setCashedOut(false);
    setMineSet(null);
    setAutoGame(false);
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
    if (isExploded) return "mine-exploded";
    if (!gameEnded && isRevealed && !isMine) return "star-playing";
    if (gameEnded && isMine && !isExploded) return "mine";
    // Game over: all safe tiles show stars (plus bombs and fire)
    if (gameEnded && !isMine) return "star-done";
    if (!gameEnded) return "hidden-active";
    return "hidden-active";
  }

  if (loadStage === 1) {
    return (
      <>
        <style>{`@keyframes minesSpribeDotPulse{0%,100%{background:#3a3c43;box-shadow:none}45%{background:#e50914;box-shadow:0 0 14px rgba(229,9,20,0.9)}}`}</style>
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          <img src="/assets/spribe-loading.png" alt="Powered by Spribe" style={{ display: 'block', width: 340, maxWidth: '80vw', height: 'auto' }} />
          <div style={{ display: 'flex', gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <i key={i} style={{
                width: 10, height: 10, borderRadius: '50%', background: '#3a3c43',
                animation: 'minesSpribeDotPulse 1.1s infinite ease-in-out',
                animationDelay: `${i * 0.18}s`,
              }} />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (loadStage === 2) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{
          width: '100%', maxWidth: 900, flex: 1, margin: '0 auto',
          background: 'linear-gradient(135deg, #1b9bd7 0%, #2470e0 55%, #2b5fe3 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 17,
        }}>
          connecting...
        </div>
      </div>
    );
  }

  return (
    <>
      <GameLayout title="Mines" emoji="💣" color="#7C3AED"
        sidebar={
          <Panel>
            <BetInput bet={bet} setBet={setBet}
              onHalf={() => setBet(b => Math.max(1, Math.floor(b / 2)))}
              onDouble={() => setBet(b => b * 2)}
              disabled={phase === 'playing'}
            />

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#9ea0a3', display: 'block', marginBottom: 8 }}>
                Mine Count: {mineCount} 💣
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {MINE_COUNTS.map(n => (
                  <button key={n} onClick={() => setMineCount(n)}
                    disabled={phase === 'playing'}
                    style={{
                      padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: `2px solid ${mineCount === n ? '#7C3AED' : '#303236'}`,
                      background: mineCount === n ? '#7C3AED15' : '#1a1b1e',
                      color: mineCount === n ? '#7C3AED' : '#9ea0a3',
                      cursor: phase === 'playing' ? 'not-allowed' : 'pointer',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: '#1a1b1e', borderRadius: 12, padding: '12px 14px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Gems Found</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}>💎 {gems}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Current ×</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED' }}>{currentMult}×</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Mines</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#EF4444' }}>💣 {mineCount}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Next ×</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>{nextMult}×</div>
              </div>
            </div>

            {phase === 'playing' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 10, fontWeight: 700, fontSize: 15,
                  background: '#D1FAE533', border: '1.5px solid #6EE7B7', color: '#059669', marginBottom: 10,
                }}>
                  ${(bet * currentMult).toFixed(2)} ({currentMult}×)
                </div>
                <ActionButton onClick={cashOut} color="#059669" variant="secondary" disabled={cashedOut}>
                  Cash Out
                </ActionButton>
              </div>
            )}

            {phase !== 'playing' && (
              <ActionButton onClick={startGame} color="#7C3AED" disabled={bet > balance || bet < 1}>
                {phase === 'done' ? 'Play Again' : 'Start Game'}
              </ActionButton>
            )}

            {message && (
              <div style={{
                marginTop: 14, padding: '12px 16px', borderRadius: 12,
                background: message.win ? '#D1FAE5' : '#FEE2E2',
                color: message.win ? '#065F46' : '#991B1B',
                fontWeight: 600, fontSize: 13,
              }}>
                {message.text}
              </div>
            )}
          </Panel>
        }
      >
        <Panel>
          {/* Top Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '8px 0', borderBottom: '1px solid #303236' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.25)', padding: '4px 10px', borderRadius: 8 }}>
                💣 MINES
              </span>
              <button onClick={() => setShowHowToPlay(true)} style={{
                background: '#ffc107', border: 'none', color: '#000', padding: '4px 10px',
                borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                ? How to Play
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#4caf50', background: '#4caf5020', padding: '4px 12px', borderRadius: 8 }}>
                FUN MODE
              </span>
            </div>
          </div>

          {/* Quick Bets */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12, background: '#1a1b1e', borderRadius: 10, padding: 6 }}>
            {QUICK_BETS.map(v => (
              <button key={v} onClick={() => setBet(v)} disabled={phase === 'playing'}
                style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  border: `1px solid ${bet === v ? '#7C3AED' : '#303236'}`,
                  background: bet === v ? '#7C3AED20' : 'transparent',
                  color: bet === v ? '#7C3AED' : '#9ea0a3',
                  cursor: phase === 'playing' ? 'not-allowed' : 'pointer',
                }}>
                ${v}
              </button>
            ))}
          </div>

          {/* Mine Count + Next Mult Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#9ea0a3' }}>Mines:</label>
              <select
                value={mineCount}
                onChange={(e) => setMineCount(Number(e.target.value))}
                disabled={phase === 'playing'}
                style={{
                  background: '#1a1b1e', border: '1px solid #303236', color: '#fff',
                  padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none',
                }}
              >
                {MINE_COUNTS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ background: '#ffc107', color: '#000', padding: '4px 14px', borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
              Next: {nextMult.toFixed(2)}×
            </div>
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}>
            {Array.from({ length: GRID }).map((_, idx) => {
              const view = getCellView(idx);
              const isRev = revealed.includes(idx);
              const isMine = mineSet?.has(idx);
              const isExploded = idx === exploded;
              const isClickable = phase === 'playing' && !isRev && !cashedOut && !(isMine && isExploded);

              let bg = '#111113';
              let border = '#303236';

              switch (view) {
                case 'hidden': bg = '#1c3d63'; break;
                case 'hidden-active': bg = '#23456e'; border = '#7C3AED44'; break;
                case 'star-playing': bg = 'linear-gradient(145deg, #f59e0b, #d97706)'; border = '#6EE7B7'; break;
                case 'star-done': bg = 'linear-gradient(145deg, #21456d, #152a4c)'; border = '#5a9fcf'; break;
                case 'mine': bg = 'linear-gradient(145deg, #21456d, #152a4c)'; border = '#90CAF9'; break;
                case 'mine-exploded': bg = 'linear-gradient(145deg, #ef5350, #e53935)'; border = '#EF4444'; break;
              }

              const emoji = (() => {
                if (!isRev) return phase === 'playing' ? '🔵' : '⬜';
                if (isMine) return isExploded ? '💥' : '💣';
                return '💎';
              })();

              return (
                <button
                  key={idx}
                  onClick={() => { if (isClickable) revealCell(idx); }}
                  style={{
                    height: 64, borderRadius: 5,
                    fontSize: 26,
                    border: `2px solid ${border}`,
                    background: bg,
                    cursor: isClickable ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                    animation: isRev ? 'minesRevealPop 0.3s ease' : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {emoji}
                  {view === 'hidden-active' && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)',
                      borderRadius: '5px 5px 0 0',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={pickRandom} disabled={phase !== 'playing' || cashedOut} style={{
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                letterSpacing: '0.5px', opacity: phase !== 'playing' || cashedOut ? 0.35 : 1,
              }}>
                🎲 RANDOM
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={resetGame} disabled={phase === 'idle'} style={{
                  width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.2)', color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', fontSize: 16,
                }}>
                  ↻
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Auto</span>
                  <button onClick={() => setAutoGame(!autoGame)} style={{
                    width: 38, height: 22, borderRadius: 11, border: 'none',
                    background: autoGame ? '#4caf50' : 'rgba(255,255,255,0.2)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 2, left: autoGame ? 18 : 2,
                      transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* How to Play Modal */}
          {showHowToPlay && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} onClick={() => setShowHowToPlay(false)}>
              <div onClick={e => e.stopPropagation()} style={{
                background: '#1a1b1e', border: '2px solid #7C3AED', borderRadius: 16,
                padding: 28, maxWidth: 400, width: '90%',
              }}>
                <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 16, textAlign: 'center' }}>
                  How to Play Mines
                </h3>
                <div style={{ color: '#9ea0a3', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
                  <p>• Find 💎 gems and avoid 💣 mines on a 5x5 grid</p>
                  <p>• Choose the number of mines before each round</p>
                  <p>• Click tiles to reveal them — gems increase your multiplier</p>
                  <p>• Cash out anytime to lock in your winnings</p>
                  <p>• Hit a mine and you lose your bet</p>
                  <p>• Clear all safe tiles for the maximum payout!</p>
                  <p>• Use RANDOM to auto-pick a tile</p>
                  <p>• Enable AUTO GAME for automatic play</p>
                </div>
                <button onClick={() => setShowHowToPlay(false)} style={{
                  width: '100%', padding: 12, borderRadius: 12, border: 'none',
                  background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 16,
                  cursor: 'pointer',
                }}>Got it</button>
              </div>
            </div>
          )}
        </Panel>
      </GameLayout>
    </>
  );
}