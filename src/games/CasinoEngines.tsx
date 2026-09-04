import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { CasinoGame } from "../pages/casinoGames";

export type EngineKind = "slot" | "crash" | "mines" | "wheel" | "flip" | "plinko" | "dice";

const SPECIAL: Record<string, EngineKind> = {
  dice: "dice",
  mines: "mines",
  chickenroad: "mines",
  tower: "mines",
  cubes: "mines",
  maze: "mines",
  plinko: "plinko",
  wheel: "wheel",
  darts: "wheel",
  keno: "wheel",
  coinflip: "flip",
  rockpaper: "flip",
  goalrush: "flip",
  scratch: "flip",
};

export function engineFor(game: CasinoGame): EngineKind {
  const key = game.id.replace(/-/g, "");
  if (SPECIAL[key]) return SPECIAL[key];
  if (game.cat === "Crash") return "crash";
  if (game.cat === "Slots" || game.cat === "Fishing") return "slot";
  if (game.cat === "Table" || game.cat === "Live" || game.cat === "Card" || game.cat === "Virtual")
    return "wheel";
  return "flip";
}

/* ---------------- shared bet controls ---------------- */

function BetBox({
  bet,
  setBet,
  disabled,
  children,
}: {
  bet: string;
  setBet: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="engine-controls">
      <div className="bet-field">
        <span>Bet</span>
        <input type="number" min={1} value={bet} onChange={(e) => setBet(e.target.value)} disabled={disabled} />
      </div>
      {children}
    </div>
  );
}

function useWager() {
  const [bet, setBet] = useState("100");
  return { bet, setBet, amount: Number(bet) || 0 };
}

interface EngineProps {
  game: CasinoGame;
  debit: (amount: number, note: string) => boolean;
  creditWin: (amount: number, note: string) => void;
}

/* ---------------- SLOT ENGINE ---------------- */

const SLOT_THEMES: Record<string, string[]> = {
  sweetbonanza: ["🍭", "🍬", "🍇", "🍉", "⭐"],
  gatesolympus: ["⚡", "🏛️", "👑", "💎", "🔔"],
  starlight: ["🌟", "💖", "🔮", "🍬", "⭐"],
  sugarrush: ["🍬", "🧁", "🍭", "🍓", "⭐"],
  bigbass: ["🎣", "🐟", "🚤", "🪱", "💰"],
  wolfgold: ["🐺", "🌕", "🏜️", "🐂", "💰"],
  bookdead: ["📖", "🏺", "🐍", "👁️", "💎"],
  reactoonz: ["👽", "⚛️", "🔋", "🌈", "💫"],
  firejoker: ["🔥", "🃏", "👑", "⭐", "🍒"],
  megamoolah: ["🦁", "🐘", "🦒", "🌴", "💰"],
  immortal: ["🧛", "🦇", "🏰", "🌹", "🕯️"],
  thunderstruck: ["🌩️", "🔨", "⚡", "🐏", "👑"],
  bookofra: ["📜", "🏺", "🐪", "🔺", "💎"],
  luckylady: ["🍀", "🐞", "🌙", "💰", "⭐"],
  sizzlinghot: ["🌶️", "🍒", "🍋", "🔔", "7️⃣"],
  starburst: ["⭐", "💎", "🔷", "🟣", "🟡"],
  gonzo: ["🗿", "🌿", "🪙", "🏔️", "💎"],
  deadoralive: ["🤠", "🔫", "🌵", "🐎", "💀"],
  divinefortune: ["🏛️", "⚡", "🦁", "🪙", "💎"],
  bonanza: ["⛏️", "💎", "🧨", "🚂", "💰"],
  extrachilli: ["🌶️", "🐓", "🌽", "🔥", "💰"],
  wanteddead: ["🔫", "🎯", "🚂", "💀", "💰"],
  ripcity: ["🏙️", "🎭", "💸", "🚕", "💥"],
  lebandit: ["🎭", "🎩", "💸", "🌃", "💎"],
  chaoscrew: ["💥", "🔧", "🐱", "⚡", "💀"],
  mahjongways: ["🀄", "🀅", "🀆", "🎴", "💎"],
  fortunetiger: ["🐯", "🧧", "🪙", "🏮", "💰"],
  fortuneox: ["🐂", "🧧", "🥮", "🏮", "💰"],
  fortunemouse: ["🐭", "🧧", "🪙", "🏮", "💰"],
  ganesha: ["🐘", "🪷", "✨", "🪙", "💎"],
  wildwest: ["🌵", "🤠", "🐍", "💰", "⭐"],
  doghouse: ["🐕", "🦴", "🐾", "🏠", "💰"],
  fruits: ["🍉", "🍇", "🍋", "🍎", "🍬"],
  buffaloking: ["🐃", "🌄", "🦅", "🌲", "💰"],
  razorshark: ["🦈", "🌊", "🐠", "🫧", "💎"],
  jamminjars: ["🫙", "🍓", "🍑", "🍇", "🍍"],
  moneytrain: ["🚂", "💵", "🔫", "🏜️", "💎"],
  templertumble: ["🛕", "🗿", "🌿", "💎", "🔥"],
  snakearena: ["🐍", "🥚", "🐀", "🌿", "💰"],
  fishingmaster: ["🎣", "🐟", "🦐", "🦑", "💰"],
  jackpotfishing: ["🐠", "🐡", "🦈", "🎣", "💣"],
};

