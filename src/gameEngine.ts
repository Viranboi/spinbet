export interface FakePlayer {
  name: string;
  betAmount: number;
  cashOut: number;
  cashouted: boolean;
  target: number;
  img: string;
  bot?: boolean;
}

const FIRST_NAMES = [
  "Ali", "Kamal", "Jean", "Pierre", "Eric", "Musa", "David", "Samuel",
  "Joseph", "Patrick", "Emmanuel", "Benjamin", "Daniel", "Michael", "James",
  "John", "Robert", "William", "Richard", "Thomas", "Charles", "Peter",
  "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
  "George", "Timothy", "Ronald", "Edward", "Jason", "Jeffrey", "Ryan",
  "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry",
  "Justin", "Scott", "Brandon", "Benjamin", "Samuel", "Raymond", "Gregory",
  "Frank", "Alexander", "Patrick", "Jack", "Dennis", "Jerry", "Tyler",
  "Aaron", "Jose", "Nathan", "Henry", "Douglas", "Peter", "Zachary",
  "Noah", "Adam", "Kyle", "Carl", "Arthur", "Gerald", "Roger",
  "Keith", "Jeremy", "Terry", "Lawrence", "Sean", "Austin", "Joe",
  "Willie", "Billy", "Bruce", "Gabriel", "Logan", "Albert", "Ethan",
  "Wayne", "Ralph", "Roy", "Eugene", "Randy", "Vincent", "Philip",
  "Bobby", "Harry", "Ralph", "Louis", "Philip", "Wayne", "Eugene",
  "Bruno", "Kofi", "Amadou", "Ibrahim", "Moussa", "Omar", "Hassan",
  "Karim", "Youssef", "Ahmed", "Mamadou", "Abdoulaye", "Ismail",
  "Sekou", "Moussa", "Boubacar", "Amadou", "Souleymane", "Bakari",
];

const LAST_NAMES = [
  "M.", "D.", "K.", "J.", "B.", "S.", "A.", "L.", "T.", "R.",
  "N.", "C.", "E.", "P.", "W.", "G.", "H.", "F.", "O.", "I.",
  "U.", "V.", "X.", "Z.", "Y.", "Q.", "M.B.", "A.K.", "J.P.",
  "D.W.", "S.T.", "B.R.", "K.N.", "L.C.", "E.H.", "P.G.", "W.F.",
  "N.O.", "C.I.", "R.U.", "T.V.", "G.X.", "H.Z.", "F.Y.",
];

const MASKED_NAMES: string[] = [];
for (let i = 0; i < 200; i++) {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  MASKED_NAMES.push(`${first} ${last}`);
}
// Ensure uniqueness
const UNIQUE_NAMES = Array.from(new Set(MASKED_NAMES));

const AVATARS = [
  "./avatars/av-3.png", "./avatars/av-4.png", "./avatars/av-5.png",
  "./avatars/av-12.png", "./avatars/av-13.png", "./avatars/av-14.png",
  "./avatars/av-15.png", "./avatars/av-39.png", "./avatars/av-45.png",
];

export function generateMultiplier(time: number): number {
  return (
    1 +
    0.06 * time +
    Math.pow(0.06 * time, 2) -
    Math.pow(0.04 * time, 3) +
    Math.pow(0.04 * time, 4)
  );
}

export function findCrashTime(crashPoint: number): number {
  let lo = 0;
  let hi = 1000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (generateMultiplier(mid) < crashPoint) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

// Custom pacing (spec): 0x -> 1x takes 4s, 1x -> 2x takes 4s,
// then every additional +1x takes 1s (3x at 9s, 4x at 10s, Nx at N+6s).
// Identical on every round — pace reveals nothing about the crash point.
export function flightSecondsFor(crashPoint: number): number {
  if (!Number.isFinite(crashPoint) || crashPoint <= 0) return 0;
  return crashPoint <= 2 ? crashPoint * 4 : crashPoint + 6;
}

// Multiplier after elapsedSec seconds of flight, capped at the crash point.
// FIX 1: never below 1.00x — without this floor, cashing out during the
// first 4s paid LESS than the stake (e.g. 0.5x at t=2s).
// FIX 2: non-finite crash input can no longer produce a NaN multiplier.
export function multiplierAtElapsed(crashPoint: number, elapsedSec: number): number {
  if (!Number.isFinite(crashPoint) || crashPoint <= 0) return 1;
  const t = Math.max(0, elapsedSec);
  let m: number;
  if (t <= 4) m = t / 4;
  else if (t <= 8) m = 1 + (t - 4) / 4;
  else m = t - 6;
  return Math.min(Math.max(m, 1), crashPoint);
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function computeCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(serverSeed);
  const msgData = encoder.encode(`${clientSeed}:${nonce}`);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const h = parseInt(hex.substring(0, 8), 16) / 0xffffffff;

  if (h === 0) return 1;

  const crashPoint = 0.97 / h;
  return Math.max(1, Math.floor(crashPoint * 100) / 100);
}

export function generateFakePlayers(crashPoint: number): FakePlayer[] {
  const count = Math.floor(Math.random() * 251) + 1050;
  const users: FakePlayer[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name: string;
    if (i < UNIQUE_NAMES.length) {
      name = UNIQUE_NAMES[i % UNIQUE_NAMES.length];
    } else {
      name = UNIQUE_NAMES[Math.floor(Math.random() * UNIQUE_NAMES.length)];
    }
    if (usedNames.has(name) && Math.random() > 0.3) {
      name = `${name} ${Math.floor(Math.random() * 99)}`;
    }
    usedNames.add(name);
    const betAmount = i < 12
      ? Math.floor(Math.random() * 29999 + 60001)
      : Math.floor(Math.random() * 49000 + 1000);
    const willCashOut = Math.random() > 0.3;
    const cashOutMult = willCashOut
      ? Math.max(
          1.01,
          Math.floor((Math.random() * Math.min(crashPoint, 20) + 1) * 100) / 100
        )
      : 0;
    users.push({
      name,
      betAmount,
      cashOut: willCashOut ? betAmount * cashOutMult : 0,
      cashouted: willCashOut,
      target: cashOutMult,
      img: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      bot: false,
    });
  }
  return users;
}

export function generateWatcherCount(): number {
  return Math.floor(Math.random() * 3000) + 5000;
}

export function generateInitialHistory(): number[] {
  const values = [
    1.98, 1.34, 5.67, 1.12, 2.45, 1.87, 12.34, 1.56, 2.89, 3.45,
    1.34, 4.56, 1.78, 2.12, 1.45, 2.34, 1.67, 1.23, 3.98, 1.11,
    1.12, 2.67, 1.90, 1.34, 4.12, 1.89, 5.43, 1.23, 2.78, 1.23,
    1.56, 3.21, 1.08, 2.11, 1.54, 1.44, 1.88, 1.92, 1.11, 1.67,
  ];
  return values;
}

export function newServerSeed(): string {
  return randomHex(32);
}

export function newClientSeed(): string {
  return randomHex(16);
}
