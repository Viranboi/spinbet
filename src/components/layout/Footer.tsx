import React from "react";
import { Link } from "react-router-dom";
import logoUrl from "../../assets/logo.webp";
import "./Footer.scss";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logoUrl} alt="Winner logo" className="logo-img" />
              <span className="logo-text">Winner</span>
            </div>
            <p className="footer-desc">
              The premier online betting platform for Africa.
              Sports betting, crash games, and casino — all in one place.
            </p>
            <div className="footer-badges">
              <span className="badge">🔒 SSL Secured</span>
              <span className="badge">✓ Licensed</span>
              <span className="badge">🛡️ BCLB</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/">Sports</Link>
            <Link to="/casino">Casino</Link>
            <Link to="/aviator">Aviator</Link>
            <Link to="/promotions">Promotions</Link>
            <Link to="/secret-odds">Secret Odds (Demo)</Link>
            <span className="footer-link-placeholder">Live Betting</span>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <span className="footer-link-placeholder">Help Center</span>
            <span className="footer-link-placeholder">Responsible Gaming</span>
            <span className="footer-link-placeholder">Terms & Conditions</span>
            <span className="footer-link-placeholder">Privacy Policy</span>
            <span className="footer-link-placeholder">Contact Us</span>
          </div>

          <div className="footer-col">
            <h4>Payments</h4>
            <div className="payment-methods">
              <div className="payment-item">M-Pesa</div>
              <div className="payment-item">Flutterwave</div>
              <div className="payment-item">Airtel Money</div>
              <div className="payment-item">Bank Transfer</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Winner. All rights reserved. 18+ Only. Bet responsibly.</p>
          <div className="footer-flags">
            <span>🌍 Africa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
