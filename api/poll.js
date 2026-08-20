module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = process.env.PATALINK_API_KEY;
  if (!apiKey) {
    console.error("PATALINK_API_KEY is not set in environment variables");
    return res.status(500).json({ error: "Payment service not configured" });
  }

  const { transactionId } = req.query;
  if (!transactionId) {
    return res.status(400).json({ error: "Missing transactionId" });
  }

  try {
    const patalinkRes = await fetch(`https://api.patalink.me/pay/${transactionId}`, {
      headers: { Authorization: "Bearer " + apiKey },
    });

    const data = await patalinkRes.json();
    return res.status(patalinkRes.status).json(data);
  } catch (err) {
    console.error("Patalink poll error:", err);
    return res.status(500).json({ error: "Payment service unavailable" });
  }
};
