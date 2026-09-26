import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";
import * as ordersApi from "../p2p/orders";
import { CURRENCY_META, FiatCurrency } from "../p2p/types";
import "./AdminPage.scss";

const ACCESS_CODE = "LETSBET-PARTNER";

export default function PartnerPage() {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("lb_partner_ok") === "1"
  );

  if (!unlocked) {
    return (
      <div className="admin-page">
        <div className="gate-card">
          <span className="gate-icon">🤝</span>
          <h2>Partner Access</h2>
          <p>Enter the invitation code you received from the SpinBet team.</p>
          <input
            type="password"
            placeholder="Invitation code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (code.trim() === ACCESS_CODE) {
                  sessionStorage.setItem("lb_partner_ok", "1");
                  setUnlocked(true);
                } else toast.error("Invalid invitation code");
              }
            }}
          />
          <button
            className="btn-gold"
            onClick={() => {
              if (code.trim() === ACCESS_CODE) {
                sessionStorage.setItem("lb_partner_ok", "1");
                setUnlocked(true);
              } else toast.error("Invalid invitation code");
            }}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return <PartnerRegister />;
}

function PartnerRegister() {
  const { user } = useAuth();
  const profile = user ? ordersApi.getMyExchangerProfile(user.uid) : undefined;
  const [displayName, setDisplayName] = useState("");
  const [mtn, setMtn] = useState("");
  const [airtel, setAirtel] = useState("");
  const [holderName, setHolderName] = useState("");
  const [currency, setCurrency] = useState<FiatCurrency>("BIF");
  const [rate, setRate] = useState("1.02");
  const [minFiat, setMinFiat] = useState("1000");
  const [maxFiat, setMaxFiat] = useState("200000");
  const [requestedFloat, setRequestedFloat] = useState("50000");

  if (profile) {
    return (
      <div className="admin-page">
        <div className="desk-status">
          <h2>🏢 {profile.displayName}</h2>
          <p className="ok">Your desk is live on the P2P market.</p>
          <div className="status-grid">
            <div><span>Float available</span><b>${Math.floor(profile.availableCoins).toLocaleString()}</b></div>
            <div><span>In escrow</span><b>${profile.lockedCoins.toLocaleString()}</b></div>
            <div><span>Status</span><b>{profile.status}</b></div>
            <div><span>Verified</span><b>{profile.verified ? "Yes" : "Pending"}</b></div>
          </div>
          <p className="note">
            Need more float? Message the admin — funds are credited instantly after confirmation.
            Manage your desk from the <b>Exchanger Hub</b> tab on the P2P page.
          </p>
        </div>
      </div>
    );
  }

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
        floatCoins: 0,
      });
      toast.success("Application submitted! The admin will credit your starting float.");
    } catch (err: any) {
      toast.error(err.message || "Could not submit application");
    }
  }

  return (
    <div className="admin-page">
      {!user && (
        <div className="gate-card small">
          🔒 Log in first, then register your exchange desk here.
        </div>
      )}
      ${user && (
        <div className="panel-card">
          <div className="panel-head">
            <h2>Become a Certified Exchanger</h2>
            <p>
              Private registration for approved partners. Your desk goes live immediately;
              the admin credits your starting float (${Number(requestedFloat || 0).toLocaleString()} requested).
            </p>
          </div>
          <div className="form-grid">
            <label>Desk name<input placeholder="e.g. Kigali Fast Coins" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
            <label>Account holder name<input placeholder="Name registered on MoMo" value={holderName} onChange={(e) => setHolderName(e.target.value)} /></label>
            <label>MTN MoMo number<input placeholder="+250 78…" value={mtn} onChange={(e) => setMtn(e.target.value)} /></label>
            <label>Airtel Money number<input placeholder="+250 73…" value={airtel} onChange={(e) => setAirtel(e.target.value)} /></label>
            <label>Pricing currency
              <select value={currency} onChange={(e) => setCurrency(e.target.value as FiatCurrency)}>
                <option value="RWF">USD — US Dollar</option>
                <option value="BIF">USD — US Dollar</option>
              </select>
            </label>
            <label>Rate ({CURRENCY_META[currency].symbol} per coin)<input type="number" step="0.001" value={rate} onChange={(e) => setRate(e.target.value)} /></label>
            <label>Min order ({CURRENCY_META[currency].symbol})<input type="number" value={minFiat} onChange={(e) => setMinFiat(e.target.value)} /></label>
            <label>Max order ({CURRENCY_META[currency].symbol})<input type="number" value={maxFiat} onChange={(e) => setMaxFiat(e.target.value)} /></label>
            <label>Starting float to request ($)<input type="number" value={requestedFloat} onChange={(e) => setRequestedFloat(e.target.value)} /></label>
          </div>
          <button
            className="btn-gold"
            disabled={!holderName.trim() || (!mtn.trim() && !airtel.trim())}
            onClick={submit}
          >
            Submit partner application
          </button>
        </div>
      )}
    </div>
  );
}
