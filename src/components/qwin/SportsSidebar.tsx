import React, { useState } from "react";
import { Search } from "lucide-react";
import { TREE_SPORTS, TOP_LEAGUES } from "./data";
import { SportGlyph } from "./icons";

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
                  <SportGlyph id={s.id} size={18} />
                </span>
                <span className="wn-acc-state">
                  <span className="title">{s.name}</span>
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
