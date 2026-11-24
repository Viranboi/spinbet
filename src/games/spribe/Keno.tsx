import { useState } from 'react';
import GameLayout, { Panel, BetInput, ActionButton } from './GameLayout';
import { useCurrency } from '../../currency';

const COLOR = '#DB2777';
const TOTAL = 40;
const DRAW = 20;

const PAYOUTS: Record<number, Record<number, number>> = {
  1:  { 1: 3.8 },
  2:  { 2: 8 },
  3:  { 2: 2, 3: 26 },
  4:  { 2: 1.5, 3: 6, 4: 70 },
  5:  { 3: 3, 4: 20, 5: 200 },
  6:  { 3: 2, 4: 8, 5: 50, 6: 500 },
  7:  { 4: 5, 5: 25, 6: 100, 7: 1000 },
  8:  { 4: 3, 5: 15, 6: 50, 7: 300, 8: 3000 },
  9:  { 4: 2, 5: 8,  6: 25, 7: 100, 8: 800, 9: 5000 },
  10: { 5: 5, 6: 15, 7: 50, 8: 200, 9: 1000, 10: 10000 },
};

export default function Keno({ balance, setBalance }: { balance: number; setBalance: (b: number | ((prev: number) => number)) => void }) {
  const { fmt } = useCurrency();
  const [bet, setBet] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'drawing' | 'done'>('idle');
  const [message, setMessage] = useState<{ text: string; win: boolean } | null>(null);

  function toggleNumber(n: number) {
    if (phase !== 'idle' || drawing) return;
    setSelected(s =>
      s.includes(n) ? s.filter(x => x !== n) : s.length < 10 ? [...s, n] : s
    );
  }

  function clearSelection() {
    if (phase !== 'idle') return;
    setSelected([]);
  }

  function quickPick(count: number) {
    if (phase !== 'idle') return;
    const nums: number[] = [];
    while (nums.length < count) {
      const n = Math.floor(Math.random() * TOTAL) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    setSelected(nums);
  }

  async function play() {
    if (bet > balance || selected.length === 0) return;
    setBalance(b => b - bet);
    setPhase('drawing');
    setDrawing(true);
    setDrawn([]);
    setMessage(null);

    const allNums = Array.from({ length: TOTAL }, (_, i) => i + 1);
    const shuffled = allNums.sort(() => Math.random() - 0.5).slice(0, DRAW);
    const drawResult: number[] = [];

    for (let i = 0; i < shuffled.length; i++) {
      await new Promise(r => setTimeout(r, 80));
      drawResult.push(shuffled[i]);
      setDrawn([...drawResult]);
    }

    const matches = selected.filter(n => shuffled.includes(n)).length;
    const picks = selected.length;
    const payoutTable = PAYOUTS[picks] || {};
    const mult = payoutTable[matches] || 0;
    const payout = parseFloat((bet * mult).toFixed(2));

    if (payout > 0) setBalance(b => parseFloat((b + payout).toFixed(2)));

    const matchStr = `${matches}/${picks} matched`;
    setMessage(
      payout > 0
        ? { text: `${matchStr} — ${mult}× — Won ${fmt(payout)}!`, win: true }
        : { text: `${matchStr} — No win this time`, win: false }
    );
    setPhase('done');
    setDrawing(false);
  }

  function reset() {
    setPhase('idle');
    setDrawn([]);
    setSelected([]);
    setMessage(null);
  }

  const matches = drawn.filter(n => selected.includes(n)).length;
  const picks = selected.length;
  const bestPayout = PAYOUTS[picks]
    ? Math.max(...Object.values(PAYOUTS[picks]))
    : 0;

  return (
    <GameLayout title="Keno" emoji="🎯" color={COLOR}
      sidebar={
        <Panel>
          <BetInput bet={bet} setBet={setBet}
            onHalf={() => setBet(b => Math.max(1, Math.floor(b / 2)))}
            onDouble={() => setBet(b => b * 2)}
            disabled={phase !== 'idle'}
          />

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#9ea0a3', display: 'block', marginBottom: 8 }}>
              Quick Pick
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[1,3,5,7,10].map(n => (
                <button key={n} onClick={() => quickPick(n)}
                  disabled={phase !== 'idle'}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: '#1a1b1e', color: '#9ea0a3',
                    border: '1.5px solid #303236',
                    cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
                  }}>
                  Pick {n}
                </button>
              ))}
              <button onClick={clearSelection} disabled={phase !== 'idle'} style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: '#FEE2E2', color: '#991B1B',
                border: '1.5px solid #FECACA',
                cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
              }}>Clear</button>
            </div>
          </div>

          <div style={{
            background: '#1a1b1e', borderRadius: 12, padding: '12px 14px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Selected</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLOR }}>{selected.length}/10</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Matched</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>{matches}/{picks}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Best Win</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F59E0B' }}>{bestPayout > 0 ? `${bestPayout}×` : '—'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Drawn</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLOR }}>{drawn.length}/{DRAW}</div>
            </div>
          </div>

          {phase === 'idle' ? (
            <ActionButton onClick={play} color={COLOR} disabled={selected.length === 0 || bet > balance || bet < 1}>
              Play Keno
            </ActionButton>
          ) : phase === 'done' ? (
            <ActionButton onClick={reset} color={COLOR} disabled={false}>
              Play Again
            </ActionButton>
          ) : (
            <div style={{
              padding: '12px 16px', borderRadius: 12, background: COLOR + '15',
              fontWeight: 600, fontSize: 14, color: COLOR, textAlign: 'center',
            }}>
              Drawing... {drawn.length}/{DRAW}
            </div>
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

          {picks > 0 && PAYOUTS[picks] && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>
                Payouts for {picks} picks
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Object.entries(PAYOUTS[picks]).map(([m, mult]) => (
                  <div key={m} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '5px 10px', borderRadius: 8,
                    background: Number(m) === matches && phase === 'done' ? COLOR + '20' : '#1a1b1e',
                    border: `1.5px solid ${Number(m) === matches && phase === 'done' ? COLOR : '#303236'}`,
                    fontSize: 12, fontWeight: 600,
                    color: Number(m) === matches && phase === 'done' ? COLOR : '#9ea0a3',
                  }}>
                    <span>Match {m}</span>
                    <span>{mult}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      }
    >
      <Panel>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: 6,
        }}>
          {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => {
            const isSelected = selected.includes(n);
            const isDrawn = drawn.includes(n);
            const isMatch = isSelected && isDrawn;

            return (
              <button
                key={n}
                onClick={() => toggleNumber(n)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  border: `2px solid ${isMatch ? '#10B981' : isDrawn ? '#C4B5FD' : isSelected ? COLOR : '#303236'}`,
                  background: isMatch ? '#D1FAE5' : isDrawn ? '#EDE9FE' : isSelected ? COLOR + '20' : '#111113',
                  color: isMatch ? '#065F46' : isDrawn ? '#7C3AED' : isSelected ? COLOR : '#6b7280',
                  cursor: phase === 'idle' ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { color: COLOR + '20', border: COLOR, label: 'Selected' },
            { color: '#EDE9FE', border: '#C4B5FD', label: 'Drawn' },
            { color: '#D1FAE5', border: '#10B981', label: 'Match!' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: item.color, border: `2px solid ${item.border}` }} />
              {item.label}
            </div>
          ))}
        </div>

        {phase === 'idle' && selected.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, marginTop: 16 }}>
            Select 1–10 lucky numbers, then press Play!
          </p>
        )}
      </Panel>
    </GameLayout>
  );
}
