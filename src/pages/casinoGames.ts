export interface CasinoGame {
  id: string;
  name: string;
  cat: "Crash" | "Slots" | "Table" | "Live" | "Instant" | "Card" | "Virtual" | "Fishing";
  provider: string;
  icon: string;
  rtp: number;
  hot: boolean;
  new: boolean;
  players: number;
  gradient: string;
}

const G = (
  id: string,
  name: string,
  cat: CasinoGame["cat"],
  provider: string,
  icon: string,
  rtp: number,
  opts: { hot?: boolean; new?: boolean } = {}
): CasinoGame => ({
  id,
  name,
  cat,
  provider,
  icon,
  rtp,
  hot: !!opts.hot,
  new: !!opts.new,
  players: 200 + ((id.length * 137 + name.length * 61) % 3800),
  gradient: GRADIENTS[(id.charCodeAt(0) + name.length) % GRADIENTS.length],
});

const GRADIENTS = [
  "linear-gradient(135deg,#1a0533,#0d1b2a)",
  "linear-gradient(135deg,#2d1b4e,#0d1b2a)",
  "linear-gradient(135deg,#0d2b1e,#101820)",
  "linear-gradient(135deg,#331a05,#0d1b2a)",
  "linear-gradient(135deg,#051a33,#1a0533)",
  "linear-gradient(135deg,#33051a,#101820)",
  "linear-gradient(135deg,#1a3305,#0d2b1e)",
  "linear-gradient(135deg,#101820,#2d1b4e)",
];

export const CASINO_GAMES: CasinoGame[] = [
  G("aviator", "Aviator", "Crash", "Spribe", "✈️", 97.0, { hot: true }),
  G("mines", "Mines", "Instant", "Spribe", "💣", 97.0, { hot: true }),
];

export const PROVIDERS = Array.from(new Set(CASINO_GAMES.map((g) => g.provider))).sort();

export const CATEGORY_ICONS: Record<string, string> = {
  All: "🎮",
  Crash: "✈️",
  Slots: "🎰",
  Table: "🎲",
  Live: "📹",
  Instant: "⚡",
  Card: "🃏",
  Virtual: "🏇",
  Fishing: "🎣",
};
