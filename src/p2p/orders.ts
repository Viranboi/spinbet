import {
  CURRENCY_META,
  Exchanger,
  FiatCurrency,
  OrderMessage,
  P2POrder,
  coinsForFiat,
  limitsFor,
  rateFor,
} from "./types";
import { emit, load, save, subscribe, uid } from "./storage";
import { credit } from "./wallet";
import { seedExchangers, ADMIN_EXCHANGER_UID } from "./exchangers";

const KEY = "orders";
const EX_KEY = "exchangers";
const PAYMENT_WINDOW_MS = 15 * 60 * 1000;

function readAll(): P2POrder[] {
  return load<P2POrder[]>(KEY, []);
}

function writeAll(orders: P2POrder[]) {
  save(KEY, orders);
  emit(KEY);
}

export function getOrders(): P2POrder[] {
  return readAll();
}

export function getOrderByCode(code: string): P2POrder | undefined {
  return readAll().find((o) => o.code === code);
}

export function subscribeOrders(fn: () => void): () => void {
  return subscribe(KEY, fn);
}

/* ---------------- exchangers registry ---------------- */

export function getExchangers(): Exchanger[] {
  return load<Exchanger[]>(EX_KEY, []);
}

export function subscribeExchangers(fn: () => void): () => void {
  return subscribe(EX_KEY, fn);
}

function writeExchangers(list: Exchanger[]) {
  save(EX_KEY, list);
  emit(EX_KEY);
}

export function ensureSeeded() {
  if (getExchangers().length === 0) {
    writeExchangers(seedExchangers());
  }
}

export function findExchangerByUid(exUid: string): Exchanger | undefined {
  return getExchangers().find((e) => e.uid === exUid);
}

export function setOnline(exchangerId: string, online: boolean) {
  const list = getExchangers();
  const target = list.find((e) => e.id === exchangerId);
  if (!target) return;
  target.online = online;
  writeExchangers(list);
}

const AVATAR_COLORS = ["#FCD535", "#0ECB81", "#4B9EFF", "#9C6BFF", "#FF9F43", "#F6465D"];

export interface ApplyInput {
  uid: string;
  displayName: string;
  mtnNumber?: string;
  airtelNumber?: string;
  holderName: string;
  currency: FiatCurrency;
  rate: number;
  minFiat: number;
  maxFiat: number;
  floatCoins: number;
}

export function applyAsExchanger(input: ApplyInput): Exchanger {
  const list = getExchangers();
  const existing = list.find((e) => e.uid === input.uid);
  if (existing) throw new Error("You have already registered as an exchanger.");

  const accounts: Exchanger["accounts"] = [];
  if (input.mtnNumber)
    accounts.push({ method: "MTN MoMo", label: "MTN Mobile Money", number: input.mtnNumber, holderName: input.holderName });
  if (input.airtelNumber)
    accounts.push({ method: "Airtel Money", label: "Airtel Money", number: input.airtelNumber, holderName: input.holderName });
  if (accounts.length === 0) throw new Error("Add at least one Mobile Money number.");

  const isRwf = input.currency === "RWF";
  const exchanger: Exchanger = {
    id: uid("ex"),
    uid: input.uid,
    displayName: input.displayName,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    status: "active",
    verified: false,
    online: true,
    joinedAt: Date.now(),
    rateRwf: isRwf ? input.rate : Math.round(input.rate / 2.28 * 1000) / 1000,
    rateBif: isRwf ? Math.round(input.rate * 2.31 * 1000) / 1000 : input.rate,
    minFiatRwf: isRwf ? input.minFiat : Math.round(input.minFiat / 2.3),
    maxFiatRwf: isRwf ? input.maxFiat : Math.round(input.maxFiat / 2.3),
    minFiatBif: isRwf ? Math.round(input.minFiat * 2.3) : input.minFiat,
    maxFiatBif: isRwf ? Math.round(input.maxFiat * 2.3) : input.maxFiat,
    availableCoins: input.floatCoins,
    lockedCoins: 0,
    accounts,
    stats: {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      disputedOrders: 0,
      completionRate: 100,
      avgReleaseMinutes: 0,
      totalVolumeCoins: 0,
    },
  };
  list.push(exchanger);
  writeExchangers(list);
  return exchanger;
}

export function getMyExchangerProfile(userUid: string): Exchanger | undefined {
  return getExchangers().find((e) => e.uid === userUid);
}

/* ---------------- order lifecycle ---------------- */

function newCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `P2P-${n}`;
}

