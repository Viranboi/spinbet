import React from "react";
import Header from "./components/header";
import BetsUsers from "./components/bet-users";
import Main from "./components/Main";
import propeller from "./assets/images/propeller.png";
import CasinoPage from "./games/CasinoPage";

import Context from "./context";

function App() {
  const { unityLoading, currentProgress, rechargeState, state } =
    React.useContext(Context);
  const [showCasino, setShowCasino] = React.useState(false);

  if (showCasino) {
    return (
      <CasinoPage
        onBack={() => setShowCasino(false)}
        balance={state?.userInfo?.balance || 0}
      />
    );
  }

  return (
    <div className="main-container">
      {!unityLoading && (
        <div className="myloading">
          <div className="loading-container">
            <div className="rotation">
              <img alt="propeller" src={propeller}></img>
            </div>
            <div className="waiting">
              <div
                style={{ width: `${currentProgress * 1.111 + 0.01}%` }}
              ></div>
            </div>
            <p>{Number(currentProgress * 1.111 + 0.01).toFixed(2)}%</p>
          </div>
        </div>
      )}
      {rechargeState && (
        <div className="recharge">
          <div className="recharge-body">
            <div className="recharge-body-font">
              Insufficient balance amount
            </div>
          </div>
        </div>
      )}
      <Header onCasinoClick={() => setShowCasino(true)} />
      <div className="game-container">
        <BetsUsers />
        <Main />
      </div>
    </div>
  );
}

export default App;
