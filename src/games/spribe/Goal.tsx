import { useState } from 'react';
import GameLayout, { Panel, BetInput, ActionButton } from './GameLayout';
import { useCurrency } from '../../currency';

const COLOR = '#059669';
const COLS = 5;
const ROWS = 3;

function generateKeepers() {
  return Array.from({ length: COLS }, () => Math.floor(Math.random() * ROWS));
}

const COL_MULTS = [1.4, 2.0, 3.0, 5.0, 10.0];

export default function Goal({ balance, setBalance }: { balance: number; setBalance: (b: number | ((prev: number) => number)) => void }) {
  const { fmt } = useCurrency();
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [keepers, setKeepers] = useState<number[] | null>(null);
  const [currentCol, setCurrentCol] = useState(0);
  const [picks, setPicks] = useState<{ col: number; row: number; hit: boolean }[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [message, setMessage] = useState<{ text: string; win: boolean } | null>(null);
  const [cashedOut, setCashedOut] = useState(false);
  const [, setCurrentMult] = useState(1);

  function startGame() {
    if (bet > balance) return;
    setBalance(b => b - bet);
    setKeepers(generateKeepers());
    setCurrentCol(0);
    setPicks([]);
    setRevealed([]);
    setMessage(null);
    setCashedOut(false);
    setCurrentMult(1);
    setPhase('playing');
  }

  function pickCell(col: number, row: number) {
    if (phase !== 'playing' || col !== currentCol) return;

    const keeperRow = keepers![col];
    const hit = row === keeperRow;
    const idx = col * ROWS + row;

    setRevealed(r => [...r, idx]);
    setPicks(p => [...p, { col, row, hit }]);

    if (hit) {
      const allKeepers = keepers!.map((kr, c) => c * ROWS + kr);
      setRevealed(allKeepers);
      setMessage({ text: `Goalkeeper blocked it! Lost ${fmt(bet)}`, win: false });
      setPhase('done');
    } else {
      const nextCol = col + 1;
      const mult = COL_MULTS[col];
      setCurrentMult(mult);
      if (nextCol >= COLS) {
        const payout = parseFloat((bet * COL_MULTS[COLS - 1]).toFixed(2));
        setBalance(b => parseFloat((b + payout).toFixed(2)));
        setMessage({ text: `FULL SCORE! Won ${fmt(payout)}!`, win: true });
        setPhase('done');
        const allKeepers = keepers!.map((kr, c) => c * ROWS + kr);
        setRevealed(allKeepers);
      } else {
        setCurrentCol(nextCol);
      }
    }
  }

  function cashOut() {
    if (phase !== 'playing' || currentCol === 0 || cashedOut) return;
    const mult = COL_MULTS[currentCol - 1];
    const payout = parseFloat((bet * mult).toFixed(2));
    setBalance(b => parseFloat((b + payout).toFixed(2)));
    setCashedOut(true);
    setMessage({ text: `Cashed out ${mult}× — Won ${fmt(payout)}!`, win: true });
    const allKeepers = keepers!.map((kr, c) => c * ROWS + kr);
    setRevealed(allKeepers);
    setPhase('done');
  }

  function getCellState(col: number, row: number) {
    const idx = col * ROWS + row;
    const pick = picks.find(p => p.col === col && p.row === row);
    const isKeeper = keepers && keepers[col] === row && revealed.includes(idx);
    const isGoal = pick && !pick.hit;
    const isMiss = pick && pick.hit;
    return { isKeeper, isGoal, isMiss, isRevealed: revealed.includes(idx) };
  }

  const phasePlaying = phase === 'playing';

  return (
    <GameLayout title="Goal" emoji="⚽" color={COLOR}
      sidebar={
        <Panel>
          <BetInput bet={bet} setBet={setBet}
            onHalf={() => setBet(b => Math.max(1, Math.floor(b / 2)))}
            onDouble={() => setBet(b => b * 2)}
            disabled={phasePlaying}
          />

          {phasePlaying && currentCol > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                Current winnings if you cash out:
              </div>
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontWeight: 700, fontSize: 16,
                background: '#D1FAE533', border: '1.5px solid #6EE7B7', color: COLOR, marginBottom: 10,
              }}>
                {fmt(bet * COL_MULTS[currentCol - 1])} ({COL_MULTS[currentCol - 1]}×)
              </div>
              <ActionButton onClick={cashOut} color={COLOR} variant="secondary" disabled={cashedOut}>
                Cash Out Now
              </ActionButton>
            </div>
          )}

          {phase === 'idle' || phase === 'done' ? (
            <ActionButton onClick={startGame} color={COLOR} disabled={bet > balance || bet < 1}>
              {phase === 'done' ? 'Play Again' : 'Start Game'}
            </ActionButton>
          ) : null}

          {message && (
            <div style={{
              marginTop: 14, padding: '12px 16px', borderRadius: 12,
              background: message.win ? '#D1FAE5' : '#FEE2E2',
              color: message.win ? '#065F46' : '#991B1B',
              fontWeight: 600, fontSize: 14,
            }}>
              {message.text}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>Multiplier Ladder</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {COL_MULTS.slice().reverse().map((m, i) => {
                const col = COLS - 1 - i;
                const active = phasePlaying && col === currentCol;
                const done = picks.some(p => p.col === col);
                return (
                  <div key={col} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 8,
                    background: active ? COLOR + '20' : done ? '#F0FDF4' : '#1a1b1e',
                    border: `1.5px solid ${active ? COLOR : done ? '#6EE7B7' : '#303236'}`,
                    fontSize: 13, fontWeight: 600, color: active ? COLOR : done ? '#065F46' : '#6b7280',
                  }}>
                    <span>{active ? '▶' : done ? '✓' : ' '}</span>
                    <span>Column {col + 1}</span>
                    <span style={{ marginLeft: 'auto' }}>{m}×</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      }
    >
      <Panel>
        <div style={{
          background: 'linear-gradient(180deg, #064E3B, #065F46)',
          borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden',
        }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${(i / COLS) * 100}%`,
              width: `${100 / COLS}%`,
              background: i % 2 === 0 ? '#065F4620' : 'transparent',
            }} />
          ))}

          <div style={{ display: 'flex', gap: 10, marginBottom: 12, position: 'relative', zIndex: 1 }}>
            {COL_MULTS.map((m, c) => (
              <div key={c} style={{
                flex: 1, textAlign: 'center',
                fontSize: 12, fontWeight: 700,
                color: phasePlaying && c === currentCol ? '#FCD34D' : '#ffffff66',
              }}>{m}×</div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
            {Array.from({ length: COLS }).map((_, col) => (
              <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: ROWS }).map((_, row) => {
                  const { isKeeper, isGoal } = getCellState(col, row);
                  const isActive = phasePlaying && col === currentCol;
                  const isPast = col < currentCol || phase === 'done';

                  return (
                    <button
                      key={row}
                      onClick={() => pickCell(col, row)}
                      style={{
                        height: 70, borderRadius: 12, fontSize: 28,
                        border: `2px solid ${isActive ? '#FCD34D88' : 'transparent'}`,
                        background: isKeeper ? '#EF444433' : isGoal ? '#10B98133' : '#ffffff15',
                        cursor: isActive ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      {isKeeper ? '🧤' : isGoal ? '⚽' : isActive ? '❓' : isPast ? '✓' : '⬜'}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          {phase === 'idle' && <p style={{ color: '#6b7280', fontSize: 14 }}>Place your bet and kick off!</p>}
          {phasePlaying && (
            <p style={{ color: COLOR, fontWeight: 600, fontSize: 14 }}>
              Pick a cell in column {currentCol + 1} — avoid the goalkeeper!
            </p>
          )}
        </div>
      </Panel>
    </GameLayout>
  );
}
