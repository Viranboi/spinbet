// Vercel serverless: GET /api/patalink-payout-status?id=WITHDRAWAL_ID
// Polls PataLink for withdrawal terminal status.
const { createClient } = require("@patalink/node-api-client");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const id = (req.query && req.query.id) || "";
    if (!id) return res.status(400).json({ error: "Missing id" });

    const client = createClient({
      apiKey: process.env.PATALINK_PAYOUT_API_KEY || "",
      encryptionKey: process.env.PATALINK_PAYOUT_ENCRYPTION_KEY || "",
      baseUrl: process.env.PATALINK_PAYOUT_BASE_URL || "https://api.patalink.me",
    });

    const status = await client.getWithdrawalStatus(id);

    res.status(200).json({
      id: status.id,
      status: status.status || "pending",
      amount: status.amount,
      destinationNumber: status.destinationNumber,
      reason: status.reason || null,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
