// Vercel serverless: GET /api/patalink-status?id=TRANSACTION_ID
// Proxies PataLink GET {base}/pay/{id} using the server-side key. Avoids CORS issues.
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const idRaw =
      (req.query && (req.query.id || req.query.transactionId)) ||
      (req.url || "").split("?")[0].split("/").pop() ||
      "";
    const id = encodeURIComponent((idRaw || "").trim());
    if (!id || id === encodeURIComponent(""))
      return res
        .status(400)
        .json({ error: "Missing id. Use /api/patalink-status?id=TRANSACTION_ID" });
    const apiKey = process.env.PATALINK_API_KEY || "";
    if (!apiKey)
      return res
        .status(500)
        .json({ error: "Server missing PATALINK_API_KEY env var" });
    const base = (process.env.PATALINK_BASE_URL || "https://api.patalink.me").replace(/\/$/, "");
    const r = await fetch(`${base}/pay/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const text = await r.text();
    res.status(r.status).setHeader("Content-Type", "application/json").send(text);
  } catch (e) {
    res.status(500).json({ error: "Proxy failed: " + String((e && e.message) || e) });
  }
};
