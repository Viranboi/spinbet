import React, { useState } from "react";
import { toast } from "react-toastify";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
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
  suspended?: boolean;
}

function loadPlatformUsers(): PlatformUser[] {
  try {
    const raw = JSON.parse(localStorage.getItem("letsbet_users") || "{}");
    return Object.values(raw).map((e: any) => e.user);
  } catch {
    return [];
  }
}

function AdminPayout() {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("MTN");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const uid = user?.uid;
    if (!uid) return toast.error("Not logged in");
    const amt = Math.round(Number(amount) || 0);
    if (!phone || !/^0[0-9]{9}$/.test(phone))
      return toast.error("Enter a valid MTN number (078/079… 10 digits)");
    if (!amt || amt < 100) return toast.error("Amount must be at least 100 RWF");
    const bal = getBalance(uid);
    if (bal < amt) return toast.error(`Insufficient balance: ${bal.toLocaleString()} 🪙`);

    setBusy(true);
    try {
      const r = await fetch("/api/patalink-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount: amt, network }),
      });
      const data = await r.json();
      if (!r.ok || !data.id) throw new Error(data.error || "Payout creation failed");

      // Reserve funds from admin balance immediately
      debit(uid, amt, "withdrawal_payout", `payout-${data.id}`, `Payout to ${phone} (${network})`);
      setStatus(`Payout #${data.id} created — ${data.status || "pending"}. Checking…`);

      // Poll terminal status (short, serverless-safe)
      let attempts = 0;
      while (attempts++ < 6) {
        await new Promise((res) => setTimeout(res, 2500));
        const sr = await fetch(`/api/patalink-payout-status?id=${encodeURIComponent(data.id)}`);
        const sd = await sr.json();
        const st = String(sd.status || "").toLowerCase();
        if (st === "paid" || st === "success" || st === "completed") {
          setStatus(`Payout #${data.id} completed ✅`);
          toast.success("Withdrawal completed successfully");
          return;
        }
        if (st === "rejected" || st === "failed") {
          credit(uid, amt, "withdrawal_refund", `payout-${data.id}`, `Failed payout refund to ${phone}`);
          setStatus(`Payout #${data.id} failed — ${amt.toLocaleString()} 🪙 refunded`);
          toast.error("Payout failed — amount refunded to your balance");
          return;
        }
      }
      setStatus(`Payout #${data.id} still processing — check again later`);
    } catch (err: any) {
      toast.error(err?.message || "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  }

  const bal = getBalance(user?.uid || "");
  return (
    <div className="card" style={{ marginBottom: 20, maxWidth: 520 }}>
      <h2>💸 Admin Withdrawal / Payout</h2>
      <p className="note">Withdraw from your admin balance to any MoMo number via PataLink.</p>
      <form onSubmit={handleWithdraw} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="0781234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ flex: 1, minWidth: 150, padding: "8px", borderRadius: 6, border: "1px solid #e5e7eb" }}
          />
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            style={{ padding: "8px", borderRadius: 6, border: "1px solid #e5e7eb", minWidth: 150 }}
          >
            <option value="MTN">MTN MoMo</option>
            <option value="Airtel">Airtel Money</option>
          </select>
          <input
            type="number"
            placeholder="Amount RWF"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ flex: 1, minWidth: 120, padding: "8px", borderRadius: 6, border: "1px solid #e5e7eb" }}
          />
        </div>
        <button type="submit" disabled={busy} className="btn-gold" style={{ padding: "10px" }}>
          {busy ? "Sending…" : "Withdraw"}
        </button>
      </form>
      {status && <p className="note" style={{ marginTop: 8 }}>{status}</p>}
      <p className="note">Your admin balance: {bal.toLocaleString()} 🪙</p>
    </div>
  );
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

