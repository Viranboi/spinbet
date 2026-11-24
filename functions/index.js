const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const app = express();

app.get("/api/patalink-config", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Cache-Control", "no-store");
  const apiKey = process.env.PATALINK_API_KEY || "";
  const encKey = process.env.PATALINK_ENC_KEY || process.env.PATALINK_ENCRYPTION_KEY || "";
  res.json({
    apiKey,
    encKey,
    baseUrl: (process.env.PATALINK_BASE_URL || "https://api.patalink.me").replace(/\/$/, ""),
    hasKeys: !!(apiKey && encKey),
  });
});

app.get("/api/patalink-status", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const idRaw = req.query.id || req.query.transactionId || "";
    const id = encodeURIComponent(String(idRaw).trim());
    if (!String(idRaw).trim()) return res.status(400).json({ error: "Missing id" });
    const apiKey = process.env.PATALINK_API_KEY || "";
    if (!apiKey) return res.status(500).json({ error: "Server missing PATALINK_API_KEY env var" });
    const base = (process.env.PATALINK_BASE_URL || "https://api.patalink.me").replace(/\/$/, "");
    const r = await fetch(`${base}/pay/${id}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    const text = await r.text();
    res.status(r.status).set("Content-Type", "application/json").send(text);
  } catch (e) {
    res.status(500).json({ error: "Proxy failed: " + String((e && e.message) || e) });
  }
});

const crypto = require("crypto");
const SERVER_SEED = process.env.CRASH_SERVER_SEED || "8f4e2b1c9d6a7f3e5c0b8d2a4f6e9c1b3d5f7a9e0c2b4d6f8a1c3e5b7d9f0a2";
const CLIENT_SEED = process.env.CRASH_CLIENT_SEED || "titanfortunes-shared-client";
const BET_MS = 4000, PLAY_MS = 10000, END_MS = 5000, ROUND_MS = BET_MS + PLAY_MS + END_MS;
const EPOCH_MS = Date.UTC(2026, 0, 1);
function crashPoint(index) {
  const sig = crypto.createHmac("sha256", SERVER_SEED).update(`${CLIENT_SEED}:${index}`).digest("hex");
  const h = parseInt(sig.substring(0, 8), 16) / 0xffffffff;
  if (h === 0) return 1;
  return Math.max(1, Math.floor((0.97 / h) * 100) / 100);
}
app.get("/api/rounds", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Cache-Control", "no-store");
  const now = Date.now();
  const idx = Math.max(0, Math.floor((now - EPOCH_MS) / ROUND_MS));
  const msIntoPhase = now - (EPOCH_MS + idx * ROUND_MS);
  const phase = msIntoPhase < BET_MS ? "BET" : msIntoPhase < BET_MS + PLAY_MS ? "PLAYING" : "GAMEEND";
  const count = Math.min(Math.max(parseInt(req.query.count, 10) || 12, 1), 50);
  const historyCount = Math.min(Math.max(parseInt(req.query.history, 10) || 40, 0), 100);
  const next = [];
  for (let i = 1; i < count; i++) next.push(crashPoint(idx + i));
  const history = [];
  for (let i = historyCount; i >= 1; i--) history.push(crashPoint(idx - i));
  history.reverse();
  const sig = crypto.createHmac("sha256", SERVER_SEED).update(`${CLIENT_SEED}:${idx}`).digest("hex");
  res.json({ now, roundIndex: idx, roundStart: EPOCH_MS + idx * ROUND_MS, msIntoPhase, phase, betMs: BET_MS, playMs: PLAY_MS, endMs: END_MS, roundMs: ROUND_MS, current: crashPoint(idx), next, history, serverSeed: SERVER_SEED, clientSeed: CLIENT_SEED, nonce: idx, hash: sig });
});

exports.api = onRequest({ region: "us-central1" }, app);
