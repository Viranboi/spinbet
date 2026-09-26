import React, { useState, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { credit } from "../p2p/wallet";
import { toast } from "react-toastify";
import "./DepositPage.scss";

type PaymentMethod = "ussd" | "momo" | "airtel";

const QUICK_AMOUNTS = [200, 400, 500, 1000];

export default function DepositPage() {
  const { user } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>("momo");
  const [amount, setAmount] = useState<string>("400");
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const phone = user?.phone || "+250739263633";

  function scrollCarousel(dir: -1 | 1) {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 220, behavior: "smooth" });
    }
  }

  function handleQuickAmount(val: number) {
    setAmount(String(val));
  }

  async function handleDeposit() {
    if (!user) {
      toast.error("Please login to make a deposit");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1) {
      toast.error("Enter a valid amount (min 1 BIF)");
      return;
    }
    if (numAmount > 10_000_000) {
      toast.error("Maximum deposit is 10,000,000 BIF");
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      credit(user.uid, numAmount, "adjustment", `mm-${Date.now()}`, `Mobile Money deposit via ${method.toUpperCase()}`);
      toast.success(`Deposit of ${numAmount.toLocaleString()} BIF successful!`);
      setAmount("400");
      setPromoCode("");
    } catch (e: any) {
      toast.error(e?.message || "Deposit failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dm-page">
      {/* SpinBet Top Navigation Bar */}
      <div className="dm-topnav">
        <div className="dm-topnav-inner">
          <div className="dm-topnav-left">
            <img src="/assets/spinbet-logo.png" alt="SpinBet" className="dm-spinbet-logo" />
            <div className="dm-topnav-items">
              <span className="dm-nav-item"><span className="dm-nav-ico">☰</span> Menu</span>
              <span className="dm-nav-item"><span className="dm-nav-ico">⚽</span> Sports</span>
              <span className="dm-nav-item"><span className="dm-nav-ico">🔴</span> Live</span>
              <span className="dm-nav-item"><span className="dm-nav-ico">🎰</span> Casino</span>
              <span className="dm-nav-item"><span className="dm-nav-ico">✈️</span> Aviator</span>
              <span className="dm-nav-item"><span className="dm-nav-ico">🎯</span> Free2Play</span>
              <span className="dm-nav-item"><span className="dm-nav-ico">🏆</span> SpinBet Leagues</span>
              <span className="dm-nav-item"><span className="dm-nav-ico">📈</span> Crash Games</span>
              <span className="dm-nav-item"><span className="dm-nav-ico">⋯</span> More</span>
            </div>
          </div>
          <div className="dm-topnav-right">
            <span className="dm-lang">🇬🇧 English ▾</span>
            <button className="dm-top-deposit">Deposit</button>
            <div className="dm-top-balance">
              <span className="dm-bal-label">Balance</span>
              <span className="dm-bal-val">4.00</span>
            </div>
            <div className="dm-top-freebet">
              <span className="dm-fb-label">Free Bet</span>
              <span className="dm-fb-val">0</span>
            </div>
            <div className="dm-user-icon">👤</div>
          </div>
        </div>
      </div>

      {/* Deposit Header */}
      <div className="dm-header">
        <button className="dm-back" onClick={() => window.history.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="dm-title">DEPOSIT</span>
        <div className="dm-header-right">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
        </div>
      </div>

      <div className="dm-body">
        <div className="dm-card">
          {/* Payment method carousel */}
          <div className="dm-carousel-wrap">
            <button className="dm-car-arrow dm-car-left" onClick={() => scrollCarousel(-1)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            <div className="dm-carousel" ref={carouselRef}>
              {/* USSD Card */}
              <button
                className={`dm-pay-card ${method === "ussd" ? "active" : ""}`}
                onClick={() => setMethod("ussd")}
              >
                <div className="dm-pay-visual dm-ussd-bg">
                  <div className="dm-ussd-icon">
                    <span className="dm-ussd-hash">*#</span>
                  </div>
                </div>
                <span className="dm-pay-name">USSD</span>
              </button>

              {/* MoMo Card */}
              <button
                className={`dm-pay-card ${method === "momo" ? "active" : ""}`}
                onClick={() => setMethod("momo")}
              >
                <div className="dm-pay-visual dm-momo-bg">
                  <div className="dm-momo-logo">
                    <svg viewBox="0 0 60 50" width="40" height="34">
                      <polygon points="15,8 30,35 0,35" fill="#000"/>
                      <polygon points="35,8 50,35 20,35" fill="#000"/>
                    </svg>
                  </div>
                  <div className="dm-momo-text">
                    <span className="dm-momo-title">MoMo</span>
                    <span className="dm-momo-sub">from MTN</span>
                  </div>
                </div>
                <span className="dm-pay-name dm-momo-name">MoMo</span>
              </button>

              {/* Airtel Card */}
              <button
                className={`dm-pay-card ${method === "airtel" ? "active" : ""}`}
                onClick={() => setMethod("airtel")}
              >
                <div className="dm-pay-visual dm-airtel-bg">
                  <div className="dm-airtel-logo">
                    <svg viewBox="0 0 50 50" width="36" height="36">
                      <circle cx="25" cy="20" r="12" fill="none" stroke="#e40000" stroke-width="3"/>
                      <path d="M18 14 Q25 6 32 14" fill="none" stroke="#e40000" stroke-width="3" stroke-linecap="round"/>
                      <path d="M18 26 Q25 34 32 26" fill="none" stroke="#e40000" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <span className="dm-airtel-name">airtel</span>
                  <span className="dm-airtel-money">money</span>
                </div>
                <span className="dm-pay-name dm-airtel-label">airtel</span>
              </button>
            </div>

            <button className="dm-car-arrow dm-car-right" onClick={() => scrollCarousel(1)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* View All + Phone */}
          <div className="dm-view-phone-row">
            <button className="dm-view-all-btn">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              View All
            </button>
            <span className="dm-phone-num">{phone}</span>
          </div>

          {/* Quick amounts */}
          <div className="dm-quick-row">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                className={`dm-quick-btn ${Number(amount) === val ? "active" : ""}`}
                onClick={() => handleQuickAmount(val)}
              >
                +{val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div className="dm-amount-wrap">
            <div className="dm-amount-field">
              <span className="dm-amount-cur">RWF</span>
              <div className="dm-amount-divider" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                max={10000000}
                className="dm-amount-input"
              />
              {amount && (
                <button className="dm-amount-clear" onClick={() => setAmount("")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>
            <div className="dm-amount-hint">
              <span>Min: 1</span>
              <span>Max: 10,000,000</span>
            </div>
          </div>

          {/* Promo code */}
          <div className="dm-promo-wrap">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Promotion Code (Optional)"
              className="dm-promo-input"
            />
          </div>

          {/* Deposit button */}
          <button
            className="dm-deposit-btn"
            onClick={handleDeposit}
            disabled={busy || !amount || Number(amount) < 1}
          >
            {busy ? "PROCESSING..." : "DEPOSIT"}
          </button>

          {/* Instructions */}
          <div className="dm-instructions">
            <p>1. Ensure <strong>{phone}</strong> is your number and is sufficiently funded with your desired deposit amount.</p>
            <p>2. Choose a deposit amount and click <strong>Deposit</strong> button.</p>
            <p>3. When prompted, confirm deposit by entering your mobile money <strong>PIN</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
