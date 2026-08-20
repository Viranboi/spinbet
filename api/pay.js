module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.PATALINK_API_KEY;
  if (!apiKey) {
    console.error("PATALINK_API_KEY is not set in environment variables");
    return res.status(500).json({ error: "Payment service not configured" });
  }

  try {
    const patalinkRes = await fetch("https://api.patalink.me/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const data = await patalinkRes.json();
    return res.status(patalinkRes.status).json(data);
  } catch (err) {
    console.error("Patalink proxy error:", err);
    return res.status(500).json({ error: "Payment service unavailable" });
  }
};
