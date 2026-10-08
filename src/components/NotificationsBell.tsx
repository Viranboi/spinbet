import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../p2p/hooks";
import "./NotificationsBell.scss";

const KIND_ICON: Record<string, string> = {
  info: "🔔",
  bonus: "🎁",
  warning: "⚠️",
  promo: "🔥",
};

export default function NotificationsBell({ dark = false }: { dark?: boolean }) {
  const { list, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const recent = list.slice(0, 6);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        aria-label="Notifications"
        className={`ntf-bell-btn${unread > 0 ? " has-unread" : ""}`}
        style={{
          position: "relative",
          background: unread > 0
            ? "linear-gradient(135deg,rgba(252,213,53,.25),rgba(240,165,0,.18))"
            : dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff",
          width: 36,
          height: 36,
          borderRadius: 10,
          cursor: "pointer",
          fontSize: 17,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        🔔
        {unread > 0 && (
          <span
            className="ntf-bell-badge"
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 19,
              height: 19,
              borderRadius: 999,
              background: "#f6465d",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 5px",
              border: "2px solid #121214",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
          />
          <div
            className="ntf-drop"
            style={{
              position: "absolute",
              right: 0,
              top: 44,
              width: 340,
              maxWidth: "86vw",
              maxHeight: 440,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "#14171d",
              border: "1px solid #23262d",
              borderRadius: 14,
              boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
              zIndex: 9999,
              color: "#eaecef",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <b style={{ fontSize: 14 }}>
                Notifications {unread > 0 && <span style={{ color: "#fcd535" }}>({unread} new)</span>}
              </b>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  style={{ background: "none", border: "none", color: "#848e9c", fontSize: 12, cursor: "pointer" }}
                >
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ overflowY: "auto", maxHeight: 330 }}>
              {recent.length === 0 ? (
                <div style={{ padding: 28, textAlign: "center", color: "#848e9c", fontSize: 13 }}>
                  No notifications yet.
                </div>
              ) : (
                recent.map((n) => (
                  <button
                    key={n.id}
                    className="ntf-drop-item"
                    onClick={() => markRead(n.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      gap: 10,
                      padding: "11px 14px",
                      background: n.read ? "transparent" : "rgba(252,213,53,0.06)",
                      border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      color: "inherit",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{KIND_ICON[n.kind] || "🔔"}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ display: "block", fontSize: 13 }}>{n.title}</b>
                      <small style={{ display: "block", fontSize: 12, color: "#a7b0bc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {n.message}
                      </small>
                      <small style={{ fontSize: 10, color: "#5a6069" }}>
                        {new Date(n.ts).toLocaleString()}
                      </small>
                    </span>
                    {!n.read && (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fcd535", marginTop: 6, flexShrink: 0 }} />
                    )}
                  </button>
                ))
              )}
            </div>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              style={{
                textAlign: "center",
                padding: "11px",
                fontSize: 13,
                fontWeight: 700,
                color: "#14181d",
                background: "linear-gradient(135deg,#ffe14d,#fcd535)",
                textDecoration: "none",
              }}
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
