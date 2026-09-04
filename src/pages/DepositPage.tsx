import React from "react";
import P2PDeposit from "../components/p2p/P2PDeposit";
import CryptoDeposit from "../components/p2p/CryptoDeposit";
import "./DepositPage.scss";

type Tab = "crypto" | "p2p";

export default function DepositPage() {
  const [tab, setTab] = React.useState<Tab>("crypto");

  return (
    <div className="deposit-page">
      <div className="deposit-inner wide">
        <div className="p2p-header">
          <h1>Deposit</h1>
          <p>
            Fund your account instantly with crypto (BTC, ETH, USDT &amp; more) or buy
            coins directly from trusted P2P exchangers.
          </p>
        </div>

        <div className="dep-tabs">
          <button
            className={`dep-tab ${tab === "crypto" ? "on" : ""}`}
            onClick={() => setTab("crypto")}
          >
            <span className="dep-tab-ico">₿</span> Crypto Deposit
            <em className="dep-flag">FAST</em>
          </button>
          <button
            className={`dep-tab ${tab === "p2p" ? "on" : ""}`}
            onClick={() => setTab("p2p")}
          >
            <span className="dep-tab-ico">🤝</span> P2P Trading
          </button>
        </div>

        {tab === "crypto" ? <CryptoDeposit /> : <P2PDeposit />}
      </div>
    </div>
  );
}
