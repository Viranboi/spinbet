import { emit, load, save, uid } from "./storage";

const CODES_KEY = "referral_codes";
const REFERRERS_KEY = "referral_referrers";
const COMMISSIONS_KEY = "referral_commissions";

interface CodeMap { [uid: string]: string }
interface ReferrerMap { [uid: string]: string }
interface CommissionEntry { id: string; uid: string; amount: number; fromUid: string; ts: number; }
interface CommissionMap { [uid: string]: CommissionEntry[] }

function readCodes(): CodeMap { return load<CodeMap>(CODES_KEY, {}); }
function readReferrers(): ReferrerMap { return load<ReferrerMap>(REFERRERS_KEY, {}); }
function readCommissions(): CommissionMap { return load<CommissionMap>(COMMISSIONS_KEY, {}); }

export function generateReferralCode(userUid: string): string {
  const all = readCodes();
  if (all[userUid]) return all[userUid];
  let code = `REF${userUid.slice(0, 6).toUpperCase()}`;
  const used = new Set(Object.values(all));
  let i = 0;
  while (used.has(code)) {
    i += 1;
    code = `REF${userUid.slice(0, 4).toUpperCase()}${i}`;
  }
  all[userUid] = code;
  save(CODES_KEY, all);
  emit(CODES_KEY);
  return code;
}

export function getReferralCode(userUid: string): string {
  const all = readCodes();
  if (all[userUid]) return all[userUid];
  return generateReferralCode(userUid);
}

export function findUidByCode(code: string): string | null {
  const all = readCodes();
  const entry = Object.entries(all).find(([, c]) => c.toLowerCase() === code.trim().toLowerCase());
  return entry ? entry[0] : null;
}

export function setReferrer(userUid: string, code: string): boolean {
  const refUid = findUidByCode(code);
  if (!refUid || refUid === userUid) return false;
  const all = readReferrers();
  if (all[userUid]) return false;
  all[userUid] = refUid;
  save(REFERRERS_KEY, all);
  emit(REFERRERS_KEY);
  return true;
}

export function getReferrerUid(userUid: string): string | null {
  return readReferrers()[userUid] || null;
}

export function listReferrals(userUid: string): string[] {
  const all = readReferrers();
  return Object.entries(all).filter(([, v]) => v === userUid).map(([k]) => k);
}

export function recordCommission(userUid: string, fromUid: string, amount: number): void {
  if (amount <= 0) return;
  const all = readCommissions();
  if (!all[userUid]) all[userUid] = [];
  all[userUid].unshift({ id: uid("ref"), uid: userUid, amount, fromUid, ts: Date.now() });
  if (all[userUid].length > 200) all[userUid].length = 200;
  save(COMMISSIONS_KEY, all);
  emit(COMMISSIONS_KEY);
}

export function getCommissions(userUid: string): CommissionEntry[] {
  return readCommissions()[userUid] || [];
}

export function getCommissionTotal(userUid: string): number {
  return getCommissions(userUid).reduce((s, e) => s + e.amount, 0);
}
