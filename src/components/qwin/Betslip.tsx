import React, { useState } from "react";
import { Trash2, Info, X, Check } from "lucide-react";
import { toast } from "react-toastify";
import type { Selection } from "./data";

interface Props {
  selections: Selection[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

const QUICK = [500, 1000, 5000, 10000];

function SlipArt() {
  return (
    <svg width="104" height="104" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="48" cy="82" rx="26" ry="4" fill="rgba(255,255,255,0.06)" />
      <g transform="rotate(-6 48 44)">
        <path
          d="M28 14h40v58l-5-3.4-5 3.4-5-3.4-5 3.4-5-3.4-5 3.4-5-3.4-5 3.4V14z"
          fill="#17191e"
          stroke="#4a505b"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="34" y="24" width="22" height="5" rx="2.5" fill="#ffdf00" />
        <path d="M34 36h28M34 43h28M34 50h20M34 57h25" stroke="#565d69" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M62 52h8M62 59h5" stroke="#3a404a" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <circle cx="66" cy="66" r="11" fill="#101216" stroke="#ffdf00" strokeWidth="2.4" />
      <path d="M74 74l7 7" stroke="#ffdf00" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function Betslip({ selections, onRemove, onClear }: Props) {
  const [tab, setTab] = useState<"betslip" | "mybets">("betslip");
  const [acceptChanges, setAcceptChanges] = useState(true);
  const [stake, setStake] = useState("");
  const [booking, setBooking] = useState("");

  const totalOdds =
    selections.length > 0
      ? selections.reduce((acc, s) => acc * s.odds, 1)
      : 0;
  const stakeNum = parseFloat(stake) || 0;
  const returns = stakeNum * (selections.length > 1 ? totalOdds : selections[0]?.odds ?? 0);

  function placeBet() {
    if (!selections.length) return;
    if (stakeNum <= 0) {
      toast.error("Enter a stake amount first");
      return;
    }
    toast.success(
      `Bet placed (demo): ${selections.length} pick${selections.length > 1 ? "s" : ""} @ ${totalOdds.toFixed(2)} — $${Math.round(returns).toLocaleString()}`
    );
    setStake("");
    onClear();
  }

  function loadCode() {
    if (!booking.trim()) {
      toast.error("Enter a booking code");
      return;
    }
    toast.info(`Booking code "${booking.trim()}" not found (demo)`);
    setBooking("");
  }

  return (
    <div className="wn-betslip">
      <div className="wn-bs-head">
        <button
          className={tab === "betslip" ? "active" : ""}
          onClick={() => setTab("betslip")}
        >
          Betslip ({selections.length})
        </button>
        <button
          className={tab === "mybets" ? "active" : ""}
          onClick={() => setTab("mybets")}
        >
          My Bets (0)
        </button>
      </div>

      <div className="wn-bs-body">
        {tab === "mybets" ? (
          <div className="wn-bs-empty">
            <SlipArt />
            <h2>No bets yet</h2>
            <p>Your placed bets will appear here.</p>
          </div>
        ) : (
          <>
            <div className="wn-bs-actions">
              <label className="wn-check">
                <input
                  id="accept-odds"
                  type="checkbox"
                  checked={acceptChanges}
                  onChange={(e) => setAcceptChanges(e.target.checked)}
                />
                <span className={`box ${acceptChanges ? "on" : ""}`} aria-hidden>
                  {acceptChanges && <Check size={11} strokeWidth={4} />}
                </span>
                <span>Accept Odds Changes</span>
                <Info size={12} />
              </label>
              <button
                className={`wn-clear ${selections.length === 0 ? "disable" : ""}`}
                onClick={onClear}
                disabled={selections.length === 0}
              >
                Remove All
                <Trash2 size={13} />
              </button>
            </div>

            <div className="wn-load-bet">
              <input
                value={booking}
                onChange={(e) => setBooking(e.target.value)}
                placeholder="Booking Code"
              />
              <button type="button" onClick={loadCode}>Load</button>
            </div>

            {selections.length === 0 ? (
              <div className="wn-bs-empty">
                <SlipArt />
                <h2>Your Betslip Is Empty</h2>
                <p>Please add some selections to place a bet.</p>
              </div>
            ) : (
              <>
                <div className="wn-bs-selections">
                  {selections.map((s) => (
                    <div key={s.key} className="wn-sel">
                      <div className="main">
                        <span className="pick">{s.pickLabel.split(" — ")[0]}</span>
                        <span className="match">{s.matchLabel}</span>
                      </div>
                      <div className="right">
                        <em>{s.odds.toFixed(2)}</em>
                        <button onClick={() => onRemove(s.key)} aria-label="Remove selection">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="wn-stake">
                  <input
                    type="number"
                    min={0}
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    placeholder="Stake Amount"
                  />
                  <div className="quick">
                    {QUICK.map((q) => (
                      <button key={q} type="button" onClick={() => setStake(String(stakeNum + q))}>
                        +{q.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="wn-totals">
                  <div>
                    <span>Total Odds</span>
                    <strong>{(selections.length > 1 ? totalOdds : selections[0]?.odds ?? 0).toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>Possible Payout</span>
                    <strong>${Math.round(returns).toLocaleString()}</strong>
                  </div>
                </div>

                <button className="wn-place" onClick={placeBet}>Place Bet</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
