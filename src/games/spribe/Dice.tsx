import { useState } from 'react';
import GameLayout, { Panel, BetInput, ActionButton } from './GameLayout';
import { useCurrency } from '../../currency';

const COLOR = '#2563EB';
const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

export default function Dice({ balance, setBalance }: { balance: number; setBalance: (b: number | ((prev: number) => number)) => void }) {
  const { fmt } = useCurrency();
  const [bet, setBet] = useState(10);
  const [target, setTarget] = useState(4);
  const [mode, setMode] = useState<'over' | 'under'>('over');
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ roll: number; win: boolean; profit: number } | null>(null);
  const [animFace, setAnimFace] = useState<number | null>(null);

  const winChance = mode === 'over' ? (6 - target) / 6 : target / 6;
  const multiplier = parseFloat((0.97 / winChance).toFixed(2));

  function roll() {
    if (bet > balance || rolling) return;
    setBalance(b => b - bet);
    setResult(null);
    setRolling(true);

    let ticks = 0;
    const max = 14;
    const id = setInterval(() => {
      setAnimFace(Math.floor(Math.random() * 6));
      ticks++;
      if (ticks >= max) {
        clearInterval(id);
        const rollResult = Math.floor(Math.random() * 6) + 1;
        setAnimFace(rollResult - 1);
        const win = mode === 'over' ? rollResult > target : rollResult <= target;
        const profit = win ? parseFloat((bet * multiplier).toFixed(2)) : 0;
        if (win) setBalance(b => parseFloat((b + profit).toFixed(2)));
        setResult({ roll: rollResult, win, profit });
        setRolling(false);
      }
    }, 60);
  }

  return (
    <GameLayout title="Dice" emoji="🎲" color={COLOR}
      sidebar={
        <Panel>
          <BetInput bet={bet} setBet={setBet}
            onHalf={() => setBet(b => Math.max(1, Math.floor(b / 2)))}
            onDouble={() => setBet(b => b * 2)}
            disabled={rolling}
          />

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#9ea0a3', display: 'block', marginBottom: 8 }}>
              Bet Type
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['over','under'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  flex: 1, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: `2px solid ${mode === m ? COLOR : '#303236'}`,
                  background: mode === m ? COLOR + '15' : '#1a1b1e',
                  color: mode === m ? COLOR : '#9ea0a3',
                  cursor: 'pointer',
                }}>
                  {m === 'over' ? 'Over' : 'Under'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#9ea0a3', display: 'block', marginBottom: 8 }}>
              {mode === 'over' ? `Roll Over: ${target}` : `Roll Under or Equal: ${target}`}
            </label>
            <input type="range" min={1} max={5} value={target}
              onChange={e => setTarget(Number(e.target.value))}
              disabled={rolling}
              style={{ width: '100%', accentColor: COLOR }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>

          <div style={{
            background: '#1a1b1e', borderRadius: 12, padding: '12px 14px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Win Chance</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLOR }}>{(winChance * 100).toFixed(0)}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Multiplier</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>{multiplier}×</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Payout</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F59E0B' }}>{fmt(bet * multiplier)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Profit</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#7C3AED' }}>{fmt(bet * multiplier - bet)}</div>
            </div>
          </div>

          <ActionButton onClick={roll} color={COLOR} disabled={rolling || bet > balance || bet < 1}>
            {rolling ? 'Rolling...' : 'Roll Dice'}
          </ActionButton>

          {result && (
            <div style={{
              marginTop: 14, padding: '12px 16px', borderRadius: 12,
              background: result.win ? '#D1FAE5' : '#FEE2E2',
              color: result.win ? '#065F46' : '#991B1B',
              fontWeight: 600, fontSize: 14,
            }}>
              {result.win ? `Won ${fmt(result.profit)}!` : 'Better luck next time!'}
            </div>
          )}
        </Panel>
      }
    >
      <Panel style={{ minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          fontSize: 120, lineHeight: 1, marginBottom: 24,
          filter: result?.win ? 'drop-shadow(0 0 20px #10B98188)' : 'none',
        }}>
          {animFace !== null ? FACES[animFace] : '🎲'}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[1,2,3,4,5,6].map(n => {
            const isTarget = mode === 'over' ? n > target : n <= target;
            return (
              <div key={n} style={{
                width: 44, height: 44, borderRadius: 10, fontSize: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isTarget ? COLOR + '20' : '#1a1b1e',
                border: `2px solid ${isTarget ? COLOR : '#303236'}`,
                color: isTarget ? COLOR : '#6b7280',
              }}>
                {FACES[n - 1]}
              </div>
            );
          })}
        </div>

        <p style={{ color: '#6b7280', fontSize: 14 }}>
          {mode === 'over'
            ? `Win when rolling OVER ${target}`
            : `Win when rolling ${target} OR UNDER`}
        </p>
      </Panel>
    </GameLayout>
  );
}
