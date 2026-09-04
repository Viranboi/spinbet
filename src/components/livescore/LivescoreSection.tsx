import React, { useState, useEffect, useMemo } from "react";
import "./LivescoreSection.scss";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  minute: string;
  league: string;
  leagueLogo: string;
  status: "live" | "ht" | "ft" | "upcoming";
  kickoff: string;
  day: string;
  odds: { home: number; draw: number; away: number };
}

interface SportDbEvent {
  idEvent: string;
  strEvent: string;
  strLeague: string;
  strLeagueBadge: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strTimestamp: string | null;
  strStatus: string | null;
  strProgress?: string | null;
}

const API_BASE = "https://www.thesportsdb.com/api/v1/json/3/eventsday.php";

function dayOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function dayLabel(ts: string | null): string {
  if (!ts) return "";
  const date = new Date(ts.replace("Z", ""));
  const today = new Date();
  const diff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

/** deterministic pseudo-odds from team names so they stay stable per fixture */
function makeOdds(a: string, b: string): Match["odds"] {
  let h = 0;
  const s = a + "|" + b;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const r = (n: number) => ((h >> (n * 5)) % 1000) / 1000;
  const home = 1.35 + r(1) * 2.6;
  const away = 1.45 + r(2) * 3.4;
  const draw = 2.9 + r(3) * 1.6;
  const round = (x: number) => Math.round(x * 20) / 20;
  return { home: round(home), draw: round(draw), away: round(away) };
}

function mapStatus(ev: SportDbEvent): { status: Match["status"]; minute: string } {
  const st = (ev.strStatus || "").toLowerCase();
  if (["not started", "", "ns", "postponed", "canceled", "cancelled"].includes(st))
    return { status: "upcoming", minute: "Soon" };
  if (st === "ht") return { status: "ht", minute: "HT" };
  if (["match finished", "ft", "aet", "pen", "finished"].includes(st))
    return { status: "ft", minute: "FT" };
  if (["1h", "2h", "et", "p", "live", "1st half", "2nd half"].includes(st) || /^\d+$/.test(st)) {
    const prog = ev.strProgress && /^\d+$/.test(ev.strProgress) ? `${ev.strProgress}'` : st.toUpperCase();
    return { status: "live", minute: prog };
  }
  return { status: "upcoming", minute: "Soon" };
}

function mapEvent(ev: SportDbEvent): Match {
  const { status, minute } = mapStatus(ev);
  return {
    id: ev.idEvent,
    homeTeam: ev.strHomeTeam,
    awayTeam: ev.strAwayTeam,
    homeScore: ev.intHomeScore === null ? null : Number(ev.intHomeScore),
    awayScore: ev.intAwayScore === null ? null : Number(ev.intAwayScore),
    minute,
    league: ev.strLeague,
    leagueLogo: ev.strLeagueBadge || "🏆",
    status,
    kickoff: ev.strTimestamp
      ? new Date(ev.strTimestamp.replace("Z", "")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "",
    day: dayLabel(ev.strTimestamp),
    odds: makeOdds(ev.strHomeTeam, ev.strAwayTeam),
  };
}

const FALLBACK: Match[] = [
  { id: "f1", homeTeam: "Arsenal", awayTeam: "Chelsea", homeScore: 2, awayScore: 1, minute: "67'", league: "Premier League", leagueLogo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", status: "live", day: "Today", kickoff: "", odds: { home: 1.45, draw: 4.2, away: 6.5 } },
  { id: "f2", homeTeam: "Barcelona", awayTeam: "Real Madrid", homeScore: 1, awayScore: 1, minute: "34'", league: "La Liga", leagueLogo: "🇪🇸", status: "live", day: "Today", kickoff: "", odds: { home: 2.1, draw: 3.4, away: 3.2 } },
  { id: "f3", homeTeam: "APR FC", awayTeam: "Rayon Sports", homeScore: 0, awayScore: 0, minute: "12'", league: "African Premier League", leagueLogo: "🌍", status: "live", day: "Today", kickoff: "", odds: { home: 1.8, draw: 3.5, away: 4.0 } },
  { id: "f4", homeTeam: "Bayern Munich", awayTeam: "Dortmund", homeScore: 3, awayScore: 0, minute: "HT", league: "Bundesliga", leagueLogo: "🇩🇪", status: "ht", day: "Today", kickoff: "", odds: { home: 1.15, draw: 6.0, away: 12.0 } },
  { id: "f5", homeTeam: "Man City", awayTeam: "Liverpool", homeScore: null, awayScore: null, minute: "Soon", league: "Premier League", leagueLogo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", status: "upcoming", day: "Today", kickoff: "18:30", odds: { home: 2.3, draw: 3.4, away: 2.9 } },
  { id: "f6", homeTeam: "Juventus", awayTeam: "AC Milan", homeScore: null, awayScore: null, minute: "Soon", league: "Serie A", leagueLogo: "🇮🇹", status: "upcoming", day: "Today", kickoff: "20:45", odds: { home: 2.0, draw: 3.3, away: 3.5 } },
];

export default function LivescoreSection() {
  const [sport, setSport] = useState<"Soccer" | "Volleyball">("Soccer");
  const [matches, setMatches] = useState<Record<string, Match[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "live" | "upcoming">("all");

  useEffect(() => {
    let cancelled = false;

    async function load(s: "Soccer" | "Volleyball") {
      if (matches[s]) return;
      setLoading(true);
      try {
        const days = [-1, 0, 1, 2];
        const responses = await Promise.all(
          days.map((off) =>
            fetch(`${API_BASE}?d=${dayOffset(off)}&s=${s}`)
              .then((r) => r.json())
              .catch(() => ({ events: [] }))
          )
        );
        if (cancelled) return;
        const seen = new Set<string>();
        const list: Match[] = [];
        for (const data of responses) {
          for (const ev of data.events || []) {
            if (seen.has(ev.idEvent)) continue;
            seen.add(ev.idEvent);
            list.push(mapEvent(ev));
          }
        }
        setMatches((prev) => ({ ...prev, [s]: list.length > 0 ? list : FALLBACK }));
      } catch {
        if (!cancelled) setMatches((prev) => ({ ...prev, [s]: FALLBACK }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load(sport);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  const current = useMemo(() => matches[sport] || [], [matches, sport]);
  const sorted = useMemo(
    () =>
      [...current].sort((a, b) => {
        const rank = (m: Match) => (m.status === "live" ? 0 : m.status === "ht" ? 1 : m.status === "upcoming" ? 2 : 3);
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        return a.kickoff.localeCompare(b.kickoff);
      }),
    [current]
  );
  const filtered = filter === "all" ? sorted : sorted.filter((m) => m.status === filter);
  const liveCount = current.filter((m) => m.status === "live" || m.status === "ht").length;

  return (
    <div className="livescore-section">
      <div className="livescore-inner">
        <div className="livescore-header">
          <div className="livescore-title">
            <span className="live-pulse"></span>
            <h2>Live Matches</h2>
            <span className="live-count">{liveCount} live</span>
          </div>
          <div className="livescore-filters">
            <button className={`ls-filter ${sport === "Soccer" ? "active" : ""}`} onClick={() => setSport("Soccer")}>⚽ Football</button>
            <button className={`ls-filter ${sport === "Volleyball" ? "active" : ""}`} onClick={() => setSport("Volleyball")}>🏐 Volleyball</button>
            <button className={`ls-filter ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
            <button className={`ls-filter ${filter === "live" ? "active" : ""}`} onClick={() => setFilter("live")}>
              <span className="ls-live-dot"></span> Live
            </button>
            <button className={`ls-filter ${filter === "upcoming" ? "active" : ""}`} onClick={() => setFilter("upcoming")}>Upcoming</button>
          </div>
        </div>

        {loading && !matches[sport] ? (
          <div className="ls-loading">Loading today's fixtures…</div>
        ) : (
          <div className="matches-grid">
            {filtered.map((m) => (
              <div key={m.id} className={`match-card ${m.status}`}>
                <div className="match-league">
                  {m.leagueLogo.startsWith("http") ? (
                    <img src={m.leagueLogo} alt="" width={16} height={16} />
                  ) : (
                    <span>{m.leagueLogo}</span>
                  )}
                  <span>{m.league}</span>
                  <span className={`match-status ${m.status}`}>
                    {m.status === "live" && <span className="s-dot"></span>}
                    {m.status === "live" && m.minute}
                    {m.status === "ht" && "HT"}
                    {m.status === "upcoming" && `${m.day ? m.day + " · " : ""}${m.kickoff || "Soon"}`}
                    {m.status === "ft" && `FT${m.day && m.day !== "Today" ? " · " + m.day : ""}`}
                  </span>
                </div>
                <div className="match-teams">
                  <div className="match-team">
                    <span className="team-name">{m.homeTeam}</span>
                    <span className={`team-score ${(m.homeScore ?? -1) > (m.awayScore ?? -1) ? "leading" : ""}`}>
                      {m.homeScore ?? "-"}
                    </span>
                  </div>
                  <div className="match-team">
                    <span className="team-name">{m.awayTeam}</span>
                    <span className={`team-score ${(m.awayScore ?? -1) > (m.homeScore ?? -1) ? "leading" : ""}`}>
                      {m.awayScore ?? "-"}
                    </span>
                  </div>
                </div>
                <div className="match-odds">
                  <button className="odds-btn">
                    <span className="odds-label">1</span>
                    <span className="odds-val">{m.odds.home.toFixed(2)}</span>
                  </button>
                  <button className="odds-btn">
                    <span className="odds-label">X</span>
                    <span className="odds-val">{m.odds.draw.toFixed(2)}</span>
                  </button>
                  <button className="odds-btn">
                    <span className="odds-label">2</span>
                    <span className="odds-val">{m.odds.away.toFixed(2)}</span>
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="ls-loading">No {filter} matches right now.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
