import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { PaymentModal } from "@patalink/react-payment-modal";
import "@patalink/react-payment-modal/style.css";
import { useAuth } from "../auth/AuthContext";
import { useWallet } from "../p2p/hooks";
import { credit } from "../p2p/wallet";
import { ALL_METHODS } from "../components/p2p/OtherPaymentMethods";
import "./DepositPage.scss";

/* ------------------------------------------------------------------ */
/* 1win-style cashier. Same rails as before (PataLink MoMo + NOWPayments */
/* crypto), only the layout/chrome changes.                            */
/* ------------------------------------------------------------------ */

export const RWF_PER_USD = 1400;
export const MIN_RWF = 20 * RWF_PER_USD; // 28,000 RWF ≈ $20
const MIN_CRYPTO_USD = 1;

type MethodId =
  | "mtn"
  | "usdt"
  | "btc"
  | "eth"
  | "ltc"
  | "doge"
  | "airtel"
  | "visa"
  | "mastercard"
  | "more";

interface MethodDef {
  id: MethodId;
  name: string;
  sub: string;
  badge: string;
  badgeClass: string;
  tag: string;
  live: boolean;
}

const METHODS: MethodDef[] = [
  { id: "mtn", name: "MTN Mobile Money", sub: `Min ${MIN_RWF.toLocaleString()} RWF`, badge: "MTN", badgeClass: "b-mtn", tag: "Mobile money", live: true },
  { id: "usdt", name: "Tether USDT", sub: "Min $1 · TRC-20", badge: "₮", badgeClass: "b-usdt", tag: "Crypto", live: true },
  { id: "btc", name: "Bitcoin", sub: "Min $1 · BTC", badge: "₿", badgeClass: "b-btc", tag: "Crypto", live: true },
  { id: "eth", name: "Ethereum", sub: "Min $1 · ETH", badge: "Ξ", badgeClass: "b-eth", tag: "Crypto", live: true },
  { id: "ltc", name: "Litecoin", sub: "Min $1 · LTC", badge: "Ł", badgeClass: "b-ltc", tag: "Crypto", live: true },
  { id: "doge", name: "Dogecoin", sub: "Min $1 · DOGE", badge: "Ð", badgeClass: "b-doge", tag: "Crypto", live: true },
  { id: "airtel", name: "Airtel Money", sub: "Coming soon", badge: "airtel", badgeClass: "b-airtel", tag: "Mobile money", live: false },
  { id: "visa", name: "Visa", sub: "Coming soon", badge: "VISA", badgeClass: "b-visa", tag: "Card", live: false },
  { id: "mastercard", name: "Mastercard", sub: "Coming soon", badge: "MC", badgeClass: "b-mc", tag: "Card", live: false },
  { id: "more", name: "All methods", sub: `${ALL_METHODS.length}+ options`, badge: "⋯", badgeClass: "b-more", tag: "Directory", live: true },
];

const CRYPTO_COIN: Record<string, { payCurrency: string; label: string; hint: string }> = {
  usdt: { payCurrency: "usdttrc20", label: "USDT · TRC-20", hint: "Cheapest network" },
  btc: { payCurrency: "btc", label: "Bitcoin", hint: "BTC" },
  eth: { payCurrency: "eth", label: "Ethereum", hint: "ETH" },
  ltc: { payCurrency: "ltc", label: "Litecoin", hint: "LTC — fast & low fee" },
  doge: { payCurrency: "doge", label: "Dogecoin", hint: "DOGE" },
};

const MOMO_PRESETS = [MIN_RWF, 50000, 100000, 200000];
const CRYPTO_PRESETS = [20, 50, 100, 250, 500];

const MOMO_PENDING_KEY = "spinbet_pending_momo";
const CRYPTO_PENDING_KEY = "stake_pending_invoice";
const PROMO_KEY = "spinbet_deposit_promo";

