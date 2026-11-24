import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth/AuthContext";

export type CurrencyCode =
  | "USD"
  | "RWF"
  | "BIF"
  | "EUR"
  | "GBP"
  | "KES"
  | "NGN"
  | "UGX"
  | "TZS"
  | "ZAR"
  | "GHS"
  | "INR"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "AED";

export interface CurrencyMeta {
  symbol: string;
  label: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { symbol: "$", label: "US Dollar", decimals: 2 },
  RWF: { symbol: "RWF", label: "Rwandan Franc", decimals: 0 },
  BIF: { symbol: "FBu", label: "Burundian Franc", decimals: 0 },
  EUR: { symbol: "€", label: "Euro", decimals: 2 },
  GBP: { symbol: "£", label: "British Pound", decimals: 2 },
  KES: { symbol: "KSh", label: "Kenyan Shilling", decimals: 0 },
  NGN: { symbol: "₦", label: "Nigerian Naira", decimals: 0 },
  UGX: { symbol: "USh", label: "Ugandan Shilling", decimals: 0 },
  TZS: { symbol: "TSh", label: "Tanzanian Shilling", decimals: 0 },
  ZAR: { symbol: "R", label: "South African Rand", decimals: 2 },
  GHS: { symbol: "GH₵", label: "Ghanaian Cedi", decimals: 2 },
  INR: { symbol: "₹", label: "Indian Rupee", decimals: 0 },
  CAD: { symbol: "C$", label: "Canadian Dollar", decimals: 2 },
  AUD: { symbol: "A$", label: "Australian Dollar", decimals: 2 },
  CHF: { symbol: "CHF", label: "Swiss Franc", decimals: 2 },
  CNY: { symbol: "¥", label: "Chinese Yuan", decimals: 2 },
  AED: { symbol: "AED", label: "UAE Dirham", decimals: 2 },
};

// Fallback rates: 1 USD = X of each currency (RWF matches the app's
// RWF_PER_USD = 1400 used by MoMo deposits).
const STATIC_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  RWF: 1400,
  BIF: 2900,
  EUR: 0.92,
  GBP: 0.79,
  KES: 129,
  NGN: 1610,
  UGX: 3690,
  TZS: 2650,
  ZAR: 17.9,
  GHS: 15.4,
  INR: 88.5,
  CAD: 1.37,
  AUD: 1.52,
  CHF: 0.88,
  CNY: 7.24,
  AED: 3.67,
};

const LS_CURRENCY = "spinbet_currency";
const LS_RATES = "spinbet_fx_v1";
const RATE_TTL = 24 * 60 * 60 * 1000;

interface FxCache {
  ts: number;
  rates: Partial<Record<CurrencyCode, number>>;
}

function loadCurrency(): CurrencyCode {
  try {
    const raw = localStorage.getItem(LS_CURRENCY);
    if (raw && CURRENCIES[raw as CurrencyCode]) return raw as CurrencyCode;
  } catch {
    /* ignore */
  }
  return "RWF";
}

function loadFx(): FxCache {
  try {
    const raw = localStorage.getItem(LS_RATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.ts === "number" && parsed.rates) return parsed;
    }
  } catch {
    /* ignore */
  }
  return { ts: 0, rates: {} };
}

function saveFx(cache: FxCache) {
  try {
    localStorage.setItem(LS_RATES, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

function round(value: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

function formatNumber(value: number, decimals: number): string {
  if (!isFinite(value)) value = 0;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rate: number;
  meta: CurrencyMeta;
  symbol: string;
  /** Full money string, e.g. "$1,500" or "RWF 700,000" */
  fmt: (usd: number) => string;
  /** Number only (converted), for layouts with a separate symbol span */
  num: (usd: number) => string;
  /** USD -> display-currency number (for input values) */
  disp: (usd: number) => number;
  /** Display-currency number -> USD (parses user input) */
  usd: (display: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<CurrencyCode>(loadCurrency);
  const [rates, setRates] = useState<Partial<Record<CurrencyCode, number>>>(
    () => loadFx().rates
  );

  // Refresh FX rates once a day (silent fallback to static rates).
  useEffect(() => {
    const cache = loadFx();
    if (Date.now() - cache.ts < RATE_TTL) return;
    let cancelled = false;
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((j: any) => {
        if (cancelled || !j || !j.rates) return;
        const picked: Partial<Record<CurrencyCode, number>> = {};
        (Object.keys(CURRENCIES) as CurrencyCode[]).forEach((c) => {
          const v = j.rates[c];
          if (typeof v === "number" && v > 0) picked[c] = v;
        });
        if (Object.keys(picked).length) {
          saveFx({ ts: Date.now(), rates: picked });
          setRates(picked);
        }
      })
      .catch(() => {
        /* offline — keep static rates */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback(
    (c: CurrencyCode) => {
      if (!CURRENCIES[c]) return;
      setCurrencyState(c);
      try {
        localStorage.setItem(LS_CURRENCY, c);
      } catch {
        /* ignore */
      }
      if (user?.uid) {
        setDoc(
          doc(db, "users", user.uid),
          { currency: c, updatedAt: Date.now() },
          { merge: true }
        ).catch(() => {});
      }
    },
    [user?.uid]
  );

  // Account currency wins on login (works across devices).
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        const c: any = snap.data()?.currency;
        if (c && CURRENCIES[c as CurrencyCode] && c !== currency) {
          setCurrencyState(c as CurrencyCode);
          try {
            localStorage.setItem(LS_CURRENCY, c);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const meta = CURRENCIES[currency];
  const rate = useMemo(() => {
    const live = rates[currency];
    return live && live > 0 ? live : STATIC_RATES[currency];
  }, [rates, currency]);

  const fmt = useCallback(
    (usd: number) => {
      const v = (isFinite(usd as number) ? usd : 0) * rate;
      const n = formatNumber(v, meta.decimals);
      const sep = /[A-Za-z]/.test(meta.symbol) && !meta.symbol.includes("$") ? " " : "";
      return meta.symbol + sep + n;
    },
    [rate, meta]
  );

  const num = useCallback(
    (usd: number) => formatNumber((isFinite(usd as number) ? usd : 0) * rate, meta.decimals),
    [rate, meta]
  );

  const disp = useCallback(
    (usd: number) => {
      const v = isFinite(usd as number) ? usd : 0;
      return rate === 1 ? v : round(v * rate, meta.decimals);
    },
    [rate, meta]
  );

  const usd = useCallback(
    (display: number) => {
      const v = isFinite(display as number) ? display : 0;
      return rate === 1 ? v : round(v / rate, 4);
    },
    [rate]
  );

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    rate,
    meta,
    symbol: meta.symbol,
    fmt,
    num,
    disp,
    usd,
  };

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Safe fallback so components rendered outside the provider (tests, etc.)
    // keep working in USD.
    return {
      currency: "RWF",
      setCurrency: () => {},
      rate: STATIC_RATES.RWF,
      meta: CURRENCIES.RWF,
      symbol: "RWF",
      fmt: (usd: number) => `RWF ${formatNumber(usd * STATIC_RATES.RWF, 0)}`,
      num: (usd: number) => formatNumber(usd * STATIC_RATES.RWF, 0),
      disp: (usd: number) => Math.round(usd * STATIC_RATES.RWF),
      usd: (display: number) => Math.round((display / STATIC_RATES.RWF) * 10000) / 10000,
    };
  }
  return ctx;
}