function SecretOddsControl() {
  const [enabled, setEnabled] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "secretOdds"));
      if (snap.exists()) {
        const d: any = snap.data();
        setEnabled(!!d.enabled);
        setMessage(d.message || "");
      } else {
        setEnabled(false);
        setMessage("");
      }
    } catch {
      /* ignore */
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  async function toggle() {
    const next = !enabled;
    setBusy(true);
    try {
      await setDoc(
        doc(db, "settings", "secretOdds"),
        { enabled: next, message, updatedAt: Date.now() },
        { merge: true }
      );
      setEnabled(next);
      toast.success(next ? "Odds page unlocked for users" : "Odds page locked");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update odds visibility");
    } finally {
      setBusy(false);
    }
  }

  async function saveMessage() {
    setBusy(true);
    try {
      await setDoc(
        doc(db, "settings", "secretOdds"),
        { message, updatedAt: Date.now() },
        { merge: true }
      );
      toast.success("Message saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save message");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h3 className="section-title">🔐 Secret odds access</h3>
      <div className="form-card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ color: "#9aa3b5" }}>Status:</span>
          <span style={{ color: enabled ? "#0ecb81" : "#f6465d", fontWeight: 700 }}>
            {loaded ? (enabled ? "UNLOCKED (users can see odds)" : "LOCKED (users see wait screen)") : "Loading..."}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button className={enabled ? "btn-danger small" : "btn-green small"} onClick={toggle} disabled={busy || !loaded}>
            {busy ? "Saving..." : enabled ? "🔒 Lock odds page" : "🔓 Unlock odds page"}
          </button>
        </div>
        <label style={{ display: "block", marginBottom: 8 }}>
          Message to users on locked page
          <input
            placeholder="e.g. Odds will be available at 8 PM. Come back later."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: "100%", marginTop: 4 }}
          />
        </label>
        <button className="btn-gold small" onClick={saveMessage} disabled={busy}>
          Save message
        </button>
      </div>
    </>
  );
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

      <SecretOddsControl />

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

       <DepositRequests />

       <NotificationSender />

      <SupportInbox />

      <RecentOrders />

      <WithdrawRequests />
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

