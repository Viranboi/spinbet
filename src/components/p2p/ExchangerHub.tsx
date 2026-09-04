import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/AuthContext";
import * as ordersApi from "../../p2p/orders";
import { useIncomingOrders, useWallet } from "../../p2p/hooks";
import { CURRENCY_META, FiatCurrency, Exchanger } from "../../p2p/types";
import { transferCoins } from "../../p2p/wallet";
import { StatusBadge } from "./OrderView";

interface PlatformUser {
  uid: string;
  email: string;
  displayName: string;
}

function findUser(query: string): PlatformUser | null {
  try {
    const raw = JSON.parse(localStorage.getItem("letsbet_users") || "{}");
    const q = query.trim().toLowerCase();
    for (const entry of Object.values<any>(raw)) {
      const u = entry.user;
      if (u.email.toLowerCase() === q || u.uid.toLowerCase() === q) return u;
    }
    return null;
  } catch {
    return null;
  }
}

export default function ExchangerHub() {
  const { user } = useAuth();
  const profile = user ? ordersApi.getMyExchangerProfile(user.uid) : undefined;

  if (!user) {
    return (
      <div className="hub-login">
        <span className="big">🔐</span>
        <h4>Log in required</h4>
        <p>Log in to apply as an exchanger or manage your float.</p>
      </div>
    );
  }

  return profile ? <ExchangerDashboard profile={profile} /> : <ApplyForm />;
}

function ApplyForm() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [mtn, setMtn] = useState("");
  const [airtel, setAirtel] = useState("");
  const [holderName, setHolderName] = useState("");
  const [currency, setCurrency] = useState<FiatCurrency>("BIF");
  const [rate, setRate] = useState("1.02");
  const [minFiat, setMinFiat] = useState("1000");
  const [maxFiat, setMaxFiat] = useState("200000");
  const [floatCoins, setFloatCoins] = useState("50000");
  const [agree, setAgree] = useState(false);

  function submit() {
    if (!user) return;
    try {
      ordersApi.applyAsExchanger({
        uid: user.uid,
        displayName: displayName.trim() || `${user.displayName || "Player"}'s Exchange`,
        mtnNumber: mtn.trim(),
        airtelNumber: airtel.trim(),
        holderName: holderName.trim(),
        currency,
        rate: Number(rate),
        minFiat: Number(minFiat),
        maxFiat: Number(maxFiat),
        floatCoins: Number(floatCoins),
      });
      toast.success("Application approved — your exchange desk is live!");
    } catch (err: any) {
      toast.error(err.message || "Could not submit application");
    }
  }

  return (
    <div className="apply-form">
      <div className="apply-head">
        <h3>Become an Exchanger</h3>
        <p>
          Sell coins for African francs (RWF or BIF). You receive Mobile Money payments directly and
          release coins from your float. Top exchangers complete trades in under 5 minutes.
        </p>
      </div>
      <div className="form-grid">
        <label>Desk name
          <input placeholder="e.g. Kigali Fast Coins" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>Account holder name
          <input placeholder="Name registered on MoMo" value={holderName} onChange={(e) => setHolderName(e.target.value)} />
        </label>
        <label>MTN MoMo number
          <input placeholder="+250 78…" value={mtn} onChange={(e) => setMtn(e.target.value)} />
        </label>
        <label>Airtel Money number
          <input placeholder="+250 73…" value={airtel} onChange={(e) => setAirtel(e.target.value)} />
        </label>
        <label>Pricing currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value as FiatCurrency)}>
            <option value="RWF">RWF — African Franc</option>
            <option value="BIF">BIF — African Franc</option>
          </select>
        </label>
        <label>Rate ({CURRENCY_META[currency].symbol} per coin)
          <input type="number" step="0.001" min="0.9" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label>Min order ({CURRENCY_META[currency].symbol})
          <input type="number" min="100" value={minFiat} onChange={(e) => setMinFiat(e.target.value)} />
        </label>
        <label>Max order ({CURRENCY_META[currency].symbol})
          <input type="number" min="1000" value={maxFiat} onChange={(e) => setMaxFiat(e.target.value)} />
        </label>
        <label>Coin float you will lock
          <input type="number" min="1000" value={floatCoins} onChange={(e) => setFloatCoins(e.target.value)} />
        </label>
      </div>
      <label className="agree-row">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        I agree to release coins within 10 minutes of a confirmed payment and to resolve disputes honestly.
      </label>
      <button className="btn-gold" disabled={!agree || !holderName.trim() || (!mtn.trim() && !airtel.trim())} onClick={submit}>
        Submit application
      </button>
    </div>
  );
}

