import React from 'react';

export default function GameLayout({ title, emoji, color = '#7C3AED', children, sidebar }: {
  title: string;
  emoji: string;
  color?: string;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  return (
    <div style={{
      maxWidth: 960, margin: '0 auto', padding: '32px 24px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: color + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>{emoji}</div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 800, fontSize: 26, color: '#fff',
        }}>{title}</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: sidebar ? '1fr 300px' : '1fr',
        gap: 20,
        alignItems: 'start',
      }}>
        <div>{children}</div>
        {sidebar && <div>{sidebar}</div>}
      </div>
    </div>
  );
}

export function Panel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#111113',
      border: '1.5px solid #303236',
      borderRadius: 16,
      padding: 24,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function BetInput({ bet, setBet, onHalf, onDouble, disabled }: {
  bet: number;
  setBet: (v: number) => void;
  onHalf: () => void;
  onDouble: () => void;
  disabled: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#9ea0a3', display: 'block', marginBottom: 8 }}>
        Bet Amount
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number" min="1" value={bet}
          onChange={e => setBet(Math.max(1, Number(e.target.value)))}
          disabled={disabled}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid #303236', fontSize: 15, fontWeight: 600,
            background: '#1a1b1e', color: '#fff',
          }}
        />
        <button onClick={onHalf} disabled={disabled} style={{
          padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: '#1a1b1e', color: '#9ea0a3',
          border: '1.5px solid #303236', cursor: disabled ? 'not-allowed' : 'pointer',
        }}>½</button>
        <button onClick={onDouble} disabled={disabled} style={{
          padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: '#1a1b1e', color: '#9ea0a3',
          border: '1.5px solid #303236', cursor: disabled ? 'not-allowed' : 'pointer',
        }}>2×</button>
      </div>
    </div>
  );
}

export function ActionButton({ onClick, disabled, children, color = '#7C3AED', variant = 'primary' }: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  color?: string;
  variant?: 'primary' | 'secondary';
}) {
  const base: React.CSSProperties = {
    width: '100%', padding: '14px', borderRadius: 12,
    fontWeight: 700, fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', letterSpacing: '0.3px',
    opacity: disabled ? 0.5 : 1, border: 'none',
  };
  const styles: React.CSSProperties = variant === 'primary' ? {
    ...base,
    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
    color: '#fff',
    boxShadow: `0 4px 16px ${color}44`,
  } : {
    ...base,
    background: '#111113',
    color,
    border: `2px solid ${color}`,
  };
  return (
    <button onClick={onClick} disabled={disabled} style={styles}>
      {children}
    </button>
  );
}
