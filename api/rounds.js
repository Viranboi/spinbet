const crypto = require("crypto");

const SERVER_SEED =
  process.env.CRASH_SERVER_SEED ||
  "8f4e2b1c9d6a7f3e5c0b8d2a4f6e9c1b3d5f7a9e0c2b4d6f8a1c3e5b7d9f0a2";
const CLIENT_SEED =
  process.env.CRASH_CLIENT_SEED || "titanfortunes-shared-client";

const BET_MS = 3000;
const PLAY_MS = 10000;
const END_MS = 2000;
const ROUND_MS = BET_MS + PLAY_MS + END_MS;
const EPOCH_MS = Date.UTC(2026, 0, 1);

function crashPoint(index) {
  const sig = crypto
    .createHmac("sha256", SERVER_SEED)
    .update(`${CLIENT_SEED}:${index}`)
    .digest("hex");
  const h = parseInt(sig.substring(0, 8), 16) / 0xffffffff;
  if (h === 0) return 1;
  return Math.max(1, Math.floor((0.97 / h) * 100) / 100);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  const now = Date.now();
  const idx = Math.max(0, Math.floor((now - EPOCH_MS) / ROUND_MS));
  const msIntoPhase = now - (EPOCH_MS + idx * ROUND_MS);
  const phase =
    msIntoPhase < BET_MS
      ? "BET"
      : msIntoPhase < BET_MS + PLAY_MS
      ? "PLAYING"
      : "GAMEEND";

  const count = Math.min(Math.max(parseInt(req.query.count, 10) || 12, 1), 50);
  const historyCount = Math.min(
    Math.max(parseInt(req.query.history, 10) || 40, 0),
    100
  );

  const next = [];
  for (let i = 1; i < count; i++) next.push(crashPoint(idx + i));

  const history = [];
  for (let i = historyCount; i >= 1; i--) history.push(crashPoint(idx - i));
  history.reverse();

  const sig = crypto
    .createHmac("sha256", SERVER_SEED)
    .update(`${CLIENT_SEED}:${idx}`)
    .digest("hex");

  res.status(200).json({
    now,
    roundIndex: idx,
    roundStart: EPOCH_MS + idx * ROUND_MS,
    msIntoPhase,
    phase,
    betMs: BET_MS,
    playMs: PLAY_MS,
    endMs: END_MS,
    roundMs: ROUND_MS,
    current: crashPoint(idx),
    next,
    history,
    serverSeed: SERVER_SEED,
    clientSeed: CLIENT_SEED,
    nonce: idx,
    hash: sig,
  });
};
