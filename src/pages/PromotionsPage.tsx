import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./PromotionsPage.scss";

const PROMOTIONS = [
  {
    id: 1,
    title: "100% First Deposit Bonus",
    desc: "Get up to BIF 100,000 on your first deposit. Instant credit, no wagering on first bet.",
    badge: "NEW",
    gradient: "linear-gradient(135deg, #d32f2f, #b71c1c)",
    icon: "🎁",
    active: true,
  },
  {
    id: 2,
    title: "Aviator Free Spins",
    desc: "Play 50 free rounds on Aviator every Friday. Min deposit BIF 5,000.",
    badge: "WEEKLY",
    gradient: "linear-gradient(135deg, #1a0533, #0d1b2a)",
    icon: "✈️",
    active: true,
  },
  {
    id: 3,
    title: "Accumulator Boost",
    desc: "Add 5+ selections and get up to 50% extra on your winnings.",
    badge: "SPORTS",
    gradient: "linear-gradient(135deg, #1b5e20, #2e7d32)",
    icon: "⚽",
    active: true,
  },
  {
    id: 4,
    title: "Refer & Earn BIF 10,000",
    desc: "Invite friends and earn BIF 1,000 for each friend who deposits.",
    badge: "SOCIAL",
    gradient: "linear-gradient(135deg, #e65100, #bf360c)",
    icon: "🤝",
    active: true,
  },
  {
    id: 5,
    title: "Cashback Mondays",
    desc: "Get 10% cashback on all losses every Monday. Up to BIF 5,000.",
    badge: "WEEKLY",
    gradient: "linear-gradient(135deg, #0d47a1, #1565c0)",
    icon: "💰",
    active: true,
  },
  {
    id: 6,
    title: "VIP Loyalty Rewards",
    desc: "Earn points on every bet. Higher VIP levels unlock exclusive bonuses and faster withdrawals.",
    badge: "VIP",
    gradient: "linear-gradient(135deg, #4a148c, #6a1b9a)",
    icon: "👑",
    active: true,
  },
];

export default function PromotionsPage() {
  const { user } = useAuth();

  return (
    <div className="promos-page">
      <div className="promos-inner">
        <div className="promos-hero">
          <h1>Promotions & Bonuses</h1>
          <p>Exclusive offers for new and existing players across Africa</p>
        </div>

        <div className="promos-grid">
          {PROMOTIONS.map((p) => (
            <div key={p.id} className="promo-card">
              <div className="promo-top" style={{ background: p.gradient }}>
                <span className="promo-badge">{p.badge}</span>
                <span className="promo-icon">{p.icon}</span>
              </div>
              <div className="promo-body">
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="promo-actions">
                  {user ? (
                    <Link to="/casino" className="promo-btn">Claim Now</Link>
                  ) : (
                    <Link to="/" className="promo-btn">Register to Claim</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="promos-terms">
          <h3>Terms & Conditions</h3>
          <ul>
            <li>All bonuses are subject to wagering requirements</li>
            <li>Minimum deposit of BIF 100 required for deposit bonuses</li>
            <li>Bonus funds must be wagered 5x before withdrawal</li>
            <li>Maximum bet with bonus funds: BIF 5,000</li>
            <li>Bonuses expire after 30 days if not used</li>
            <li>One bonus per household/IP address</li>
            <li>SpinBet reserves the right to modify or cancel promotions at any time</li>
            <li>Players must be 18+ to participate</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
