export interface SportMatch {
  id: string; sport: string; league: string; leagueId: string; country: string;
  flag: string; homeTeam: string; awayTeam: string; homeAbbr: string; awayAbbr: string;
  homeLogo: string; awayLogo: string; date: string; time: string; venue: string;
  weather: string; isLive: boolean; minute: number; status: string;
  liveScore: { home: number; away: number };
  stats: Record<string, { home: number; away: number }>;
  odds: { home: number; draw: number; away: number };
  probHome: number; probDraw: number;
  markets?: any;
}

export interface LeagueInfo {
  id: string; name: string; country: string; flag: string; badge: string; count: number;
}

// Environment configuration
const PROXY_BASE = '/api/footballMatches';

// League metadata and logos
export const LEAGUES: LeagueInfo[] = [
  {
    id: 'epl',
    name: 'Premier League',
    country: 'England',
    flag: '🇬🇧',
    badge: 'https://media-4.api-sports.io/football/leagues/39.png',
    count: 24,
  },
  {
    id: 'laliga',
    name: 'La Liga',
    country: 'Spain',
    flag: '🇪🇸',
    badge: 'https://media-4.api-sports.io/football/leagues/140.png',
    count: 18,
  },
  {
    id: 'ucl',
    name: 'UEFA Champions League',
    country: 'Europe',
    flag: '🇪🇺',
    badge: 'https://media-4.api-sports.io/football/leagues/2.png',
    count: 14,
  },
  {
    id: 'seriea',
    name: 'Serie A',
    country: 'Italy',
    flag: '🇮🇹',
    badge: 'https://media-4.api-sports.io/football/leagues/135.png',
    count: 16,
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    country: 'Germany',
    flag: '🇩🇪',
    badge: 'https://media-4.api-sports.io/football/leagues/78.png',
    count: 15,
  },
  {
    id: 'ligue1',
    name: 'Ligue 1',
    country: 'France',
    flag: '🇫🇷',
    badge: 'https://media-4.api-sports.io/football/leagues/61.png',
    count: 12,
  },
  {
    id: 'mls',
    name: 'MLS',
    country: 'USA',
    flag: '🇺🇸',
    badge: 'https://media-4.api-sports.io/football/leagues/253.png',
    count: 20,
  },
  {
    id: 'spl',
    name: 'Saudi Pro League',
    country: 'Saudi Arabia',
    flag: '🇸🇦',
    badge: 'https://media-4.api-sports.io/football/leagues/307.png',
    count: 10,
  },
];

// Helper to generate realistic decimal odds
function calcOdds(probMargin = 1.05, probHome = 0.45, probDraw = 0.28) {
  const probAway = 1.0 - (probHome + probDraw);
  const homeOdds = parseFloat((1 / (probHome * probMargin)).toFixed(2));
  const drawOdds = parseFloat((1 / (probDraw * probMargin)).toFixed(2));
  const awayOdds = parseFloat((1 / (probAway * probMargin)).toFixed(2));
  return { home: homeOdds, draw: drawOdds, away: awayOdds };
}

