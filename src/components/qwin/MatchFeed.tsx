import React, { useMemo, useState } from "react";
import { ChevronDown, Zap } from "lucide-react";
import type { Selection } from "./data";
import { MATCHES, CENTER_TABS, SPORT_TABS } from "./data";
import { SportGlyph } from "./icons";

interface Props {
  selections: Selection[];
  onToggle: (sel: Omit<Selection, "key">) => void;
}

const TEAM_JERSEYS: Record<string, { home: string; away: string }> = {
  "Ipswich Town": { home: "#3a5ba0", away: "#c8102e" },
  "Liverpool FC": { home: "#c8102e", away: "#3a5ba0" },
  "Real Betis Seville": { home: "#00954c", away: "#1d428a" },
  "Arsenal": { home: "#ef0107", away: "#034694" },
  "Chelsea": { home: "#034694", away: "#ef0107" },
  "Newcastle United": { home: "#241f20", away: "#c8102e" },
  "Tottenham Hotspur": { home: "#132257", away: "#ffffff" },
  "West Ham United": { home: "#7a263a", away: "#1bb1e7" },
  "Aston Villa": { home: "#670e36", away: "#95bfe5" },
  "Brighton & Hove": { home: "#0057b8", away: "#ffffff" },
  "Crystal Palace": { home: "#1b458f", away: "#c4122e" },
  "Fulham FC": { home: "#000000", away: "#cc0000" },
  "Wolverhampton": { home: "#fdb913", away: "#231f20" },
  "Nottingham Forest": { home: "#dd0000", away: "#ffffff" },
  "Bournemouth": { home: "#da291c", away: "#000000" },
  "Brentford": { home: "#e30613", away: "#000000" },
  "Everton": { home: "#003399", away: "#ffffff" },
  "Leicester City": { home: "#003090", away: "#fdb913" },
  "Leeds United": { home: "#ffffff", away: "#ffcd00" },
  "Southampton": { home: "#d71920", away: "#1c1c1c" },
  "Burnley": { home: "#6c1d45", away: "#99d6ea" },
  "Luton Town": { home: "#f78f1e", away: "#000b3a" },
  "Sheffield United": { home: "#ee2737", away: "#000000" },
  "Elche CF": { home: "#1a5632", away: "#c8102e" },
  "FC Barcelona": { home: "#a50044", away: "#004d98" },
  "Atletico Madrid": { home: "#cb3524", away: "#272e61" },
  "Villarreal CF": { home: "#FFE114", away: "#005187" },
  "Real Madrid": { home: "#ffffff", away: "#00529f" },
  "Sevilla": { home: "#d4001e", away: "#ffffff" },
  "Frosinone Calcio": { home: "#88c4e6", away: "#ffd700" },
  "Juventus Turin": { home: "#000000", away: "#ffffff" },
  "Atalanta BC": { home: "#1e71b8", away: "#000000" },
  "Sassuolo Calcio": { home: "#009040", away: "#000000" },
  "Stade Rennais FC": { home: "#e4002b", away: "#000000" },
  "Paris Saint-Germain": { home: "#004170", away: "#da291c" },
  "Le Havre AC": { home: "#0055a5", away: "#ffffff" },
  "AS Monaco": { home: "#e2001a", away: "#ffffff" },
  "Torino FC": { home: "#8b0000", away: "#ffffff" },
  "AC Milan": { home: "#fb090b", away: "#000000" },
  "SC Cambuur": { home: "#ffd700", away: "#003399" },
  "Feyenoord Rotterdam": { home: "#ee1c25", away: "#000000" },
  "Bayern München": { home: "#dc052d", away: "#0066b2" },
  "Dortmund": { home: "#fde100", away: "#000000" },
  "Galatasaray": { home: "#ffc72c", away: "#ee1c25" },
  "Fenerbahçe": { home: "#002f87", away: "#ffc72c" },
  "Lakers": { home: "#552583", away: "#FDB927" },
  "Warriors": { home: "#1D428A", away: "#FFC72C" },
};

