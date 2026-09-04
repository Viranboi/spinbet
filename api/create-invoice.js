const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey)
    return res
      .status(500)
      .json({ error: "NOWPAYMENTS_API_KEY is not configured on the server" });

  const { amount, payCurrency, orderId, orderDesc } = req.body || {};
  const priceAmount = Number(amount);
  if (!Number.isFinite(priceAmount) || priceAmount < 1 || priceAmount > 100000) {
    return res
      .status(400)
      .json({ error: "amount must be a number between 1 and 100000" });
  }

  try {
    const origin =
      req.headers.origin ||
      (req.headers.referer ? new URL(req.headers.referer).origin : "") ||
      "https://aviator-crash-rose.vercel.app";

    const payload = {
      price_amount: priceAmount,
      price_currency: "usd",
      pay_currency: payCurrency || "usdttrc20",
      order_id: orderId || undefined,
      order_description: orderDesc || "Account deposit",
      success_url: `${origin}/deposit?payment=success`,
      cancel_url: `${origin}/deposit?payment=cancelled`,
      ipn_callback_url: `${origin}/api/ipn`,
    };

    const r = await fetch(`${NOWPAYMENTS_API}/invoice`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res
      .status(502)
      .json({ error: "NOWPayments request failed", detail: String(err) });
  }
};
