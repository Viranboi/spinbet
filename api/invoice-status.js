const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";

const ACTIVE_STATUSES = new Set(["waiting", "confirming", "sending", "confirmed"]);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey)
    return res
      .status(500)
      .json({ error: "NOWPAYMENTS_API_KEY is not configured on the server" });

  const id = req.query.id;
  if (!id || typeof id !== "string")
    return res.status(400).json({ error: "Missing invoice id" });

  try {
    const url = `${NOWPAYMENTS_API}/payment/?invoiceId=${encodeURIComponent(
      id
    )}&limit=1&sortBy=created_at&orderBy=desc`;
    const r = await fetch(url, { headers: { "x-api-key": apiKey } });
    const data = await r.json();
    const payment = data?.data?.[0] || null;

    let state = "waiting";
    if (payment && payment.payment_status) state = payment.payment_status;

    return res.status(200).json({
      invoiceId: id,
      status: state,
      payAddress: payment?.pay_address || null,
      actuallyPaid: payment?.actually_paid ?? null,
      payCurrency: payment?.pay_currency || null,
    });
  } catch (err) {
    return res
      .status(502)
      .json({ error: "Status check failed", detail: String(err) });
  }
};
