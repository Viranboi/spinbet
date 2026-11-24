import { LedgerEntry } from "./types";
import { emit, load, save, subscribe, uid } from "./storage";
import { pushBalance, pushDelta } from "./remote";
import * as referrals from "./referrals";

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
  // Do NOT push here: server balance wins on load via ensureRemoteLoop.
  // Pushing 0 on first open used to overwrite admin top-ups.
  emit(KEY);
  return WELCOME_BONUS;
}

export function credit(
  userUid: string,
  amount: number,
  type: LedgerEntry["type"],
  ref: string,
  note: string,
  pushRemote: boolean = true
): number {
  const all = readAll();
  const next = Math.round(((all[userUid] || 0) + amount) * 10000) / 10000;
  all[userUid] = next;
  save(KEY, all);
  if (pushRemote) pushDelta(userUid, amount).catch(() => {});
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

  // Referral commission: 15% of referred user's casino wins.
  if (type === "casino_win" && amount > 0) {
    const refUid = referrals.getReferrerUid(userUid);
    if (refUid) {
      const commission = Math.round(amount * 0.15 * 10000) / 10000;
      if (commission > 0) {
        try {
          credit(refUid, commission, "referral_commission", userUid, "Referral commission (15%)");
          referrals.recordCommission(refUid, userUid, commission);
        } catch {
          /* ignore commission errors */
        }
      }
    }
  }

  return next;
}

export function debit(
  userUid: string,
  amount: number,
  type: LedgerEntry["type"],
  ref: string,
  note: string,
  pushRemote: boolean = true
): number {
  const all = readAll();
  const current = all[userUid] || 0;
  if (current < amount) throw new Error("Insufficient balance");
  const next = Math.round((current - amount) * 10000) / 10000;
  all[userUid] = next;
  save(KEY, all);
  if (pushRemote) pushDelta(userUid, -amount).catch(() => {});
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
  note: string,
  pushRemote: boolean = true
): number {
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error("Enter a valid non-negative balance");
  const all = readAll();
  const current = all[userUid] || 0;
  const next = Math.round(amount * 10000) / 10000;
  all[userUid] = next;
  save(KEY, all);
  if (pushRemote) pushBalance(userUid, next);
  pushLedger({
    id: uid("led"),
    uid: userUid,
    type: "adjustment",
    amount: Math.round((next - current) * 10000) / 10000,
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
