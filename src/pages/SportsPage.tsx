import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../auth/AuthContext";
import { SportsDataService, LEAGUES, type SportMatch } from "../sports/sportsData";
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

  function onOdds(m: SportMatch, pick: string, odds: number) {
    if (!user) return toast.info("Log in to place bets — tap JOIN.");
    toast.success(`${pick} @ ${odds.toFixed(2)} — ${m.homeTeam} vs ${m.awayTeam}`);
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
      <Footer />
    </div>
  );
}
