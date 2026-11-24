import React from "react";
import { CurrencyCode, CURRENCIES, useCurrency } from "../currency";

/**
 * Compact display-currency picker (USD, RWF, BIF, EUR, ...).
 * Used in the site Navbar and in the games header.
 */
export default function CurrencySelect({
  style,
  dark = true,
}: {
  style?: React.CSSProperties;
  dark?: boolean;
}) {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      onClick={(e) => e.stopPropagation()}
      title={`Display currency — ${CURRENCIES[currency].label}`}
      aria-label="Display currency"
      style={{
        appearance: "none",
        WebkitAppearance: "none",
        background: dark ? "#2a2b2e" : "#f2f4f7",
        color: dark ? "#fcd535" : "#101828",
        border: dark ? "1px solid #3a3b3f" : "1px solid #e4e7ef",
        borderRadius: 8,
        padding: "5px 8px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: "pointer",
        outline: "none",
        ...style,
      }}
    >
      {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
        <option key={c} value={c} style={{ color: "#101828", background: "#fff" }}>
          {c}
        </option>
      ))}
    </select>
  );
}
