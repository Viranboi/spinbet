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
  // Crash (6)
  G("aviator", "Aviator", "Crash", "Spribe", "✈️", 97.0, { hot: true }),
  G("crash-x", "Crash X", "Crash", "Turbo Games", "🚀", 97.0),
  G("limbo", "Limbo", "Crash", "Spribe", "🔮", 97.0),
  G("jetx", "JetX", "Crash", "SmartSoft", "🛩️", 97.0, { hot: true }),
  G("balloon", "Balloon", "Crash", "SmartSoft", "🎈", 97.0, { new: true }),
  G("space-xy", "Space XY", "Crash", "BGaming", "🛸", 97.0),

  // Instant (14)
  G("mines", "Mines", "Instant", "Spribe", "💣", 97.0, { hot: true }),
  G("dice", "Dice", "Instant", "Spribe", "🎲", 98.0, { hot: true }),
  G("plinko", "Plinko", "Instant", "BGaming", "📌", 97.0),
  G("tower", "Tower", "Instant", "Turbo Games", "🏗️", 96.0),
  G("keno", "Keno", "Instant", "Spribe", "🔢", 95.0),
  G("wheel", "Wheel of Fortune", "Instant", "Evolution", "🎯", 96.0),
  G("scratch", "Scratch Gold", "Instant", "Pragmatic", "🎫", 95.0),
  G("coinflip", "Coin Flip", "Instant", "Turbo Games", "🪙", 98.0),
  G("rock-paper", "Rock Paper Scissors", "Instant", "Spribe", "✂️", 97.5),
  G("goal-rush", "Goal Rush", "Instant", "SmartSoft", "🥅", 96.5, { new: true }),
  G("chicken-road", "Chicken Road", "Instant", "InOut Games", "🐔", 98.0, { hot: true, new: true }),
  G("cubes", "Cubes 2", "Instant", "Hacksaw", "🧊", 96.2),
  G("maze", "Money Maze", "Instant", "InOut Games", "🌀", 97.0),
  G("darts", "Darts", "Instant", "Turbo Games", "🏹", 96.8),

  // Slots (40)
  G("sweet-bonanza", "Sweet Bonanza", "Slots", "Pragmatic Play", "🍭", 96.5, { hot: true }),
  G("gates-olympus", "Gates of Olympus", "Slots", "Pragmatic Play", "⚡", 96.5, { hot: true }),
  G("starlight", "Starlight Princess", "Slots", "Pragmatic Play", "🌟", 96.5),
  G("sugar-rush", "Sugar Rush", "Slots", "Pragmatic Play", "🍬", 96.5),
  G("big-bass", "Big Bass Bonanza", "Slots", "Reel Kingdom", "🎣", 96.7),
  G("wolf-gold", "Wolf Gold", "Slots", "Pragmatic Play", "🐺", 96.0),
  G("book-dead", "Book of Dead", "Slots", "Play'n GO", "📖", 96.2, { hot: true }),
  G("reactoonz", "Reactoonz", "Slots", "Play'n GO", "👽", 96.5),
  G("fire-joker", "Fire Joker", "Slots", "Play'n GO", "🔥", 96.1),
  G("rich-wilde", "Rich Wilde & the Amulet", "Slots", "Play'n GO", "🏺", 96.5),
  G("mega-moolah", "Mega Moolah", "Slots", "Microgaming", "🦁", 88.1, { hot: true }),
  G("immortal", "Immortal Romance", "Slots", "Microgaming", "🧛", 96.9),
  G("thunderstruck", "Thunderstruck II", "Slots", "Microgaming", "🌩️", 96.7),
  G("book-of-ra", "Book of Ra Deluxe", "Slots", "Novomatic", "📜", 95.1),
  G("lucky-lady", "Lucky Lady's Charm", "Slots", "Novomatic", "🍀", 95.1),
  G("sizzling-hot", "Sizzling Hot", "Slots", "Novomatic", "🌶️", 95.7),
  G("starburst", "Starburst", "Slots", "NetEnt", "⭐", 96.1),
  G("gonzo", "Gonzo's Quest", "Slots", "NetEnt", "🗿", 95.9),
  G("dead-or-alive", "Dead or Alive 2", "Slots", "NetEnt", "🤠", 96.8),
  G("divine-fortune", "Divine Fortune", "Slots", "NetEnt", "🏛️", 96.6),
  G("bonanza", "Bonanza Megaways", "Slots", "Big Time Gaming", "⛏️", 96.0),
  G("extra-chilli", "Extra Chilli", "Slots", "Big Time Gaming", "🌶️", 96.2),
  G("wanted-dead", "Wanted Dead or a Wild", "Slots", "Hacksaw", "🔫", 96.4, { hot: true }),
  G("rip-city", "RIP City", "Slots", "Hacksaw", "🏙️", 96.3, { new: true }),
  G("le-bandit", "Le Bandit", "Slots", "Hacksaw", "🎭", 96.4),
  G("chaos-crew", "Chaos Crew", "Slots", "Hacksaw", "💥", 96.3),
  G("mahjong-ways", "Mahjong Ways 2", "Slots", "PG Soft", "🀄", 96.9, { hot: true }),
  G("fortune-tiger", "Fortune Tiger", "Slots", "PG Soft", "🐯", 96.8, { hot: true }),
  G("fortune-ox", "Fortune Ox", "Slots", "PG Soft", "🐂", 96.8),
  G("fortune-mouse", "Fortune Mouse", "Slots", "PG Soft", "🐭", 96.9),
  G("ganesha", "Ganesha Fortune", "Slots", "PG Soft", "🐘", 96.7),
  G("wild-west", "Wild West Gold", "Slots", "Pragmatic Play", "🌵", 96.5),
  G("dog-house", "The Dog House", "Slots", "Pragmatic Play", "🐕", 96.5),
  G("fruits", "Fruit Party", "Slots", "Pragmatic Play", "🍉", 96.5),
  G("buffalo-king", "Buffalo King", "Slots", "Pragmatic Play", "🐃", 96.1),
  G("razor-shark", "Razor Shark", "Slots", "Push Gaming", "🦈", 96.7),
  G("jammin-jars", "Jammin' Jars", "Slots", "Push Gaming", "🫙", 96.8),
  G("money-train", "Money Train 4", "Slots", "Relax Gaming", "🚂", 96.4, { new: true }),
  G("temple-tumble", "Temple Tumble", "Slots", "Relax Gaming", "🛕", 96.2),
  G("snake-arena", "Snake Arena", "Slots", "Relax Gaming", "🐍", 96.3),

  // Table (10)
  G("roulette", "European Roulette", "Table", "Evolution", "🎡", 97.3, { hot: true }),
  G("blackjack", "Blackjack Classic", "Table", "Evolution", "🃏", 99.5),
  G("baccarat", "Baccarat", "Table", "Evolution", "👑", 98.9),
  G("sic-bo", "Sic Bo", "Table", "Pragmatic Play", "🎴", 97.2),
  G("craps", "Craps", "Table", "Evolution", "🎲", 98.6),
  G("american-roul", "American Roulette", "Table", "Evolution", "🎰", 94.7),
  G("auto-roulette", "Auto Roulette", "Table", "Evolution", "🔴", 97.3),
  G("dragon-tiger", "Dragon Tiger", "Table", "Pragmatic Play", "🐉", 96.3),
  G("fan-tan", "Fan Tan", "Table", "Evolution", "⚪", 98.9),
  G("teen-patti", "Teen Patti", "Table", "Ezugi", "🇮🇳", 97.0),

  // Live (12)
  G("crazy-time", "Crazy Time", "Live", "Evolution", "🎪", 96.1, { hot: true }),
  G("monopoly-live", "Monopoly Live", "Live", "Evolution", "🎩", 96.4),
  G("lightning-roul", "Lightning Roulette", "Live", "Evolution", "⚡", 97.3, { hot: true }),
  G("deal-no-deal", "Deal or No Deal", "Live", "Evolution", "💼", 96.3),
  G("dream-catcher", "Dream Catcher", "Live", "Evolution", "🎠", 96.6),
  G("mega-ball", "Mega Ball", "Live", "Evolution", "🎱", 96.1),
  G("monop-big-baller", "Monopoly Big Baller", "Live", "Evolution", "🚌", 96.1, { new: true }),
  G("funk-time", "Funky Time", "Live", "Evolution", "🕺", 95.9, { new: true }),
  G("gates-live", "Gates of Olympus Live", "Live", "Pragmatic Play", "🏛️", 96.5, { new: true }),
  G("sweet-bonanza-live", "Sweet Bonanza Candyland", "Live", "Pragmatic Play", "🍬", 96.5),
  G("live-andar", "Live Andar Bahar", "Live", "Evolution", "🃏", 97.9),
  G("stock-market", "Stock Market Live", "Live", "Ezugi", "📈", 97.0),

  // Card (10)
  G("texas-holdem", "Texas Hold'em Poker", "Card", "Evolution", "♠️", 97.8),
  G("video-poker", "Video Poker", "Card", "Betsoft", "🂡", 99.5),
  G("hilo", "Hi-Lo", "Card", "Spribe", "🔼", 97.0),
  G("three-card", "Three Card Poker", "Card", "Evolution", "♦️", 98.0),
  G("caribbean", "Caribbean Stud", "Card", "Playtech", "♣️", 97.4),
  G("pai-gow", "Pai Gow Poker", "Card", "Playtech", "🀅", 97.2),
  G("omaha", "Omaha Poker", "Card", "Evolution", "♥️", 98.0),
  G("war", "Casino War", "Card", "Evolution", "⚔️", 97.1),
  G("solitaire", "Casino Solitaire", "Card", "Playtech", "🂱", 96.8),
  G("baccarat-squeeze", "Baccarat Squeeze", "Card", "Evolution", "🫴", 98.9),

  // Virtual (6)
  G("virtual-football", "Virtual Football League", "Virtual", "Leapfrog", "⚽", 93.0, { hot: true }),
  G("virtual-derby", "Virtual Horse Derby", "Virtual", "Leapfrog", "🏇", 92.0),
  G("virtual-greyhound", "Virtual Greyhounds", "Virtual", "Leapfrog", "🐕", 92.5),
  G("virtual-basket", "Virtual Basketball", "Virtual", "Leapfrog", "🏀", 93.5),
  G("virtual-speedway", "Virtual Speedway", "Virtual", "Leapfrog", "🏍️", 92.8),
  G("virtual-cycling", "Virtual Cycling", "Virtual", "Leapfrog", "🚴", 92.3),

  // Fishing (2)
  G("fishing-master", "Fishing Master", "Fishing", "JILI", "🐟", 96.5),
  G("jackpot-fishing", "Jackpot Fishing", "Fishing", "JILI", "🐠", 96.8, { new: true }),
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
