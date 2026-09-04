import React, { useMemo, useState } from "react";
import type { Selection } from "./data";
import { MATCHES, CENTER_TABS, SPORT_TABS } from "./data";
import { SportGlyph } from "./icons";

interface Props {
  selections: Selection[];
  onToggle: (sel: Omit<Selection, "key">) => void;
}

export default function MatchFeed({ selections, onToggle }: Props) {
  const [tab, setTab] = useState<string>("upcoming");
  const [sportId, setSportId] = useState<number>(31);

  const selectedKeys = new Set(selections.map((s) => s.key));

  // the sportsbook shows football events under the football tab on the dashboard
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
                      <span className="we-team">{m.home}</span>
                      <span className="we-team">{m.away}</span>
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
                      <button type="button" className="we-more">
                        +{m.markets}
                      </button>
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
