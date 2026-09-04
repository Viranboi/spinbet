import { findCrashTime } from "./gameEngine";

export interface RoundState {
  now: number;
  roundIndex: number;
  roundStart: number;
  msIntoPhase: number;
  phase: "BET" | "PLAYING" | "GAMEEND";
  betMs: number;
  playMs: number;
  endMs: number;
  roundMs: number;
  current: number;
  next: number[];
  history: number[];
  serverSeed?: string;
  clientSeed?: string;
  nonce?: number;
  hash?: string;
}

let serverOffset = 0;

export function syncedNow(): number {
  return Date.now() + serverOffset;
}

function applyServerTime(serverNow: number, rtt: number): void {
  serverOffset = serverNow + rtt / 2 - Date.now();
}

export async function fetchRoundState(): Promise<RoundState> {
  for (;;) {
    try {
      const t0 = Date.now();
      const res = await fetch("/api/rounds", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.now === "number") {
          applyServerTime(data.now, Date.now() - t0);
          return data as RoundState;
        }
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

export async function getUpcomingOdds(count = 12): Promise<number[]> {
  try {
    const t0 = Date.now();
    const res = await fetch(`/api/rounds?count=${count}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || typeof data.now !== "number") return [];
    applyServerTime(data.now, Date.now() - t0);
    return [data.current, ...(data.next || [])];
  } catch {
    return [];
  }
}

export function crashTimeFor(crashPoint: number): number {
  return findCrashTime(crashPoint);
}
