import React, { useEffect, useRef, useState } from "react";
/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth } from "../auth/AuthContext";
import {
  getThread,
  markRead,
  sendMessage,
  startUserSync,
  subscribeThreads,
  totalUnreadForUser,
} from "../p2p/support";
import { isBlocked } from "../p2p/restrictions";

export const OPEN_SUPPORT_EVENT = "open-support";

export function openSupportChat() {
  window.dispatchEvent(new CustomEvent(OPEN_SUPPORT_EVENT));
}

const QUICK = ["Deposit help 💳", "Withdraw status 🏦", "My bonus 🎁", "Account issue 👤"];

export default function SupportChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [, force] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_SUPPORT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SUPPORT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!user) return;
    setUnread(totalUnreadForUser(user.uid));
    force((n) => n + 1);
    const stopLive = startUserSync(user.uid);
    const stopLocal = subscribeThreads(() => {
      if (!user) return;
      setUnread(totalUnreadForUser(user.uid));
      force((n) => n + 1);
    });
    return () => {
      stopLocal();
      stopLive();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (open && user) {
      markRead(user.uid, "user");
      setUnread(0);
    }
  }, [open, user?.uid]);

  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [open, unread]);

  function send(text?: string) {
    const msg = (text ?? draft).trim();
    if (!user || !msg || sending) return;
    setSending(true);
    try {
      sendMessage(user.uid, user.displayName || "Player", user.email, "user", msg);
    } finally {
      setDraft("");
      setSending(false);
      setTimeout(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }, 40);
    }
  }

  if (!user || isBlocked(user.uid)) return null;

  const thread = getThread(user.uid);
  const messages = thread?.messages || [];

  return (
    <>
      <button
        className={`support-fab ${open ? "hidden" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Chat with Support"
      >
        <span className="fab-ring" />
        <span className="fab-emoji">💬</span>
        <span className="fab-dot" />
        {unread > 0 && <span className="fab-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="support-panel">
          <div className="sp-head">
            <span className="sp-avatar">🎧</span>
            <div className="sp-title">
              <b>Support</b>
              <span className="sp-status">
                <i className="pulse-dot" /> Online — replies in minutes
              </span>
            </div>
            <button className="sp-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="sp-body" ref={bodyRef}>
            <div className="sp-day">🔒 Private chat with SpinBet Support</div>
            {messages.length === 0 ? (
              <div className="sp-empty">
                <span className="sp-empty-ico">👋</span>
                <p>
                  Hi <b>{user.displayName || "there"}</b>! How can we help?
                </p>
                <p className="hint">Deposits, withdrawals, bonuses or your account.</p>
                <div className="sp-quick">
                  {QUICK.map((q) => (
                    <button key={q} onClick={() => send(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <div key={m.id} className={`sp-msg ${m.from}`}>
                    {m.from === "admin" && <span className="sp-who">Support</span>}
                    <div className="bubble">{m.text}</div>
                    <span className="ts">
                      {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
                {messages.length <= 3 && (
                  <div className="sp-quick">
                    {QUICK.map((q) => (
                      <button key={q} onClick={() => send(q)}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="sp-input">
            <input
              placeholder="Message Support…"
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button onClick={() => send()} disabled={!draft.trim() || sending} aria-label="Send">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
