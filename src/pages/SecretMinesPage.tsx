import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MinesPage.scss";
import "./SecretMinesPage.scss";

const GRID = 25;
const SHARED_KEY = "liveMinesRound";
const STALE_MS = 5 * 60 * 1000;

interface SharedRound {
  mines: number[];
  mineCount: number;
  revealed: number[];
  status: string;
  ts: number;
}

function readShared(): SharedRound | null {
  try {
    const raw = localStorage.getItem(SHARED_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.mines)) return null;
    return data as SharedRound;
  } catch {
    return null;
  }
}

export default function SecretMinesPage() {
  const navigate = useNavigate();
  const [round, setRound] = useState<SharedRound | null>(() => readShared());

  useEffect(() => {
    const refresh = () => setRound(readShared());
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SHARED_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    const timer = setInterval(refresh, 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  }, []);

  const stale = !round || !round.ts || Date.now() - round.ts > STALE_MS;
  const mines = !stale && round ? round.mines : [];
  const mineSet = new Set(mines);
  const revealedSet = new Set(!stale && round ? round.revealed || [] : []);
  const mineCount = !stale && round ? round.mineCount || 0 : 0;
  const status = stale || !round ? "waiting" : round.status;
  const found = Array.from(revealedSet).filter((i) => !mineSet.has(i)).length;
  const safeTotal = GRID - mineCount;
  const safeLeft = Math.max(0, safeTotal - found);

  const statusText =
    status === "playing"
      ? "🟢 LIVE — click only the green ✅ tiles on the /mines page"
      : status === "done"
        ? "🏁 Round over — press BET on /mines for the next round"
        : status === "idle"
          ? "🎮 No active round — press BET on the /mines page"
          : "⏳ Waiting — open /mines in another tab and press BET…";

  return (
    <div className="mines-page secret-page">
      <div className="secret-demo-banner">⚠️ THIS IS DEMO — NOT FOR REAL MONEY ⚠️</div>

      <div className="mines-sitebar">
        <button className="mines-lobby-btn" onClick={() => navigate("/")}>
          <span className="mines-lobby-arrow">‹</span> <span>Home</span>
        </button>
        <div className="mines-sitebar-right">
          <span className="mines-sitebar-bal">👁 MIRROR</span>
        </div>
      </div>

      <div className="mines-game-frame">
        <div className={`secret-status ${status}`}>{statusText}</div>

        <div className="mines-selector-row">
          <div className="mines-mine-select">
            <label>Bombs in this round: <strong>{mineCount}</strong></label>
          </div>
          <div className="mines-next-mult">Safe left: {safeLeft}</div>
        </div>

        <div className="mines-grid">
          {Array.from({ length: GRID }).map((_, idx) => {
            const isMine = mineSet.has(idx);
            const isRevealed = revealedSet.has(idx);
            const cls = isMine
              ? isRevealed ? "mine-exploded" : "peek-mine"
              : isRevealed ? "star-playing" : "secret-safe";
            return (
              <div key={idx} className={`mines-cell ${cls}`}>
                {cls === "secret-safe" && (
                  <div className="mines-tile safe"><span className="secret-safe-emoji">✅</span></div>
                )}
                {cls === "peek-mine" && (
                  <div className="mines-tile peek"><span className="secret-bomb-emoji">💣</span></div>
                )}
                {cls === "star-playing" && (
                  <div className="mines-reveal star-playing-bg">
                    <svg viewBox="0 0 60 60" width="44" height="44">
                      <polygon
                        points="30,6 36,22 54,22 40,33 45,50 30,39 15,50 20,33 6,22 24,22"
                        fill="#ffffff"
                      />
                    </svg>
                  </div>
                )}
                {cls === "mine-exploded" && (
                  <div className="mines-reveal exploded-bg">
                    <span className="secret-bomb-emoji">🔥</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="secret-steps">
          <strong>How to use:</strong>
          <p>1️⃣ Open <strong>/mines</strong> in another tab — same browser, same device</p>
          <p>2️⃣ Choose mines and press <strong>BET</strong> there</p>
          <p>3️⃣ Bombs appear <strong>here live</strong> (💣 = avoid, ✅ = safe to click)</p>
          <p>4️⃣ Click only ✅ tiles on /mines, then <strong>CASH OUT</strong></p>
        </div>
      </div>
    </div>
  );
}
