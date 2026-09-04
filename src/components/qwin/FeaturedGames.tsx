import React from "react";
import type { Selection } from "./data";
import { FEATURED_GAMES } from "./data";

interface Props {
  selections: Selection[];
  onToggle: (sel: Omit<Selection, "key">) => void;
}

export default function FeaturedGames({ selections, onToggle }: Props) {
  const selectedKeys = new Set(selections.map((s) => s.key));

  return (
    <section className="wn-featured">
      <div className="wn-featured-grid">
        {FEATURED_GAMES.map((g) => {
          const label = `${g.home} vs ${g.away}`;
          const picks = [
            { tag: "1" as const, odds: g.o1 },
            { tag: "X" as const, odds: g.oX },
            { tag: "2" as const, odds: g.o2 },
          ];
          return (
            <article key={g.id} className="wn-featured-card">
              <div className="fg-header">
                <span className="fg-league">{g.league}</span>
                <span className="fg-time">{g.time}</span>
              </div>
              <div className="fg-body">
                <div className="fg-teams">
                  <span className="fg-team-name">{g.home}</span>
                  <span className="fg-team-name">{g.away}</span>
                </div>
                <div className="fg-odds">
                  {picks.map((p) => {
                    if (p.odds === undefined) return null;
                    const key = `${g.id}-${p.tag}`;
                    const on = selectedKeys.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`fg-odd ${on ? "selected" : ""} ${!on && g.boosted === p.tag ? "boosted" : ""}`}
                        onClick={() =>
                          onToggle({
                            matchLabel: label,
                            pickLabel: `${p.tag} @ ${p.odds.toFixed(2)} — ${label}`,
                            odds: p.odds,
                          })
                        }
                      >
                        <span className="odd-label">{p.tag}</span>
                        <span className="odd-price">{p.odds.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
