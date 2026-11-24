import React, { useState } from 'react';
import { Mines, Aviator } from './spribe';
import { useCurrency } from '../currency';

const GAMES = [
  { id: 'mines', name: 'Mines', emoji: '💣', color: '#059669', component: Mines, desc: 'Find gems, avoid bombs' },
];

export default function CasinoPage({ onBack, balance }: { onBack: () => void; balance: number }) {
  const { fmt } = useCurrency();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(balance);

  if (selectedGame) {
    const GameComponent = selectedGame === 'aviator2' ? Aviator : GAMES.find(g => g.id === selectedGame)?.component;
    const gameName = selectedGame === 'aviator2' ? 'Aviator' : GAMES.find(g => g.id === selectedGame)?.name;
    const gameEmoji = selectedGame === 'aviator2' ? '✈️' : GAMES.find(g => g.id === selectedGame)?.emoji;
    if (GameComponent) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
          <div style={{
            padding: '14px 24px',
            background: '#111113',
            borderBottom: '1px solid #303236',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <button
              onClick={() => setSelectedGame(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8be35d',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Back to Casino
            </button>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              {gameEmoji} {gameName}
            </div>
            <div style={{ marginLeft: 'auto', color: '#fff', fontWeight: 700, fontSize: 16 }}>
              {fmt(currentBalance)}
            </div>
          </div>
          <GameComponent balance={currentBalance} setBalance={setCurrentBalance} />
        </div>
      );
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Top bar */}
      <div style={{
        padding: '14px 24px',
        background: '#111113',
        borderBottom: '1px solid #303236',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#8be35d',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← Back to Aviator
        </button>
        <div style={{
          fontSize: 22,
          fontWeight: 900,
          color: '#ffbd71',
        }}>
          Crash Games
        </div>
        <div style={{ marginLeft: 'auto', color: '#fff', fontWeight: 700, fontSize: 16 }}>
          {fmt(currentBalance)}
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* FEATURED: Aviator - BIG card */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#9ea0a3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>
            Featured Game
          </div>
          <button
            onClick={() => setSelectedGame('aviator2')}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #1a1040, #0d0d1a)',
              border: '2px solid #7C3AED',
              borderRadius: 20,
              padding: 0,
              cursor: 'pointer',
              overflow: 'hidden',
              textAlign: 'left',
              boxShadow: '0 0 30px #7C3AED33',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: '32px 36px',
            }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 52,
                flexShrink: 0,
                boxShadow: '0 4px 20px #7C3AED66',
              }}>
                ✈️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                  Aviator
                </div>
                <div style={{ fontSize: 15, color: '#9ea0a3', marginBottom: 16 }}>
                  Cash out before the plane flies away! Watch the multiplier grow.
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '10px 32px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '1px',
                }}>
                  PLAY NOW
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Other games */}
        <div style={{ fontSize: 14, fontWeight: 700, color: '#9ea0a3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>
          More Games
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {GAMES.map(game => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              style={{
                background: '#111113',
                border: '2px solid #303236',
                borderRadius: 20,
                padding: 0,
                cursor: 'pointer',
                overflow: 'hidden',
                textAlign: 'left',
              }}
            >
              <div style={{
                height: 120,
                background: `linear-gradient(135deg, ${game.color}33, ${game.color}11)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 56,
                borderBottom: `2px solid ${game.color}33`,
              }}>
                {game.emoji}
              </div>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                  {game.name}
                </div>
                <div style={{ fontSize: 13, color: '#9ea0a3' }}>
                  {game.desc}
                </div>
                <div style={{
                  marginTop: 12,
                  padding: '8px 0',
                  borderRadius: 10,
                  background: game.color,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  textAlign: 'center',
                }}>
                  Play Now
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