function SlotEngine({ game, debit, creditWin }: EngineProps) {
  const symbols = SLOT_THEMES[game.id.replace(/-/g, "")] || ["7️⃣", "💎", "🔔", "🍒", "⭐"];
  const { bet, setBet, amount } = useWager();
  const [reels, setReels] = useState([0, 1, 2].map((i) => i % symbols.length));
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string>("");

  function spin() {
    if (spinning) return;
    if (amount <= 0) return toast.error("Enter a bet");
    if (!debit(amount, `${game.name} spin`)) return;
    setSpinning(true);
    setResult("");
    const final = [0, 0, 0].map(() => Math.floor(Math.random() * symbols.length));
    let ticks = 0;
    const iv = setInterval(() => {
      ticks++;
      setReels([0, 1, 2].map((i) => Math.floor(Math.random() * symbols.length)));
      if (ticks >= 12) {
        clearInterval(iv);
        setReels(final);
        const [a, b, c] = final;
        let mult = 0;
        if (a === b && b === c) mult = a === 0 ? 20 : a <= 2 ? 10 : 5;
        else if (a === b || b === c || a === c) mult = 1.5;
        if (mult > 0) {
          const win = Math.round(amount * mult * 100) / 100;
          creditWin(win, `${game.name} ${mult}x`);
          setResult(`🎉 ${mult}× — won ${win.toLocaleString()} coins`);
        } else {
          setResult("No match — try again");
        }
        setSpinning(false);
      }
    }, 90);
  }

  return (
    <div className="engine">
      <div className="slot-machine">
        {reels.map((r, i) => (
          <div key={i} className={`reel ${spinning ? "spin" : ""}`}>{symbols[r]}</div>
        ))}
      </div>
      <div className={`engine-result ${result.startsWith("🎉") ? "win" : result ? "lose" : ""}`}>{result}</div>
      <BetBox bet={bet} setBet={setBet} disabled={spinning}>
        <button className="btn-gold" onClick={spin} disabled={spinning}>{spinning ? "Spinning…" : "SPIN"}</button>
      </BetBox>
      <div className="paytable">3× {symbols[0]} = 20× · 3× {symbols[1]}-{symbols[2]} = 10× · 3× others = 5× · any pair = 1.5×</div>
    </div>
  );
}

/* ---------------- CRASH ENGINE ---------------- */

