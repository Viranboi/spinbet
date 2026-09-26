import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import "./BonusBanner.scss";

export default function BonusBanner() {
  const { user } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  function handleClaim() {
    if (!user) return;
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      setClaimed(true);
    }, 1500);
  }

  return (
    <div className="bonus-banner">
      <div className="bonus-inner">
        <div className="bonus-glow"></div>
        <div className="bonus-content">
          <div className="bonus-left">
            <span className="bonus-tag">NEW PLAYER BONUS</span>
            <h2>Get <span className="bonus-highlight">100% up to $100,000</span></h2>
            <p>Make your first deposit and we'll match it instantly. Plus 50 free spins on Aviator!</p>
            <div className="bonus-features">
              <span>✓ Instant credit</span>
              <span>✓ No wagering on first bet</span>
              <span>✓ Use on any game</span>
            </div>
          </div>
          <div className="bonus-right">
            {claimed ? (
              <div className="bonus-claimed">
                <span className="claimed-icon">✅</span>
                <span>Bonus Claimed!</span>
                <span className="claimed-sub">$100,000 added to your account</span>
              </div>
            ) : (
              <button className="bonus-claim-btn" onClick={handleClaim} disabled={claiming || !user}>
                {claiming ? (
                  <span className="claim-loading">Claiming...</span>
                ) : user ? (
                  "Claim Bonus"
                ) : (
                  "Register to Claim"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