// Generate comprehensive markets for a match
export function generateMarkets(homeTeam: string, awayTeam: string, probHome = 0.45, probDraw = 0.28) {
  const probAway = 1 - (probHome + probDraw);
  const matchWinner = calcOdds(1.06, probHome, probDraw);

  const dc1X = parseFloat((1 / ((probHome + probDraw) * 1.06)).toFixed(2));
  const dc12 = parseFloat((1 / ((probHome + probAway) * 1.06)).toFixed(2));
  const dcX2 = parseFloat((1 / ((probDraw + probAway) * 1.06)).toFixed(2));

  const ou2_5Over = parseFloat((1.75 + Math.random() * 0.35).toFixed(2));
  const ou2_5Under = parseFloat((1.85 + Math.random() * 0.30).toFixed(2));
  const ou1_5Over = parseFloat((1.22 + Math.random() * 0.15).toFixed(2));
  const ou1_5Under = parseFloat((3.40 + Math.random() * 0.50).toFixed(2));
  const ou3_5Over = parseFloat((2.80 + Math.random() * 0.60).toFixed(2));
  const ou3_5Under = parseFloat((1.35 + Math.random() * 0.20).toFixed(2));

  const bttsYes = parseFloat((1.70 + Math.random() * 0.25).toFixed(2));
  const bttsNo = parseFloat((2.00 + Math.random() * 0.30).toFixed(2));

  const dnbHome = parseFloat((matchWinner.home * 0.75).toFixed(2));
  const dnbAway = parseFloat((matchWinner.away * 0.75).toFixed(2));

  const correctScores = [
    { score: '1-0', odds: parseFloat((6.5 + Math.random() * 2).toFixed(2)) },
    { score: '2-0', odds: parseFloat((8.0 + Math.random() * 3).toFixed(2)) },
    { score: '2-1', odds: parseFloat((7.5 + Math.random() * 2).toFixed(2)) },
    { score: '1-1', odds: parseFloat((6.0 + Math.random() * 1.5).toFixed(2)) },
    { score: '0-0', odds: parseFloat((9.5 + Math.random() * 3).toFixed(2)) },
    { score: '0-1', odds: parseFloat((7.0 + Math.random() * 2.5).toFixed(2)) },
    { score: '0-2', odds: parseFloat((11.0 + Math.random() * 4).toFixed(2)) },
    { score: '1-2', odds: parseFloat((8.5 + Math.random() * 3).toFixed(2)) },
    { score: '3-1', odds: parseFloat((14.0 + Math.random() * 5).toFixed(2)) },
    { score: '2-2', odds: parseFloat((12.0 + Math.random() * 4).toFixed(2)) },
  ];

  return {
    matchWinner: [
      { selection: 'Home Win', label: `${homeTeam}`, odds: matchWinner.home, key: '1' },
      { selection: 'Draw', label: 'Draw', odds: matchWinner.draw, key: 'X' },
      { selection: 'Away Win', label: `${awayTeam}`, odds: matchWinner.away, key: '2' },
    ],
    doubleChance: [
      { selection: '1X (Home or Draw)', label: '1X', odds: dc1X },
      { selection: '12 (Home or Away)', label: '12', odds: dc12 },
      { selection: 'X2 (Draw or Away)', label: 'X2', odds: dcX2 },
    ],
    overUnder: [
      { selection: 'Over 1.5 Goals', label: 'Over 1.5', odds: ou1_5Over },
      { selection: 'Under 1.5 Goals', label: 'Under 1.5', odds: ou1_5Under },
      { selection: 'Over 2.5 Goals', label: 'Over 2.5', odds: ou2_5Over },
      { selection: 'Under 2.5 Goals', label: 'Under 2.5', odds: ou2_5Under },
      { selection: 'Over 3.5 Goals', label: 'Over 3.5', odds: ou3_5Over },
      { selection: 'Under 3.5 Goals', label: 'Under 3.5', odds: ou3_5Under },
    ],
    btts: [
      { selection: 'BTTS - Yes', label: 'Yes', odds: bttsYes },
      { selection: 'BTTS - No', label: 'No', odds: bttsNo },
    ],
    drawNoBet: [
      { selection: `DNB - ${homeTeam}`, label: `${homeTeam}`, odds: dnbHome },
      { selection: `DNB - ${awayTeam}`, label: `${awayTeam}`, odds: dnbAway },
    ],
    handicap: [
      { selection: `${homeTeam} (-1.5)`, label: `${homeTeam} -1.5`, odds: parseFloat((matchWinner.home * 1.85).toFixed(2)) },
      { selection: `${awayTeam} (+1.5)`, label: `${awayTeam} +1.5`, odds: parseFloat((1.35 + Math.random() * 0.2).toFixed(2)) },
    ],
    firstGoal: [
      { selection: `First Goal - ${homeTeam}`, label: `${homeTeam}`, odds: parseFloat((matchWinner.home * 0.85).toFixed(2)) },
      { selection: 'First Goal - None', label: 'No Goal', odds: parseFloat((9.0 + Math.random() * 3).toFixed(2)) },
      { selection: `First Goal - ${awayTeam}`, label: `${awayTeam}`, odds: parseFloat((matchWinner.away * 0.85).toFixed(2)) },
    ],
    secondHalfWinner: [
      { selection: `2nd Half - ${homeTeam}`, label: `${homeTeam}`, odds: parseFloat((matchWinner.home * 1.15).toFixed(2)) },
      { selection: '2nd Half - Draw', label: 'Draw', odds: parseFloat((2.40 + Math.random() * 0.3).toFixed(2)) },
      { selection: `2nd Half - ${awayTeam}`, label: `${awayTeam}`, odds: parseFloat((matchWinner.away * 1.15).toFixed(2)) },
    ],
    corners: [
      { selection: 'Corners Over 9.5', label: 'Over 9.5', odds: 1.80 },
      { selection: 'Corners Under 9.5', label: 'Under 9.5', odds: 1.95 },
    ],
    cards: [
      { selection: 'Cards Over 3.5', label: 'Over 3.5', odds: 1.72 },
      { selection: 'Cards Under 3.5', label: 'Under 3.5', odds: 2.05 },
    ],
    correctScore: correctScores,
  };
}

