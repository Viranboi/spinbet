// Proxy to football-data.org (keeps API key server-side).
// GET /api/footballMatches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&competition=PL&status=LIVE
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

  if (req.method === "OPTIONS") return res.status(200).send("");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const KEY = process.env.FOOTBALL_API_KEY;
  if (!KEY) return res.status(500).json({ error: "Football API key not configured." });

  try {
    const { dateFrom, dateTo, competition, status } = req.query || {};
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (competition) params.set("competitions", competition);
    if (status) params.set("status", status);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 14000);
    const upstream = await fetch(`https://api.football-data.org/v4/matches?${params.toString()}`, {
      headers: { "X-Auth-Token": KEY },
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.message || "Upstream error" });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error("[footballMatches]", err?.message);
    return res.status(500).json({ error: err?.message || "Fetch failed" });
  }
};