export default function DepositPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useWallet();
  const [method, setMethod] = useState<MethodId>("mtn");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const status = params.get("payment");
    if (status === "success") {
      toast.info("Payment created — waiting for on-chain confirmation. Balance updates automatically.");
      params.delete("payment");
      setParams(params, { replace: true });
    } else if (status === "cancelled") {
      toast.warn("Crypto payment was cancelled. No funds were taken.");
      params.delete("payment");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = METHODS.find((m) => m.id === method) || METHODS[0];
  const needle = query.trim().toLowerCase();
  const visibleMethods = METHODS.filter(
    (m) => !needle || m.name.toLowerCase().includes(needle) || m.tag.toLowerCase().includes(needle)
  );

  return (
    <div className="w1-page">
      {/* top cashier bar */}
      <div className="w1-topbar">
        <div className="w1-topbar-inner">
          <button className="w1-back" onClick={() => window.history.back()} aria-label="Back">‹</button>
          <img src="/assets/spinbet-logo.png" alt="SpinBet" className="w1-logo" />
          <div className="w1-tabs">
            <span className="w1-tab on">Deposit</span>
            <Link to="/withdraw" className="w1-tab">Withdraw</Link>
          </div>
          <div className="w1-top-right">
            <span className="w1-balance">
              <i>Balance</i>
              <b>${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b>
            </span>
            <button className="w1-deposit-pill" onClick={() => navigate("/deposit")}>+</button>
          </div>
        </div>
      </div>

      <div className="w1-wrap">
        <div className="w1-cashier">
          {/* left: payment method rail */}
          <aside className="w1-rail">
            <div className="w1-rail-head">Payment method</div>
            <div className="w1-rail-search">
              <span>⌕</span>
              <input placeholder="Search method…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="w1-methods">
              {visibleMethods.map((m) => (
                <button
                  key={m.id}
                  className={`w1-method${method === m.id ? " on" : ""}`}
                  onClick={() => setMethod(m.id)}
                >
                  <span className={`w1-badge ${m.badgeClass}`}>{m.badge}</span>
                  <span className="w1-method-text">
                    <b>{m.name}</b>
                    <small>{m.sub}</small>
                  </span>
                  <span className="w1-chev">›</span>
                </button>
              ))}
              {visibleMethods.length === 0 && <div className="w1-empty">No methods match “{query}”.</div>}
            </div>
            <div className="w1-rail-foot">
              <span className="w1-secure">🔒 Secure payments · 0% fee</span>
            </div>
          </aside>

          {/* right: method form */}
          <section className="w1-main">
            {!user ? (
              <div className="w1-gate">
                <span className="w1-gate-icon">🔒</span>
                <h2>Log in to deposit</h2>
                <p>You need an account before you can top up your balance.</p>
              </div>
            ) : method === "more" ? (
              <MoreMethods query={query} showAll={showAll} setShowAll={setShowAll} />
            ) : !active.live ? (
              <UnavailableMethod name={active.name} goCrypto={() => setMethod("usdt")} goMomo={() => setMethod("mtn")} />
            ) : active.id === "mtn" ? (
              <MomoPanel />
            ) : (
              <CryptoPanel methodId={method} onPickMethod={setMethod} />
            )}
          </section>
        </div>
        <p className="w1-disclaimer">18+ Play responsibly. Deposits are instant once the provider confirms the payment.</p>
      </div>
    </div>
  );
}

/* ---------------- MoMo (PataLink) panel ---------------- */

interface ModalCfg {
  baseUrl: string;
  apiKey: string;
  encKey: string;
  amount: number;
  nonce: number;
}

function MomoPanel() {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(30000);
  const [cfg, setCfg] = useState<ModalCfg | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [manualTx, setManualTx] = useState("");
  const [promo, setPromo] = useState(() => { try { return localStorage.getItem(PROMO_KEY) || ""; } catch { return ""; } });
  const pollRef = useRef<number>(0);
  const userRef = useRef(user);
  userRef.current = user;

  function stopPolling() {
    window.clearInterval(pollRef.current);
    pollRef.current = 0;
  }

  async function fetchStatus(txId: string): Promise<any> {
    const r = await fetch(`/api/patalink-status?id=${encodeURIComponent(txId)}`, { cache: "no-store" });
    const text = await r.text();
    try { return JSON.parse(text); } catch { return { raw: text }; }
  }

  function clearPending(txId: string) {
    try {
      const raw = localStorage.getItem(MOMO_PENDING_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.txId === txId) localStorage.removeItem(MOMO_PENDING_KEY);
    } catch { /* ignore */ }
  }

  function handleResult(txId: string, data: any, amountRwf: number, uid: string) {
    const st = String(data?.status || "unknown").toLowerCase();
    const reason = data?.reason || data?.message || "";
    if (st === "success") {
      stopPolling();
      clearPending(txId);
      setChecking(null);
      credit(uid, Math.round(amountRwf), "momo_deposit", `pt-${txId}`, "MTN MoMo deposit (PataLink)");
      toast.success(`MoMo deposit confirmed — ${Math.round(amountRwf).toLocaleString()} added to your balance!`);
    } else if (st === "failed" || st === "rejected") {
      stopPolling();
      clearPending(txId);
      setChecking(null);
      toast.error(`MoMo payment ${st}. ${reason || "Declined by provider — no funds were taken."}`);
    } else {
      setChecking(txId);
    }
  }

  function startPolling(txId: string, amountRwf: number, uid: string) {
    stopPolling();
    setChecking(txId);
    const tick = async () => {
      try {
        const data = await fetchStatus(txId);
        handleResult(txId, data, amountRwf, uid);
      } catch { /* transient — keep polling */ }
    };
    void tick();
    pollRef.current = window.setInterval(() => void tick(), 4000);
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/patalink-config", { cache: "no-store" });
        const j = await r.json();
        setCfg({
          baseUrl: String(j.baseUrl || "https://api.patalink.me").replace(/\/$/, ""),
          apiKey: String(j.apiKey || ""),
          encKey: String(j.encKey || ""),
          amount: 30000,
          nonce: Date.now(),
        });
        const q = new URLSearchParams(window.location.search);
        const tid = q.get("OrderTrackingId");
        if (tid) {
          window.history.replaceState({}, document.title, window.location.pathname);
          setManualTx(tid);
        }
      } catch { /* keys unavailable — modal stays hidden */ }
    })();
    try {
      const raw = localStorage.getItem(MOMO_PENDING_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.txId && Date.now() - p.ts < 24 * 3600_000) startPolling(p.txId, p.amountRwf, p.uid);
        else localStorage.removeItem(MOMO_PENDING_KEY);
      }
    } catch { localStorage.removeItem(MOMO_PENDING_KEY); }
    return () => window.clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the Pay button amount in sync — no separate "update" step
  useEffect(() => {
    setCfg((c) => (c ? { ...c, amount: Math.round(Number(amount) || 0) } : c));
  }, [amount]);

  const a = Math.round(Number(amount) || 0);
  const valid = a >= MIN_RWF;
  const applied = cfg && cfg.apiKey ? { ...cfg, amount: a, nonce: cfg.nonce } : null;

  async function onModalSuccess(data: any, error: any) {
    if (error) {
      toast.error(`Could not start MoMo payment: ${error.message || "unknown error"}`);
      return;
    }
    const txId = data && data.transactionId;
    if (!txId) { toast.error("No transactionId returned. Try again."); return; }
    const uid = user?.uid || "guest";
    try { localStorage.setItem(MOMO_PENDING_KEY, JSON.stringify({ txId, amountRwf: a, uid, ts: Date.now() })); } catch { /* ignore */ }
    toast.info(`Approve the MoMo prompt on your phone. Polling ${txId}…`);
    startPolling(txId, a, uid);
  }

  async function checkManual() {
    const txId = manualTx.trim();
    if (!txId) return toast.error("Paste a transactionId first");
    try {
      const data = await fetchStatus(txId);
      const raw = localStorage.getItem(MOMO_PENDING_KEY);
      let amt = 0; let uid = user?.uid || "guest";
      try {
        const p = JSON.parse(raw || "");
        if (p && p.txId === txId) { amt = p.amountRwf; uid = p.uid; }
      } catch { /* ignore */ }
      if (amt > 0) handleResult(txId, data, amt, uid);
      else toast.info(`Status: ${String(data?.status || "unknown").toUpperCase()}`);
    } catch { toast.error("Status check failed — try again."); }
  }

  function applyPromo() {
    try { localStorage.setItem(PROMO_KEY, promo.trim()); } catch { /* ignore */ }
    toast.success(promo.trim() ? `Bonus code “${promo.trim()}” saved — it will apply to your next deposit.` : "Bonus code cleared.");
  }

  return (
    <div className="w1-form">
      <div className="w1-method-head">
        <span className="w1-badge lg b-mtn">MTN</span>
        <div>
          <h2>MTN Mobile Money</h2>
          <p>Pay with MTN MoMo · credited automatically</p>
        </div>
        <span className="w1-instant">⚡ Instant</span>
      </div>

      {checking && (
        <div className="w1-pending">
          <span className="w1-spinner" />
          <span>Payment <b>#{checking.slice(0, 12)}…</b> detected — approve it on your phone. Balance updates automatically.</span>
        </div>
      )}

      <label className="w1-label">Deposit amount</label>
      <div className={`w1-amount${valid ? "" : " err"}`}>
        <span className="w1-cur">RWF</span>
        <input type="number" min={MIN_RWF} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        {amount ? <button className="w1-clear" onClick={() => setAmount(0)}>✕</button> : null}
      </div>
      <div className="w1-chips">
        {MOMO_PRESETS.map((p) => (
          <button key={p} className={`w1-chip${a === p ? " on" : ""}`} onClick={() => setAmount(p)}>
            {p.toLocaleString()}
          </button>
        ))}
      </div>
      <div className="w1-limits">Min {MIN_RWF.toLocaleString()} RWF · Max 5,000,000 RWF · 0% fee</div>

      <label className="w1-label">Bonus code <i>(optional)</i></label>
      <div className="w1-promo">
        <input placeholder="Enter promo code" value={promo} onChange={(e) => setPromo(e.target.value)} />
        <button onClick={applyPromo}>Apply</button>
      </div>

      <div className="w1-pay">
        {applied ? (
          <PaymentModal
            key={applied.nonce || "init"}
            apiKey={applied.apiKey}
            encryptionKey={applied.encKey}
            baseUrl={applied.baseUrl}
            fixedAmount={applied.amount}
            customText={`Deposit ${applied.amount.toLocaleString()} RWF`}
            customColor="#00a651"
            themeColor="#00a651"
            companyName="SpinBet"
            creatorName="SpinBet"
            callbackUrl={window.location.origin + window.location.pathname}
            onSuccess={onModalSuccess}
          />
        ) : (
          <button className="w1-submit" disabled>Loading payment keys…</button>
        )}
      </div>
      {!valid && <div className="w1-err">Minimum MoMo deposit is {MIN_RWF.toLocaleString()} RWF (≈ $20).</div>}

      <ol className="w1-steps">
        <li><b>1</b> Enter the amount and press the green button.</li>
        <li><b>2</b> Enter your MTN number (078 / 079…) and approve the prompt.</li>
        <li><b>3</b> Balance is credited automatically — 1 RWF = 1 unit.</li>
      </ol>

      <div className="w1-recheck">
        <span>Already paid?</span>
        <input placeholder="Paste transactionId" value={manualTx} onChange={(e) => setManualTx(e.target.value)} />
        <button onClick={checkManual}>Check status</button>
      </div>
    </div>
  );
}

