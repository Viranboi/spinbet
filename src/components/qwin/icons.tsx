import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

const svgProps = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true as const,
  className,
});

/* ============================== NAV ICONS ============================== */

export function MenuLinesIcon({ size = 19, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3.5 6h17M3.5 12h17M3.5 18h17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Two overlapping outline balls — football (front-left) & basketball (back-right). */
export function SportsBallsIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="8" cy="14.5" r="5.8" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15.8" cy="9" r="5.8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8.7v11.6M2.2 14.5h11.6M15.8 3.2v11.6M10 9h11.6" stroke="currentColor" strokeWidth="1.25" />
      <path d="M4.1 10.4a7 7 0 0 0 7.8 7.8M11.9 4.9a7 7 0 0 0 7.8 7.8" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/** Broadcast tower with radar waves. */
export function LiveRadarIcon({ size = 19, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="9.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="5.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <path d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Slot machine "777" symbol box. */
export function Casino777Icon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="2.2" y="4.2" width="19.6" height="15.6" rx="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.4 8.4h3.4L6.6 15.6M11 8.4h3.4L12.2 15.6M16.6 8.4H20L17.8 15.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Classic white propeller airplane silhouette. */
export function AviatorPlaneIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M2.2 13.1l7.7-1.7 5.7-8.2 2.2-.6-.8 8.1 4.8 1.1c.8.2.8 1.3 0 1.5L17 14.4l.8 5.2-2.2-.6-5.7-4.5-7.7.1c-1.1 0-1.1-1.3 0-1.5z" fill="currentColor" />
      <path d="M6.5 11.9l-2.2-4.4 1.7-.4 3.8 3.6M6.5 14.4l-2.2 4.4 1.7.4 3.8-3.6" fill="currentColor" />
    </svg>
  );
}

/** Stylized F2P graphic badge. */
export function Free2PlayBadgeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3.2 6.2h5.6M3.2 6.2v11.6M3.2 11.6h4.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.6 8.6c.2-1.6 1.3-2.5 2.8-2.5 1.6 0 2.7 1 2.7 2.5 0 2.7-5.3 3.3-5.3 6.6v.6h5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.6 17.8V6.2h1.9a3 3 0 0 1 0 6h-1.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.6 13.4l3 4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Trophy with soccer-ball emblem (SpinBet Leagues). */
export function StakeLeaguesTrophyIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M7 3.6h10v5.2a5 5 0 0 1-10 0z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7 5H4.2a3.4 3.4 0 0 0 3.4 3.4M17 5h2.8a3.4 3.4 0 0 1-3.4 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 13.9v3M9 20.2c.5-2 1.6-3.3 3-3.3s2.5 1.3 3 3.3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 5.9l1.7 1.2-.6 2h-2.2l-.6-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12 5.9V4.4M13.7 7.1l1.5-.5M13.1 9.1l.9 1.3M10.9 9.1l-.9 1.3M10.3 7.1l-1.5-.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** "x999" crash games text badge. */
export function CrashX999BadgeIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="1.6" y="4.6" width="20.8" height="14.8" rx="2.6" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      <path d="M4.2 9.4l3 5.2M7.2 9.4l-3 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="10.6" cy="10.4" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 10.4c0 2.9-.9 4.6-2.5 5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.2" cy="10.4" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17.1 10.4c0 2.9-.9 4.6-2.5 5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="19.6" cy="10.4" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Three dots inside a circle. */
export function MoreCircleIcon({ size = 19, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8" cy="12" r="1.15" fill="currentColor" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" />
      <circle cx="16" cy="12" r="1.15" fill="currentColor" />
    </svg>
  );
}

/** Betting slip / receipt with magnifying glass. */
export function CheckBetslipIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path
        d="M5 3.4h11.4a1.2 1.2 0 0 1 1.2 1.2v13.2l-2.2-1.4-2.2 1.4-2.2-1.4-2.2 1.4-2.2-1.4-1.6 1V4.6A1.2 1.2 0 0 1 5 3.4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7.4 7.4h6.6M7.4 10.2h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="15.4" cy="15.2" r="3.4" fill="#121418" stroke="currentColor" strokeWidth="1.6" />
      <path d="M17.9 17.8l2.6 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Dynamic soccer ball in motion with a bold "V". */
export function VirtualShopIcon({ size = 19, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <g clipPath="url(#wnvs-c)">
        <circle cx="15" cy="8.2" r="5.6" stroke="currentColor" strokeWidth="1.7" />
        <path d="M15 5.4l2.2 1.6-.8 2.6h-2.8l-.8-2.6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M15 5.4V2.9M17.2 7l2.4-.7M16.4 9.6l1.5 2.1M13.6 9.6l-1.5 2.1M12.8 7l-2.4-.7" stroke="currentColor" strokeWidth="1" />
      </g>
      <defs>
        <clipPath id="wnvs-c">
          <circle cx="15" cy="8.2" r="5.6" />
        </clipPath>
      </defs>
      {/* motion streaks */}
      <path d="M2 6.2h5.2M1.4 9.4h3.6M2 12.6h4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      {/* V */}
      <path d="M5.6 14.6l2.6 5.6 2.6-5.6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================ UI GLYPHS ============================ */

/** Filled user/person icon inside a circle (profile button). */
export function UserPersonIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="10" fill="#3a3c43" />
      <circle cx="12" cy="9" r="3.5" fill="#fff" />
      <path d="M5.5 19c1.5-3 4-4.5 6.5-4.5s5 1.5 6.5 4.5" fill="#fff" />
    </svg>
  );
}

/* =========================== SPORT GLYPHS =========================== */

const sport = (paths: React.ReactNode, vb = "0 0 24 24") =>
  function SportGlyphInner({ size = 18, className }: IconProps) {
    return (
      <svg width={size} height={size} viewBox={vb} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className={className}>
        {paths}
      </svg>
    );
  };

export const FootballIcon = sport(
  <>
    <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 8.6l3.1 2.2-1.2 3.6h-3.8l-1.2-3.6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M12 8.6V4.9M15.1 10.8l3.5-1.2M13.9 14.4l2.2 3M10.1 14.4l-2.2 3M8.9 10.8L5.4 9.6" stroke="currentColor" strokeWidth="1.1" />
  </>
);

export const BasketballIcon = sport(
  <>
    <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 3.4v17.2M3.4 12h17.2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5.9 5.9a11.4 11.4 0 0 1 0 12.2M18.1 5.9a11.4 11.4 0 0 0 0 12.2" stroke="currentColor" strokeWidth="1.3" />
  </>
);

export const TennisIcon = sport(
  <>
    <ellipse cx="10" cy="9.4" rx="6.4" ry="6.4" transform="rotate(-38 10 9.4)" stroke="currentColor" strokeWidth="1.6" />
    <path d="M6.6 4.6a7.6 7.6 0 0 0 6.8 9.6M4.4 8a7.6 7.6 0 0 0 9.6 6.8" stroke="currentColor" strokeWidth="1.1" opacity="0.85" />
    <path d="M13.6 14.4l5 5.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    <circle cx="19.4" cy="6.2" r="2.3" stroke="currentColor" strokeWidth="1.4" />
  </>
);

export const ESoccerGamepadIcon = sport(
  <>
    <path d="M7.4 7h9.2a5.2 5.2 0 0 1 5 6.4l-.7 3a2.6 2.6 0 0 1-4.6 1L14.6 15H9.4L7.7 17.4a2.6 2.6 0 0 1-4.6-1l-.7-3A5.2 5.2 0 0 1 7.4 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8 10.2v4M6 12.2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="15.6" cy="10.9" r="1.05" fill="currentColor" />
    <circle cx="17.8" cy="13.1" r="1.05" fill="currentColor" />
  </>
);

export const MmaGloveIcon = sport(
  <>
    <path
      d="M7.6 3.8h6.2c3.4 0 6 2.6 6 6 0 2.4-1.3 4.4-3.2 5.4v2.2a2.4 2.4 0 0 1-2.4 2.4H9.4A2.4 2.4 0 0 1 7 17.4v-2.2C5.4 14.4 4.2 12.8 4.2 11V7.6a3.8 3.8 0 0 1 3.4-3.8z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M4.2 11h15.4M7 15.2h9.6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10.8 3.9v6" stroke="currentColor" strokeWidth="1.3" opacity="0.8" />
  </>
);

export const BaseballIcon = sport(
  <>
    <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M6.2 5.4a12.6 12.6 0 0 1 0 13.2M17.8 5.4a12.6 12.6 0 0 0 0 13.2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5.4 8.4l1.6.8M4.9 12h1.8M5.4 15.6l1.6-.8M18.6 8.4l-1.6.8M19.1 12h-1.8M18.6 15.6l-1.6-.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </>
);

export const BoxingGloveIcon = sport(
  <>
    <path
      d="M8 3.6h4.6c3.8 0 6.8 3 6.8 6.8 0 2.1-.8 3.9-2.2 5.2v2.6a2.2 2.2 0 0 1-2.2 2.2H8.4A2.2 2.2 0 0 1 6.2 18v-2.5C4.7 14.2 3.8 12.4 3.8 10.4 3.8 6.6 5 3.6 8 3.6z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M3.9 10.6h15.3M6.2 15.6h11" stroke="currentColor" strokeWidth="1.4" />
    <path d="M9.4 3.7c-1 1.6-1 4.6 0 6.4" stroke="currentColor" strokeWidth="1.3" opacity="0.8" />
  </>
);

export const RugbyBallIcon = sport(
  <>
    <ellipse cx="12" cy="12" rx="9.4" ry="5.6" transform="rotate(-38 12 12)" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8.6 15.4l6.8-6.8M10.2 11l.9.9M12 9.2l.9.9M11.1 13.8l.9.9M13 12l.9.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </>
);

export const CricketBatBallIcon = sport(
  <>
    <path
      d="M14.9 3.2c1.5-1.5 3.7-1.6 4.9-.4s1.1 3.4-.4 4.9l-7.2 7.2-4.5-4.5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M8.2 10.9l-4.4 4.4a1.9 1.9 0 0 0 0 2.7l2.2 2.2a1.9 1.9 0 0 0 2.7 0l4.4-4.4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="19.6" cy="17.4" r="2.6" stroke="currentColor" strokeWidth="1.4" />
  </>
);

export const FutsalBallIcon = sport(
  <>
    <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 9.2l2.6 1.9-1 3.1h-3.2l-1-3.1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M12 9.2V6.4M14.6 11.1l2.7-.9M13.6 14.2l1.6 2.3M10.4 14.2l-1.6 2.3M9.4 11.1l-2.7-.9" stroke="currentColor" strokeWidth="1.1" />
  </>
);

export const HandballIcon = sport(
  <>
    <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 3.4c3 2.2 3 15 0 17.2M3.4 12c2.2-3 15-3 17.2 0" stroke="currentColor" strokeWidth="1.3" />
  </>
);

export const IceHockeyIcon = sport(
  <>
    <path d="M4.6 3.6l9.2 13.4M19.4 3.6l-9.2 13.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M12.6 15.4l3.4 4.8c.6.9 2 .9 2.7 0 .6-.8.5-1.9-.2-2.6l-4-4.2zM11.4 15.4L8 20.2c-.6.9-2 .9-2.7 0-.6-.8-.5-1.9.2-2.6l4-4.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <rect x="8.6" y="20" width="6.8" height="1.9" rx="0.9" fill="currentColor" />
  </>
);

export const SnookerIcon = sport(
  <>
    <circle cx="8" cy="15.4" r="4.6" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="16.6" cy="8.4" r="2.6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M14.6 13.4l5.6 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </>
);

export const TableTennisIcon = sport(
  <>
    <circle cx="10.4" cy="10.4" r="6.8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M14.9 14.9l1.6 4.5c.2.7-.6 1.4-1.3 1l-3.4-3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18.6" cy="6.6" r="2.4" stroke="currentColor" strokeWidth="1.4" />
  </>
);

export const VolleyballIcon = sport(
  <>
    <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 3.4c-2.4 2.6-3.4 6.4-2.4 10.2M20.2 9.4c-3.4-.6-7.2.8-9.4 3.8M6.4 18.6c2.6-2 6.6-2.6 10-1.2" stroke="currentColor" strokeWidth="1.3" />
  </>
);

export const BeachVolleyballIcon = sport(
  <>
    <circle cx="12" cy="9" r="6.4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2.6c-1.9 1.9-2.6 4.8-1.8 7.7M18.2 6.8c-2.5-.5-5.4.6-7 2.8M5.9 13.4c2-1.5 5-2 7.5-1" stroke="currentColor" strokeWidth="1.1" />
    <path d="M3 19.2c2.2-1.6 4.6-1.6 6.8 0s4.6 1.6 6.8 0 4.4-1.6 6.4-.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </>
);

const SPORT_GLYPHS: Record<number, React.FC<IconProps>> = {
  31: FootballIcon,
  32: BasketballIcon,
  35: TennisIcon,
  3137: ESoccerGamepadIcon,
  3117: MmaGloveIcon,
  33: BaseballIcon,
  310: BoxingGloveIcon,
  312: RugbyBallIcon,
  321: CricketBatBallIcon,
  329: FutsalBallIcon,
  36: HandballIcon,
  34: IceHockeyIcon,
  319: SnookerIcon,
  320: TableTennisIcon,
  323: VolleyballIcon,
  334: BeachVolleyballIcon,
};

export function SportGlyph({ id, size = 18, className }: IconProps & { id: number }) {
  const Glyph = SPORT_GLYPHS[id] ?? FootballIcon;
  return <Glyph size={size} className={className} />;
}
