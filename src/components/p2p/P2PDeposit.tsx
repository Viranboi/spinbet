import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useMyOrders, useWallet } from "../../p2p/hooks";
import BuyCoins from "./BuyCoins";
import OrderView from "./OrderView";
import MyOrders from "./MyOrders";
import ExchangerHub from "./ExchangerHub";
import { FiatCurrency } from "../../p2p/types";

type Tab = "buy" | "orders" | "hub";

export default function P2PDeposit() {
  const { user } = useAuth();
  const { balance, ledger } = useWallet();
  const { active } = useMyOrders();
  const [tab, setTab] = useState<Tab>("buy");
  const [currency, setCurrency] = useState<FiatCurrency>("BIF");
  const [inOrder, setInOrder] = useState(false);

  useEffect(() => {
    if (active) setInOrder(true);
  }, [active]);

  if (!user) {
    return (
      <div className="p2p-deposit">
        <div className="login-gate">
          <span className="big">🔒</span>
          <h2>Login Required</h2>
          <p>You need to be logged in to buy coins on the P2P market.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p2p-deposit">
      <div className="wallet-strip">
        <div className="w-cell">
          <span className="w-label">Coin balance</span>
          <span className="w-value gold">{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="w-cell">
          <span className="w-label">Account</span>
          <span className="w-value">{user.displayName || user.email?.split("@")[0]}</span>
        </div>
        <div className="w-cell">
          <span className="w-label">P2P deposits</span>
          <span className="w-value">
            {ledger.filter((l) => l.type === "p2p_deposit").reduce((s, l) => s + l.amount, 0).toLocaleString()} coins
          </span>
        </div>
        <div className="w-note">
          Coins are used for betting across Winner. Buy them here from verified exchangers with MTN MoMo or Airtel Money.
        </div>
      </div>

      {inOrder && active ? (
        <OrderView order={active} onDone={() => setInOrder(false)} />
      ) : (
        <>
          <div className="tabs">
            <button className={`tab ${tab === "buy" ? "on" : ""}`} onClick={() => setTab("buy")}>
              Buy Coins
            </button>
            <button className={`tab ${tab === "orders" ? "on" : ""}`} onClick={() => setTab("orders")}>
              My Orders
            </button>
            <button className={`tab ${tab === "hub" ? "on" : ""}`} onClick={() => setTab("hub")}>
              Exchanger Hub
            </button>
          </div>

          {tab === "buy" && (
            <BuyCoins
              currency={currency}
              onCurrencyChange={setCurrency}
              onStartTrade={() => setInOrder(true)}
            />
          )}
          {tab === "orders" && <MyOrders onOpen={() => setInOrder(true)} />}
          {tab === "hub" && <ExchangerHub />}
        </>
      )}
    </div>
  );
}
