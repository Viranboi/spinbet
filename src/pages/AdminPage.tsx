import React, { useState } from "react";
import { toast } from "react-toastify";
import * as ordersApi from "../p2p/orders";
import { useExchangers } from "../p2p/hooks";
import { Exchanger } from "../p2p/types";
import { credit, debit, getBalance, setBalance, subscribeBalance } from "../p2p/wallet";
import {
  SupportThread,
  getAllThreads,
  markRead,
  sendMessage,
  subscribeThreads,
} from "../p2p/support";
import "./AdminPage.scss";

const ADMIN_PASSCODE = "letsbet-admin-2026";

interface PlatformUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
}

function loadPlatformUsers(): PlatformUser[] {
  try {
    const raw = JSON.parse(localStorage.getItem("letsbet_users") || "{}");
    return Object.values(raw).map((e: any) => e.user);
  } catch {
    return [];
  }
}

export default function AdminPage() {
  const [pass, setPass] = useState("");
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("lb_admin_ok") === "1"
  );

  if (!unlocked) {
    return (
      <div className="admin-page">
        <div className="gate-card">
          <span className="gate-icon">🛡️</span>
          <h2>Admin Console</h2>
          <p>Restricted area. Enter the admin passcode.</p>
          <input
            type="password"
            placeholder="Admin passcode"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          />
          <button className="btn-gold" onClick={tryUnlock}>Unlock console</button>
        </div>
      </div>
    );
  }

  return <AdminConsole />;

  function tryUnlock() {
    if (pass === ADMIN_PASSCODE) {
      sessionStorage.setItem("lb_admin_ok", "1");
      setUnlocked(true);
    } else toast.error("Wrong passcode");
  }
}

