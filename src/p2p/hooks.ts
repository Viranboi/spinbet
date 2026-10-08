import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Exchanger, LedgerEntry, P2POrder } from "./types";
import * as wallet from "./wallet";
import * as orders from "./orders";
import { ensureRemoteLoop, mirrorProfile } from "./remote";
import * as notifs from "./notifications";
import { fetchMyRestriction, isBlocked, subscribeRestrictions } from "./restrictions";

export function useWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  const refresh = useCallback(() => {
    if (!user) {
      setBalance(0);
      setLedger([]);
      return;
    }
    setBalance(wallet.ensureWallet(user.uid));
    setLedger(wallet.getLedger(user.uid));
  }, [user]);

  useEffect(() => {
    ensureRemoteLoop();
    if (user) mirrorProfile(user);
    refresh();
    return wallet.subscribeBalance(refresh);
  }, [refresh, user]);

  return { balance, ledger, refresh };
}

export function useExchangers() {
  const [list, setList] = useState<Exchanger[]>([]);

  const refresh = useCallback(() => {
    orders.ensureSeeded();
    setList(orders.getExchangers());
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 20000);
    const unsub = orders.subscribeExchangers(refresh);
    return () => {
      clearInterval(iv);
      unsub();
    };
  }, [refresh]);

  return list;
}

export function useMyOrders() {
  const { user } = useAuth();
  const [orders_, setOrders] = useState<P2POrder[]>([]);
  const [active, setActive] = useState<P2POrder | undefined>();

  const refresh = useCallback(() => {
    if (!user) {
      setOrders([]);
      setActive(undefined);
      return;
    }
    orders.expireStale();
    setOrders(orders.myOrders(user.uid));
    setActive(orders.activeOrderFor(user.uid));
  }, [user]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 1000);
    const unsub = orders.subscribeOrders(refresh);
    return () => {
      clearInterval(iv);
      unsub();
    };
  }, [refresh]);

  return { orders: orders_, active };
}

export function useIncomingOrders() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<P2POrder[]>([]);

  const refresh = useCallback(() => {
    if (!user) {
      setIncoming([]);
      return;
    }
    setIncoming(orders.incomingOrdersFor(user.uid));
  }, [user]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 1000);
    const unsub = orders.subscribeOrders(refresh);
    return () => {
      clearInterval(iv);
      unsub();
    };
  }, [refresh]);

  return incoming;
}

export function useNotifications() {
  const { user } = useAuth();
  const [list, setList] = useState<notifs.AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) {
      setList([]);
      setLoading(false);
      return;
    }
    setList(notifs.getCachedNotifications(user.uid));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    notifs.fetchMyNotifications(user.uid).then(() => refresh()).catch(() => refresh());
    return notifs.subscribeMyNotifications(user.uid, refresh);
  }, [user, refresh]);

  const unread = list.filter((n) => !n.read).length;

  return {
    list,
    unread,
    loading,
    refresh,
    markRead: (id: string) => user && notifs.markNotificationRead(user.uid, id).then(refresh),
    markAllRead: () => user && notifs.markAllRead(user.uid).then(refresh),
  };
}

/** Live lock status of the signed-in user (admin can lock accounts). */
export function useBlocked(): boolean {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState(() => (user ? isBlocked(user.uid) : false));

  useEffect(() => {
    if (!user) {
      setBlocked(false);
      return;
    }
    setBlocked(isBlocked(user.uid));
    fetchMyRestriction(user.uid).then((b) => setBlocked(b)).catch(() => {});
    return subscribeRestrictions(() => setBlocked(isBlocked(user.uid)));
  }, [user]);

  return blocked;
}
