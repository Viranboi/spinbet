export interface Selection {
  key: string;
  matchLabel: string;
  pickLabel: string;
  odds: number;
}

export interface FeaturedGame {
  id: string;
  league: string;
  time: string;
  home: string;
  away: string;
  o1: number;
  oX: number;
  o2: number;
  boosted?: "1" | "X" | "2";
}

export interface MatchRow {
  id: string;
  tab: "live" | "top" | "upcoming";
  sport: string;
  time: string;
  country: string;
  flag: string;
  league: string;
  home: string;
  away: string;
  o1: number;
  oX?: number;
  o2: number;
  markets: number;
  liveMinute?: number;
  score?: string;
}

export interface Banner {
  img: string;
  alt: string;
  tag?: string;
  title?: string;
  subtitle?: string;
}

export const BANNERS: Banner[] = [
  { img: "/assets/Home-1.webp", alt: "Winner Home" },
  { img: "/assets/image1.webp", alt: "Winner Promo 1" },
  { img: "/assets/image2.webp", alt: "Winner Promo 2" },
  { img: "/assets/image3.webp", alt: "Winner Promo 3" },
  { img: "/assets/image4.webp", alt: "Winner Promo 4" },
  { img: "/assets/image5.webp", alt: "Winner Promo 5" },
  { img: "/assets/image6.webp", alt: "Winner Promo 6" },
  { img: "/assets/image7.webp", alt: "Winner Promo 7" },
  { img: "/assets/image8.webp", alt: "Winner Promo 8" },
];

export const SIDE_BANNER = "/assets/customer-care.webp";

export interface SportTreeItem {
  id: number;
  name: string;
  count: number;
}

export const TREE_SPORTS: SportTreeItem[] = [
  { id: 31, name: "Football", count: 1250 },
  { id: 32, name: "Basketball", count: 51 },
  { id: 35, name: "Tennis", count: 126 },
  { id: 3137, name: "eSoccer", count: 23 },
  { id: 3117, name: "MMA", count: 36 },
  { id: 33, name: "Baseball", count: 37 },
  { id: 310, name: "Boxing", count: 43 },
  { id: 312, name: "Rugby", count: 46 },
  { id: 321, name: "Cricket", count: 13 },
  { id: 329, name: "Futsal", count: 7 },
  { id: 36, name: "Handball", count: 28 },
  { id: 34, name: "Ice Hockey", count: 66 },
  { id: 319, name: "Snooker", count: 8 },
  { id: 320, name: "Table Tennis", count: 201 },
  { id: 323, name: "Volleyball", count: 4 },
  { id: 334, name: "Beach Volley", count: 3 },
];

export const TOP_LEAGUES: Record<number, { name: string; count: number }[]> = {
  31: [
    { name: "UEFA Champions League", count: 7 },
    { name: "Premier League", count: 22 },
    { name: "Serie A", count: 16 },
    { name: "LaLiga", count: 19 },
    { name: "Ligue 1", count: 9 },
    { name: "Eredivisie", count: 8 },
    { name: "LaLiga 2", count: 6 },
    { name: "DFB Pokal", count: 8 },
    { name: "Super Lig", count: 9 },
    { name: "Liga Portugal", count: 4 },
  ],
  32: [
    { name: "NBA", count: 12 },
    { name: "WNBA", count: 6 },
  ],
};

export interface LeagueChip {
  flag: string;
  label: string;
  count: number;
}

