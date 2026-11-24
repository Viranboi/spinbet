import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useWallet } from "../p2p/hooks";
import { useCurrency } from "../currency";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import * as referrals from "../p2p/referrals";
import "./ProfilePage.scss";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { balance, ledger } = useWallet();
  const { fmt } = useCurrency();
  const [name, setName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const referralCode = user ? referrals.getReferralCode(user.uid) : "";
  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/?ref=${referralCode}` : referralCode;
  const referralsList = user ? referrals.listReferrals(user.uid) : [];
  const commissions = user ? referrals.getCommissions(user.uid) : [];
  const commissionTotal = user ? referrals.getCommissionTotal(user.uid) : 0;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMsg("");
    try {
      const updated = { ...user, displayName: name };
      localStorage.setItem("letsbet_current_user", JSON.stringify(updated));
      await setDoc(doc(db, "users", user.uid), { displayName: name, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      setMsg("Profile updated");
    } catch {
      setMsg("Failed to update profile");
    }
    setSaving(false);
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-gate">
          <h2>Login required</h2>
          <p>Please log in to view your profile.</p>
          <button onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{(user.displayName || user.email || "U")[0].toUpperCase()}</div>
        <div>
          <h1>{user.displayName || user.email?.split("@")[0]}</h1>
          <p className="profile-id">Account ID: {user.uid}</p>
        </div>
        <button className="profile-logout" onClick={async () => { await logout(); navigate("/"); }}>Logout</button>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h3>Account</h3>
          <div className="profile-row"><span>Username</span><strong>{user.displayName || "-"}</strong></div>
          <div className="profile-row"><span>Email</span><strong>{user.email}</strong></div>
          <div className="profile-row"><span>Phone</span><strong>{user.phone || "-"}</strong></div>
          <div className="profile-row"><span>Balance</span><strong>{fmt(balance)}</strong></div>
          <div className="profile-actions">
            <button onClick={() => navigate("/deposit")}>Deposit</button>
            <button onClick={() => navigate("/withdraw")}>Withdraw</button>
          </div>
        </div>

        <div className="profile-card">
          <h3>Edit Profile</h3>
          <form onSubmit={saveProfile} className="profile-form">
            <label>Display name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <label>Email (cannot be edited)</label>
            <input value={user.email} disabled />
            <label>Phone (cannot be edited)</label>
            <input value={user.phone || ""} disabled />
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
            {msg && <p className="profile-msg">{msg}</p>}
          </form>
        </div>

        <div className="profile-card">
          <h3>Bonuses</h3>
          <p className="profile-empty">No active bonuses right now.</p>
          <div className="profile-code-row">
            <input placeholder="Enter bonus code" />
            <button>Redeem</button>
          </div>
        </div>

        <div className="profile-card">
          <h3>VIP History</h3>
          <p className="profile-empty">No VIP activity yet.</p>
        </div>

        <div className="profile-card">
          <h3>Referral Program</h3>
          <div className="profile-row"><span>Your code</span><strong>{referralCode}</strong></div>
          <div className="profile-row"><span>Referral link</span><strong style={{ fontSize: 11, wordBreak: "break-all" }}>{referralLink}</strong></div>
          <div className="profile-row"><span>Referrals</span><strong>{referralsList.length}</strong></div>
          <div className="profile-row"><span>Commission (15%)</span><strong>{fmt(commissionTotal)}</strong></div>
          <p className="profile-empty">Earn 15% of your referrals' winnings.</p>
          {commissions.length > 0 && (
            <div className="profile-tx-list" style={{ marginTop: 10 }}>
              {commissions.slice(0, 10).map((c: any) => (
                <div key={c.id} className="profile-tx">
                  <div><strong>Commission</strong><span>{new Date(c.ts).toLocaleString()}</span></div>
                  <div className="pos">{fmt(c.amount)}</div>
                  <div className="profile-tx-bal">{c.fromUid}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-card profile-wide">
          <h3>Transaction History</h3>
          {ledger && ledger.length ? (
            <div className="profile-tx-list">
              {ledger.slice(0, 20).map((e: any) => (
                <div key={e.id} className="profile-tx">
                  <div>
                    <strong>{e.type}</strong>
                    <span>{new Date(e.ts).toLocaleString()}</span>
                  </div>
                  <div className={e.amount >= 0 ? "pos" : "neg"}>{fmt(e.amount)}</div>
                  <div className="profile-tx-bal">{fmt(e.balanceAfter)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="profile-empty">No transactions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
