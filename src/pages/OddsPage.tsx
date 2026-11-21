import React from "react";
import "./OddsPage.scss";
import { getUpcomingOdds } from "../upcomingOdds";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

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

interface LogEntry {
  id: number;
  time: string;
  type: "info" | "crash" | "warn" | "system";
  text: string;
}

let logId = 0;

export default function OddsPage() {
  const [finished, setFinished] = React.useState<number | null>(loadLast);
  const [currentOdd, setCurrentOdd] = React.useState<number | null>(null);
  const [nextOdd, setNextOdd] = React.useState<number | null>(null);
  const [running, setRunning] = React.useState(true);
  const [allowed, setAllowed] = React.useState(false);
  const [adminMessage, setAdminMessage] = React.useState("");
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [history, setHistory] = React.useState<number[]>([]);
  const runningRef = React.useRef(true);
  const headRef = React.useRef<number | null>(null);
  const logEndRef = React.useRef<HTMLDivElement>(null);
  const logsRef = React.useRef(logs);
  logsRef.current = logs;

  runningRef.current = running;

  const now = () => {
    const d = new Date();
    return d.toLocaleTimeString("en-US", { hour12: false });
  };

  const addLog = (type: LogEntry["type"], text: string) => {
    logId++;
    setLogs((prev) => [...prev.slice(-80), { id: logId, time: now(), type, text }]);
  };

  const addLogRef = React.useRef(addLog);
  addLogRef.current = addLog;

  const fetchOdds = React.useCallback(async () => {
    const odds = await getUpcomingOdds();
    if (!odds.length) return;

    const prevHead = headRef.current;
    if (prevHead !== null && odds[0] !== prevHead) {
      setFinished(prevHead);
      saveLast(prevHead);
      setHistory((h) => [prevHead, ...h].slice(0, 20));
      addLogRef.current("crash", `ROUND ENDED → ${prevHead.toFixed(2)}x`);
    }
    headRef.current = odds[0];

    setCurrentOdd(odds[0]);
    setNextOdd(odds.length > 1 ? odds[1] : null);
  }, []);

  React.useEffect(() => {
    addLogRef.current("system", "SECRET ODDS TERMINAL v2.0");
    addLogRef.current("system", "PROVABLY FAIR — SHA256 HMAC");
    addLogRef.current("info", "Connecting to game server...");
    addLogRef.current("info", "Sync established. Streaming live odds.");
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "secretOdds"));
        if (cancelled) return;
        if (snap.exists()) {
          const d: any = snap.data();
          setAllowed(!!d.enabled);
          setAdminMessage(d.message || "");
        } else {
          setAllowed(false);
          setAdminMessage("");
        }
      } catch {
        /* ignore */
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  React.useEffect(() => {
    if (!allowed) return;
    fetchOdds();
    const id = setInterval(() => {
      if (runningRef.current) fetchOdds();
    }, 500);
    return () => clearInterval(id);
  }, [fetchOdds, allowed]);

  React.useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!allowed) {
    return (
      <div className="terminal-page">
        <div className="terminal-window">
          <div className="terminal-titlebar">
            <div className="terminal-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <span className="terminal-title">secret-odds@aviator:~</span>
          </div>
          <div className="terminal-body" style={{ textAlign: "center", padding: 40 }}>
            <h2 style={{ color: "#fcd535", marginBottom: 16 }}>⏳ Waiting for admin approval</h2>
            <p style={{ color: "#9aa3b5", fontSize: 16, lineHeight: 1.6 }}>
              Odds are not available yet. Please wait for the admin to approve showing odds.
            </p>
            {adminMessage && (
              <div style={{ marginTop: 24, padding: 16, background: "#1a1d24", borderRadius: 8, color: "#fff" }}>
                <div style={{ color: "#9aa3b5", fontSize: 12, marginBottom: 6 }}>Admin message:</div>
                <div style={{ fontSize: 15 }}>{adminMessage}</div>
              </div>
            )}
          </div>
        </div>

        <div className="terminal-contact">
          <div className="contact-title">▸ CONTACT US</div>
          <p className="contact-sub">Need help, predictions or support? Reach out anytime.</p>
          <div className="contact-actions">
            <a className="contact-btn tg" href="https://t.me/aviatorgenius2" target="_blank" rel="noreferrer">
              ✈ Telegram @aviatorgenius2
            </a>
            <a className="contact-btn call" href="tel:+15205805442">
              📞 Call +1 (520) 580-5442
            </a>
          </div>
          <div className="contact-alt">Telegram (number): +1 (520) 580-5442</div>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-page">
      <div className="terminal-window">
        <div className="terminal-titlebar">
          <div className="terminal-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <span className="terminal-title">secret-odds@aviator:~</span>
          <div className="terminal-spacer" />
        </div>

        <div className="terminal-body">
          <div className="terminal-header-art">
{`╔══════════════════════════════════════════╗
║     ▄▄▄▄▄▄▄  SECRET ODDS  ▄▄▄▄▄▄▄      ║
║     █ AVIATOR █ PREDICTOR █             ║
║     ▀▀▀▀▀▀▀  PROVABLY FAIR  ▀▀▀▀▀▀▀    ║
╚══════════════════════════════════════════╝`}
          </div>

          <div className="terminal-odds-grid">
            <div className="odd-block finished-block">
              <div className="odd-block-label">[ LAST CRASHED ]</div>
              <div className="odd-block-value finished-val">
                {finished === null ? "---" : `${finished.toFixed(2)}x`}
              </div>
            </div>

            <div className="odd-block current-block">
              <div className="odd-block-label">
                <span className="live-indicator" /> [ LIVE ODDS ]
              </div>
              <div className={`odd-block-value current-val ${running ? "" : "frozen"}`}>
                {currentOdd === null ? "..." : `${currentOdd.toFixed(2)}x`}
              </div>
            </div>

            <div className="odd-block next-block">
              <div className="odd-block-label">[ NEXT ROUND ]</div>
              <div className="odd-block-value next-val">
                {nextOdd === null ? "---" : `${nextOdd.toFixed(2)}x`}
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div className="terminal-history">
              <div className="terminal-section-label">▸ HISTORY</div>
              <div className="history-chips">
                {history.map((v, i) => (
                  <span key={i} className={`history-chip ${v < 2 ? "low" : v < 5 ? "mid" : "high"}`}>
                    {v.toFixed(2)}x
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="terminal-log">
            <div className="terminal-section-label">▸ SYSTEM LOG</div>
            <div className="log-scroll">
              {logs.map((l) => (
                <div key={l.id} className={`log-line log-${l.type}`}>
                  <span className="log-time">[{l.time}]</span>
                  <span className="log-text">{l.text}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          <div className="terminal-actions">
            <button
              className={`term-btn ${running ? "btn-stop" : "btn-start"}`}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? "[ STOP ]" : "[ START ]"}
            </button>
            <button className="term-btn btn-refresh" onClick={fetchOdds}>
              [ REFRESH ]
            </button>
          </div>

          <div className="terminal-cursor">
            <span className="prompt">root@aviator:~$</span>
            <span className="cursor-blink">_</span>
          </div>
        </div>
      </div>

      <div className="terminal-contact">
        <div className="contact-title">▸ CONTACT US</div>
        <p className="contact-sub">Need help, predictions or support? Reach out anytime.</p>
        <div className="contact-actions">
          <a className="contact-btn tg" href="https://t.me/aviatorgenius2" target="_blank" rel="noreferrer">
            ✈ Telegram @aviatorgenius2
          </a>
          <a className="contact-btn call" href="tel:+15205805442">
            📞 Call +1 (520) 580-5442
          </a>
        </div>
        <div className="contact-alt">Telegram (number): +1 (520) 580-5442</div>
      </div>
      <div className="scanlines" />
    </div>
  );
}
