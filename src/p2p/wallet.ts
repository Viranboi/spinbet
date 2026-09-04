import { LedgerEntry } from "./types";
import { emit, load, save, subscribe, uid } from "./storage";

const KEY = "wallet";
const LEDGER_KEY = "ledger";

const WELCOME_BONUS = 0;

interface WalletMap {
  [uid: string]: number;
}

function readAll(): WalletMap {
  return load<WalletMap>(KEY, {});
}

export function getBalance(userUid: string): number {
  const all = readAll();
  if (!(userUid in all)) return 0;
  return all[userUid];
}

export function ensureWallet(userUid: string): number {
  const all = readAll();
  if (userUid in all) return all[userUid];
  all[userUid] = WELCOME_BONUS;
  save(KEY, all);
  if (WELCOME_BONUS > 0) {
    pushLedger({
      id: uid("led"),
      uid: userUid,
      type: "welcome_bonus",
      amount: WELCOME_BONUS,
      balanceAfter: WELCOME_BONUS,
      ref: "signup",
      note: "Welcome bonus",
      ts: Date.now(),
    });
  }
  emit(KEY);
  return WELCOME_BONUS;
}

export function credit(
  userUid: string,
  amount: number,
  type: LedgerEntry["type"],
  ref: string,
  note: string
): number {
  const all = readAll();
  const next = Math.round(((all[userUid] || 0) + amount) * 100) / 100;
  all[userUid] = next;
  save(KEY, all);
  pushLedger({
    id: uid("led"),
    uid: userUid,
    type,
    amount,
    balanceAfter: next,
    ref,
    note,
    ts: Date.now(),
  });
  emit(KEY);
  return next;
}

export function debit(
  userUid: string,
  amount: number,
  type: LedgerEntry["type"],
  ref: string,
  note: string
): number {
  const all = readAll();
  const current = all[userUid] || 0;
  if (current < amount) throw new Error("Insufficient balance");
  const next = Math.round((current - amount) * 100) / 100;
  all[userUid] = next;
  save(KEY, all);
  pushLedger({
    id: uid("led"),
    uid: userUid,
    type,
    amount: -amount,
    balanceAfter: next,
    ref,
    note,
    ts: Date.now(),
  });
  emit(KEY);
  return next;
}

export function transferCoins(
  fromUid: string,
  toUid: string,
  amount: number,
  note: string
): number {
  if (amount <= 0) throw new Error("Amount must be positive");
  debit(fromUid, amount, "exchanger_transfer", toUid, note);
  return credit(toUid, amount, "exchanger_transfer", fromUid, note);
}

export function setBalance(
  userUid: string,
  amount: number,
  ref: string,
  note: string
): number {
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error("Enter a valid non-negative balance");
  const all = readAll();
  const current = all[userUid] || 0;
  const next = Math.round(amount * 100) / 100;
  all[userUid] = next;
  save(KEY, all);
  pushLedger({
    id: uid("led"),
    uid: userUid,
    type: "adjustment",
    amount: Math.round((next - current) * 100) / 100,
    balanceAfter: next,
    ref,
    note,
    ts: Date.now(),
  });
  emit(KEY);
  return next;
}

function pushLedger(entry: LedgerEntry) {
  const ledger = load<LedgerEntry[]>(LEDGER_KEY, []);
  ledger.unshift(entry);
  if (ledger.length > 500) ledger.length = 500;
  save(LEDGER_KEY, ledger);
}

export function getLedger(userUid: string): LedgerEntry[] {
  return load<LedgerEntry[]>(LEDGER_KEY, []).filter((e) => e.uid === userUid);
}

export function subscribeBalance(fn: () => void): () => void {
  return subscribe(KEY, fn);
}