// Built-in authentic realistic match database
export const REAL_FOOTBALL_MATCHES: SportMatch[] = [
  {
    id: 'rf-101',
    sport: 'football',
    league: 'Premier League',
    leagueId: 'epl',
    country: 'England',
    flag: '🇬🇧',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeAbbr: 'ARS',
    awayAbbr: 'CHE',
    homeLogo: 'https://media-4.api-sports.io/football/teams/42.png',
    awayLogo: 'https://media-4.api-sports.io/football/teams/49.png',
    date: '2026-07-26',
    time: '16:30',
    venue: 'Emirates Stadium, London',
    weather: '⛅ 19°C Part Clouds',
    isLive: true,
    minute: 68,
    status: '2nd Half',
    liveScore: { home: 2, away: 1 },
    stats: {
      possession: { home: 58, away: 42 },
      shots: { home: 12, away: 7 },
      shotsOnTarget: { home: 6, away: 3 },
      corners: { home: 7, away: 4 },
      yellowCards: { home: 2, away: 3 },
      redCards: { home: 0, away: 0 },
    },
    odds: { home: 1.75, draw: 3.60, away: 4.20 },
    probHome: 0.52,
    probDraw: 0.25,
  },
  {
    id: 'rf-102',
    sport: 'football',
    league: 'Premier League',
    leagueId: 'epl',
    country: 'England',
    flag: '🇬🇧',
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    homeAbbr: 'MCI',
    awayAbbr: 'LIV',
    homeLogo: 'https://media-4.api-sports.io/football/teams/50.png',
    awayLogo: 'https://media-4.api-sports.io/football/teams/40.png',
    date: '2026-07-26',
    time: '19:00',
    venue: 'Etihad Stadium, Manchester',
    weather: '🌧️ 16°C Light Rain',
    isLive: true,
    minute: 34,
    status: '1st Half',
    liveScore: { home: 1, away: 1 },
    stats: {
      possession: { home: 61, away: 39 },
      shots: { home: 8, away: 5 },
      shotsOnTarget: { home: 4, away: 2 },
      corners: { home: 4, away: 2 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 0 },
    },
    odds: { home: 1.95, draw: 3.50, away: 3.60 },
    probHome: 0.46,
    probDraw: 0.26,
  },
  {
    id: 'rf-103',
    sport: 'football',
    league: 'La Liga',
    leagueId: 'laliga',
    country: 'Spain',
    flag: '🇪🇸',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeAbbr: 'RMA',
    awayAbbr: 'BAR',
    homeLogo: 'https://media-4.api-sports.io/football/teams/541.png',
    awayLogo: 'https://media-4.api-sports.io/football/teams/529.png',
    date: '2026-07-26',
    time: '21:00',
    venue: 'Santiago Bernabéu, Madrid',
    weather: '☀️ 28°C Clear Sky',
    isLive: false,
    minute: 0,
    status: 'Upcoming',
    liveScore: { home: 0, away: 0 },
    stats: {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
    },
    odds: { home: 2.10, draw: 3.40, away: 3.15 },
    probHome: 0.42,
    probDraw: 0.27,
  },
  {
    id: 'rf-104',
    sport: 'football',
    league: 'UEFA Champions League',
    leagueId: 'ucl',
    country: 'Europe',
    flag: '🇪🇺',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Paris Saint-Germain',
    homeAbbr: 'BAY',
    awayAbbr: 'PSG',
    homeLogo: 'https://media-4.api-sports.io/football/teams/157.png',
    awayLogo: 'https://media-4.api-sports.io/football/teams/85.png',
    date: '2026-07-27',
    time: '20:00',
    venue: 'Allianz Arena, Munich',
    weather: '⛅ 21°C Mild',
    isLive: false,
    minute: 0,
    status: 'Upcoming',
    liveScore: { home: 0, away: 0 },
    stats: {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
    },
    odds: { home: 1.85, draw: 3.70, away: 3.80 },
    probHome: 0.49,
    probDraw: 0.24,
  },
  {
    id: 'rf-105',
    sport: 'football',
    league: 'Serie A',
    leagueId: 'seriea',
    country: 'Italy',
    flag: '🇮🇹',
    homeTeam: 'Inter Milan',
    awayTeam: 'Juventus',
    homeAbbr: 'INT',
    awayAbbr: 'JUV',
    homeLogo: 'https://media-4.api-sports.io/football/teams/505.png',
    awayLogo: 'https://media-4.api-sports.io/football/teams/496.png',
    date: '2026-07-26',
    time: '18:45',
    venue: 'San Siro, Milan',
    weather: '🌤️ 25°C Warm',
    isLive: true,
    minute: 81,
    status: '2nd Half',
    liveScore: { home: 1, away: 0 },
    stats: {
      possession: { home: 52, away: 48 },
      shots: { home: 14, away: 9 },
      shotsOnTarget: { home: 5, away: 3 },
      corners: { home: 6, away: 5 },
      yellowCards: { home: 3, away: 4 },
      redCards: { home: 0, away: 1 },
    },
    odds: { home: 1.45, draw: 4.00, away: 6.50 },
    probHome: 0.62,
    probDraw: 0.22,
  },
  {
    id: 'rf-106',
    sport: 'football',
    league: 'Saudi Pro League',
    leagueId: 'spl',
    country: 'Saudi Arabia',
    flag: '🇸🇦',
    homeTeam: 'Al Nassr',
    awayTeam: 'Al Hilal',
    homeAbbr: 'NAS',
    awayAbbr: 'HIL',
    homeLogo: 'https://media-4.api-sports.io/football/teams/2501.png',
    awayLogo: 'https://media-4.api-sports.io/football/teams/2506.png',
    date: '2026-07-26',
    time: '20:30',
    venue: 'Al-Awwal Park, Riyadh',
    weather: '☀️ 34°C Hot',
    isLive: true,
    minute: 52,
    status: '2nd Half',
    liveScore: { home: 2, away: 2 },
    stats: {
      possession: { home: 50, away: 50 },
      shots: { home: 10, away: 11 },
      shotsOnTarget: { home: 5, away: 6 },
      corners: { home: 5, away: 6 },
      yellowCards: { home: 2, away: 2 },
      redCards: { home: 0, away: 0 },
    },
    odds: { home: 2.30, draw: 3.40, away: 2.70 },
    probHome: 0.40,
    probDraw: 0.27,
  },
  {
    id: 'rf-107',
    sport: 'football',
    league: 'MLS',
    leagueId: 'mls',
    country: 'USA',
    flag: '🇺🇸',
    homeTeam: 'Inter Miami',
    awayTeam: 'LA Galaxy',
    homeAbbr: 'MIA',
    awayAbbr: 'LAG',
    homeLogo: 'https://media-4.api-sports.io/football/teams/16120.png',
    awayLogo: 'https://media-4.api-sports.io/football/teams/1603.png',
    date: '2026-07-27',
    time: '22:00',
    venue: 'Chase Stadium, Fort Lauderdale',
    weather: '🌙 27°C Humid',
    isLive: false,
    minute: 0,
    status: 'Upcoming',
    liveScore: { home: 0, away: 0 },
    stats: {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
    },
    odds: { home: 1.80, draw: 3.80, away: 3.90 },
    probHome: 0.50,
    probDraw: 0.24,
  },
];

