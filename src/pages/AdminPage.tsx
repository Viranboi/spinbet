import React, { useState } from "react";
import { toast } from "react-toastify";
import * as ordersApi from "../p2p/orders";
import { useExchangers } from "../p2p/hooks";
import { Exchanger } from "../p2p/types";
import { credit, debit, getBalance, setBalance, subscribeBalance } from "../p2p/wallet";
import { fetchRemoteUsers, RemoteUser } from "../p2p/remote";
import {
  SupportThread,
  fetchAllThreadsRemote,
  getAllThreads,
  markRead,
  sendMessage,
  startAdminSync,
  subscribeThreads,
} from "../p2p/support";
import {
  AppNotification,
  NotificationKind,
  deleteNotification,
  fetchRecentNotifications,
  sendNotification,
} from "../p2p/notifications";
import { isBlocked, setBlocked, subscribeRestrictions } from "../p2p/restrictions";
import "./AdminPage.scss";

import { useAuth } from "../auth/AuthContext";

const ADMIN_EMAILS = ["blackviran@gmail.com", "freelancerviran@gmail.com"];

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
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isAdminEmail =
    !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setErr(e?.message || "Invalid email or password");
    } finally {
      setBusy(false);
    }
  }

  // 1) Not signed in -> email + password login only (no passcode)
  if (!user) {
    return (
      <div className="admin-page">
        <div className="gate-card">
          <span className="gate-icon">🛡️</span>
          <h2>Admin Console</h2>
          <p>Restricted area. Sign in with your admin email and password.</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ letterSpacing: "normal", textAlign: "left" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              required
            />
            {err && (
              <p className="mono" style={{ color: "#f6465d", fontSize: 12 }}>
                {err}
              </p>
            )}
            <button className="btn-gold" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2) Signed in but not admin email
  if (!isAdminEmail) {
    return (
      <div className="admin-page">
        <div className="gate-card">
          <span className="gate-icon">⛔</span>
          <h2>Admins only</h2>
          <p>
            Signed in as {user?.email || "(not signed in)"}. This console is
            restricted to {ADMIN_EMAILS.join(", ")}.
          </p>
          <button className="btn-gold" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <AdminConsole />;
}

function AdminConsole() {
  const { logout } = useAuth();
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="env-pill">PRODUCTION</span>
          <button
            className="console-lock-btn"
            onClick={() => logout()}
            title="Lock console and sign out"
          >
            🔒 Lock
          </button>
        </div>
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

      <NotificationSender />

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
  const [live, setLive] = useState(false);

  React.useEffect(() => {
    fetchAllThreadsRemote().then((t) => setThreads(t)).catch(() => {});
    const stopLive = startAdminSync();
    setLive(true);
    const stopLocal = subscribeThreads(() => {
      setThreads(getAllThreads());
    });
    return () => {
      stopLocal();
      stopLive();
      setLive(false);
    };
  }, []);

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
      <h3 className="section-title">
        💬 Support inbox {live && <span className="off-tag" style={{ color: "#0ecb81", borderColor: "rgba(14,203,129,.4)" }}>● live</span>}
      </h3>
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
  const [users, setUsers] = useState<PlatformUser[]>(() => loadPlatformUsers());
  const [remote, setRemote] = useState<RemoteUser[]>([]);
  const [remoteOk, setRemoteOk] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [, force] = useState(0);

  React.useEffect(() => subscribeBalance(() => force((n) => n + 1)), []);
  React.useEffect(() => subscribeRestrictions(() => force((n) => n + 1)), []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchRemoteUsers();
      if (!alive) return;
      setRemote(list);
      // null = unknown yet; true if we got data OR Firestore reachable (empty is still ok after first sync).
      // We treat fetch success (even empty) as reachable; failure returns [] too, so probe again on next mount.
      setRemoteOk(true);
      if (list.length === 0) {
        // Could be genuinely empty (no user has opened the new version yet) — keep local list visible.
      }
    })().catch(() => alive && setRemoteOk(false));
    const iv = setInterval(async () => {
      try {
        const list = await fetchRemoteUsers();
        if (alive) { setRemote(list); setRemoteOk(true); }
      } catch { /* keep last list */ }
    }, 8000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  // Merge local + remote by uid so admin sees users from other countries/phones too.
  const merged: PlatformUser[] = React.useMemo(() => {
    const map = new Map<string, PlatformUser>();
    for (const u of users) map.set(u.uid, u);
    for (const r of remote) {
      if (!map.has(r.uid)) {
        map.set(r.uid, { uid: r.uid, email: r.email || "(remote user)", displayName: r.displayName || "Player", phone: r.phone });
      }
    }
    return Array.from(map.values());
  }, [users, remote]);

  const remoteBal = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of remote) m.set(r.uid, r.balance);
    return m;
  }, [remote]);

  function refreshLocal() {
    setUsers(loadPlatformUsers());
    force((n) => n + 1);
  }

  const q = query.trim().toLowerCase();
  const filtered = merged.filter(
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

  async function doLock(u: PlatformUser) {
    const locked = isBlocked(u.uid);
    try {
      await setBlocked(u.uid, !locked, !locked ? "Locked by admin" : "");
      if (!locked) {
        // Tell the user why, with verification steps — fire-and-forget.
        sendNotification(
          u.uid,
          "Action required to unlock your balance 🔒",
          "Your balance was temporarily locked after our system flagged unusual activity that looks automated. To verify you're human, please send a photo of your ID and deposit $20 from the same address you used before. Once verified, your balance will be unlocked.",
          "warning",
          "admin"
        ).catch(() => {});
      }
      toast.success(
        !locked
          ? `🔒 ${u.displayName || u.email} locked out of games`
          : `🔓 ${u.displayName || u.email} unlocked`
      );
      force((n) => n + 1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update lock");
    }
  }

  function doCredit(u: PlatformUser, sign: 1 | -1) {    const coins = Number(amounts[u.uid]);
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
        💰 Users &amp; Balances ({filtered.length} / local {users.length} + remote {remote.length})
        <input
          className="user-search"
          placeholder="Search email, name or UID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="chip-btn" onClick={refreshLocal} title="Reload local users">↻</button>
      </h3>
      {remoteOk === false && (
        <div className="empty-note">Remote DB unreachable — showing local users only. Enable Firestore + allow read/write on `users` to sync across countries.</div>
      )}
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
                <th>Status</th>
                <th>Balance controls</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid}>
                  <td><b>{u.displayName || "Player"}</b></td>
                  <td>{u.email}</td>
                  <td className="mono">{u.uid}</td>
                  <td className="bal" style={isBlocked(u.uid) ? { opacity: 0.55 } : undefined}>
                    {isBlocked(u.uid) ? "🔒 " : ""}{(remoteBal.has(u.uid) ? remoteBal.get(u.uid)! : getBalance(u.uid)).toLocaleString()} 🪙
                  </td>
                  <td>
                    <div className="ctrl-row">
                      {isBlocked(u.uid) ? (
                        <span className="status-badge s-disputed">🔒 locked</span>
                      ) : (
                        <span className="status-badge s-completed">active</span>
                      )}
                      <button
                        className={`chip-btn ${isBlocked(u.uid) ? "go" : "danger"}`}
                        onClick={() => doLock(u)}
                        title={isBlocked(u.uid) ? "Unlock this user" : "Lock this user out of games"}
                      >
                        {isBlocked(u.uid) ? "🔓 Unlock" : "🔒 Lock"}
                      </button>
                    </div>
                  </td>
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

function NotificationSender() {
  const [users, setUsers] = useState<PlatformUser[]>(() => loadPlatformUsers());
  const [remote, setRemote] = useState<RemoteUser[]>([]);
  const [target, setTarget] = useState("all");
  const [kind, setKind] = useState<NotificationKind>("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<AppNotification[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchRemoteUsers();
        if (alive) setRemote(list);
      } catch {}
      try {
        const r = await fetchRecentNotifications(20);
        if (alive) setRecent(r);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const merged: PlatformUser[] = React.useMemo(() => {
    const map = new Map<string, PlatformUser>();
    for (const u of users) map.set(u.uid, u);
    for (const r of remote) {
      if (!map.has(r.uid)) {
        map.set(r.uid, { uid: r.uid, email: r.email || "(remote user)", displayName: r.displayName || "Player", phone: r.phone });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.displayName || a.email).localeCompare(b.displayName || b.email)
    );
  }, [users, remote]);

  async function handleSend() {
    setBusy(true);
    try {
      await sendNotification(target, title, message, kind, "admin");
      toast.success(target === "all" ? "Broadcast sent to all users 🔔" : "Notification sent to user 🔔");
      setTitle("");
      setMessage("");
      setUsers(loadPlatformUsers());
      const r = await fetchRecentNotifications(20).catch(() => [] as AppNotification[]);
      setRecent(r);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification(id);
      setRecent((r) => r.filter((n) => n.id !== id));
      toast.info("Notification deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <>
      <h3 className="section-title">🔔 Send notification</h3>
      <div className="form-card">
        <div className="form-grid">
          <label>
            Recipient
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">📢 All users (broadcast)</option>
              {merged.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName || "Player"} — {u.email} ({u.uid.slice(0, 8)}…)
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={kind} onChange={(e) => setKind(e.target.value as NotificationKind)}>
              <option value="info">🔔 Info</option>
              <option value="bonus">🎁 Bonus / credit</option>
              <option value="promo">🔥 Promotion</option>
              <option value="warning">⚠️ Warning / account</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Title
            <input
              placeholder="e.g. Bonus credited 🎁"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Message
            <input
              placeholder="e.g. We added $5,000 to your balance. Good luck!"
              value={message}
              maxLength={1000}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
        </div>
        <button className="btn-gold" onClick={handleSend} disabled={busy || !title.trim() || !message.trim()}>
          {busy ? "Sending…" : target === "all" ? "📢 Broadcast to all users" : "Send to user"}
        </button>
      </div>

      <h3 className="section-title">Recent notifications ({recent.length})</h3>
      <div className="admin-table-wrap">
        {recent.length === 0 ? (
          <div className="empty-note">No notifications sent yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>To</th><th>Title</th><th>Message</th><th>When</th><th></th></tr>
            </thead>
            <tbody>
              {recent.map((n) => (
                <tr key={n.id}>
                  <td className="mono">{n.uid === "all" ? "📢 ALL" : n.uid.slice(0, 10) + "…"}</td>
                  <td><b>{n.title}</b></td>
                  <td style={{ maxWidth: 320, whiteSpace: "normal" }}>{n.message}</td>
                  <td className="mono">{n.ts ? new Date(n.ts).toLocaleString() : "—"}</td>
                  <td><button className="chip-btn danger" onClick={() => handleDelete(n.id)}>Delete</button></td>
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