function CrashEngine({ game, debit, creditWin }: EngineProps) {
  const { bet, setBet, amount } = useWager();
  const [mult, setMult] = useState(1);
  const [state, setState] = useState<"idle" | "flying" | "crashed" | "cashed">("idle");
  const [lastCrash, setLastCrash] = useState<number | null>(null);
  const crashRef = useRef(0);
  const cashedRef = useRef(false);
  const ivRef = useRef<any>(null);

  useEffect(() => () => clearInterval(ivRef.current), []);

  function launch() {
    if (state === "flying") return;
    if (amount <= 0) return toast.error("Enter a bet");
    if (!debit(amount, `${game.name} bet`)) return;
    const r = Math.random();
    crashRef.current = Math.max(1.01, Math.min(120, 0.98 / (1 - r)));
    cashedRef.current = false;
    setState("flying");
    setMult(1);
    const start = Date.now();
    ivRef.current = setInterval(() => {
      const t = (Date.now() - start) / 1000;
      const m = Math.pow(1.06, t * 4);
      if (m >= crashRef.current) {
        clearInterval(ivRef.current);
        setMult(crashRef.current);
        setLastCrash(crashRef.current);
        setState("crashed");
      } else {
        setMult(m);
      }
    }, 60);
  }

  function cashOut() {
    if (state !== "flying" || cashedRef.current) return;
    cashedRef.current = true;
    clearInterval(ivRef.current);
    const win = Math.round(amount * mult * 100) / 100;
    creditWin(win, `${game.name} cashout ${mult.toFixed(2)}x`);
    setState("cashed");
  }

  return (
    <div className="engine">
      <div className={`crash-screen ${state}`}>
        <div className="crash-mult">{mult.toFixed(2)}×</div>
        <div className="crash-bar"><span style={{ width: `${Math.min(100, (mult / Math.max(2, lastCrash || 2)) * 100)}%` }}></span></div>
        {state === "crashed" && <div className="crash-msg boom">💥 Crashed at {crashRef.current.toFixed(2)}×</div>}
        {state === "cashed" && <div className="crash-msg win">✅ Cashed out {mult.toFixed(2)}×</div>}
        {lastCrash !== null && state !== "crashed" && <div className="crash-last">Last crash: {lastCrash.toFixed(2)}×</div>}
      </div>
      <BetBox bet={bet} setBet={setBet} disabled={state === "flying"}>
        {state === "flying" ? (
          <button className="btn-green" onClick={cashOut}>Cash out {mult.toFixed(2)}×</button>
        ) : (
          <button className="btn-gold" onClick={launch}>Launch</button>
        )}
      </BetBox>
    </div>
  );
}

/* ---------------- MINES ENGINE ---------------- */

function MinesEngine({ game, debit, creditWin }: EngineProps) {
  const { bet, setBet, amount } = useWager();
  const [mines, setMines] = useState(5);
  const [board, setBoard] = useState<boolean[]>(Array(25).fill(false));
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [state, setState] = useState<"idle" | "playing" | "lost" | "won">("idle");

  function start() {
    if (amount <= 0) return toast.error("Enter a bet");
    if (!debit(amount, `${game.name} bet`)) return;
    const bombs = new Set<number>();
    while (bombs.size < mines) bombs.add(Math.floor(Math.random() * 25));
    setBoard(Array.from({ length: 25 }, (_, i) => bombs.has(i)));
    setRevealed(new Set());
    setState("playing");
  }

  function pick(i: number) {
    if (state !== "playing" || revealed.has(i)) return;
    if (board[i]) {
      setState("lost");
      return;
    }
    const next = new Set(revealed).add(i);
    setRevealed(next);
    if (next.size === 25 - mines) finish(next.size);
  }

  function currentMult(picks: number): number {
    if (picks === 0) return 1;
    let m = 0.97;
    for (let i = 0; i < picks; i++) m *= (25 - i) / (25 - mines - i);
    return Math.round(m * 100) / 100;
  }

  function finish(picks: number) {
    const win = Math.round(amount * currentMult(picks) * 100) / 100;
    creditWin(win, `${game.name} cleared ${picks}`);
    setState("won");
  }

  const picks = revealed.size;

  return (
    <div className="engine">
      <div className="mines-head">
        <select value={mines} onChange={(e) => setMines(Number(e.target.value))} disabled={state === "playing"}>
          {[3, 5, 10].map((n) => <option key={n} value={n}>{n} traps</option>)}
        </select>
        {state === "playing" && (
          <span className="mines-info">Next: {currentMult(picks + 1).toFixed(2)}× · Now: {currentMult(picks).toFixed(2)}×</span>
        )}
      </div>
      <div className="mines-grid">
        {board.map((isTrap, i) => (
          <button
            key={i}
            className={`tile ${revealed.has(i) ? "safe" : ""} ${(state === "lost" || state === "won") && isTrap ? "trap-show" : ""}`}
            onClick={() => pick(i)}
            disabled={state !== "playing"}
          >
            {(state === "lost" || state === "won") && isTrap ? "💥" : revealed.has(i) ? "💎" : ""}
          </button>
        ))}
      </div>
      {state === "lost" && <div className="engine-result lose">💥 Hit a trap — lost</div>}
      {state === "won" && <div className="engine-result win">🎉 Cleared! Won {Math.round(amount * currentMult(state === "won" ? picks : picks)).toLocaleString()} coins</div>}
      <BetBox bet={bet} setBet={setBet} disabled={state === "playing"}>
        {state === "playing" ? (
          <button className="btn-green" onClick={() => finish(picks)} disabled={picks === 0}>
            Cash out {currentMult(picks).toFixed(2)}×
          </button>
        ) : (
          <button className="btn-gold" onClick={start}>Start round</button>
        )}
      </BetBox>
    </div>
  );
}

