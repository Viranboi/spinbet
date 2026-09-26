import React, { useState } from "react";
import { Search } from "lucide-react";
import { TREE_SPORTS, TOP_LEAGUES } from "./data";

const SPORT_EMOJI: Record<number, string> = {
  31: "\u26BD",
  32: "\uD83C\uDFC0",
  35: "\uD83C\uDFD3",
  3137: "\uD83C\uDFAE",
  3117: "\uD83E\uDD4A",
  33: "\u26BE",
  310: "\uD83E\uDD4A",
  312: "\uD83C\uDFC9",
  321: "\uD83C\uDFCF",
  329: "\u26BD",
  36: "\uD83C\uDFD0",
  34: "\uD83C\uDFD2",
  319: "\uD83C\uDFB1",
  320: "\uD83C\uDFD3",
  323: "\uD83C\uDFD0",
  334: "\uD83C\uDFD0",
};

export default function SportsSidebar() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(31);

  const q = query.trim().toLowerCase();
  const list = q
    ? TREE_SPORTS.filter((s) => s.name.toLowerCase().includes(q))
    : TREE_SPORTS;

  return (
    <div className="wn-tree">
      <div className="wn-tree-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams, events, leagues"
          aria-label="Search teams, events, leagues"
        />
      </div>

      <div className="wn-tree-list">
        {list.map((s) => {
          const open = expanded === s.id;
          return (
            <div key={s.id} className={`wn-acc ${open ? "open" : ""}`}>
              <button
                type="button"
                className="wn-acc-control"
                onClick={() => setExpanded(open ? null : s.id)}
              >
                <span className="wn-acc-ico">
                  <span className="sport-emoji">{SPORT_EMOJI[s.id] || "\u26BD"}</span>
                </span>
                <span className="wn-acc-state">
                  <span className="title">{s.name.toUpperCase()}</span>
                  <span className="count">({s.count})</span>
                </span>
                <i className={`arrow ${open ? "up" : ""}`} />
              </button>

              {open && TOP_LEAGUES[s.id] && (
                <div className="wn-acc-panel">
                  {TOP_LEAGUES[s.id].map((l) => (
                    <button key={l.name} type="button" className="wn-league-row">
                      <span className="name">{l.name}</span>
                      <span className="count">{l.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="wn-tree-empty">No sports found for "{query}"</div>
        )}
      </div>
    </div>
  );
}
