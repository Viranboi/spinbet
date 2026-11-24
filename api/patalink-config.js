// Vercel serverless: GET /api/patalink-config -> public PataLink config.
// Same live keys as the PataLink tester site (copied, never regenerated).
// The PataLink modal needs keys client-side by design.
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  const apiKey = process.env.PATALINK_API_KEY || "";
  const encKey =
    process.env.PATALINK_ENC_KEY || process.env.PATALINK_ENCRYPTION_KEY || "";
  res.status(200).json({
    apiKey,
    encKey,
    baseUrl: (process.env.PATALINK_BASE_URL || "https://api.patalink.me").replace(/\/$/, ""),
    hasKeys: !!(apiKey && encKey),
  });
};