/* ---------------- WHEEL ENGINE ---------------- */

const WHEEL_SEGMENTS = [
  { label: "0×", mult: 0, cls: "lose" },
  { label: "1.5×", mult: 1.5, cls: "" },
  { label: "0×", mult: 0, cls: "lose" },
  { label: "2×", mult: 2, cls: "mid" },
  { label: "0×", mult: 0, cls: "lose" },
  { label: "3×", mult: 3, cls: "mid" },
  { label: "0×", mult: 0, cls: "lose" },
  { label: "5×", mult: 5, cls: "high" },
  { label: "0×", mult: 0, cls: "lose" },
  { label: "10×", mult: 10, cls: "jackpot" },
];

function WheelEngine({ game, debit, creditWin }: EngineProps) {
  const { bet, setBet, amount } = useWager();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");

  function spin() {
    if (spinning) return;
    if (amount <= 0) return toast.error("Enter a bet");
    if (!debit(amount, `${game.name} spin`)) return;
    setSpinning(true);
    setResult("");
    const idx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segAngle = 360 / WHEEL_SEGMENTS.length;
    const target = 360 * 5 + (360 - idx * segAngle - segAngle / 2);
    setAngle((a) => a + target);
    setTimeout(() => {
      const seg = WHEEL_SEGMENTS[idx];
      if (seg.mult > 0) {
        const win = Math.round(amount * seg.mult * 100) / 100;
        creditWin(win, `${game.name} ${seg.label}`);
        setResult(`🎉 ${seg.label} — won ${win.toLocaleString()} coins`);
      } else {
        setResult(`Landed on ${seg.label} — try again`);
      }
      setSpinning(false);
    }, 3200);
  }

  return (
    <div className="engine center">
      <div className="wheel-wrap">
        <div className={`wheel ${spinning ? "spinning" : ""}`} style={{ transform: `rotate(${angle}deg)` }}>
          {WHEEL_SEGMENTS.map((s, i) => (
            <div key={i} className={`segment ${s.cls}`} style={{ transform: `rotate(${i * 36}deg)` }}>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="wheel-pointer">▼</div>
      </div>
      <div className={`engine-result ${result.startsWith("🎉") ? "win" : result ? "lose" : ""}`}>{result}</div>
      <BetBox bet={bet} setBet={setBet} disabled={spinning}>
        <button className="btn-gold" onClick={spin} disabled={spinning}>{spinning ? "Spinning…" : "Spin"}</button>
      </BetBox>
    </div>
  );
}

/* ---------------- FLIP ENGINE ---------------- */

const FLIP_OPTIONS: Record<string, { label: string[]; icon: string[] }> = {
  coinflip: { label: ["Heads", "Tails"], icon: ["🪙", "🌙"] },
  rockpaper: { label: ["Rock", "Paper", "Scissors"], icon: ["🪨", "📄", "✂️"] },
  goalrush: { label: ["Shoot Left", "Shoot Right"], icon: ["⬅️", "➡️"] },
  scratch: { label: ["Scratch Gold", "Scratch Diamond"], icon: ["🎫", "💎"] },
};

function FlipEngine({ game, debit, creditWin }: EngineProps) {
  const opts = FLIP_OPTIONS[game.id.replace(/-/g, "")] || {
    label: game.cat === "Virtual" ? ["Home Win", "Away Win"] : ["Option A", "Option B"],
    icon: ["🔵", "🔴"],
  };
  const three = opts.label.length === 3;
  const mult = three ? 2.85 : 1.95;
  const { bet, setBet, amount } = useWager();
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<number | null>(null);
  const [result, setResult] = useState("");

  function play(choice: number) {
    if (busy) return;
    if (amount <= 0) return toast.error("Enter a bet");
    if (!debit(amount, `${game.name} bet`)) return;
    setBusy(true);
    setPicked(choice);
    setOutcome(null);
    setResult("");
    setTimeout(() => {
      const o = Math.floor(Math.random() * opts.label.length);
      setOutcome(o);
      if (o === choice) {
        const win = Math.round(amount * mult * 100) / 100;
        creditWin(win, `${game.name} win`);
        setResult(`🎉 You won ${win.toLocaleString()} coins (${mult}×)`);
      } else {
        setResult(`It was ${opts.label[o]} — you lost`);
      }
      setBusy(false);
    }, 900);
  }

  return (
    <div className="engine center">
      <div className="flip-stage">
        {opts.icon.map((ic, i) => (
          <button
            key={i}
            className={`flip-card ${picked === i ? "picked" : ""} ${outcome === i ? "hit" : outcome !== null && picked === i ? "miss" : ""}`}
            onClick={() => play(i)}
            disabled={busy}
          >
            <span className="flip-icon">{ic}</span>
            <span>{opts.label[i]}</span>
            <small>{mult}×</small>
          </button>
        ))}
      </div>
      <div className={`engine-result ${result.startsWith("🎉") ? "win" : result ? "lose" : ""}`}>{result}</div>
      <BetBox bet={bet} setBet={setBet} disabled={busy}>
        <div />
      </BetBox>
    </div>
  );
}

/* ---------------- PLINKO ENGINE ---------------- */

const PLINKO_SLOTS = [5.6, 2.1, 1.1, 0.5, 0.2, 0.5, 1.1, 2.1, 5.6];

function PlinkoEngine({ game, debit, creditWin }: EngineProps) {
  const { bet, setBet, amount } = useWager();
  const [dropping, setDropping] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const [result, setResult] = useState("");

  function drop() {
    if (dropping) return;
    if (amount <= 0) return toast.error("Enter a bet");
    if (!debit(amount, `${game.name} drop`)) return;
    const p: number[] = [];
    for (let i = 0; i < 8; i++) p.push(Math.random() < 0.5 ? 0 : 1);
    setLanded(null);
    setResult("");
    setDropping(true);
    setTimeout(() => {
      const slot = p.reduce((a, b) => a + b, 0);
      setLanded(slot);
      const m = PLINKO_SLOTS[slot];
      if (m >= 1) {
        const win = Math.round(amount * m * 100) / 100;
        creditWin(win, `${game.name} ${m}x`);
        setResult(`🎉 ${m}× — won ${win.toLocaleString()} coins`);
      } else {
        setResult(`${m}× — try again`);
      }
      setDropping(false);
    }, 1600);
  }

  return (
    <div className="engine center">
      <div className="plinko-board">
        {Array.from({ length: 8 }).map((_, row) => (
          <div key={row} className="peg-row">
            {Array.from({ length: row + 2 }).map((__, i) => <span key={i} className="peg" />)}
          </div>
        ))}
        {!dropping && landed === null && <div className="plinko-ball idle">⚪</div>}
        {dropping && <div className="plinko-ball dropping">⚪</div>}
      </div>
      <div className="plinko-slots">
        {PLINKO_SLOTS.map((m, i) => (
          <span key={i} className={`pslot ${landed === i ? "hit" : ""} ${m >= 2 ? "hot" : m < 1 ? "cold" : ""}`}>{m}×</span>
        ))}
      </div>
      <div className={`engine-result ${result.startsWith("🎉") ? "win" : result ? "lose" : ""}`}>{result}</div>
      <BetBox bet={bet} setBet={setBet} disabled={dropping}>
        <button className="btn-gold" onClick={drop} disabled={dropping}>{dropping ? "Dropping…" : "Drop ball"}</button>
      </BetBox>
    </div>
  );
}

export {
  SlotEngine,
  CrashEngine,
  MinesEngine,
  WheelEngine,
  FlipEngine,
  PlinkoEngine,
  useWager,
  BetBox,
};
