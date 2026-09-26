import React from "react";

import "../index.scss";
import Context from "../context";
import aviatorLogo from "../assets/images/aviator-logo.svg";

export default function Header({ onCasinoClick }: { onCasinoClick?: () => void }) {
  const { state, responsibleGaming, updateResponsibleGaming } = React.useContext(Context)

  const [howto, setHowto] = React.useState<'howto' | 'short' | 'more' | ''>("howto");
  const [showResponsible, setShowResponsible] = React.useState(false);
  const [rgSettings, setRgSettings] = React.useState({
    lossLimit: responsibleGaming.lossLimit || 0,
    depositLimit: responsibleGaming.depositLimit || 0,
    sessionLimit: responsibleGaming.sessionLimit || 0,
  });

  const saveResponsibleGaming = () => {
    updateResponsibleGaming({
      lossLimit: rgSettings.lossLimit,
      depositLimit: rgSettings.depositLimit,
      sessionLimit: rgSettings.sessionLimit,
    });
    setShowResponsible(false);
  };

  return (
    <>
      {/* Row 1: Lobby + Deposit - HIGH BLACK */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "40px",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        zIndex: 850,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#8be35d", cursor: "pointer", fontSize: "18px", fontWeight: 700 }} onClick={() => window.history.back()}>
            &#8249;
          </span>
          <span style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>Lobby</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            style={{
              background: "transparent",
              border: "1px solid #4a8c2a",
              borderRadius: "6px",
              padding: "6px 28px",
              color: "#4a8c2a",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Deposit
          </button>
          <div
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            style={{
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: "16px",
            }}
          >
            &#x26F6;
          </div>
        </div>
      </div>

      {/* Row 2: Aviator + Balance + Icons - SOFT DARK */}
      <div className="header flex-none items-center" style={{ top: "40px" }}>
        <div className="header-container header-soft-dark" style={{ padding: "0 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src={aviatorLogo} alt="Aviator" style={{ height: "28px" }} />
          </div>

          <div className="second-block" style={{ gap: "10px" }}>
            <div className="d-flex">
              <div className="balance">
                <span className="amount">{Number(state.userInfo.balance).toLocaleString()}</span>{' '}
                <span className="currency">BIF</span>
              </div>
            </div>
            <div className="header-hamburger" style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#2a2b2e",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              cursor: "pointer",
              padding: "7px",
            }}>
              <span style={{ display: "block", width: "16px", height: "2px", background: "#ccc", borderRadius: "1px" }}></span>
              <span style={{ display: "block", width: "16px", height: "2px", background: "#ccc", borderRadius: "1px" }}></span>
              <span style={{ display: "block", width: "16px", height: "2px", background: "#ccc", borderRadius: "1px" }}></span>
            </div>

          </div>
        </div>
      </div>

      {showResponsible && (
        <div className="modal" style={{ zIndex: 9999 }}>
          <div className="back" onClick={() => setShowResponsible(false)}></div>
          <div className="modal-dialog" style={{ maxWidth: "400px" }}>
            <div className="modal-content">
              <div className="modal-header">
                <span>Responsible Gaming</span>
                <button onClick={() => setShowResponsible(false)} className="close">×</button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ color: "#9ea0a3", marginBottom: "6px", fontSize: "12px" }}>Session Time Limit (minutes)</div>
                  <input
                    type="number"
                    value={rgSettings.sessionLimit}
                    onChange={(e) => setRgSettings({ ...rgSettings, sessionLimit: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 12px", background: "#111113", border: "1px solid #2a2b2e", borderRadius: "8px", color: "#fff", fontSize: "13px" }}
                    placeholder="0 = No limit"
                  />
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ color: "#9ea0a3", marginBottom: "6px", fontSize: "12px" }}>Loss Limit (BIF)</div>
                  <input
                    type="number"
                    value={rgSettings.lossLimit}
                    onChange={(e) => setRgSettings({ ...rgSettings, lossLimit: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 12px", background: "#111113", border: "1px solid #2a2b2e", borderRadius: "8px", color: "#fff", fontSize: "13px" }}
                    placeholder="0 = No limit"
                  />
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ color: "#9ea0a3", marginBottom: "6px", fontSize: "12px" }}>Deposit Limit (BIF)</div>
                  <input
                    type="number"
                    value={rgSettings.depositLimit}
                    onChange={(e) => setRgSettings({ ...rgSettings, depositLimit: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 12px", background: "#111113", border: "1px solid #2a2b2e", borderRadius: "8px", color: "#fff", fontSize: "13px" }}
                    placeholder="0 = No limit"
                  />
                </div>
                {responsibleGaming.selfExcluded && (
                  <div style={{ padding: "10px", background: "#2e1212", border: "1px solid #5c2020", borderRadius: "8px", color: "#ff6b6b", marginBottom: "12px", fontSize: "12px" }}>
                    Your account is self-excluded. Contact support to reactivate.
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      updateResponsibleGaming({ selfExcluded: true });
                      setShowResponsible(false);
                    }}
                    style={{ flex: 1, padding: "10px", background: "#2e1212", border: "1px solid #5c2020", borderRadius: "8px", color: "#ff6b6b", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                  >
                    Self-Exclude
                  </button>
                  <button
                    onClick={saveResponsibleGaming}
                    style={{ flex: 1, padding: "10px", background: "#8be35d", border: "none", borderRadius: "8px", color: "#000", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                  >
                    Save Settings
                  </button>
                </div>
                <div style={{ marginTop: "12px", padding: "10px", background: "#111113", borderRadius: "8px", color: "#9ea0a3", fontSize: "11px", lineHeight: "1.5" }}>
                  Play responsibly. Gambling should be entertainment, not a way to make money. Set limits before you play.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {howto === "short" && <div className="modal">
        <div className="back" onClick={() => setHowto("howto")}></div>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header modal-bg text-uppercase">
              <span>How to Play?</span>
              <button onClick={() => setHowto('')} className="close modal-close">
                <span>×</span>
              </button>
            </div>
            <div className="modal-body m-body-bg">
              <div className="youtube">
                <div className="embed-responsive">
                  <iframe title="tutorial" className="embed-responsive-item" src="https://www.youtube.com/embed/PZejs3XDCSY?playsinline=1" />
                </div>
              </div>
              <div className="step">
                <div className="bullet">01</div>
                <p>Make a bet, or even two at same time and wait for the round to start.</p>
              </div>
              <div className="step">
                <div className="bullet bullet-2">02</div>
                <p>Look after the luck plane, Your win is bet multiply by a coefficient of lucky plane. Cash out before plane files away and money is yours!</p>
              </div>
              <div className="step">
                <div className="bullet bullet-3">03</div>
                <p>Cash out before plane files away and money is yours!</p>
              </div>
            </div>
            <div className="modal-footer m-f-bg">
              <button onClick={() => setHowto("more")}>
                detailed rules
              </button>
            </div>
          </div>
        </div>
      </div>}

      {howto === "more" && <div className="modal">
        <div className="back" onClick={() => setHowto("howto")}></div>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <span className="text-uppercase">Game rules</span>
              <button onClick={() => setHowto("howto")} className="close">
                <span>×</span>
              </button>
            </div>
            <div className="modal-body p-1r">
              <p className="text-gray">
                Aviator is a new generation of iGaming entertainment. You can win many times more, in seconds! Aviator is built on a provably fair system, which is currently the only real guarantee of honesty in the gambling industry.
              </p>
              <h6 className="title-2"> How to play </h6>
              <div className="youtube w-99">
                <div className="embed-responsive">
                  <iframe title="tutorial" className="embed-responsive-item" src="https://www.youtube.com/embed/PZejs3XDCSY?playsinline=1" />
                </div>
              </div>
              <h6 className="pt-5"> Aviator is as easy to play as 1-2-3: </h6>
              <div className="steps-container">
                <div className="step-item">
                  <h3>01</h3>
                  <div className="step-bg-img"></div>
                  <div className="step-text pt-2">
                    <span>bet</span> before take-off
                  </div>
                </div>
                <div className="step-item">
                  <h3>02</h3>
                  <div className="step-bg-img-2"></div>
                  <div className="step-text">
                    <span>Watch</span> as your Lucky Plane takes off and your winnings increase.
                  </div>
                </div>
                <div className="step-item">
                  <h3>03</h3>
                  <div className="step-bg-img-3"></div>
                  <div className="step-text">
                    <span>Cash out</span> before the plane disappears and wins X times more!
                  </div>
                </div>
              </div>
              <p className="text-grey mt-20"> But remember, if you did not have time to Cash Out before the Lucky Plane flies away, your bet will be lost. Aviator is pure excitement! Risk and win. It's all in your hands! </p>
              <div className="rules-list">
                <div className="rules-list-title"> More details</div>
                <ul className="list-group">
                  <li className="list-group-item">
                    The win multiplier starts at 1x and grows more and more as the Lucky Plane takes off.
                  </li>
                  <li className="list-group-item">
                    Your winnings are calculated at the multiplier at which you made a Cash Out, multiplied by your bet.
                  </li>
                  <li className="list-group-item">
                    Before the start of each round, our provably fair random number generator generates the multiplier at which the Lucky Plane will fly away.
                  </li>
                </ul>
              </div>
              <h6> GAME FUNCTIONS </h6>
              <div className="rules-list pt-2">
                <div className="rules-list-title"> Bet & Cash Out </div>
                <ul className="list-group">
                  <li className="list-group-item"> Select an amount and press the "Bet" button to make a bet. </li>
                  <li className="list-group-item"> You can make two bets simultaneously, by adding a second bet panel. </li>
                  <li className="list-group-item"> Press the "Cash Out" button to cash out your winnings. Your win is your bet multiplied by the Cash Out multiplier. </li>
                  <li className="list-group-item"> Your bet is lost, if you didn't cash out before the plane flies away. </li>
                </ul>
              </div>
              <div className="rules-list pt-2">
                <div className="rules-list-title"> Hotkeys (Desktop) </div>
                <ul className="list-group">
                  <li className="list-group-item"> <strong>SPACE</strong> — Cash out active bet </li>
                  <li className="list-group-item"> <strong>B</strong> — Place first bet </li>
                  <li className="list-group-item"> <strong>N</strong> — Place second bet </li>
                  <li className="list-group-item"> <strong>1-4</strong> — Quick add to bet amount (500/2K/5K/10K) </li>
                  <li className="list-group-item"> <strong>ESC</strong> — Cancel bet </li>
                </ul>
              </div>
              <div className="rules-list pt-2">
                <div className="rules-list-title"> Auto Play & Auto Cash Out </div>
                <ul className="list-group">
                  <li className="list-group-item"> Auto Play is activated from the "Auto" tab on the Bet Panel, by pressing the "Auto Play" button. </li>
                  <li className="list-group-item"> Auto Cash Out is available from the "Auto" tab on the Bet panel. </li>
                </ul>
              </div>
              <div className="rules-list pt-2">
                <div className="rules-list-title"> Return to Player </div>
                <ul className="list-group">
                  <li className="list-group-item"> The overall theoretical return to player is 97%. </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>}
    </>
  );
}
