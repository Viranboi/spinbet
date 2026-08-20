export interface FakePlayer {
  name: string;
  betAmount: number;
  cashOut: number;
  cashouted: boolean;
  target: number;
  img: string;
  bot?: boolean;
}

const FAKE_NAMES = [
  "Raj***k", "Sud***p", "Vik***r", "Ama***n", "Kri***a",
  "San***y", "Pri***a", "Ank***h", "Dev***s", "Rah***l",
  "Ayu***i", "Sur***j", "Nar***a", "Man***h", "Gau***m",
  "Kum***r", "Lak***i", "Ram***h", "Sit***a", "Shi***a",
  "Joh***n", "Mar***a", "Dav***d", "Car***s", "Pat***k",
  "Ric***d", "Ste***n", "Jas***e", "Bra***y", "Toh***a",
  "Kau***l", "Ani***a", "Roh***t", "Nik***l", "Sar***a",
  "Ven***t", "Oma***r", "Zai***a", "Har***h", "Mea***a",
];

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
  const e = Math.pow(2, 32);
  const crashPoint =
    Math.floor((100 - 1) * e) / (parseInt(hex.substring(0, 8), 16) + 1);
  return Math.max(1, Math.floor(crashPoint * 100) / 100);
}

export function generateFakePlayers(crashPoint: number): FakePlayer[] {
  const count = Math.floor(Math.random() * 12) + 4;
  const users: FakePlayer[] = [];
  for (let i = 0; i < count; i++) {
    const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
    const betAmount = [20, 50, 100, 200, 500, 1000][
      Math.floor(Math.random() * 6)
    ];
    const willCashOut = Math.random() > 0.3;
    const cashOutMult = willCashOut
      ? Math.max(
          1.01,
          Math.floor((Math.random() * Math.min(crashPoint, 50) + 1) * 100) / 100
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

export function generateInitialHistory(): number[] {
  const values = [
    1.23, 2.45, 1.87, 5.67, 1.12, 3.45, 12.34, 1.56, 2.89, 7.89,
    1.34, 4.56, 1.78, 9.12, 1.45, 2.34, 6.78, 1.23, 3.98, 15.67,
    1.12, 2.67, 8.9, 1.34, 4.12, 1.89, 5.43, 1.23, 2.78, 11.23,
    1.56, 3.21, 1.08, 2.11, 6.54, 1.44, 4.88, 1.92, 10.11, 1.67,
  ];
  return values;
}

export function newServerSeed(): string {
  return randomHex(32);
}

export function newClientSeed(): string {
  return randomHex(16);
}