export const FAVORITE_LEAGUES: LeagueChip[] = [
  { flag: "🌍", label: "UEFA Champions League", count: 7 },
  { flag: "🏆", label: "UEFA Europa League", count: 14 },
  { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", label: "Premier League", count: 21 },
  { flag: "🏆", label: "UEFA Conference League", count: 24 },
];

export const FEATURED_GAMES: FeaturedGame[] = [
  { id: "fg1", league: "Spain · LaLiga", time: "Today 21:30", home: "Elche CF", away: "FC Barcelona", o1: 8.0, oX: 5.7, o2: 1.38, boosted: "2" },
  { id: "fg2", league: "England · Premier League", time: "Today 17:30", home: "Newcastle United", away: "Liverpool FC", o1: 3.75, oX: 3.9, o2: 1.93 },
  { id: "fg3", league: "Italy · Serie A", time: "Today 18:30", home: "Frosinone Calcio", away: "Juventus Turin", o1: 7.2, oX: 4.9, o2: 1.41 },
  { id: "fg4", league: "Spain · LaLiga", time: "Today 17:00", home: "Atletico Madrid", away: "Villarreal CF", o1: 1.85, oX: 3.85, o2: 4.3 },
  { id: "fg5", league: "France · Ligue 1", time: "Today 20:45", home: "Stade Rennais FC", away: "Paris Saint-Germain", o1: 5.5, oX: 4.7, o2: 1.53 },
  { id: "fg6", league: "Italy · Serie A", time: "Today 20:45", home: "Atalanta BC", away: "Sassuolo Calcio", o1: 1.56, oX: 4.2, o2: 5.7 },
  { id: "fg7", league: "France · Ligue 1", time: "Today 17:15", home: "Le Havre AC", away: "AS Monaco", o1: 3.65, oX: 3.55, o2: 2.02 },
  { id: "fg8", league: "Italy · Serie A", time: "Today 20:45", home: "Torino FC", away: "AC Milan", o1: 4.3, oX: 3.45, o2: 1.9 },
  { id: "fg9", league: "Netherlands · Eredivisie", time: "Today 16:45", home: "SC Cambuur", away: "Feyenoord Rotterdam", o1: 11.0, oX: 7.0, o2: 1.23 },
  { id: "fg10", league: "England · Premier League", time: "Tomorrow 21:00", home: "Fulham FC", away: "Chelsea FC", o1: 3.90, oX: 3.85, o2: 1.87 },
];

export const CENTER_TABS = [
  { key: "live", label: "Live" },
  { key: "top", label: "Top Events" },
  { key: "upcoming", label: "Upcoming" },
] as const;

export interface SportTab {
  id: number;
  label: string;
}

export const SPORT_TABS: SportTab[] = [
  { id: 31, label: "Football" },
  { id: 32, label: "Basketball" },
  { id: 35, label: "Tennis" },
  { id: 3137, label: "eSoccer" },
  { id: 3117, label: "MMA" },
  { id: 33, label: "Baseball" },
  { id: 310, label: "Boxing" },
  { id: 312, label: "Rugby" },
  { id: 321, label: "Cricket" },
  { id: 329, label: "Futsal" },
  { id: 36, label: "Handball" },
  { id: 34, label: "Ice Hockey" },
  { id: 319, label: "Snooker" },
  { id: 320, label: "Table Tennis" },
  { id: 323, label: "Volleyball" },
  { id: 334, label: "Beach Volley" },
];

export const MATCHES: MatchRow[] = [
  { id: "m1", tab: "live", sport: "Football", time: "64'", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", league: "Premier League", home: "Arsenal", away: "Chelsea", o1: 1.42, oX: 4.5, o2: 6.8, markets: 128, liveMinute: 64, score: "2 - 1" },
  { id: "m2", tab: "live", sport: "Football", time: "38'", country: "Spain", flag: "🇪🇸", league: "LaLiga", home: "Real Madrid", away: "Sevilla", o1: 1.28, oX: 5.8, o2: 9.5, markets: 118, liveMinute: 38, score: "1 - 0" },
  { id: "m3", tab: "live", sport: "Basketball", time: "Q3", country: "USA", flag: "🇺🇸", league: "NBA", home: "Lakers", away: "Warriors", o1: 1.72, o2: 2.15, markets: 74, liveMinute: 41, score: "78 - 81" },
  { id: "m4", tab: "top", sport: "Football", time: "Today 21:30", country: "Spain", flag: "🇪🇸", league: "LaLiga", home: "Elche CF", away: "FC Barcelona", o1: 8.0, oX: 5.7, o2: 1.38, markets: 96 },
  { id: "m5", tab: "top", sport: "Football", time: "Today 17:30", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", league: "Premier League", home: "Newcastle United", away: "Liverpool FC", o1: 3.75, oX: 3.9, o2: 1.93, markets: 142 },
  { id: "m6", tab: "top", sport: "Football", time: "Today 18:30", country: "Italy", flag: "🇮🇹", league: "Serie A", home: "Frosinone Calcio", away: "Juventus Turin", o1: 7.2, oX: 4.9, o2: 1.41, markets: 131 },
  { id: "m7", tab: "upcoming", sport: "Football", time: "Tomorrow 21:00", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", league: "Premier League", home: "Fulham FC", away: "Chelsea FC", o1: 3.85, oX: 3.9, o2: 1.87, markets: 156 },
  { id: "m8", tab: "upcoming", sport: "Football", time: "Tomorrow 20:45", country: "Italy", flag: "🇮🇹", league: "Serie A", home: "Atalanta BC", away: "Sassuolo Calcio", o1: 1.56, oX: 4.2, o2: 5.7, markets: 149 },
  { id: "m9", tab: "upcoming", sport: "Football", time: "Tomorrow 20:45", country: "France", flag: "🇫🇷", league: "Ligue 1", home: "Stade Rennais FC", away: "Paris Saint-Germain", o1: 5.5, oX: 4.7, o2: 1.53, markets: 121 },
  { id: "m10", tab: "upcoming", sport: "Football", time: "Tomorrow 17:15", country: "France", flag: "🇫🇷", league: "Ligue 1", home: "Le Havre AC", away: "AS Monaco", o1: 3.65, oX: 3.55, o2: 2.02, markets: 108 },
  { id: "m11", tab: "upcoming", sport: "Football", time: "Tomorrow 16:45", country: "Netherlands", flag: "🇳🇱", league: "Eredivisie", home: "SC Cambuur", away: "Feyenoord Rotterdam", o1: 11.0, oX: 7.0, o2: 1.23, markets: 87 },
  { id: "m12", tab: "upcoming", sport: "Football", time: "Sat 18:00", country: "Germany", flag: "🇩🇪", league: "DFB Pokal", home: "Bayern München", away: "Dortmund", o1: 2.05, oX: 3.5, o2: 3.3, markets: 134 },
  { id: "m13", tab: "upcoming", sport: "Football", time: "Sat 20:00", country: "Türkiye", flag: "🇹🇷", league: "Super Lig", home: "Galatasaray", away: "Fenerbahçe", o1: 2.4, oX: 3.4, o2: 2.75, markets: 112 },
];
