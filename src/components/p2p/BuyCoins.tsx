import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/AuthContext";
import { useExchangers } from "../../p2p/hooks";
import * as ordersApi from "../../p2p/orders";
import {
  CURRENCY_META,
  FiatCurrency,
  coinsForFiat,
  limitsFor,
} from "../../p2p/types";

interface Props {
  currency: FiatCurrency;
  onCurrencyChange: (c: FiatCurrency) => void;
  onStartTrade: () => void;
}

export default function BuyCoins({ currency, onCurrencyChange, onStartTrade }: Props) {
  const { user } = useAuth();
  const exchangers = useExchangers();
  const [fiatAmount, setFiatAmount] = useState<string>("");
  const [payWith, setPayWith] = useState<"all" | "MTN MoMo" | "Airtel Money">("all");

  const meta = CURRENCY_META[currency];
  const amountNum = Number(fiatAmount) || 0;

  const filtered = useMemo(() => {
    return exchangers
      .filter((e) => e.status === "active" && e.online)
      .filter((e) => payWith === "all" || e.accounts.some((a) => a.method === payWith))
      .filter((e) => {
        const l = limitsFor(e, currency);
        return amountNum === 0 || (amountNum >= l.min && amountNum <= l.max);
      })
      .sort((a, b) => {
        if (a.uid === "letsbet_admin") return -1;
        if (b.uid === "letsbet_admin") return 1;
        if (a.stats.completedOrders !== b.stats.completedOrders)
          return b.stats.completedOrders - a.stats.completedOrders;
        return currency === "RWF" ? a.rateRwf - b.rateRwf : a.rateBif - b.rateBif;
      });
  }, [exchangers, currency, payWith, amountNum]);

  function handleTrade(exchangerId: string) {
    if (!user) {
      toast.error("Please log in to start a trade");
      return;
    }
    if (amountNum <= 0) {
      toast.error("Enter the amount you want to spend first");
      return;
    }
    try {
      ordersApi.createOrder({
        buyerUid: user.uid,
        buyerName: user.displayName || user.email?.split("@")[0] || "Player",
        exchangerId,
        currency,
        fiatAmount: amountNum,
      });
      toast.success("Order opened — complete the payment to receive your funds");
      onStartTrade();
    } catch (err: any) {
      toast.error(err.message || "Could not open order");
    }
  }

  return (
    <div className="buy-coins">
      <div className="express-card">
        <div className="express-head">
          <h3>Buy Coins with Mobile Money</h3>
          <span className="escrow-badge">🛡 Escrow protected</span>
        </div>
        <div className="currency-toggle">
          {(["RWF", "BIF"] as FiatCurrency[]).map((c) => (
            <button
              key={c}
              className={`cur-btn ${currency === c ? "on" : ""}`}
              onClick={() => onCurrencyChange(c)}
            >
              {CURRENCY_META[c].symbol}
              <small>{CURRENCY_META[c].label}</small>
            </button>
          ))}
        </div>
        <label className="amount-label">I will pay</label>
        <div className="amount-box">
          <span className="cur-prefix">{meta.symbol}</span>
          <input
            type="number"
            min={0}
            placeholder={`Min ${currency === "RWF" ? "500" : "1,000"}`}
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
          />
          <span className="coin-eq">
            ${bestCoins(amountNum)}
          </span>
        </div>
        <div className="quick-row">
          {meta.quickAmounts.map((q) => (
            <button key={q} className={`quick ${amountNum === q ? "sel" : ""}`} onClick={() => setFiatAmount(String(q))}>
              {q.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="paywith-row">
          <span>Pay with:</span>
          {(["all", "MTN MoMo", "Airtel Money"] as const).map((m) => (
            <button key={m} className={`chip ${payWith === m ? "sel" : ""}`} onClick={() => setPayWith(m)}>
              {m === "all" ? "All methods" : m}
            </button>
          ))}
        </div>
      </div>

      <div className="offers-table-wrap">
        <table className="offers-table">
          <thead>
            <tr>
              <th>Exchanger</th>
              <th>Price ({meta.symbol} per coin)</th>
              <th>Available</th>
              <th>Limit ({meta.symbol})</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No exchangers match this amount or filter. Try another amount.
                </td>
              </tr>
            )}
            {filtered.map((ex) => {
              const l = limitsFor(ex, currency);
              const rate = currency === "RWF" ? ex.rateRwf : ex.rateBif;
              return (
                <tr key={ex.id}>
                  <td>
                    <div className="ex-cell">
                      <span className="avatar" style={{ background: ex.avatarColor }}>
                        {ex.displayName[0]}
                      </span>
                      <div className="ex-meta">
                        <span className="ex-name">
                          {ex.displayName}
                          {ex.verified && <span className="verified" title="Verified exchanger">✔</span>}
                        </span>
                        <span className="ex-stats">
                          {ex.stats.totalOrders.toLocaleString()} orders · {ex.stats.completionRate}% completion
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="price-cell">{rate.toFixed(3)}</td>
                  <td>${Math.floor(ex.availableCoins).toLocaleString()}</td>
                  <td>
                    {l.min.toLocaleString()} – {l.max.toLocaleString()}
                  </td>
                  <td>
                    <div className="method-chips">
                      {ex.accounts.map((a) => (
                        <span key={a.method} className={`m-chip ${a.method === "MTN MoMo" ? "mtn" : "airtel"}`}>
                          {a.method}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="action-cell">
                    <button className="trade-btn" onClick={() => handleTrade(ex.id)} disabled={amountNum <= 0}>
                      Trade
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="safety-strip">
        <div className="safety-item"><span>🛡</span><div><b>Funds in escrow</b><p>Coins are locked by the exchanger the moment you open an order.</p></div></div>
        <div className="safety-item"><span>⏱</span><div><b>15-minute window</b><p>Complete your MoMo payment and mark the order paid before it expires.</p></div></div>
        <div className="safety-item"><span>⚖️</span><div><b>Dispute support</b><p>Problem with a trade? Open a dispute and our team reviews the evidence.</p></div></div>
      </div>
    </div>
  );

  function bestCoins(fiat: number): string {
    if (!fiat || filtered.length === 0) return "0";
    const best = filtered[0];
    return coinsForFiat(best, currency, fiat).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}
