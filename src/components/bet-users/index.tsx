import React from "react";
import AllData from "./all-data";
import MyBets from "./my-bets";
import TopHistory from "./top-history";
import Context, { BettedUserType } from "../../context";

export default function BetsUsers() {
  const { previousHand, bettedUsers, getMyBets, totalBets, totalCashout, watcherCount } = React.useContext(Context);

  const [headerType, setHeaderType] = React.useState("my");
  const [allData, setAllData] = React.useState<BettedUserType[]>([]);
  const [pre, setPre] = React.useState(false);
  const [showFairModal, setShowFairModal] = React.useState(false);
  const [selectedRound, setSelectedRound] = React.useState<any>(null);

  const activePlayers = pre ? previousHand.length : bettedUsers.length;

  const header = [
    { type: "all", value: "All Bets" },
    { type: "my", value: "My Bets", onClick: "myBet" },
    { type: "top", value: "Top" },
  ];

  const getData = (e) => {
    if (e === "myBet") getMyBets();
  };

  React.useEffect(() => {
    const filterBots = (list: BettedUserType[]) =>
      (list || []).filter((u) => !u.bot);
    if (pre) {
      setAllData(filterBots(previousHand));
    } else {
      if (!!bettedUsers.length) setAllData(filterBots(bettedUsers));
    }
  }, [pre, bettedUsers, previousHand]);

  const openFairModal = (round: any) => {
    setSelectedRound(round);
    setShowFairModal(true);
  };

  return (
    <div className="info-board">
      <div className="bets-block">
        <div className="bet-block-nav">
          <div style={{ height: "24px" }}>
            <div className="navigation-switcher">
              {header.map((item, index) => (
                <button
                  key={index}
                  className={`tab ${headerType === item.type ? "click" : ""}`}
                  onClick={() => {
                    setHeaderType(item.type);
                    item.onClick && getData(item.onClick);
                  }}
                >
                  {item.value}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="data-list">
          {headerType === "all" ? (
                     <AllData setPre={setPre} pre={pre} allData={allData} activePlayers={activePlayers} totalBets={totalBets} totalCashout={totalCashout} watcherCount={watcherCount} />
          ) : headerType === "my" ? (
            <MyBets />
          ) : (
            <TopHistory openFairModal={openFairModal} />
          )}
        </div>
      </div>

      {showFairModal && selectedRound && (
        <div className="modal" style={{ zIndex: 9999 }}>
          <div className="back" onClick={() => setShowFairModal(false)}></div>
          <div className="modal-dialog" style={{ maxWidth: "420px" }}>
            <div className="modal-content" style={{ background: "#1b1c1d", border: "1px solid #303236", borderRadius: "12px" }}>
              <div className="modal-header" style={{ background: "#252628", borderRadius: "12px 12px 0 0", padding: "12px 16px", borderBottom: "1px solid #303236" }}>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>Provably Fair Verification</span>
                <button onClick={() => setShowFairModal(false)} style={{ background: "none", border: "none", color: "#9ea0a3", fontSize: "20px", cursor: "pointer" }}>×</button>
              </div>
              <div style={{ padding: "16px", fontSize: "12px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ color: "#9ea0a3", marginBottom: "4px" }}>Round ID</div>
                  <div style={{ color: "#fff", fontFamily: "monospace" }}>{selectedRound.roundId}</div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ color: "#9ea0a3", marginBottom: "4px" }}>Crash Point</div>
                  <div style={{ color: "#8be35d", fontWeight: 700, fontSize: "16px" }}>{Number(selectedRound.crashPoint).toFixed(2)}x</div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ color: "#9ea0a3", marginBottom: "4px" }}>Server Seed (hashed)</div>
                  <div style={{ color: "#fff", fontFamily: "monospace", wordBreak: "break-all", background: "#101112", padding: "8px", borderRadius: "6px" }}>{selectedRound.hash || "N/A"}</div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ color: "#9ea0a3", marginBottom: "4px" }}>Client Seed</div>
                  <div style={{ color: "#fff", fontFamily: "monospace", wordBreak: "break-all", background: "#101112", padding: "8px", borderRadius: "6px" }}>{selectedRound.clientSeed}</div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ color: "#9ea0a3", marginBottom: "4px" }}>Nonce</div>
                  <div style={{ color: "#fff", fontFamily: "monospace" }}>{selectedRound.nonce}</div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ color: "#9ea0a3", marginBottom: "4px" }}>Timestamp</div>
                  <div style={{ color: "#fff" }}>{new Date(selectedRound.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ background: "#101112", padding: "12px", borderRadius: "8px", border: "1px solid #303236" }}>
                  <div style={{ color: "#9ea0a3", fontSize: "11px", marginBottom: "6px" }}>How to verify:</div>
                  <ol style={{ margin: 0, paddingLeft: "16px", color: "#bbbfc5", fontSize: "11px", lineHeight: "1.6" }}>
                    <li>Use the server seed, client seed, and nonce</li>
                    <li>Compute HMAC-SHA256(server_seed, client_seed:nonce)</li>
                    <li>Take first 8 hex chars, convert to int, divide by 0xFFFFFFFF</li>
                    <li>Result h: crash point = 0.97 / h</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
