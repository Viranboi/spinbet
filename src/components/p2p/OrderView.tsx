import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/AuthContext";
import * as ordersApi from "../../p2p/orders";
import { useExchangers } from "../../p2p/hooks";
import { CURRENCY_META, P2POrder } from "../../p2p/types";

function Countdown({ until }: { until: number }) {
  const [left, setLeft] = useState(until - Date.now());
  useEffect(() => {
    const iv = setInterval(() => setLeft(until - Date.now()), 500);
    return () => clearInterval(iv);
  }, [until]);
  if (left <= 0) return <span className="cd expired">00:00</span>;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className={`cd ${m <= 2 ? "warn" : ""}`}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function OrderView({ order, onDone }: { order: P2POrder; onDone: () => void }) {
  const { user } = useAuth();
  const exchangers = useExchangers();
  const ex = exchangers.find((e) => e.id === order.exchangerId);
  const [ref, setRef] = useState(order.paymentRef);
  const [disputeText, setDisputeText] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [chat, setChat] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [order.messages.length]);

  if (!user) return null;
  const meta = CURRENCY_META[order.currency];
  const isBuyer = user.uid === order.buyerUid;

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Copy failed")
    );
  }

  function confirmPaid() {
    try {
      ordersApi.markPaid(order.id, user!.uid, ref);
      toast.success("Marked as paid — waiting for the exchanger to release your coins");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  }

  function cancel() {
    try {
      ordersApi.cancelOrder(order.id, user!.uid);
      toast.info("Order cancelled");
      onDone();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  }

  function dispute() {
    try {
      ordersApi.openDispute(order.id, user!.uid, disputeText);
      toast.warning("Dispute submitted. Our team will review it.");
      setShowDispute(false);
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  }

  function sendChat() {
    if (!chat.trim()) return;
    ordersApi.addMessage(order.id, user!.uid, isBuyer ? "buyer" : "exchanger", chat.trim());
    setChat("");
  }

  const step = ["pending_payment", "paid", "completed"].indexOf(
    order.status === "released" ? "completed" : order.status === "refunded" ? "completed" : order.status
  );

  return (
    <div className="order-view">
      <button className="back-link" onClick={onDone}>← Back to offers</button>

      <div className="order-head">
        <div>
          <h3>Order {order.code}</h3>
          <span className="order-sub">
            Buy <b>{order.coinAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} coins</b> from{" "}
            <b>{order.exchangerName}</b> · {new Date(order.createdAt).toLocaleString()}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="steps">
        {["Pay the exchanger", "Confirm payment", "Coins released"].map((label, i) => (
          <div key={label} className={`step ${i < step ? "done" : i === step ? "now" : ""}`}>
            <span className="dot">{i < step ? "✓" : i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="order-grid">
        <div className="pay-panel">
          {order.status === "pending_payment" && (
            <>
              <div className="timer-row">
                <span>Complete payment within</span>
                <Countdown until={order.expiresAt} />
              </div>
              <p className="pay-note">
                Send exactly <b>{order.fiatAmount.toLocaleString()} {meta.symbol}</b> to one of the accounts below,
                then click “I have paid”. Use your Winner username as the MoMo reference where possible.
              </p>
            </>
          )}
          {order.status === "paid" && (
            <div className="await-box">
              <span className="pulse-dot" />
              Payment marked. Waiting for <b>{order.exchangerName}</b> to verify and release{" "}
              <b>{order.coinAmount.toLocaleString()} coins</b>. You may message them below for a faster release.
            </div>
          )}
          {(order.status === "completed") && (
            <div className="success-box">
              ✅ Deposit complete — <b>{order.coinAmount.toLocaleString()} coins</b> were added to your wallet.
            </div>
          )}
          {["cancelled", "expired", "refunded"].includes(order.status) && (
            <div className="closed-box">
              This order was {order.status}. No funds left your wallet through this platform.
            </div>
          )}
          {order.status === "disputed" && (
            <div className="dispute-box">
              ⚖️ Dispute under review{order.disputeReason ? <> — “{order.disputeReason}”</> : null}. Our payments team
              will contact both parties and settle the escrow.
            </div>
          )}

          {ex && ["pending_payment", "paid"].includes(order.status) && (
            <div className="accounts">
              <h4>{order.exchangerName}'s payment accounts</h4>
              {ex.accounts.map((a) => (
                <div key={a.method + a.number} className="account-row">
                  <span className={`m-chip ${a.method === "MTN MoMo" ? "mtn" : "airtel"}`}>{a.method}</span>
                  <span className="acc-number">{a.number}</span>
                  <span className="acc-holder">{a.holderName}</span>
                  <button className="copy-btn" onClick={() => copy(a.number.replace(/\s/g, ""))}>Copy</button>
                </div>
              ))}
              <div className="amount-copy-row">
                <span>Exact amount: <b>{order.fiatAmount.toLocaleString()} {meta.symbol}</b></span>
                <button className="copy-btn" onClick={() => copy(String(order.fiatAmount))}>Copy</button>
              </div>
            </div>
          )}

          {isBuyer && order.status === "pending_payment" && (
            <div className="confirm-area">
              <input
                placeholder="MoMo transaction reference (optional)"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
              <button className="btn-gold" onClick={confirmPaid}>I have paid</button>
              <button className="btn-ghost danger" onClick={cancel}>Cancel order</button>
            </div>
          )}

          {isBuyer && order.status === "paid" && !showDispute && (
            <button className="btn-ghost danger" onClick={() => setShowDispute(true)}>Open a dispute</button>
          )}
          {isBuyer && showDispute && order.status === "paid" && (
            <div className="dispute-form">
              <textarea
                placeholder="Describe what went wrong (e.g. you paid but the exchanger is not releasing)"
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
              />
              <div className="row">
                <button className="btn-gold small" onClick={dispute}>Submit dispute</button>
                <button className="btn-ghost small" onClick={() => setShowDispute(false)}>Close</button>
              </div>
            </div>
          )}
        </div>

        <div className="side-panel">
          <div className="summary">
            <h4>Order summary</h4>
            <div className="s-row"><span>Order code</span><b>{order.code}</b></div>
            <div className="s-row"><span>You pay</span><b>{order.fiatAmount.toLocaleString()} {meta.symbol}</b></div>
            <div className="s-row"><span>You receive</span><b>{order.coinAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} coins</b></div>
            <div className="s-row"><span>Rate</span><b>{order.rate.toFixed(3)} {meta.symbol}/coin</b></div>
            {order.paymentRef && <div className="s-row"><span>Payment ref</span><b>{order.paymentRef}</b></div>}
          </div>

          <div className="chat">
            <h4>Trade chat</h4>
            <div className="chat-scroll" ref={chatRef}>
              {order.messages.map((m) => (
                <div key={m.id} className={`msg ${m.senderRole} ${m.senderUid === user.uid ? "mine" : ""}`}>
                  {m.senderRole !== "system" && <span className="who">{m.senderRole === "buyer" ? order.buyerName : order.exchangerName}</span>}
                  <p>{m.text}</p>
                  <time>{new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
              ))}
            </div>
            {["pending_payment", "paid", "disputed"].includes(order.status) && (
              <div className="chat-input">
                <input
                  placeholder="Write a message…"
                  value={chat}
                  onChange={(e) => setChat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                />
                <button onClick={sendChat}>Send</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending_payment: "Awaiting payment",
    paid: "Verifying",
    released: "Released",
    completed: "Completed",
    cancelled: "Cancelled",
    expired: "Expired",
    disputed: "Disputed",
    refunded: "Refunded",
  };
  return <span className={`status-badge s-${status}`}>{map[status] || status}</span>;
}