/* ---------------- Crypto (NOWPayments) panel ---------------- */

function CryptoPanel({ methodId, onPickMethod }: { methodId: MethodId; onPickMethod: (m: MethodId) => void }) {
  const { user } = useAuth();
  const coinKey = CRYPTO_COIN[methodId] ? String(methodId) : "usdt";
  const [amount, setAmount] = useState<number>(50);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [promo, setPromo] = useState(() => { try { return localStorage.getItem(PROMO_KEY) || ""; } catch { return ""; } });
  const pollRef = useRef<number>(0);

  useEffect(() => {
    let raw: string | null = null;
    try { raw = localStorage.getItem(CRYPTO_PENDING_KEY); } catch { raw = null; }
    if (!raw) return;
    let pending: { id: string; amount: number; uid: string; ts: number };
    try { pending = JSON.parse(raw); } catch { try { localStorage.removeItem(CRYPTO_PENDING_KEY); } catch {} return; }
    if (Date.now() - pending.ts > 24 * 3600_000) {
      try { localStorage.removeItem(CRYPTO_PENDING_KEY); } catch {}
      return;
    }
    setChecking(pending.id);
    const tick = async () => {
      try {
        const r = await fetch(`/api/invoice-status?id=${encodeURIComponent(pending.id)}`);
        const data = await r.json();
        if (data.status === "finished") {
          window.clearInterval(pollRef.current);
          try { localStorage.removeItem(CRYPTO_PENDING_KEY); } catch {}
          credit(pending.uid, pending.amount, "crypto_deposit", `np-${pending.id}`, "Crypto deposit (NOWPayments)");
          toast.success(`Deposit confirmed — $${pending.amount} added to your balance!`);
          setChecking(null);
        } else if (["failed", "expired", "refunded"].includes(data.status)) {
          window.clearInterval(pollRef.current);
          try { localStorage.removeItem(CRYPTO_PENDING_KEY); } catch {}
          toast.error(`Payment ${data.status}. No funds were taken.`);
          setChecking(null);
        }
      } catch { /* transient — keep polling */ }
    };
    void tick();
    pollRef.current = window.setInterval(() => void tick(), 6000);
    return () => window.clearInterval(pollRef.current);
  }, []);

  async function startPayment() {
    if (!(amount >= MIN_CRYPTO_USD)) return toast.error(`Enter an amount of at least $${MIN_CRYPTO_USD}`);
    setBusy(true);
    try {
      const r = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          payCurrency: CRYPTO_COIN[coinKey].payCurrency,
          orderId: user ? `dep-${user.uid}-${Date.now()}` : undefined,
          orderDesc: "Stake account deposit",
        }),
      });
      const data = await r.json();
      if (!r.ok || !data?.invoice_url) throw new Error(data?.error || "Could not create payment");
      try {
        localStorage.setItem(CRYPTO_PENDING_KEY, JSON.stringify({ id: data.id, amount, uid: user?.uid || "guest", ts: Date.now() }));
      } catch { /* ignore */ }
      window.location.href = data.invoice_url;
    } catch (e: any) {
      toast.error(e?.message || "Payment failed to start");
      setBusy(false);
    }
  }

  function applyPromo() {
    try { localStorage.setItem(PROMO_KEY, promo.trim()); } catch { /* ignore */ }
    toast.success(promo.trim() ? `Bonus code “${promo.trim()}” saved — it will apply to your next deposit.` : "Bonus code cleared.");
  }

  const coin = CRYPTO_COIN[coinKey];
  const valid = amount >= MIN_CRYPTO_USD;

  return (
    <div className="w1-form">
      <div className="w1-method-head">
        <span className={`w1-badge lg ${METHODS.find((m) => m.id === coinKey)?.badgeClass || "b-usdt"}`}>
          {METHODS.find((m) => m.id === coinKey)?.badge}
        </span>
        <div>
          <h2>{coin.label}</h2>
          <p>Secure NOWPayments checkout · credited on-chain</p>
        </div>
        <span className="w1-instant">⚡ ~15 min</span>
      </div>

      {checking && (
        <div className="w1-pending">
          <span className="w1-spinner" />
          <span>Payment <b>#{checking.slice(0, 10)}…</b> detected — waiting for network confirmations.</span>
        </div>
      )}

      <label className="w1-label">Select coin</label>
      <div className="w1-coins">
        {Object.entries(CRYPTO_COIN).map(([key, c]) => (
          <button key={key} className={`w1-coin${key === coinKey ? " on" : ""}`} onClick={() => onPickMethod(key as MethodId)}>
            <b>{c.label}</b>
            <span>{c.hint}</span>
          </button>
        ))}
      </div>

      <label className="w1-label">Deposit amount</label>
      <div className={`w1-amount${valid ? "" : " err"}`}>
        <span className="w1-cur">$</span>
        <input type="number" min={MIN_CRYPTO_USD} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        {amount ? <button className="w1-clear" onClick={() => setAmount(0)}>✕</button> : null}
      </div>
      <div className="w1-chips">
        {CRYPTO_PRESETS.map((p) => (
          <button key={p} className={`w1-chip${amount === p ? " on" : ""}`} onClick={() => setAmount(p)}>
            ${p}
          </button>
        ))}
      </div>
      <div className="w1-limits">Min $1 · Max $100,000 · 0% fee</div>

      <label className="w1-label">Bonus code <i>(optional)</i></label>
      <div className="w1-promo">
        <input placeholder="Enter promo code" value={promo} onChange={(e) => setPromo(e.target.value)} />
        <button onClick={applyPromo}>Apply</button>
      </div>

      <button className="w1-submit" onClick={startPayment} disabled={busy || !valid}>
        {busy ? "Creating invoice…" : `Deposit $${amount || 0}`}
      </button>

      <ol className="w1-steps">
        <li><b>1</b> Choose the coin and enter the USD amount.</li>
        <li><b>2</b> You are redirected to a secure checkout to pay.</li>
        <li><b>3</b> Balance is credited automatically once confirmed on-chain.</li>
      </ol>
    </div>
  );
}