export function createOrder(params: {
  buyerUid: string;
  buyerName: string;
  exchangerId: string;
  currency: FiatCurrency;
  fiatAmount: number;
}): P2POrder {
  ensureSeeded();
  const list = getExchangers();
  const ex = list.find((e) => e.id === params.exchangerId);
  if (!ex) throw new Error("Exchanger not found");
  if (ex.status !== "active") throw new Error("This exchanger is currently suspended");
  if (!ex.online) throw new Error("This exchanger is offline right now");

  const limits = limitsFor(ex, params.currency);
  if (params.fiatAmount < limits.min || params.fiatAmount > limits.max) {
    throw new Error(
      `Amount must be between ${limits.min.toLocaleString()} and ${limits.max.toLocaleString()} ${params.currency}`
    );
  }

  const coinAmount = coinsForFiat(ex, params.currency, params.fiatAmount);
  if (coinAmount > ex.availableCoins) {
    throw new Error("Exchanger does not have enough float for this amount");
  }

  // escrow lock
  ex.availableCoins -= coinAmount;
  ex.lockedCoins += coinAmount;
  const exList = getExchangers().map((e) => (e.id === ex.id ? ex : e));
  writeExchangers(exList);

  const now = Date.now();
  const order: P2POrder = {
    id: uid("ord"),
    code: newCode(),
    buyerUid: params.buyerUid,
    buyerName: params.buyerName,
    exchangerId: ex.id,
    exchangerUid: ex.uid,
    exchangerName: ex.displayName,
    currency: params.currency,
    fiatAmount: params.fiatAmount,
    coinAmount,
    rate: rateFor(ex, params.currency),
    status: "pending_payment",
    paymentRef: "",
    createdAt: now,
    paidAt: null,
    releasedAt: null,
    closedAt: null,
    expiresAt: now + PAYMENT_WINDOW_MS,
    disputeReason: "",
    messages: [
      sysMsg(`Order created. Send exactly ${params.fiatAmount.toLocaleString()} ${params.currency} to ${ex.displayName}, then click "I have paid".`),
      sysMsg("Coins are locked in escrow and will be released to your wallet once the exchanger confirms your payment."),
    ],
  };
  const orders = readAll();
  orders.unshift(order);
  writeAll(orders);
  return order;
}

function sysMsg(text: string): OrderMessage {
  return { id: uid("msg"), senderUid: "system", senderRole: "system", text, ts: Date.now() };
}

export function addMessage(orderId: string, senderUid: string, role: OrderMessage["senderRole"], text: string) {
  const orders = readAll();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;
  order.messages.push({ id: uid("msg"), senderUid, senderRole: role, text, ts: Date.now() });
  writeAll(orders);
}

export function markPaid(orderId: string, buyerUid: string, paymentRef: string) {
  const orders = readAll();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found");
  if (order.buyerUid !== buyerUid) throw new Error("Not your order");
  if (order.status !== "pending_payment") throw new Error("Order is no longer awaiting payment");
  if (Date.now() > order.expiresAt) {
    expireStale();
    throw new Error("Order has expired");
  }
  order.status = "paid";
  order.paidAt = Date.now();
  order.paymentRef = paymentRef.trim();
  order.messages.push(sysMsg(`Buyer marked the order as paid.${order.paymentRef ? ` Reference: ${order.paymentRef}` : ""} Waiting for ${order.exchangerName} to release coins.`));
  writeAll(orders);

  if (order.exchangerUid === ADMIN_EXCHANGER_UID) {
    releaseCoins(orderId, ADMIN_EXCHANGER_UID);
  }
}

export function releaseCoins(orderId: string, actorUid: string): P2POrder {
  const orders = readAll();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found");
  if (order.exchangerUid !== actorUid && order.buyerUid !== actorUid) throw new Error("Not allowed");
  if (!["paid", "disputed"].includes(order.status)) throw new Error("Nothing to release for this order");

  const list = getExchangers();
  const ex = list.find((e) => e.id === order.exchangerId);
  if (!ex) throw new Error("Exchanger missing");

  ex.lockedCoins -= order.coinAmount;
  const minutes = Math.max(1, Math.round((Date.now() - order.createdAt) / 60000));
  ex.stats.totalOrders += 1;
  ex.stats.completedOrders += 1;
  ex.stats.completionRate = Math.round((ex.stats.completedOrders / ex.stats.totalOrders) * 1000) / 10;
  ex.stats.avgReleaseMinutes =
    ex.stats.avgReleaseMinutes === 0 ? minutes : Math.round(((ex.stats.avgReleaseMinutes + minutes) / 2) * 10) / 10;
  ex.stats.totalVolumeCoins += order.coinAmount;
  writeExchangers(list);

  credit(order.buyerUid, order.coinAmount, "p2p_deposit", order.code, `P2P deposit from ${ex.displayName}`);

  order.status = "completed";
  order.releasedAt = Date.now();
  order.closedAt = order.releasedAt;
  order.messages.push(sysMsg(`${ex.displayName} released ${order.coinAmount.toLocaleString()} coins. Deposit complete.`));
  writeAll(orders);
  return order;
}

