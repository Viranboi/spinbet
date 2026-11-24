export type FiatCurrency = "RWF" | "BIF";

export type PaymentMethod = "MTN MoMo" | "Airtel Money";

export type ExchangerStatus = "active" | "suspended";

export interface ExchangerPaymentAccount {
  method: PaymentMethod;
  label: string;
  number: string;
  holderName: string;
}

export interface Exchanger {
  id: string;
  uid: string;
  displayName: string;
  avatarColor: string;
  status: ExchangerStatus;
  verified: boolean;
  online: boolean;
  joinedAt: number;
  /** fiat per 1 coin, e.g. 1.02 RWF per coin */
  rateRwf: number;
  /** fiat per 1 coin, e.g. 2.$35 per coin */
  rateBif: number;
  minFiatRwf: number;
  maxFiatRwf: number;
  minFiatBif: number;
  maxFiatBif: number;
  availableCoins: number;
  lockedCoins: number;
  accounts: ExchangerPaymentAccount[];
  stats: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    disputedOrders: number;
    completionRate: number;
    avgReleaseMinutes: number;
    totalVolumeCoins: number;
  };
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "released"
  | "completed"
  | "cancelled"
  | "expired"
  | "disputed"
  | "refunded";

export interface OrderMessage {
  id: string;
  senderUid: string;
  senderRole: "buyer" | "exchanger" | "system";
  text: string;
  ts: number;
}

export interface P2POrder {
  id: string;
  code: string;
  buyerUid: string;
  buyerName: string;
  exchangerId: string;
  exchangerUid: string;
  exchangerName: string;
  currency: FiatCurrency;
  fiatAmount: number;
  coinAmount: number;
  rate: number;
  status: OrderStatus;
  paymentRef: string;
  createdAt: number;
  paidAt: number | null;
  releasedAt: number | null;
  closedAt: number | null;
  expiresAt: number;
  disputeReason: string;
  messages: OrderMessage[];
}

export interface LedgerEntry {
  id: string;
  uid: string;
  type:
    | "welcome_bonus"
    | "crypto_deposit"
    | "momo_deposit"
    | "p2p_deposit"
    | "p2p_refund"
    | "casino_bet"
    | "sports_bet"
    | "casino_win"
    | "referral_commission"
    | "adjustment"
    | "admin_topup"
    | "admin_debit"
    | "exchanger_transfer"
    | "withdraw";
  amount: number;
  balanceAfter: number;
  ref: string;
  note: string;
  ts: number;
}

export const CURRENCY_META: Record<
  FiatCurrency,
  { symbol: string; label: string; decimals: number; quickAmounts: number[] }
> = {
  RWF: {
    symbol: "$",
    label: "US Dollar (USD)",
    decimals: 0,
    quickAmounts: [1000, 2000, 5000, 10000, 20000, 50000],
  },
  BIF: {
    symbol: "$",
    label: "US Dollar (USD)",
    decimals: 0,
    quickAmounts: [2000, 5000, 10000, 25000, 50000, 100000],
  },
};

export function rateFor(ex: Exchanger, currency: FiatCurrency): number {
  return currency === "RWF" ? ex.rateRwf : ex.rateBif;
}

export function limitsFor(
  ex: Exchanger,
  currency: FiatCurrency
): { min: number; max: number } {
  return currency === "RWF"
    ? { min: ex.minFiatRwf, max: ex.maxFiatRwf }
    : { min: ex.minFiatBif, max: ex.maxFiatBif };
}

export function coinsForFiat(
  ex: Exchanger,
  currency: FiatCurrency,
  fiat: number
): number {
  return Math.floor((fiat / rateFor(ex, currency)) * 100) / 100;
}

export function fiatForCoins(
  ex: Exchanger,
  currency: FiatCurrency,
  coins: number
): number {
  return Math.ceil(coins * rateFor(ex, currency));
}