function FundPlayer({ profile }: { profile: Exchanger }) {
  const { balance } = useWallet();
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");

  function send() {
    const coins = Number(amount);
    if (!coins || coins <= 0) return toast.error("Enter an amount");
    if (coins > balance) return toast.error("Not enough coins in your wallet");
    const user = findUser(target);
    if (!user) return toast.error("No player found with that email or UID");
    try {
      transferCoins(profile.uid, user.uid, coins, `Funded by ${profile.displayName}`);
      toast.success(`Sent ${coins.toLocaleString()} coins to ${user.displayName || user.email}`);
      setTarget("");
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || "Transfer failed");
    }
  }

  return (
    <div className="fund-player">
      <h4 className="section-title">Fund a player directly</h4>
      <p className="fund-hint">
        Send coins from your wallet ({balance.toLocaleString()} 🪙) straight to a player's account.
      </p>
      <div className="fund-row">
        <input
          placeholder="Player email or UID"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <input
          type="number"
          placeholder="Coins e.g. 5000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="btn-gold" onClick={send}>Send</button>
      </div>
    </div>
  );
}

function ExchangerDashboard({ profile }: { profile: Exchanger }) {
  const incoming = useIncomingOrders();
  const { balance } = useWallet();
  const actionable = incoming.filter((o) => ["paid", "disputed"].includes(o.status));
  const all = incoming;

  return (
    <div className="ex-dashboard">
      <div className="desk-card">
        <div className="desk-left">
          <span className="avatar big" style={{ background: profile.avatarColor }}>{profile.displayName[0]}</span>
          <div>
            <h3>{profile.displayName}</h3>
            <span className={`online-tag ${profile.online ? "on" : "off"}`}>
              ● {profile.online ? "Online — accepting orders" : "Offline"}
            </span>
          </div>
        </div>
        <button className={`btn-ghost ${profile.online ? "" : "go-live"}`} onClick={() => ordersApi.setOnline(profile.id, !profile.online)}>
          {profile.online ? "Go offline" : "Go online"}
        </button>
      </div>

      <div className="stat-cards">
        <div className="stat"><span>Float available</span><b>{Math.floor(profile.availableCoins).toLocaleString()} coins</b></div>
        <div className="stat"><span>In escrow</span><b>{profile.lockedCoins.toLocaleString()} coins</b></div>
        <div className="stat"><span>Completed</span><b>{profile.stats.completedOrders.toLocaleString()} / {profile.stats.totalOrders.toLocaleString()}</b></div>
        <div className="stat"><span>Completion rate</span><b>{profile.stats.completionRate}%</b></div>
        <div className="stat"><span>Avg. release</span><b>{profile.stats.avgReleaseMinutes || "—"} min</b></div>
        <div className="stat"><span>Your wallet</span><b>{balance.toLocaleString()} coins</b></div>
      </div>

      <FundPlayer profile={profile} />

      <h4 className="section-title">Orders to fulfil {actionable.length > 0 && <span className="count-pill">{actionable.length}</span>}</h4>
      {all.length === 0 ? (
        <div className="empty-state small">
          <span className="big">📥</span>
          <p>No buyer orders yet. Stay online to receive Mobile Money payments.</p>
        </div>
      ) : (
        <div className="fulfil-list">
          {all.map((o) => (
            <div key={o.id} className="fulfil-card">
              <div className="f-head">
                <span className="mono">{o.code}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="f-body">
                <div className="f-col">
                  <span>Buyer</span><b>{o.buyerName}</b>
                </div>
                <div className="f-col">
                  <span>Receives</span><b>{o.coinAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} coins</b>
                </div>
                <div className="f-col">
                  <span>You receive</span><b>{o.fiatAmount.toLocaleString()} {CURRENCY_META[o.currency].symbol}</b>
                </div>
                {o.paymentRef && (
                  <div className="f-col">
                    <span>MoMo ref</span><b>{o.paymentRef}</b>
                  </div>
                )}
              </div>
              {["paid", "disputed"].includes(o.status) && (
                <div className="f-actions">
                  <button className="btn-green" onClick={() => {
                    try {
                      ordersApi.releaseCoins(o.id, profile.uid);
                      toast.success(`Released ${o.coinAmount.toLocaleString()} coins to ${o.buyerName}`);
                    } catch (err: any) { toast.error(err.message); }
                  }}>Release coins</button>
                  <button className="btn-ghost danger" onClick={() => {
                    try {
                      ordersApi.refundBuyer(o.id, profile.uid);
                      toast.info("Order refunded — escrow returned to your float");
                    } catch (err: any) { toast.error(err.message); }
                  }}>Refund buyer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
