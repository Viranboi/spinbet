import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../p2p/hooks";
import "./NotificationsPage.scss";

const KIND_ICON: Record<string, string> = {
  info: "🔔",
  bonus: "🎁",
  warning: "⚠️",
  promo: "🔥",
};

export default function NotificationsPage() {
  const { list, unread, loading, markRead, markAllRead } = useNotifications();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const shown = tab === "unread" ? list.filter((n) => !n.read) : list;

  return (
    <div className="notif-page">
      <div className="notif-head">
        <div>
          <h2>🔔 Notifications</h2>
          <p>
            {loading
              ? "Loading…"
              : unread > 0
                ? `You have ${unread} unread message${unread === 1 ? "" : "s"} from Support`
                : "You're all caught up"}
          </p>
        </div>
        <div className="notif-head-actions">
          <div className="notif-tabs">
            <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
              All ({list.length})
            </button>
            <button className={tab === "unread" ? "active" : ""} onClick={() => setTab("unread")}>
              Unread ({unread})
            </button>
          </div>
          {unread > 0 && (
            <button className="notif-markall" onClick={() => markAllRead()}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="notif-empty">
          <span>📭</span>
          <b>{tab === "unread" ? "No unread notifications" : "No notifications yet"}</b>
          <p>Support messages about bonuses, deposits and account updates will appear here.</p>
          <Link to="/">Back to games</Link>
        </div>
      ) : (
        <div className="notif-list">
          {shown.map((n) => (
            <button
              key={n.id}
              className={`notif-card ${n.read ? "read" : "unread"} k-${n.kind}`}
              onClick={() => markRead(n.id)}
            >
              <span className="notif-ico">{KIND_ICON[n.kind] || "🔔"}</span>
              <span className="notif-body">
                <b>{n.title}</b>
                <p>{n.message}</p>
                <small>{new Date(n.ts).toLocaleString()}</small>
              </span>
              {!n.read && <span className="notif-dot" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
