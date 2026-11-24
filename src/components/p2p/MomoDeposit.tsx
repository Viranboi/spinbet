import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { PaymentModal } from "@patalink/react-payment-modal";
import "@patalink/react-payment-modal/style.css";
import { useAuth } from "../../auth/AuthContext";
import { credit } from "../../p2p/wallet";

// MTN MoMo deposits via PataLink — same live keys as the PataLink tester site.
// 1 RWF paid = 1 balance unit credited (same ~1:1 coin rate as P2P exchangers).
// Minimum deposit: $20 worth of RWF.
export const RWF_PER_USD = 1400;
export const MIN_RWF = 6500; // 6,500 RWF ≈ $4.64
const PRESETS = [MIN_RWF, 50000, 100000, 200000];
const DEFAULT_AMOUNT = 30000;
const PENDING_KEY = "spinbet_pending_momo";

interface Pending {
  txId: string;
  amountRwf: number;
  uid: string;
  ts: number;
}

interface ModalCfg {
  baseUrl: string;
  apiKey: string;
  encKey: string;
  amount: number;
  nonce: number;
}

export default function MomoDeposit() {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(DEFAULT_AMOUNT);
  const [cfg, setCfg] = useState<ModalCfg | null>(null);
  const [applied, setApplied] = useState<ModalCfg | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [manualTx, setManualTx] = useState("");
  const pollRef = useRef<number>(0);
  const userRef = useRef(user);
  userRef.current = user;

  function stopPolling() {
    window.clearInterval(pollRef.current);
    pollRef.current = 0;
  }

  async function fetchStatus(txId: string): Promise<any> {
    const r = await fetch(`/api/patalink-status?id=${encodeURIComponent(txId)}`, {
      cache: "no-store",
    });
    const text = await r.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  function handleResult(txId: string, data: any, amountRwf: number, uid: string) {
    const st = String(data?.status || "unknown").toLowerCase();
    const reason = data?.reason || data?.message || "";
    if (st === "success" || st === "completed" || st === "paid") {
      stopPolling();
      clearPending(txId);
      setChecking(null);
      const CREDITED_KEY = "spinbet_credited_momo";
      let already = false;
      try {
        const arr = JSON.parse(localStorage.getItem(CREDITED_KEY) || "[]");
        already = Array.isArray(arr) && arr.includes(txId);
      } catch {}
      if (!already) {
        try {
          const arr = JSON.parse(localStorage.getItem(CREDITED_KEY) || "[]");
          if (!Array.isArray(arr) || !arr.includes(txId)) {
            const next = Array.isArray(arr) ? arr : [];
            next.unshift(txId);
            if (next.length > 200) next.length = 200;
            localStorage.setItem(CREDITED_KEY, JSON.stringify(next));
          }
        } catch {}
        credit(uid, Math.round(amountRwf / RWF_PER_USD), "momo_deposit", `pt-${txId}`, "MTN MoMo deposit (PataLink)");
        toast.success(`MoMo deposit confirmed — $${Math.round(amountRwf / RWF_PER_USD).toLocaleString()} added to your balance!`);
      }
    } else if (st === "failed" || st === "rejected") {
      stopPolling();
      clearPending(txId);
      setChecking(null);
      toast.error(`MoMo payment ${st}. ${reason || "Declined by provider — no funds were taken."}`);
    } else {
      setChecking(txId);
    }
  }

  function clearPending(txId: string) {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const p: Pending = JSON.parse(raw);
      if (p.txId === txId) localStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
  }

  function startPolling(txId: string, amountRwf: number, uid: string) {
    stopPolling();
    setChecking(txId);
    const tick = async () => {
      try {
        const data = await fetchStatus(txId);
        handleResult(txId, data, amountRwf, uid);
      } catch {
        /* transient error — keep polling */
      }
    };
    void tick();
    pollRef.current = window.setInterval(() => void tick(), 4000);
  }

  // Keys (live, same as tester site) + resume pending + card callback
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/patalink-config", { cache: "no-store" });
        const j = await r.json();
        const c: ModalCfg = {
          baseUrl: String(j.baseUrl || "https://api.patalink.me").replace(/\/$/, ""),
          apiKey: String(j.apiKey || "") || process.env.REACT_APP_PATALINK_API_KEY || "",
          encKey: String(j.encKey || "") || process.env.REACT_APP_PATALINK_ENCRYPTION_KEY || "",
          amount: DEFAULT_AMOUNT,
          nonce: 0,
        };
        setCfg(c);
        if (c.apiKey) setApplied({ ...c, amount: DEFAULT_AMOUNT, nonce: Date.now() });

        const q = new URLSearchParams(window.location.search);
        const tid = q.get("OrderTrackingId");
        if (tid) {
          window.history.replaceState({}, document.title, window.location.pathname);
          const raw = localStorage.getItem(PENDING_KEY);
          let amt = 0;
          let uid = userRef.current?.uid || "guest";
          try {
            const p: Pending = JSON.parse(raw || "");
            if (p && p.txId === tid) {
              amt = p.amountRwf;
              uid = p.uid;
            }
          } catch {
            /* unknown amount — poll for status only */
          }
          setManualTx(tid);
          if (amt > 0) startPolling(tid, amt, uid);
          else {
            try {
              const data = await fetchStatus(tid);
              toast.info(`Card payment status: ${String(data?.status || "unknown").toUpperCase()}`);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* payment keys unavailable — modal stays hidden */
      }
    })();

    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (raw) {
        const p: Pending = JSON.parse(raw);
        if (p && p.txId && Date.now() - p.ts < 24 * 3600_000) {
          startPolling(p.txId, p.amountRwf, p.uid);
        } else {
          localStorage.removeItem(PENDING_KEY);
        }
      }
    } catch {
      localStorage.removeItem(PENDING_KEY);
    }
    return () => window.clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyConfig() {
    const a = Math.round(Number(amount) || 0);
    if (!(a >= MIN_RWF)) {
      toast.error(`Minimum MoMo deposit is ${MIN_RWF.toLocaleString()} RWF (≈ $5)`);
      return;
    }
    if (!cfg || !cfg.apiKey) {
      toast.error("Payment keys are still loading — try again in a moment.");
      return;
    }
    setApplied({ ...cfg, amount: a, nonce: Date.now() });
    toast.info(`Pay button updated — ${a.toLocaleString()} RWF via MTN MoMo.`);
  }

  async function onModalSuccess(data: any, error: any) {
    if (error) {
      toast.error(`Could not start MoMo payment: ${error.message || JSON.stringify(error)}`);
      return;
    }
    const txId = data && data.transactionId;
    if (!txId) {
      toast.error("No transactionId returned. Try again.");
      return;
    }
    const a = Math.round(Number(applied?.amount || amount) || 0);
    const uid = user?.uid || "guest";
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ txId, amountRwf: a, uid, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    toast.info(`Approve the MoMo prompt on your phone (*182*7# shows pending). Polling ${txId}…`);
    startPolling(txId, a, uid);
  }

  async function checkManual() {
    const txId = manualTx.trim();
    if (!txId) {
      toast.error("Paste a transactionId first");
      return;
    }
    const raw = localStorage.getItem(PENDING_KEY);
    let amt = 0;
    let uid = user?.uid || "guest";
    try {
      const p: Pending = JSON.parse(raw || "");
      if (p && p.txId === txId) {
        amt = p.amountRwf;
        uid = p.uid;
      }
    } catch {
      /* ignore */
    }
    try {
      const data = await fetchStatus(txId);
      if (amt > 0) handleResult(txId, data, amt, uid);
      else toast.info(`Status: ${String(data?.status || "unknown").toUpperCase()}`);
    } catch {
      toast.error("Status check failed — try again.");
    }
  }

  if (!user) {
    return (
      <div className="crypto-deposit">
        <div className="login-gate">
          <span className="big">🔒</span>
          <h2>Login Required</h2>
          <p>You need to be logged in to deposit with MTN MoMo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crypto-deposit">
      {checking && (
        <div className="cd-pending">
          <span className="cd-spinner" />
          MoMo payment <b>#{checking.slice(0, 12)}…</b> detected — approve on your phone.
          This page updates automatically once PataLink confirms it.
        </div>
      )}

      <div className="cd-step">
        <span className="cd-num">1</span>
        <div className="cd-step-body">
          <h3>Choose amount (RWF) — min {MIN_RWF.toLocaleString()} (≈ $5)</h3>
          <div className="cd-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={`cd-chip ${amount === p ? "on" : ""}`}
                onClick={() => setAmount(p)}
              >
                {p.toLocaleString()}
              </button>
            ))}
            <div className="cd-custom">
              <span>RWF</span>
              <input
                type="number"
                min={MIN_RWF}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="cd-step">
        <span className="cd-num">2</span>
        <div className="cd-step-body">
          <h3>Pay with MTN MoMo &amp; get credited automatically</h3>
          <p className="cd-note">
            Click <b>Update amount</b>, then the green Pay button — enter your MTN number
            (078 / 079…) in the popup and approve the prompt. 1 RWF = 1 balance unit.
          </p>
          <div className="cd-presets" style={{ marginBottom: 12 }}>
            <button className="cd-chip" onClick={applyConfig}>
              Update amount
            </button>
          </div>
          {applied && applied.apiKey ? (
            <PaymentModal
              key={applied.nonce || "init"}
              apiKey={applied.apiKey}
              encryptionKey={applied.encKey}
              baseUrl={applied.baseUrl}
              fixedAmount={applied.amount}
              customText={`Pay ${applied.amount.toLocaleString()} RWF via MTN`}
              customColor="#16a34a"
              themeColor="#16a34a"
              companyName="SpinBet"
              creatorName="SpinBet"
              callbackUrl={window.location.origin + window.location.pathname}
              onSuccess={onModalSuccess}
            />
          ) : (
            <p className="cd-note">Loading payment keys…</p>
          )}
        </div>
      </div>

      <div className="cd-step">
        <span className="cd-num">3</span>
        <div className="cd-step-body">
          <h3>Already paid? Re-check a transaction</h3>
          <div className="cd-presets">
            <div className="cd-custom" style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Paste transactionId"
                value={manualTx}
                onChange={(e) => setManualTx(e.target.value)}
                style={{ minWidth: 220 }}
              />
            </div>
            <button className="cd-chip" onClick={checkManual}>
              Check Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
