import React from "react";
import "./OddsPage.scss";
import { getUpcomingOdds } from "../upcomingOdds";

const LAST_KEY = "letsbet_last_finished_odd";

function loadLast(): number | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (raw !== null) return Number(raw);
  } catch {
    /* ignore */
  }
  return null;
}

function saveLast(value: number): void {
  try {
    localStorage.setItem(LAST_KEY, String(value));
  } catch {
    /* ignore */
  }
}

export default function OddsPage() {
  const [finished, setFinished] = React.useState<number | null>(loadLast);
  const [currentOdd, setCurrentOdd] = React.useState<number | null>(null);
  const [nextOdd, setNextOdd] = React.useState<number | null>(null);
  const [running, setRunning] = React.useState(true);
  const runningRef = React.useRef(true);
  const headRef = React.useRef<number | null>(null);

  runningRef.current = running;

  const fetchOdds = React.useCallback(async () => {
    const odds = await getUpcomingOdds();
    if (!odds.length) return;

    const prevHead = headRef.current;
    if (prevHead !== null && odds[0] !== prevHead) {
      setFinished(prevHead);
      saveLast(prevHead);
    }
    headRef.current = odds[0];

    setCurrentOdd(odds[0]);
    setNextOdd(odds.length > 1 ? odds[1] : null);
  }, []);

  React.useEffect(() => {
    fetchOdds();
    const id = setInterval(() => {
      if (runningRef.current) fetchOdds();
    }, 500);
    return () => clearInterval(id);
  }, [fetchOdds]);

  return (
    <div className="odds-page">
      <a
        className="odds-back"
        href="https://avepayment.vercel.app/"
        aria-label="Back to chat with admin"
      >
        &larr; Back to chat
      </a>
      <div className="odds-stage">
        <div className="odd-slot slot-finished">
          <span className="odd-label">Finished</span>
          <div className="odd-circle small">
            {finished === null ? (
              <span className="odd-value muted">--</span>
            ) : (
              <span className="odd-value">{finished.toFixed(2)}x</span>
            )}
          </div>
        </div>

        <div className="odd-slot slot-current">
          <span className="odd-label now-label">
            <i className="live-dot" /> Now
          </span>
          <div className={`odd-circle big ${running ? "" : "frozen"}`}>
            {currentOdd === null ? (
              <span className="odd-value muted">...</span>
            ) : (
              <span className="odd-value">{currentOdd.toFixed(2)}x</span>
            )}
          </div>
        </div>

        <div className="odd-slot slot-next">
          <span className="odd-label">Next</span>
          <div className="odd-circle medium">
            {nextOdd === null ? (
              <span className="odd-value muted">--</span>
            ) : (
              <span className="odd-value">{nextOdd.toFixed(2)}x</span>
            )}
          </div>
        </div>

        <div className="odds-actions">
          <button
            type="button"
            className={`odds-btn ${running ? "" : "active"}`}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "Stop" : "Resume"}
          </button>
          <button type="button" className="odds-btn" onClick={fetchOdds}>
            Refresh
          </button>
        </div>

        <div className="odds-watermark">STAKE</div>
      </div>
    </div>
  );
}