/* ---------------- Unavailable / directory ---------------- */

function UnavailableMethod({ name, goCrypto, goMomo }: { name: string; goCrypto: () => void; goMomo: () => void }) {
  return (
    <div className="w1-form">
      <div className="w1-method-head">
        <span className="w1-badge lg b-more">!</span>
        <div>
          <h2>{name}</h2>
          <p>Not available in your country yet</p>
        </div>
      </div>
      <div className="w1-unavail">
        <p><b>{name}</b> is not available in your region. Please use one of the live methods — crypto works everywhere.</p>
        <div className="w1-unavail-row">
          <button className="w1-submit sm" onClick={goCrypto}>Deposit with crypto</button>
          <button className="w1-ghost sm" onClick={goMomo}>Use MTN MoMo</button>
        </div>
      </div>
    </div>
  );
}

function MoreMethods({ query, showAll, setShowAll }: { query: string; showAll: boolean; setShowAll: (v: boolean) => void }) {
  const needle = query.trim().toLowerCase();
  const filtered = !needle
    ? ALL_METHODS
    : ALL_METHODS.filter((m) => m.name.toLowerCase().includes(needle) || m.category.toLowerCase().includes(needle));
  const visible = showAll ? filtered : filtered.slice(0, 60);

  function unavailable(name: string) {
    toast.error(`${name} is not available in your country`, { autoClose: 2500 });
  }

  return (
    <div className="w1-form">
      <div className="w1-method-head">
        <span className="w1-badge lg b-more">⋯</span>
        <div>
          <h2>All payment methods</h2>
          <p>Crypto + MTN MoMo are live · everything else is restricted</p>
        </div>
      </div>
      <div className="w1-all-grid">
        {visible.map((m) => (
          <button key={m.id} className="w1-all-card" onClick={() => unavailable(m.name)} title={m.name}>
            <span className="w1-all-ico">{m.icon}</span>
            <span className="w1-all-name">{m.name}</span>
            <span className="w1-all-cat">{m.category}</span>
            <span className="w1-all-badge">Unavailable</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="w1-empty">No methods match “{query}”.</p>}
      {filtered.length > 60 && (
        <button className="w1-ghost" onClick={() => setShowAll(!showAll)}>
          {showAll ? `Show less (${visible.length} / ${filtered.length})` : `Show all ${filtered.length} methods`}
        </button>
      )}
    </div>
  );
}
