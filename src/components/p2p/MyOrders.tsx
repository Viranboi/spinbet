import React from "react";
import { useMyOrders } from "../../p2p/hooks";
import { StatusBadge } from "./OrderView";
import { CURRENCY_META } from "../../p2p/types";

export default function MyOrders({ onOpen }: { onOpen: () => void }) {
  const { orders, active } = useMyOrders();

  if (active) {
    return (
      <div className="my-orders">
        <div className="active-nudge" onClick={onOpen}>
          ⚡ You have an order in progress — <b>{active.code}</b>. Tap to continue.
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders">
      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="big">🧾</span>
          <h4>No orders yet</h4>
          <p>Your P2P purchase history will appear here.</p>
        </div>
      ) : (
        <table className="offers-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Exchanger</th>
              <th>Amount</th>
              <th>Coins</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.code}</td>
                <td>{o.exchangerName}</td>
                <td>
                  {o.fiatAmount.toLocaleString()} {CURRENCY_META[o.currency].symbol}
                </td>
                <td>{o.coinAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
