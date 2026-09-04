const crypto = require("crypto");

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortDeep(value[key]);
        return acc;
      }, {});
  }
  return value;
}

module.exports = async (req, res) => {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret)
    return res.status(500).json({ error: "NOWPAYMENTS_IPN_SECRET not configured" });

  const signature = req.headers["x-nowpayments-sig"];
  if (!signature) return res.status(400).json({ error: "Missing signature" });

  const ordered = sortDeep(req.body || {});
  const digest = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(ordered))
    .digest("hex");

  if (digest !== signature)
    return res.status(401).json({ error: "Invalid signature" });

  return res.status(200).json({ received: true });
};
