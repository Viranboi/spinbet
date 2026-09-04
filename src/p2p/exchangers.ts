import { Exchanger, PaymentMethod } from "./types";

function ex(
  id: string,
  displayName: string,
  avatarColor: string,
  verified: boolean,
  online: boolean,
  rateRwf: number,
  rateBif: number,
  availableCoins: number,
  methods: PaymentMethod[],
  stats: [number, number, number, number, number, number],
  limits: { rwfMin: number; rwfMax: number; bifMin: number; bifMax: number },
  numbers: { mtn?: string; airtel?: string },
  holderName: string
): Exchanger {
  const accounts = [] as Exchanger["accounts"];
  if (numbers.mtn)
    accounts.push({
      method: "MTN MoMo",
      label: "MTN Mobile Money",
      number: numbers.mtn,
      holderName,
    });
  if (numbers.airtel)
    accounts.push({
      method: "Airtel Money",
      label: "Airtel Money",
      number: numbers.airtel,
      holderName,
    });
  const [totalOrders, completedOrders, cancelledOrders, disputedOrders, completionRate, avgReleaseMinutes] = stats;
  return {
    id,
    uid: id === "official" ? ADMIN_EXCHANGER_UID : `seed_${id}`,
    displayName,
    avatarColor,
    status: "active",
    verified,
    online,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * (30 + (id.length * 7) % 300),
    rateRwf,
    rateBif,
    minFiatRwf: limits.rwfMin,
    maxFiatRwf: limits.rwfMax,
    minFiatBif: limits.bifMin,
    maxFiatBif: limits.bifMax,
    availableCoins,
    lockedCoins: 0,
    accounts,
    stats: {
      totalOrders,
      completedOrders,
      cancelledOrders,
      disputedOrders,
      completionRate,
      avgReleaseMinutes,
      totalVolumeCoins: completedOrders * 4200,
    },
  };
}

export const ADMIN_EXCHANGER_UID = "letsbet_admin";

export function seedExchangers(): Exchanger[] {
  return [
    ex(
      "official",
      "Winner Official",
      "#FCD535",
      true,
      true,
      1.0,
      2.26,
      9_999_999,
      ["MTN MoMo", "Airtel Money"],
      [98450, 100, 0, 0, 100, 1],
      { rwfMin: 500, rwfMax: 2000000, bifMin: 1000, bifMax: 4000000 },
      { mtn: "+250 788 000 111", airtel: "+250 733 000 111" },
      "LETSBET AFRICA LTD"
    ),
    ex(
      "kigalifx",
      "KigaliFX",
      "#FCD535",
      true,
      true,
      1.012,
      2.31,
      1_480_000,
      ["MTN MoMo", "Airtel Money"],
      [18420, 99.4, 41, 3, 99.4, 3],
      { rwfMin: 1000, rwfMax: 800000, bifMin: 2000, bifMax: 1500000 },
      { mtn: "+250 788 100 204", airtel: "+250 733 100 204" },
      "KIGALIFX LTD"
    ),
    ex(
      "swiftcoins",
      "SwiftCoins RW",
      "#0ECB81",
      true,
      true,
      1.018,
      2.34,
      920_000,
      ["MTN MoMo"],
      [12150, 98.8, 96, 6, 98.8, 5],
      { rwfMin: 500, rwfMax: 400000, bifMin: 1000, bifMax: 700000 },
      { mtn: "+250 788 441 907" },
      "SWIFT COINS AFRICA"
    ),
    ex(
      "bujapesa",
      "BujaPesa",
      "#4B9EFF",
      true,
      true,
      1.009,
      2.28,
      640_000,
      ["MTN MoMo", "Airtel Money"],
      [9730, 97.9, 152, 11, 97.9, 7],
      { rwfMin: 2000, rwfMax: 1200000, bifMin: 5000, bifMax: 2500000 },
      { mtn: "+257 69 512 044", airtel: "+257 75 512 044" },
      "BUJA PESA SARL"
    ),
    ex(
      "umurava",
      "Umurava Exchange",
      "#F6465D",
      false,
      true,
      1.031,
      2.39,
      310_000,
      ["Airtel Money"],
      [4210, 96.2, 118, 9, 96.2, 12],
      { rwfMin: 1000, rwfMax: 250000, bifMin: 2000, bifMax: 450000 },
      { airtel: "+250 733 884 610" },
      "UMURAVA DIGITAL"
    ),
    ex(
      "momoking",
      "MomoKing_EA",
      "#9C6BFF",
      true,
      false,
      1.024,
      2.36,
      1_150_000,
      ["MTN MoMo", "Airtel Money"],
      [26840, 99.1, 210, 14, 99.1, 4],
      { rwfMin: 2000, rwfMax: 1000000, bifMin: 5000, bifMax: 2000000 },
      { mtn: "+250 788 007 331", airtel: "+250 733 007 331" },
      "MOMOKING EA LTD"
    ),
    ex(
      "amahoro",
      "Amahoro Coins",
      "#FF9F43",
      false,
      true,
      1.045,
      2.42,
      180_000,
      ["MTN MoMo"],
      [1890, 94.7, 74, 12, 94.7, 15],
      { rwfMin: 500, rwfMax: 150000, bifMin: 1000, bifMax: 300000 },
      { mtn: "+250 782 615 948" },
      "AMAHOLO FINTECH"
    ),
  ];
}
