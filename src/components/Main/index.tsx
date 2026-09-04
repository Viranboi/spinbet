import React from "react";
import "./main.scss";
import History from "./history";
import Crash from "../crash/index";
import Bet from "./bet";
import Context, { callCashOut } from "../../context";

export default function Main() {
  const [addBetPanel, setAddBetPanel] = React.useState(true);
  const { GameState, currentTarget, fbetted, sbetted, state, updateUserBetState, update } = React.useContext(Context);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (GameState === "PLAYING") {
            if (fbetted) {
              callCashOut(currentTarget, "f");
            } else if (sbetted) {
              callCashOut(currentTarget, "s");
            }
          }
          break;
        case "KeyB":
          if (GameState === "BET" && !fbetted) {
            updateUserBetState({ fbetState: true });
          }
          break;
        case "KeyN":
          if (addBetPanel && GameState === "BET" && !sbetted) {
            updateUserBetState({ sbetState: true });
          }
          break;
        case "Digit1":
          update({
            userInfo: {
              ...state.userInfo,
              f: { ...state.userInfo.f, betAmount: Math.min(state.userInfo.f.betAmount + 500, 90000) },
            },
          });
          break;
        case "Digit2":
          update({
            userInfo: {
              ...state.userInfo,
              f: { ...state.userInfo.f, betAmount: Math.min(state.userInfo.f.betAmount + 2000, 90000) },
            },
          });
          break;
        case "Digit3":
          update({
            userInfo: {
              ...state.userInfo,
              f: { ...state.userInfo.f, betAmount: Math.min(state.userInfo.f.betAmount + 5000, 90000) },
            },
          });
          break;
        case "Digit4":
          update({
            userInfo: {
              ...state.userInfo,
              f: { ...state.userInfo.f, betAmount: Math.min(state.userInfo.f.betAmount + 10000, 90000) },
            },
          });
          break;
        case "Escape":
          if (fbetted || sbetted) {
            updateUserBetState({ fbetState: false, fbetted: false, sbetState: false, sbetted: false });
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GameState, currentTarget, fbetted, sbetted, addBetPanel]);

  return (
    <div className="game-play">
      <div className="result-history">
        <History />
      </div>
      <div className="stage-board">
        <div className="play-board-wrapper">
          <div className="stage-canvas">
            <Crash />
          </div>
        </div>
      </div>
      <div className="bet-controls">
        <div className="controls">
          <Bet index={"f"} add={addBetPanel} setAdd={setAddBetPanel} />
          {addBetPanel &&
            <Bet index={"s"} add={addBetPanel} setAdd={setAddBetPanel} />
          }
        </div>
      </div>
    </div>
  );
}
