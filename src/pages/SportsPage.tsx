import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../auth/AuthContext";
import { SportsDataService, LEAGUES, type SportMatch } from "../sports/sportsData";
import { debit, getBalance, ensureWallet } from "../p2p/wallet";
import { useCurrency } from "../currency";
import "./SportsPage.scss";

function fmtDate(d: string) {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return d;
  }
}

function MatchCard({ m, onOdds }: { m: SportMatch; onOdds: (m: SportMatch, pick: string, odds: number) => void }) {
  return (
    <div className={`sp-match${m.isLive ? " is-live" : ""}`}>
      <div className="sp-match-head">
        <span className="sp-league">{m.flag} {m.league}</span>
        {m.isLive ? (
          <span className="sp-live-badge"><i />LIVE {m.minute}&prime;</span>
        ) : (
          <span className="sp-time">{fmtDate(m.date)} • {m.time}</span>
        )}
      </div>
      <div className="sp-teams">
        <div className="sp-team">
          {m.homeLogo && <img src={m.homeLogo} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
          <span>{m.homeTeam}</span>
        </div>
        <div className="sp-score">{m.isLive ? `${m.liveScore.home} - ${m.liveScore.away}` : "vs"}</div>
        <div className="sp-team right">
          <span>{m.awayTeam}</span>
          {m.awayLogo && <img src={m.awayLogo} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
        </div>
      </div>
      <div className="sp-odds">
        <button onClick={() => onOdds(m, m.homeTeam, m.odds.home)}><i>1</i><em>{m.odds.home.toFixed(2)}</em></button>
        <button onClick={() => onOdds(m, "Draw", m.odds.draw)}><i>X</i><em>{m.odds.draw.toFixed(2)}</em></button>
        <button onClick={() => onOdds(m, m.awayTeam, m.odds.away)}><i>2</i><em>{m.odds.away.toFixed(2)}</em></button>
      </div>
    </div>
  );
}

export default function SportsPage() {
  const { user } = useAuth();
  const { fmt, symbol, disp, usd, rate } = useCurrency();
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState("all");
  const [tab, setTab] = useState<"all" | "live" | "upcoming">("all");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let on = true;
    SportsDataService.getFixtures().then((ms) => {
      if (on) { setMatches(ms); setLoading(false); }
    }).catch(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  // live minute ticker (client-side)
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(iv);
  }, []);

  const withTick = useMemo(
    () => matches.map((m) => (m.isLive ? { ...m, minute: Math.min(90, m.minute + tick) } : m)),
    [matches, tick]
  );

  const filtered = useMemo(() => withTick.filter((m) => {
    if (league !== "all" && m.leagueId !== league && m.league !== league) return false;
    if (tab === "live" && !m.isLive) return false;
    if (tab === "upcoming" && (m.isLive || m.status === "Finished")) return false;
    return true;
  }), [withTick, league, tab]);

  const live = filtered.filter((m) => m.isLive);
  const upcoming = filtered.filter((m) => !m.isLive);

  const [pendingBet, setPendingBet] = React.useState<{ m: SportMatch; pick: string; odds: number } | null>(null);
  const [stake, setStake] = React.useState<string>("100");

  function onOdds(m: SportMatch, pick: string, odds: number) {
    if (!user) return toast.info("Log in to place bets — tap JOIN.");
    setStake("100");
    setPendingBet({ m, pick, odds });
  }

  function confirmBet() {
    if (!pendingBet || !user) return;
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid stake");
      return;
    }
    try {
      ensureWallet(user.uid);
      if (getBalance(user.uid) < amount) {
        toast.error("Insufficient balance");
        return;
      }
      debit(user.uid, amount, "sports_bet", pendingBet.m.id, `${pendingBet.pick} @ ${pendingBet.odds.toFixed(2)} — ${pendingBet.m.homeTeam} vs ${pendingBet.m.awayTeam}`);
      const potential = Math.round(amount * pendingBet.odds * 100) / 100;
      // record bet
      try {
        const raw = localStorage.getItem("sports_bets");
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift({
          id: `sb_${Date.now()}`,
          uid: user.uid,
          matchId: pendingBet.m.id,
          match: `${pendingBet.m.homeTeam} vs ${pendingBet.m.awayTeam}`,
          pick: pendingBet.pick,
          odds: pendingBet.odds,
          stake: amount,
          potential,
          ts: Date.now(),
          status: "placed",
        });
        if (arr.length > 200) arr.length = 200;
        localStorage.setItem("sports_bets", JSON.stringify(arr));
      } catch {}
      toast.success(`Bet placed: ${pendingBet.pick} @ ${pendingBet.odds.toFixed(2)} — potential payout ${fmt(potential)}`);
      setPendingBet(null);
    } catch (e: any) {
      toast.error(e?.message || "Bet failed");
    }
  }

  return (
    <div className="site-layout">
      <Navbar />
      <main className="site-main">
        <div className="sp-page">
          <div className="sp-hero">
            <div>
              <h1>⚽ Sports Betting</h1>
              <p>Live matches &amp; upcoming fixtures with real odds</p>
            </div>
            <div className="sp-tabs">
              {(["all", "live", "upcoming"] as const).map((t) => (
                <button key={t} className={`sp-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                  {t === "all" ? "All" : t === "live" ? `🔴 Live (${withTick.filter((m) => m.isLive).length})` : "Upcoming"}
                </button>
              ))}
            </div>
          </div>

          <div className="sp-leagues">
            <button className={`sp-chip${league === "all" ? " active" : ""}`} onClick={() => setLeague("all")}>All Leagues</button>
            {LEAGUES.map((l) => (
              <button key={l.id} className={`sp-chip${league === l.id ? " active" : ""}`} onClick={() => setLeague(l.id)}>
                <img src={l.badge} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                {l.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="sp-empty">Loading matches…</div>
          ) : (
            <>
              {(tab === "all" || tab === "live") && (
                <section className="sp-section">
                  <h3>🔴 Live Now ({live.length})</h3>
                  {live.length === 0 ? <div className="sp-empty">No live matches right now.</div> : (
                    <div className="sp-grid">{live.map((m) => <MatchCard key={m.id} m={m} onOdds={onOdds} />)}</div>
                  )}
                </section>
              )}
              {(tab === "all" || tab === "upcoming") && (
                <section className="sp-section">
                  <h3>📅 Upcoming ({upcoming.length})</h3>
                  {upcoming.length === 0 ? <div className="sp-empty">No upcoming matches.</div> : (
                    <div className="sp-grid">{upcoming.map((m) => <MatchCard key={m.id} m={m} onOdds={onOdds} />)}</div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </main>
      {pendingBet && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1d23", padding: 20, borderRadius: 8, width: 320, color: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Place Bet</h3>
            <p>{pendingBet.m.homeTeam} vs {pendingBet.m.awayTeam}</p>
            <p>Pick: {pendingBet.pick} @ {pendingBet.odds.toFixed(2)}</p>
            <label>Stake ({symbol})</label>
            <input
              type="number"
              value={rate === 1 || stake === "" ? stake : String(disp(Number(stake) || 0))}
              onChange={(e) => setStake(rate === 1 || e.target.value === "" ? e.target.value : String(usd(Number(e.target.value))))}
              style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setPendingBet(null)} style={{ padding: "8px 12px" }}>Cancel</button>
              <button onClick={confirmBet} style={{ padding: "8px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4 }}>Place Bet</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
