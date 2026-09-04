import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/AuthContext";
import { credit } from "../../p2p/wallet";

const COINS = [
  { id: "usdttrc20", label: "USDT · TRC-20", hint: "Cheapest network" },
  { id: "usdterc20", label: "USDT · ERC-20", hint: "Ethereum" },
  { id: "btc", label: "Bitcoin", hint: "BTC" },
  { id: "eth", label: "Ethereum", hint: "ETH" },
  { id: "ltc", label: "Litecoin", hint: "LTC — fast & low fee" },
  { id: "doge", label: "Dogecoin", hint: "DOGE" },
];

const PRESETS = [20, 50, 100, 250, 500];

const PENDING_KEY = "stake_pending_invoice";

interface Pending {
  id: string;
  amount: number;
  uid: string;
  ts: number;
}

export default function CryptoDeposit() {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(50);
  const [coin, setCoin] = useState(COINS[0].id);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const pollRef = useRef<number>(0);

  useEffect(() => {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    let pending: Pending;
    try {
      pending = JSON.parse(raw);
    } catch {
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    // expire after 24h
    if (Date.now() - pending.ts > 24 * 3600_000) {
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    setChecking(pending.id);

    const tick = async () => {
      try {
        const r = await fetch(`/api/invoice-status?id=${encodeURIComponent(pending.id)}`);
        const data = await r.json();
        if (data.status === "finished") {
          window.clearInterval(pollRef.current);
          localStorage.removeItem(PENDING_KEY);
          credit(pending.uid, pending.amount, "crypto_deposit", `np-${pending.id}`, "Crypto deposit (NOWPayments)");
          toast.success(`Deposit confirmed — $${pending.amount} added to your balance!`);
          setChecking(null);
          return;
        }
        if (["failed", "expired", "refunded"].includes(data.status)) {
          window.clearInterval(pollRef.current);
          localStorage.removeItem(PENDING_KEY);
          toast.error(`Payment ${data.status}. No funds were taken.`);
          setChecking(null);
          return;
        }
      } catch {
        /* transient error — keep polling */
      }
    };
    tick();
    pollRef.current = window.setInterval(tick, 6000);
    return () => window.clearInterval(pollRef.current);
  }, []);

  async function startPayment() {
    if (!(amount >= 1)) {
      toast.error("Enter an amount of at least $1");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          payCurrency: coin,
          orderId: user ? `dep-${user.uid}-${Date.now()}` : undefined,
          orderDesc: "Stake account deposit",
        }),
      });
      const data = await r.json();
      if (!r.ok || !data?.invoice_url) {
        throw new Error(data?.error || "Could not create payment");
      }
      localStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ id: data.id, amount, uid: user?.uid || "guest", ts: Date.now() })
      );
      window.location.href = data.invoice_url;
    } catch (e: any) {
      toast.error(e?.message || "Payment failed to start");
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="crypto-deposit">
        <div className="login-gate">
          <span className="big">🔒</span>
          <h2>Login Required</h2>
          <p>You need to be logged in to make a crypto deposit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crypto-deposit">
      {checking && (
        <div className="cd-pending">
          <span className="cd-spinner" />
          Payment <b>#{checking.slice(0, 10)}…</b> detected — waiting for network confirmations.
          This page updates automatically once the funds arrive.
        </div>
      )}

      <div className="cd-step">
        <span className="cd-num">1</span>
        <div className="cd-step-body">
          <h3>Choose amount</h3>
          <div className="cd-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={`cd-chip ${amount === p ? "on" : ""}`}
                onClick={() => setAmount(p)}
              >
                ${p}
              </button>
            ))}
            <div className="cd-custom">
              <span>$</span>
              <input
                type="number"
                min={1}
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
          <h3>Pick your coin</h3>
          <div className="cd-coins">
            {COINS.map((c) => (
              <button
                key={c.id}
                className={`cd-coin ${coin === c.id ? "on" : ""}`}
                onClick={() => setCoin(c.id)}
              >
                <b>{c.label}</b>
                <span>{c.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cd-step">
        <span className="cd-num">3</span>
        <div className="cd-step-body">
          <h3>Pay &amp; get credited automatically</h3>
          <p className="cd-note">
            You'll be redirected to a secure NOWPayments checkout. Your balance is topped
            up the moment the transaction is confirmed on-chain.
          </p>
          <button className="cd-pay-btn" onClick={startPayment} disabled={busy}>
            {busy ? "Creating invoice…" : `Pay $${amount || 0} with Crypto`}
          </button>
        </div>
      </div>
    </div>
  );
}
