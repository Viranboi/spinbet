import React, { useEffect, useRef, useState } from "react";
/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth } from "../auth/AuthContext";
import {
  getThread,
  markRead,
  sendMessage,
  subscribeThreads,
  totalUnreadForUser,
} from "../p2p/support";
import "./SupportChat.scss";

export default function SupportChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [, force] = useState(0);
  const [draft, setDraft] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setUnread(totalUnreadForUser(user.uid));
    return subscribeThreads(() => {
      setUnread(totalUnreadForUser(user.uid));
      force((n) => n + 1);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (open && user) markRead(user.uid, "user");
  }, [open, user?.uid]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [open]);

  function send() {
    if (!user || !draft.trim()) return;
    sendMessage(
      user.uid,
      user.displayName || "Player",
      user.email,
      "user",
      draft
    );
    setDraft("");
    setTimeout(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, 30);
  }

  if (!user) return null;

  const thread = getThread(user.uid);

  return (
    <>
      <button
        className={`support-fab ${open ? "hidden" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Support chat"
      >
        💬
        {unread > 0 && <span className="fab-badge">{unread}</span>}
      </button>

      {open && (
        <div className="support-panel">
          <div className="sp-head">
            <div>
              <b>SpinBet Support</b>
              <span className="sp-status">● Online — replies in minutes</span>
            </div>
            <button className="sp-close" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="sp-body" ref={bodyRef}>
            {!thread || thread.messages.length === 0 ? (
              <div className="sp-empty">
                <span>👋</span>
                <p>Hi {user.displayName || "there"}! How can we help you today?</p>
                <p className="hint">Ask about deposits, withdrawals, games or your account.</p>
              </div>
            ) : (
              thread.messages.map((m) => (
                <div key={m.id} className={`sp-msg ${m.from}`}>
                  <div className="bubble">{m.text}</div>
                  <span className="ts">
                    {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="sp-input">
            <input
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button onClick={send}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