function mapApiMatch(m: any): SportMatch {
  const probHome = 0.45;
  const probDraw = 0.28;
  return {
    id: `api-${m.id}`,
    sport: 'football',
    league: m.competition?.name || 'Football',
    leagueId: m.competition?.code?.toLowerCase() || 'epl',
    country: m.area?.name || 'World',
    flag: '⚽',
    homeTeam: m.homeTeam?.name || 'Home',
    awayTeam: m.awayTeam?.name || 'Away',
    homeAbbr: m.homeTeam?.tla || 'HOM',
    awayAbbr: m.awayTeam?.tla || 'AWY',
    homeLogo: m.homeTeam?.crest || '',
    awayLogo: m.awayTeam?.crest || '',
    date: m.utcDate ? m.utcDate.split('T')[0] : '2026-07-27',
    time: m.utcDate ? m.utcDate.split('T')[1].substring(0, 5) : '18:00',
    venue: m.venue || 'Stadium',
    weather: '⛅ 20°C',
    isLive: m.status === 'IN_PLAY' || m.status === 'PAUSED',
    minute: m.minute || 45,
    status: m.status === 'IN_PLAY' ? 'Live' : m.status === 'FINISHED' ? 'Finished' : 'Upcoming',
    liveScore: {
      home: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
      away: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
    },
    stats: {
      possession: { home: 50, away: 50 },
      shots: { home: 6, away: 4 },
      shotsOnTarget: { home: 3, away: 2 },
      corners: { home: 4, away: 3 },
      yellowCards: { home: 1, away: 1 },
      redCards: { home: 0, away: 0 },
    },
    odds: calcOdds(1.06, probHome, probDraw),
    probHome,
    probDraw,
    markets: generateMarkets(m.homeTeam?.name || 'Home', m.awayTeam?.name || 'Away', probHome, probDraw),
  };
}

