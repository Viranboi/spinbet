import React, { useRef } from "react";
import { ChevronRight } from "lucide-react";
import { FAVORITE_LEAGUES } from "./data";

export default function FavoriteLeagues() {
  const trackRef = useRef<HTMLUListElement>(null);

  function scrollRight() {
    trackRef.current?.scrollBy({ left: 260, behavior: "smooth" });
  }

  return (
    <section className="wn-fav-leagues" aria-label="Favorite leagues">
      <ul className="wn-fav-track" ref={trackRef}>
        {FAVORITE_LEAGUES.map((l) => (
          <li key={l.label} className="wn-league-chip">
            <button type="button">
              <span className="chip-icon">{l.flag}</span>
              <span className="chip-label">{l.label} ({l.count})</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="wn-carousel-arrow right"
        onClick={scrollRight}
        aria-label="Scroll leagues"
      >
        <ChevronRight size={16} />
      </button>
    </section>
  );
}
