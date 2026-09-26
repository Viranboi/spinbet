import React from "react";
import "./AviatorPage.scss";
import { Provider } from "../context";
import Header from "../components/header";
import BetsUsers from "../components/bet-users";
import Main from "../components/Main";
import Context from "../context";

function AviatorGame() {
  const { unityLoading, rechargeState } =
    React.useContext(Context);

  return (
    <div className="main-container">
      {!unityLoading && (
        <div className="spribe-splash">
          <img src="/assets/spribe-loading.png" alt="Powered by Spribe" className="spribe-loading-img" />
          <div className="spribe-dots">
            <i /><i /><i />
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
      <Header />
      <div className="game-container">
        <BetsUsers />
        <Main />
      </div>
    </div>
  );
}

export default function AviatorPage() {
  return (
    <div className="aviator-page">
      <Provider>
        <AviatorGame />
      </Provider>
    </div>
  );
}