function TeamJersey({ team, isHome }: { team: string; isHome: boolean }) {
  const colors = TEAM_JERSEYS[team];
  const color = isHome ? (colors?.home ?? "#555") : (colors?.away ?? "#888");
  return (
    <div className="we-jersey" style={{ background: color }}>
      <svg viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4 L16 0 L24 0 L30 4 L36 8 L34 16 L28 14 L28 44 L12 44 L12 14 L6 16 L4 8 Z" fill={color} stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
        <path d="M16 0 L24 0" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

export default function MatchFeed({ selections, onToggle }: Props) {
  const [tab, setTab] = useState<string>("upcoming");
  const [sportId, setSportId] = useState<number>(31);

  const selectedKeys = new Set(selections.map((s) => s.key));

  const sportName = SPORT_TABS.find((t) => t.id === sportId)?.label ?? "Football";
  const rows = useMemo(
    () => MATCHES.filter((m) => m.tab === tab && (sportId === 31 ? true : m.sport === sportName)),
    [tab, sportId, sportName]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const r of rows) {
      const key = `${r.flag}|${r.country} - ${r.league}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <section className="wn-events">
      <div className="wn-center-tabs">
        {CENTER_TABS.map((t) => (
          <button
            key={t.key}
            className={`wn-tab ${tab === t.key ? "au-s-s" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="wn-sport-filter">
        <button type="button" className="wn-sf-btn">
          <span className="sf-ico"><SportGlyph id={sportId} size={18} /></span>
          <span>{sportName}</span>
          <ChevronDown size={14} />
        </button>
        <button type="button" className="wn-sf-btn">
          <span>Today</span>
          <ChevronDown size={14} />
        </button>
        <button type="button" className="wn-sf-btn">
          <span>By Time</span>
          <ChevronDown size={14} />
        </button>
        <button type="button" className="wn-sf-icon">
          <Zap size={18} />
        </button>
      </div>

      <div className="wn-sport-tabs">
        <ul>
          {SPORT_TABS.map((t) => (
            <li
              key={t.id}
              className={sportId === t.id ? "au-s-s" : ""}
              onClick={() => setSportId(t.id)}
            >
              <span className="tab-ico"><SportGlyph id={t.id} size={20} /></span>
              <span>{t.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="wn-event-groups">
        {grouped.map(([key, list]) => {
          const [flag, league] = key.split("|");
          return (
            <div key={key} className="wn-league-block">
              <div className="wn-league-head">
                <span className="flag">{flag}</span>
                <span className="name">{league}</span>
                <span className="count">({list.length})</span>
              </div>

              {list.map((m) => {
                const label = `${m.home} vs ${m.away}`;
                const picks = [
                  { tag: "1", odds: m.o1 },
                  ...(m.oX !== undefined ? [{ tag: "X", odds: m.oX }] : []),
                  { tag: "2", odds: m.o2 },
                ];
                return (
                  <div key={m.id} className={`wn-event ${m.liveMinute ? "is-live" : ""}`}>
                    <div className="we-time">
                      {m.liveMinute ? (
                        <b className="live-min">{m.liveMinute}'</b>
                      ) : (
                        <span>{m.time}</span>
                      )}
                    </div>

                    <div className="we-teams">
                      {m.score && <span className="we-score">{m.score}</span>}
                      <div className="we-team-row">
                        <TeamJersey team={m.home} isHome={true} />
                        <span className="we-team">{m.home}</span>
                      </div>
                      <span className="we-vs">v</span>
                      <div className="we-team-row">
                        <TeamJersey team={m.away} isHome={false} />
                        <span className="we-team">{m.away}</span>
                      </div>
                    </div>

                    <div className="we-odds">
                      {picks.map((p) => {
                        const selKey = `${m.id}-${p.tag}`;
                        const on = selectedKeys.has(selKey);
                        return (
                          <button
                            key={selKey}
                            type="button"
                            className={`we-odd ${on ? "selected" : ""}`}
                            onClick={() =>
                              onToggle({
                                matchLabel: label,
                                pickLabel: `${p.tag} @ ${p.odds.toFixed(2)} — ${label}`,
                                odds: p.odds,
                              })
                            }
                          >
                            <i>{p.tag}</i>
                            <em>{p.odds.toFixed(2)}</em>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {grouped.length === 0 && (
          <div className="wn-events-empty">
            No {sportName} events in this section right now.
          </div>
        )}
      </div>
    </section>
  );
}
