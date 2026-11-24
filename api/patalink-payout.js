// Vercel serverless: POST /api/patalink-payout
// Creates a PataLink withdrawal/payout using SEPARATE payout keys (does not touch deposit keys).
// Body: { phone: "0781234567", amount: 1500, network: "MTN" | "Airtel" }
const { createClient } = require("@patalink/node-api-client");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { phone, amount, network } = req.body || {};
    if (!phone || !/^0[0-9]{9}$/.test(String(phone)))
      return res.status(400).json({ error: "Invalid phone number (use 078/079…, 10 digits)" });
    const amt = Math.round(Number(amount) || 0);
    if (!amt || amt < 100 || amt > 2000000)
      return res.status(400).json({ error: "Amount must be between 100 and 2,000,000 RWF" });

    const client = createClient({
      apiKey: process.env.PATALINK_PAYOUT_API_KEY || "",
      encryptionKey: process.env.PATALINK_PAYOUT_ENCRYPTION_KEY || "",
      baseUrl: process.env.PATALINK_PAYOUT_BASE_URL || "https://api.patalink.me",
    });

    const payout = await client.createWithdrawal({
      amount: amt,
      destinationNumber: String(phone),
      network: network === "Airtel" ? "Airtel" : "MTN",
    });

    res.status(200).json({
      id: payout.id || payout.withdrawalId,
      status: payout.status || "pending",
      amount: payout.amount,
      destinationNumber: payout.destinationNumber,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