function AdminConsole() {
  const exchangers = useExchangers();
  const [topUp, setTopUp] = useState<Record<string, string>>({});

  function doTopUp(ex: Exchanger) {
    const coins = Number(topUp[ex.id]);
    try {
      ordersApi.addFloat(ex.id, coins);
      toast.success(`Credited $${coins.toLocaleString()} to ${ex.displayName}`);
      setTopUp((t) => ({ ...t, [ex.id]: "" }));
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  }

  return (
    <div className="admin-page wide">
      <div className="console-topbar">
        <div className="ct-left">
          <span className="ct-shield">🛡️</span>
          <div>
            <h2>Admin Console</h2>
            <p>Floats, balances, support &amp; platform orders</p>
          </div>
        </div>
        <span className="env-pill">PRODUCTION</span>
      </div>

      <ConsoleStats />

      <h3 className="section-title">Exchangers ({exchangers.length})</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Desk</th>
              <th>Owner UID</th>
              <th>Float</th>
              <th>Escrow</th>
              <th>Orders</th>
              <th>Add float ($)</th>
              <th>Controls</th>
            </tr>
          </thead>
          <tbody>
            {exchangers.map((ex) => (
              <tr key={ex.id} className={ex.status === "suspended" ? "suspended" : ""}>
                <td>
                  <span className="avatar" style={{ background: ex.avatarColor }}>{ex.displayName[0]}</span>
                  <b>{ex.displayName}</b>
                  {ex.verified && <span className="v-badge">✔</span>}
                  {!ex.online && <span className="off-tag">offline</span>}
                </td>
                <td className="mono">{ex.uid}</td>
                <td>{Math.floor(ex.availableCoins).toLocaleString()}</td>
                <td>{ex.lockedCoins.toLocaleString()}</td>
                <td>{ex.stats.completedOrders} / {ex.stats.totalOrders}</td>
                <td>
                  <div className="topup-row">
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={topUp[ex.id] || ""}
                      onChange={(e) => setTopUp((t) => ({ ...t, [ex.id]: e.target.value }))}
                    />
                    <button className="btn-green small" onClick={() => doTopUp(ex)}>Credit</button>
                  </div>
                </td>
                <td>
                  <div className="ctrl-row">
                    <button
                      className="chip-btn"
                      onClick={() => { ordersApi.setVerified(ex.id, !ex.verified); toast.info(ex.verified ? "Verification removed" : "Marked verified"); }}
                    >
                      {ex.verified ? "Unverify" : "Verify"}
                    </button>
                    <button
                      className={`chip-btn ${ex.status === "active" ? "danger" : "go"}`}
                      onClick={() => { ordersApi.setExchangerStatus(ex.id, ex.status === "active" ? "suspended" : "active"); toast.info(ex.status === "active" ? "Desk suspended" : "Desk reactivated"); }}
                    >
                      {ex.status === "active" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFunding />

      <SupportInbox />

      <RecentOrders />
    </div>
  );
}

function ConsoleStats() {
  const exchangers = useExchangers();
  const [userCount] = useState<PlatformUser[]>(loadPlatformUsers);
  const orders = ordersApi.getAllOrders();
  const floatTotal = exchangers.reduce((s, e) => s + e.availableCoins, 0);
  const escrowTotal = exchangers.reduce((s, e) => s + e.lockedCoins, 0);
  const pendingOrders = orders.filter((o) =>
    ["pending_payment", "paid", "disputed"].includes(o.status)
  ).length;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="sc-label">Registered users</span>
        <b className="sc-value">{userCount.length}</b>
      </div>
      <div className="stat-card">
        <span className="sc-label">Exchanger desks</span>
        <b className="sc-value">{exchangers.length}</b>
      </div>
      <div className="stat-card">
        <span className="sc-label">Float ($)</span>
        <b className="sc-value gold">{Math.floor(floatTotal).toLocaleString()}</b>
      </div>
      <div className="stat-card">
        <span className="sc-label">Escrow ($)</span>
        <b className="sc-value blue">{escrowTotal.toLocaleString()}</b>
      </div>
      <div className="stat-card">
        <span className="sc-label">Active P2P orders</span>
        <b className="sc-value red">{pendingOrders}</b>
      </div>
    </div>
  );
}

function SupportInbox() {
  const [threads, setThreads] = useState<SupportThread[]>(() => getAllThreads());
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  React.useEffect(
    () =>
      subscribeThreads(() => {
        setThreads(getAllThreads());
      }),
    []
  );

  const active = threads.find((t) => t.userUid === openUid) || null;

  function reply() {
    if (!active || !draft.trim()) return;
    sendMessage(active.userUid, active.userName, active.userEmail, "admin", draft);
    markRead(active.userUid, "admin");
    setDraft("");
    setThreads(getAllThreads());
  }

  function openThread(t: SupportThread) {
    setOpenUid(t.userUid);
    markRead(t.userUid, "admin");
    setThreads(getAllThreads());
  }

  return (
    <>
      <h3 className="section-title">💬 Support inbox</h3>
      <div className="support-layout">
        <div className="thread-list">
          {threads.length === 0 ? (
            <div className="empty-note">No messages from users yet.</div>
          ) : (
            threads.map((t) => (
              <button
                key={t.userUid}
                className={`thread-item ${t.userUid === openUid ? "active" : ""}`}
                onClick={() => openThread(t)}
              >
                <span className="avatar" style={{ background: "#2c6bed" }}>
                  {(t.userName || t.userEmail)[0].toUpperCase()}
                </span>
                <span className="t-info">
                  <b>{t.userName || "Player"}</b>
                  <small>{t.messages[t.messages.length - 1]?.text.slice(0, 42)}</small>
                </span>
                {t.unreadForAdmin > 0 && <span className="unread-pill">{t.unreadForAdmin}</span>}
              </button>
            ))
          )}
        </div>

        <div className="thread-view">
          {!active ? (
            <div className="empty-note">Select a conversation to reply.</div>
          ) : (
            <>
              <div className="tv-head">
                <b>{active.userName || "Player"}</b>
                <span>{active.userEmail}</span>
              </div>
              <div className="tv-body">
                {active.messages.map((m) => (
                  <div key={m.id} className={`sp-msg ${m.from}`}>
                    <div className="bubble">{m.text}</div>
                    <span className="ts">
                      {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="tv-input">
                <input
                  placeholder="Reply to user…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reply()}
                />
                <button className="btn-gold small" onClick={reply}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function UserFunding() {
  const [users] = useState<PlatformUser[]>(() => loadPlatformUsers());
  const [query, setQuery] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [, force] = useState(0);

  React.useEffect(() => subscribeBalance(() => force((n) => n + 1)), []);

  const q = query.trim().toLowerCase();
  const filtered = users.filter(
    (u) =>
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.displayName || "").toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q)
  );

  function doSet(u: PlatformUser) {
    const coins = Number(amounts[u.uid]);
    if (!Number.isFinite(coins) || coins < 0)
      return toast.error("Enter a valid non-negative balance");
    try {
      const next = setBalance(u.uid, coins, "admin", `Admin set balance`);
      toast.success(
        `${u.displayName || u.email} balance set to $${next.toLocaleString()}`
      );
      setAmounts((a) => ({ ...a, [u.uid]: "" }));
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  }

  function doCredit(u: PlatformUser, sign: 1 | -1) {
    const coins = Number(amounts[u.uid]);
    if (!coins || coins <= 0) return toast.error("Enter an amount");
    try {
      if (sign === 1) {
        credit(u.uid, coins, "admin_topup", "admin", `Admin top-up`);
        toast.success(`Credited $${coins.toLocaleString()} to ${u.displayName || u.email}`);
      } else {
        debit(u.uid, coins, "admin_debit", "admin", `Admin deduction`);
        toast.success(`Debited $${coins.toLocaleString()} from ${u.displayName || u.email}`);
      }
      setAmounts((a) => ({ ...a, [u.uid]: "" }));
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  }

  return (
    <>
      <h3 className="section-title">
        Users ({users.length})
        <input
          className="user-search"
          placeholder="Search email, name or UID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </h3>
      <div className="admin-table-wrap">
        {filtered.length === 0 ? (
          <div className="empty-note">No registered users found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>UID</th>
                <th>Balance</th>
                <th>Balance controls</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid}>
                  <td><b>{u.displayName || "Player"}</b></td>
                  <td>{u.email}</td>
                  <td className="mono">{u.uid}</td>
                  <td className="bal">{getBalance(u.uid).toLocaleString()} 🪙</td>
                  <td>
                    <div className="topup-row">
                      <input
                        type="number"
                        placeholder="e.g. 10000"
                        value={amounts[u.uid] || ""}
                        onChange={(e) => setAmounts((a) => ({ ...a, [u.uid]: e.target.value }))}
                      />
                      <button className="btn-green small" onClick={() => doCredit(u, 1)} title="Add funds to balance">+ Give</button>
                      <button className="chip-btn danger" onClick={() => doCredit(u, -1)} title="Remove funds from balance">− Take</button>
                      <button className="btn-gold small" onClick={() => doSet(u)} title="Overwrite balance with exact amount">Set =</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function RecentOrders() {
  const [orders] = useState(() => ordersApi.getAllOrders());

  return (
    <>
      <h3 className="section-title">Recent P2P orders</h3>
      <div className="admin-table-wrap">
        {orders.length === 0 ? (
          <div className="empty-note">No orders yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Code</th><th>Buyer</th><th>Exchanger</th><th>Fiat</th><th>Coins</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.slice(0, 20).map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.code}</td>
                  <td>{o.buyerName}</td>
                  <td>{o.exchangerName}</td>
                  <td>{o.fiatAmount.toLocaleString()} {o.currency}</td>
                  <td>{Math.round(o.coinAmount).toLocaleString()}</td>
                  <td><span className={`status-badge s-${o.status}`}>{o.status.replace("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
