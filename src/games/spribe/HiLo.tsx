import { useState } from 'react';
import GameLayout, { Panel, BetInput, ActionButton } from './GameLayout';

const COLOR = '#DC2626';
const SUITS = ['♠','♥','♦','♣'];
const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function randomCard() {
  return {
    suit: SUITS[Math.floor(Math.random() * 4)],
    value: VALUES[Math.floor(Math.random() * 13)],
    rank: Math.floor(Math.random() * 13),
  };
}

function cardColor(suit: string) {
  return suit === '♥' || suit === '♦' ? '#DC2626' : '#1E1B4B';
}

function CardFace({ card, hidden, size = 'lg' }: { card: any; hidden: boolean; size?: 'lg' | 'sm' }) {
  const big = size === 'lg';
  return (
    <div style={{
      width: big ? 110 : 70, height: big ? 160 : 100,
      borderRadius: big ? 16 : 10,
      background: hidden ? 'linear-gradient(135deg, #7C3AED, #A855F7)' : '#fff',
      border: `2px solid ${hidden ? '#6D28D9' : '#E5E7EB'}`,
      display: 'flex', flexDirection: 'column',
      alignItems: hidden ? 'center' : 'flex-start',
      justifyContent: hidden ? 'center' : 'flex-start',
      padding: hidden ? 0 : big ? '10px 10px' : '6px 8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      position: 'relative',
      flexShrink: 0,
    }}>
      {hidden ? (
        <span style={{ fontSize: big ? 36 : 22, opacity: 0.6 }}>🎴</span>
      ) : (
        <>
          <span style={{ fontSize: big ? 18 : 12, fontWeight: 800, color: cardColor(card.suit), lineHeight: 1 }}>
            {card.value}
          </span>
          <span style={{ fontSize: big ? 20 : 14, color: cardColor(card.suit), lineHeight: 1 }}>
            {card.suit}
          </span>
          <span style={{
            fontSize: big ? 40 : 24, color: cardColor(card.suit),
            position: 'absolute', bottom: big ? 8 : 4, right: big ? 8 : 6,
          }}>{card.suit}</span>
        </>
      )}
    </div>
  );
}

