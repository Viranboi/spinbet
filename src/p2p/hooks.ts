import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Exchanger, LedgerEntry, P2POrder } from "./types";
import * as wallet from "./wallet";
import * as orders from "./orders";

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
    refresh();
    return wallet.subscribeBalance(refresh);
  }, [refresh]);

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