export function refundBuyer(orderId: string, actorUid: string): P2POrder {
  const orders = readAll();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found");
  if (order.exchangerUid !== actorUid && order.buyerUid !== actorUid) throw new Error("Not allowed");
  if (!["paid", "pending_payment", "disputed"].includes(order.status)) throw new Error("Order already closed");

  const list = getExchangers();
  const ex = list.find((e) => e.id === order.exchangerId);
  if (ex) {
    ex.lockedCoins -= order.coinAmount;
    ex.availableCoins += order.coinAmount;
    ex.stats.totalOrders += 1;
    ex.stats.cancelledOrders += 1;
    ex.stats.completionRate = Math.round((ex.stats.completedOrders / Math.max(1, ex.stats.totalOrders)) * 1000) / 10;
    writeExchangers(list);
  }

  order.status = "refunded";
  order.closedAt = Date.now();
  order.messages.push(sysMsg("Order refunded. Escrow unlocked back to the exchanger float."));
  writeAll(orders);
  return order;
}

export function cancelOrder(orderId: string, actorUid: string): P2POrder {
  const orders = readAll();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found");
  if (order.buyerUid !== actorUid) throw new Error("Not allowed");
  if (order.status !== "pending_payment") throw new Error("Only unpaid orders can be cancelled");

  const list = getExchangers();
  const ex = list.find((e) => e.id === order.exchangerId);
  if (ex) {
    ex.lockedCoins -= order.coinAmount;
    ex.availableCoins += order.coinAmount;
    writeExchangers(list);
  }

  order.status = "cancelled";
  order.closedAt = Date.now();
  order.messages.push(sysMsg("Order cancelled by buyer. Escrow unlocked."));
  writeAll(orders);
  return order;
}

export function openDispute(orderId: string, actorUid: string, reason: string): P2POrder {
  const orders = readAll();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found");
  if (order.buyerUid !== actorUid && order.exchangerUid !== actorUid) throw new Error("Not allowed");
  if (!["paid", "pending_payment"].includes(order.status)) throw new Error("Order cannot be disputed at this stage");
  if (!reason.trim()) throw new Error("Describe the problem to open a dispute");

  const list = getExchangers();
  const ex = list.find((e) => e.id === order.exchangerId);
  if (ex) {
    ex.stats.disputedOrders += 1;
    writeExchangers(list);
  }

  order.status = "disputed";
  order.disputeReason = reason.trim();
  order.messages.push(sysMsg(`Dispute opened: "${reason.trim()}". Our payments team will review the evidence.`));
  writeAll(orders);
  return order;
}

/** lazily expire pending orders past their window; returns true if anything changed */
export function expireStale(): boolean {
  const now = Date.now();
  let changed = false;
  const orders = readAll();
  for (const order of orders) {
    if (order.status === "pending_payment" && now > order.expiresAt) {
      const list = getExchangers();
      const ex = list.find((e) => e.id === order.exchangerId);
      if (ex) {
        ex.lockedCoins -= order.coinAmount;
        ex.availableCoins += order.coinAmount;
        ex.stats.totalOrders += 1;
        ex.stats.cancelledOrders += 1;
        ex.stats.completionRate = Math.round((ex.stats.completedOrders / Math.max(1, ex.stats.totalOrders)) * 1000) / 10;
        writeExchangers(list);
      }
      order.status = "expired";
      order.closedAt = now;
      order.messages.push(sysMsg("Payment window elapsed. Order expired and escrow was unlocked."));
      changed = true;
    }
  }
  if (changed) writeAll(orders);
  return changed;
}

export function activeOrderFor(buyerUid: string): P2POrder | undefined {
  expireStale();
  return (
    readAll().find(
      (o) =>
        o.buyerUid === buyerUid &&
        ["pending_payment", "paid", "disputed"].includes(o.status)
    ) || undefined
  );
}

export function incomingOrdersFor(exchangerUid: string): P2POrder[] {
  expireStale();
  return readAll().filter((o) => o.exchangerUid === exchangerUid).slice(0, 50);
}

export function myOrders(buyerUid: string): P2POrder[] {
  expireStale();
  return readAll().filter((o) => o.buyerUid === buyerUid).slice(0, 50);
}

export function formatMoney(amount: number, currency: FiatCurrency): string {
  const meta = CURRENCY_META[currency];
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: meta.decimals })} ${meta.symbol}`;
}

/* ---------------- admin operations ---------------- */

export function addFloat(exchangerId: string, coins: number): Exchanger {
  if (!coins || coins <= 0) throw new Error("Enter a valid coin amount");
  const list = getExchangers();
  const ex = list.find((e) => e.id === exchangerId);
  if (!ex) throw new Error("Exchanger not found");
  ex.availableCoins += coins;
  writeExchangers(list);
  return ex;
}

export function setExchangerStatus(exchangerId: string, status: "active" | "suspended") {
  const list = getExchangers();
  const ex = list.find((e) => e.id === exchangerId);
  if (!ex) throw new Error("Exchanger not found");
  ex.status = status;
  if (status === "suspended") ex.online = false;
  writeExchangers(list);
}

export function setVerified(exchangerId: string, verified: boolean) {
  const list = getExchangers();
  const ex = list.find((e) => e.id === exchangerId);
  if (!ex) throw new Error("Exchanger not found");
  ex.verified = verified;
  writeExchangers(list);
}

export function getAllOrders(): P2POrder[] {
  expireStale();
  return readAll().slice(0, 100);
}