export default function HiLo({ balance, setBalance }: { balance: number; setBalance: (b: number | ((prev: number) => number)) => void }) {
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [nextCard, setNextCard] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [currentMult, setCurrentMult] = useState(1);
  const [history, setHistory] = useState<{ card: any; correct: boolean }[]>([]);
  const [message, setMessage] = useState<{ text: string; win: boolean } | null>(null);
  const [cashedOut, setCashedOut] = useState(false);

  const STREAK_MULTS = [1, 1.5, 2.5, 4, 6.5, 10, 16, 25];

  function startGame() {
    if (bet > balance) return;
    setBalance(b => b - bet);
    const card = randomCard();
    setCurrentCard(card);
    setNextCard(null);
    setStreak(0);
    setCurrentMult(1);
    setHistory([]);
    setMessage(null);
    setCashedOut(false);
    setPhase('playing');
  }

  function guess(direction: 'higher' | 'lower') {
    if (phase !== 'playing') return;
    const next = randomCard();
    setNextCard(next);

    const correct = direction === 'higher'
      ? next.rank > currentCard.rank
      : next.rank < currentCard.rank;

    const newStreak = correct ? streak + 1 : 0;
    const mult = STREAK_MULTS[Math.min(newStreak, STREAK_MULTS.length - 1)];

    setHistory(h => [...h, { card: currentCard, correct }].slice(-8));

    if (!correct) {
      setMessage({ text: `Wrong! It was ${next.value}${next.suit}. You lost.`, win: false });
      setPhase('done');
      setStreak(0);
    } else {
      setStreak(newStreak);
      setCurrentMult(mult);
      setCurrentCard(next);
      setNextCard(null);
      if (newStreak >= 7) {
        const payout = parseFloat((bet * 25).toFixed(2));
        setBalance(b => parseFloat((b + payout).toFixed(2)));
        setMessage({ text: `MAX STREAK! 25× — Won $${payout.toFixed(2)}!`, win: true });
        setPhase('done');
      } else {
        setMessage({ text: `Correct! ${next.value}${next.suit}. Keep going!`, win: true });
      }
    }
  }

  function cashOut() {
    if (phase !== 'playing' || streak === 0 || cashedOut) return;
    const payout = parseFloat((bet * currentMult).toFixed(2));
    setBalance(b => parseFloat((b + payout).toFixed(2)));
    setCashedOut(true);
    setMessage({ text: `Cashed out ${currentMult}× — Won $${payout.toFixed(2)}!`, win: true });
    setPhase('done');
  }

  return (
    <GameLayout title="Hi-Lo" emoji="🃏" color={COLOR}
      sidebar={
        <Panel>
          <BetInput bet={bet} setBet={setBet}
            onHalf={() => setBet(b => Math.max(1, Math.floor(b / 2)))}
            onDouble={() => setBet(b => b * 2)}
            disabled={phase === 'playing'}
          />

          {phase === 'playing' && streak > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontWeight: 700, fontSize: 16,
                background: '#D1FAE533', border: '1.5px solid #6EE7B7', color: '#059669', marginBottom: 10,
              }}>
                Cash out: ${(bet * currentMult).toFixed(2)} ({currentMult}×)
              </div>
              <ActionButton onClick={cashOut} color="#059669" variant="secondary" disabled={cashedOut}>
                Cash Out Now
              </ActionButton>
            </div>
          )}

          {phase === 'idle' || phase === 'done' ? (
            <ActionButton onClick={startGame} color={COLOR} disabled={bet > balance || bet < 1}>
              {phase === 'done' ? 'Play Again' : 'Deal Cards'}
            </ActionButton>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ActionButton onClick={() => guess('higher')} color="#059669" disabled={false}>
                Higher
              </ActionButton>
              <ActionButton onClick={() => guess('lower')} color={COLOR} disabled={false}>
                Lower
              </ActionButton>
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

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>Streak Rewards</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STREAK_MULTS.slice(1).map((m, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '5px 10px', borderRadius: 8,
                  background: streak === i + 1 ? COLOR + '20' : '#1a1b1e',
                  border: `1.5px solid ${streak === i + 1 ? COLOR : '#303236'}`,
                  fontSize: 12, fontWeight: 600,
                  color: streak === i + 1 ? COLOR : '#9ea0a3',
                }}>
                  <span>{i + 1} correct in a row</span>
                  <span>{m}×</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      }
    >
      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Streak</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: COLOR }}>{streak} 🔥</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Current Multiplier</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>{currentMult}×</div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 32, minHeight: 200, marginBottom: 24,
        }}>
          {currentCard ? (
            <div style={{ position: 'relative' }}>
              <CardFace card={currentCard} hidden={false} />
            </div>
          ) : (
            <div style={{
              width: 110, height: 160, borderRadius: 16,
              background: '#1a1b1e', border: '2px dashed #303236',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
            }}>🃏</div>
          )}

          <div style={{ fontSize: 36, color: '#6b7280' }}>→</div>

          <CardFace card={nextCard} hidden={!nextCard || phase === 'playing'} />
        </div>

        {history.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {history.map((h, i) => (
              <div key={i} style={{
                width: 44, height: 60, borderRadius: 8, background: '#fff',
                border: `2px solid ${h.correct ? '#6EE7B7' : '#FECACA'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: cardColor(h.card.suit),
              }}>
                <span>{h.card.value}</span>
                <span>{h.card.suit}</span>
              </div>
            ))}
          </div>
        )}

        {phase === 'idle' && (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, marginTop: 16 }}>
            Deal the cards and guess higher or lower!
          </p>
        )}
      </Panel>
    </GameLayout>
  );
}