function WithdrawRequests() {
  const [list, setList] = React.useState<any[]>([]);
  const [visible, setVisible] = React.useState(10);
  const [loadErr, setLoadErr] = React.useState("");
  const refresh = React.useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "withdrawals"));
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      setList(arr);
      setLoadErr("");
    } catch (e: any) {
      setLoadErr(`Couldn't load withdrawal requests: ${e?.message || e}`);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 8000);
    return () => clearInterval(iv);
  }, [refresh]);

  async function markDone(id: string) {
    try {
      await updateDoc(doc(db, "withdrawals", id), { status: "completed", completedAt: Date.now() });
      toast.success("Marked completed");
      refresh();
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <>
      <h3 className="section-title">💸 Withdraw requests ({list.length})</h3>
      <div className="admin-table-wrap">
        {loadErr && <div className="empty-note" style={{ color: "#f6465d" }}>{loadErr}</div>}
        {list.length === 0 && !loadErr && (
          <div className="empty-note">No withdraw requests yet.</div>
        )}
        {list.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>When</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, visible).map((r) => (
                <tr key={r.id}>
                  <td><b>{r.userName || "Player"}</b></td>
                  <td>{r.email || "—"}</td>
                  <td className="mono">{r.phone || "—"}</td>
                  <td>${Number(r.amount || 0).toLocaleString()}</td>
                  <td><span className={`status-badge s-${r.status === "completed" ? "completed" : "pending"}`}>{r.status || "pending"}</span></td>
                  <td className="mono">{r.ts ? new Date(r.ts).toLocaleString() : "—"}</td>
                  <td>
                    {r.status !== "completed" && (
                      <button className="btn-green small" onClick={() => markDone(r.id)}>Mark paid</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {visible < list.length && (
          <button className="chip-btn" onClick={() => setVisible((v) => v + 10)} style={{ marginTop: 8 }}>
            View more ({list.length - visible} remaining)
          </button>
        )}
      </div>
    </>
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
  const [threads, setThreads] = useState<SupportThread[]>(() => getAllThreads());
  const [query, setQuery] = useState("");
  const [visibleUsers, setVisibleUsers] = useState(10);
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
      setRemoteOk(true);
    })().catch(() => alive && setRemoteOk(false));
    const iv = setInterval(async () => {
      try {
        const list = await fetchRemoteUsers();
        if (alive) { setRemote(list); setRemoteOk(true); }
      } catch { /* keep last list */ }
    }, 8000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  React.useEffect(() => {
    let alive = true;
    fetchAllThreadsRemote().then((t) => { if (alive) setThreads(t); }).catch(() => {});
    const stopLocal = subscribeThreads(() => setThreads(getAllThreads()));
    const iv = setInterval(() => {
      fetchAllThreadsRemote().then((t) => { if (alive) setThreads(t); }).catch(() => {});
    }, 8000);
    return () => { alive = false; stopLocal(); clearInterval(iv); };
  }, []);

  // Merge local + remote by uid so admin sees users from other countries/phones too.
  // Remote fills any gaps (phone, name) missing on the local copy.
  const merged: PlatformUser[] = React.useMemo(() => {
    const map = new Map<string, PlatformUser>();
    for (const u of users) map.set(u.uid, { ...u });
    for (const r of remote) {
      const cur = map.get(r.uid);
      if (!cur) {
        map.set(r.uid, { uid: r.uid, email: r.email || "(remote user)", displayName: r.displayName || "Player", phone: r.phone, suspended: r.suspended });
      } else {
        if (!cur.phone && r.phone) cur.phone = r.phone;
        if ((!cur.displayName || cur.displayName === "Player") && r.displayName) cur.displayName = r.displayName;
        if ((!cur.email || cur.email === "(remote user)") && r.email) cur.email = r.email;
        cur.suspended = r.suspended;
      }
    }
    for (const t of threads) {
      if (!t.userUid) continue;
      if (!map.has(t.userUid)) {
        map.set(t.userUid, { uid: t.userUid, email: t.userEmail || "(support user)", displayName: t.userName || "Player" });
      } else {
        const cur = map.get(t.userUid)!;
        if ((!cur.email || cur.email === "(remote user)" || cur.email === "(support user)") && t.userEmail) cur.email = t.userEmail;
        if ((!cur.displayName || cur.displayName === "Player") && t.userName) cur.displayName = t.userName;
      }
    }
    return Array.from(map.values());
  }, [users, remote, threads]);

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
      (u.phone || "").toLowerCase().includes(q) ||
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
        sendNotification(
          u.uid,
          "Account locked 🔒",
          "Your account has been locked by admin. You cannot play games while locked.",
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

  async function doBan(u: PlatformUser) {
    const next = !u.suspended;
    try {
      await setDoc(doc(db, "users", u.uid), { suspended: next, updatedAt: Date.now() }, { merge: true });
      if (next) {
        try { await setBlocked(u.uid, true, "Banned by admin"); } catch {}
        sendNotification(u.uid, "Account banned 🚫", "Your account has been permanently banned. Access has been revoked.", "warning", "admin").catch(() => {});
      } else {
        try { await setBlocked(u.uid, false, ""); } catch {}
      }
      toast.success(next ? `🚫 ${u.displayName || u.email} banned` : `✅ ${u.displayName || u.email} unbanned`);
      force((n) => n + 1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update ban");
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
      <AdminPayout />
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
                <th>Phone</th>
                <th>UID</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Balance controls</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visibleUsers).map((u) => (
                <tr key={u.uid}>
                  <td><b>{u.displayName || "Player"}</b></td>
                  <td>{u.email}</td>
                  <td className="mono">{u.phone || "—"}</td>
                  <td className="mono">{u.uid}</td>
                  <td className="bal" style={isBlocked(u.uid) && !u.suspended ? { opacity: 0.55 } : undefined}>
                    {u.suspended ? "🚫 " : isBlocked(u.uid) ? "🔒 " : ""}{(remoteBal.has(u.uid) ? remoteBal.get(u.uid)! : getBalance(u.uid)).toLocaleString()} 🪙
                  </td>
                  <td>
                    <div className="ctrl-row">
                      {u.suspended ? (
                        <span className="status-badge s-disputed">🚫 banned</span>
                      ) : isBlocked(u.uid) ? (
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
                      <button
                        className={`chip-btn ${u.suspended ? "go" : "danger"}`}
                        onClick={() => doBan(u)}
                        title={u.suspended ? "Unban this user" : "Ban this user from the platform"}
                      >
                        {u.suspended ? "✅ Unban" : "🚫 Ban"}
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
        {visibleUsers < filtered.length && (
          <button className="chip-btn" onClick={() => setVisibleUsers((v) => v + 10)} style={{ marginTop: 8 }}>
            View more ({filtered.length - visibleUsers} remaining)
          </button>
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

function DepositRequests() {
  const { user: adminUser } = useAuth();
  const [list, setList] = React.useState<any[]>([]);
  const [visible, setVisible] = React.useState(10);
  const [loadErr, setLoadErr] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "topups"));
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a, b) => (b.ts || b.createdAt || 0) - (a.ts || a.createdAt || 0));
      setList(arr);
      setLoadErr("");
    } catch (e: any) {
      setLoadErr(`Couldn't load deposit requests: ${e?.message || e}`);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 8000);
    return () => clearInterval(iv);
  }, [refresh]);

  async function approve(r: any) {
    const uid = r.userId || r.uid;
    const amount = Number(r.amount || 0);
    if (!uid) return toast.error("Missing user id");
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Invalid amount");
    setBusyId(r.id);
    try {
      if (r.status === "pending") {
        credit(uid, amount, "admin_topup", `topup-${r.id}`, "Deposit approved by admin");
      }
      await updateDoc(doc(db, "topups", r.id), {
        status: "approved",
        approvedAt: Date.now(),
      });
      toast.success(`Approved $${amount.toLocaleString()} for ${r.userName || r.email || uid}`);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(r: any) {
    setBusyId(r.id);
    try {
      await updateDoc(doc(db, "topups", r.id), {
        status: "cancelled",
        cancelledAt: Date.now(),
      });
      toast.info("Deposit request cancelled");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Cancel failed");
    } finally {
      setBusyId(null);
    }
  }

  async function seedExamples() {
    const samples = [
      { id: "sample-pending-1", userName: "John Doe", email: "john@example.com", phone: "0781234567", amount: 50, method: "MTN MoMo", reference: "TXN-001", status: "pending" },
      { id: "sample-completed-1", userName: "Jane Smith", email: "jane@example.com", phone: "0789876543", amount: 100, method: "Crypto (NOWPayments)", reference: "NP-ABC123", status: "completed" },
      { id: "sample-pending-2", userName: "Bob Wilson", email: "bob@example.com", phone: "0791112222", amount: 25, method: "Bank transfer", reference: "BANK-999", status: "pending" },
    ];
    const uid = adminUser?.uid || "sample-user";
    try {
      for (const s of samples) {
        await setDoc(doc(db, "topups", s.id), {
          ...s,
          userId: uid,
          uid,
          ts: Date.now(),
          createdAt: Date.now(),
        }, { merge: true });
      }
      toast.success("Sample deposits added");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to add samples");
    }
  }

  return (
    <>
      <h3 className="section-title">💳 Deposits ({list.length})</h3>
      <button className="chip-btn" onClick={seedExamples}>Add sample deposits</button>
      <div className="admin-table-wrap">
        {loadErr && <div className="empty-note" style={{ color: "#f6465d" }}>{loadErr}</div>}
        {list.length === 0 && !loadErr && (
          <div className="empty-note">No deposit requests yet.</div>
        )}
        {list.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
                <th>When</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, visible).map((r) => (
                <tr key={r.id}>
                  <td><b>{r.userName || "Player"}</b></td>
                  <td>{r.email || "—"}</td>
                  <td className="mono">{r.phone || "—"}</td>
                  <td>${Number(r.amount || 0).toLocaleString()}</td>
                  <td>{r.method || "—"}</td>
                  <td className="mono">{r.reference || r.txId || "—"}</td>
                  <td><span className={`status-badge s-${r.status === "approved" || r.status === "completed" ? "completed" : r.status === "cancelled" || r.status === "rejected" ? "cancelled" : "pending"}`}>{r.status || "pending"}</span></td>
                  <td className="mono">{r.ts || r.createdAt ? new Date(r.ts || r.createdAt).toLocaleString() : "—"}</td>
                  <td>
                    {(r.status === "pending" || !r.status) && (
                      <div className="ctrl-row">
                        <button className="btn-green small" disabled={busyId === r.id} onClick={() => approve(r)}>Approve</button>
                        <button className="chip-btn danger" disabled={busyId === r.id} onClick={() => cancel(r)}>Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {visible < list.length && (
          <button className="chip-btn" onClick={() => setVisible((v) => v + 10)} style={{ marginTop: 8 }}>
            View more ({list.length - visible} remaining)
          </button>
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