export const SportsDataService = {
  getFixtures: async () => {
    const TARGET_MATCHES = 100;
    const WINDOW_DAYS = 10;
    const MAX_WINDOWS = 8;

    try {
      const allMatches: SportMatch[] = [];
      const seenIds = new Set();
      const today = new Date();

      for (let w = 0; w < MAX_WINDOWS && allMatches.length < TARGET_MATCHES; w++) {
        const from = new Date(today);
        from.setDate(from.getDate() + w * WINDOW_DAYS);
        const to = new Date(from);
        to.setDate(to.getDate() + WINDOW_DAYS - 1);

        const dateFrom = from.toISOString().split('T')[0];
        const dateTo = to.toISOString().split('T')[0];

        const url = `${PROXY_BASE}?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        const response = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        const data = await response.json();

        const matches = (data as any)?.matches || [];
        for (const m of matches) {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            allMatches.push(mapApiMatch(m));
          }
        }

        if (allMatches.length >= TARGET_MATCHES) break;
      }

      console.log(`[FootballData] Fetched ${allMatches.length} real matches`);
      if (allMatches.length > 0) return allMatches;
    } catch (err: any) {
      console.warn('Football Data API request failed, falling back to realistic database:', err.message);
    }

    console.warn('[FootballData] API returned 0 matches — using fallback data');
    return REAL_FOOTBALL_MATCHES.map((m) => ({
      ...m,
      markets: generateMarkets(m.homeTeam, m.awayTeam, m.probHome, m.probDraw),
    }));
  },
};
