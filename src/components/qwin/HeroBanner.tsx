import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BANNERS } from "./data";

export default function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) setIdx((i) => (i + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [idx]);

  const prev = () => setIdx((i) => (i - 1 + BANNERS.length) % BANNERS.length);
  const next = () => setIdx((i) => (i + 1) % BANNERS.length);

  return (
    <section
      className="wn-slider"
      aria-label="Promotions"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        touchX.current = null;
      }}
    >
      <ul
        className="wn-slider-track"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {BANNERS.map((banner, i) => (
          <li key={banner.img} className="wn-slide" aria-hidden={i !== idx}>
            <a
              className="slide-container"
              href="#!"
              onClick={(e) => e.preventDefault()}
              tabIndex={i === idx ? 0 : -1}
            >
              <img src={banner.img} alt={banner.alt} loading={i === 0 ? "eager" : "lazy"} />
            </a>
            {banner.title && (
              <div className="wn-slide-copy">
                {banner.tag && <span className="wn-slide-tag">{banner.tag}</span>}
                <h2>{banner.title}</h2>
                {banner.subtitle && <p>{banner.subtitle}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>

      <button type="button" className="wn-slider-arrow left" onClick={prev} aria-label="Previous slide">
        <ChevronLeft size={20} />
      </button>
      <button type="button" className="wn-slider-arrow right" onClick={next} aria-label="Next slide">
        <ChevronRight size={20} />
      </button>

      <div className="wn-slider-regulatory">
        <span>18+ Gambling can be addictive, play responsibly.</span>
        <span>Regulated by NLGC of RDB</span>
      </div>

      <div className="wn-slider-ind">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            className={i === idx ? "on" : ""}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
