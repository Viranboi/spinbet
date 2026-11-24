import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";
import { useWallet } from "../p2p/hooks";
import { credit, debit } from "../p2p/wallet";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCurrency } from "../currency";
import "./DepositPage.scss";
import "./WithdrawPage.scss";

export const MIN_WITHDRAW = 150;

interface WdReq {
  id: string;
  amount: number;
  phone: string;
  ts: number;
  status: string;
}

const WD_KEY = "letsbet_p2p_v1_withdrawals";

function loadReqs(uid: string): WdReq[] {
  try {
    const all = JSON.parse(localStorage.getItem(WD_KEY) || "{}");
    const raw = all[uid] || [];
    return raw.map((r: any) => ({
      id: r.id,
      amount: r.amount,
      phone: r.phone || "",
      ts: r.ts,
      status: r.status || "pending",
    }));
  } catch {
    return [];
  }
}

function saveReq(uid: string, req: WdReq) {
  try {
    const all = JSON.parse(localStorage.getItem(WD_KEY) || "{}");
    all[uid] = [req, ...(all[uid] || [])].slice(0, 50);
    localStorage.setItem(WD_KEY, JSON.stringify(all));
  } catch {}
}

export default function WithdrawPage() {
  const { user } = useAuth();
  const { balance, ledger } = useWallet();
  const { currency, disp, usd, fmt, symbol } = useCurrency();
  const [amount, setAmount] = useState<string>("150");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [reqs, setReqs] = useState<WdReq[]>(() => (user ? loadReqs(user.uid) : []));

  const numAmount = Number(amount);
  const amtUsd = usd(numAmount);
  const withdrawals = useMemo(() => ledger.filter((e) => e.type === "withdraw").slice(0, 20), [ledger]);

  React.useEffect(() => {
    if (user) {
      setReqs(loadReqs(user.uid));
      if (!phone) setPhone(user.phone || "");
    } else {
      setReqs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Amounts are typed in the display currency; reset the default when it changes.
  React.useEffect(() => {
    setAmount(String(disp(150)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  async function submitWithdraw() {
    if (!user) return toast.error("Please login to withdraw");
    const ph = phone.trim();
    const digits = ph.replace(/\D/g, "");
    if (!/^0?7[89]\d{7,8}$/.test(digits) && !/^2507[89]\d{7,8}$/.test(digits))
      return toast.error("Enter a valid MTN phone number (e.g. 078XXXXXXX)");
    if (!amtUsd || amtUsd < MIN_WITHDRAW) return toast.error(`Minimum withdraw is ${fmt(MIN_WITHDRAW)}`);
    if (amtUsd > balance) return toast.error("Amount exceeds your balance");
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const id = `wd-${Date.now()}`;
      debit(user.uid, amtUsd, "withdraw", id, `Withdraw ${fmt(amtUsd)} — Phone: ${ph}`);
      try {
        // Must reach Firestore — otherwise the admin will never see this request.
        await setDoc(
          doc(db, "withdrawals", id),
          {
            id,
            uid: user.uid,
            userId: user.uid,
            userName: user.displayName || "",
            email: user.email || "",
            phone: ph,
            amount: amtUsd,
            ts: Date.now(),
            status: "pending",
          },
          { merge: true }
        );
      } catch (fireErr: any) {
        // Restore the balance so a failed submit never costs money.
        credit(user.uid, amtUsd, "adjustment", `wd-rev-${id}`, `Withdrawal submit failed — refunded`);
        throw new Error(
          "Couldn't reach the server — your balance was restored. Please try again."
        );
      }
      const req: WdReq = { id, amount: amtUsd, phone: ph, ts: Date.now(), status: "pending" };
      saveReq(user.uid, req);
      setReqs(loadReqs(user.uid));
      toast.success(`Withdraw of ${fmt(amtUsd)} submitted! MTN ${ph} under review.`);
      setAmount(String(disp(150)));
      setPhone(user.phone || "");
    } catch (e: any) {
      toast.error(e?.message || "Withdraw failed");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="dm-page wd-page">
        <div className="dm-header">
          <button className="dm-back" onClick={() => window.history.back()}>‹</button>
          <span className="dm-title">WITHDRAW</span>
        </div>
        <div className="dm-body">
          <div className="dm-card dm-login-gate">
            <span className="dm-gate-icon">🔒</span>
            <h2>Login Required</h2>
            <p>You need to be logged in to withdraw.</p>
          </div>
        </div>
      </div>
    );
  }

  const blocked = balance < MIN_WITHDRAW;

  return (
    <div className="dm-page wd-page">
      <div className="dm-header">
        <button className="dm-back" onClick={() => window.history.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="dm-title">WITHDRAW</span>
      </div>

      <div className="dm-body">
        <div className="dm-card">
          <div className="wd-bal">
            <span>Available balance</span>
            <b>{fmt(balance)}</b>
          </div>

          {blocked ? (
            <div className="wd-blocked">
              <span className="wd-lock">🔒</span>
              <h3>Minimum {fmt(MIN_WITHDRAW)} Required</h3>
              <p>You need at least <b>{fmt(MIN_WITHDRAW)}</b> to withdraw — you currently hold <b>{fmt(Math.floor(balance))}</b>. Keep playing Aviator or Mines (min {fmt(10)}) to grow your balance.</p>
            </div>
          ) : (
            <>
              <div className="cd-step">
                <span className="cd-num">1</span>
                <div className="cd-step-body">
                  <h3>Enter amount (min {fmt(MIN_WITHDRAW)})</h3>
                  <div className="cd-custom">
                    <span>{symbol}</span>
                    <input type="number" min={disp(MIN_WITHDRAW)} value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="cd-presets" style={{ marginTop: 10 }}>
                    {[150, 300, 500, 1000].map((p) => (
                      <button key={p} className={`cd-chip ${Math.abs(amtUsd - p) < 1 ? "on" : ""}`} onClick={() => setAmount(String(disp(p)))}>{fmt(p)}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cd-step">
                <span className="cd-num">2</span>
                <div className="cd-step-body">
                  <h3>Enter MTN phone number</h3>
                  <p className="cd-note">Funds will be sent to this phone number after review.</p>
                  <input
                    className="opm-search"
                    placeholder="e.g. 078XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <button className="dm-deposit-btn" onClick={submitWithdraw} disabled={busy || !amtUsd || amtUsd < MIN_WITHDRAW || phone.trim().length < 9}>
                {busy ? "PROCESSING…" : `WITHDRAW ${fmt(amtUsd)}`}
              </button>
            </>
          )}

          {reqs.length > 0 && (
            <div className="wd-history">
              <h4>Recent requests</h4>
              {reqs.map((r) => (
                <div key={r.id} className="wd-row">
                  <span>{fmt(r.amount)} → {r.phone}</span>
                  <span className="wd-status">{r.status}</span>
                </div>
              ))}
            </div>
          )}
          {withdrawals.length > 0 && reqs.length === 0 && (
            <div className="wd-history">
              <h4>Recent withdrawals</h4>
              {withdrawals.map((w) => (
                <div key={w.id} className="wd-row">
                  <span>-{fmt(Math.abs(w.amount))} — {w.note}</span>
                  <span className="wd-status">{new Date(w.ts).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
