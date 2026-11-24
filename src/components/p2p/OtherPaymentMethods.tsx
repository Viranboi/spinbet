import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";

export interface PayMethod {
  id: string;
  name: string;
  category: string;
  icon: string;
}

const BASE: Array<[string, string, string]> = [
  ["MTN MoMo", "Mobile Money", "📱"], ["Airtel Money", "Mobile Money", "📲"],
  ["M-Pesa", "Mobile Money", "💸"], ["Orange Money", "Mobile Money", "🍊"],
  ["Wave", "Mobile Money", "🌊"], ["Moov Money", "Mobile Money", "📞"],
  ["Tigo Pesa", "Mobile Money", "🔵"], ["Vodacom M-Pesa", "Mobile Money", "🔴"],
  ["Econet EcoCash", "Mobile Money", "💚"], ["Telecel Cash", "Mobile Money", "📳"],
  ["Chipper Cash", "Mobile Money", "🐆"], ["Paga", "Mobile Money", "🟠"],
  ["Opay", "Mobile Money", "🟢"], ["PalmPay", "Mobile Money", "🌴"],
  ["Kuda Transfer", "Bank", "🏦"], ["GTBank Transfer", "Bank", "🏛️"],
  ["Access Bank", "Bank", "🏧"], ["Equity Bank", "Bank", "⚖️"],
  ["KCB Bank", "Bank", "🦁"], ["Stanbic Bank", "Bank", "💙"],
  ["Visa", "Card", "💳"], ["Mastercard", "Card", "💰"],
  ["American Express", "Card", "💎"], ["Discover", "Card", "🔍"],
  ["UnionPay", "Card", "🐼"], ["JCB", "Card", "🗾"],
  ["Verve", "Card", "🟣"], ["RuPay", "Card", "🇮🇳"],
  ["PayPal", "E-Wallet", "🅿️"], ["Skrill", "E-Wallet", "💼"],
  ["Neteller", "E-Wallet", "👛"], ["Payoneer", "E-Wallet", "🌐"],
  ["Wise", "E-Wallet", "🔄"], ["Revolut", "E-Wallet", "🚀"],
  ["Apple Pay", "E-Wallet", "🍎"], ["Google Pay", "E-Wallet", "🤖"],
  ["Samsung Pay", "E-Wallet", "📟"], ["Alipay", "E-Wallet", "🧧"],
  ["WeChat Pay", "E-Wallet", "💬"], ["GrabPay", "E-Wallet", "🛵"],
  ["PhonePe", "E-Wallet", "📲"], ["Paytm", "E-Wallet", "🔷"],
  ["Flutterwave", "Gateway", "🌍"], ["Paystack", "Gateway", "📦"],
  ["DusuPay", "Gateway", "🔗"], ["DPO Pay", "Gateway", "🧾"],
  ["Pesapal", "Gateway", "⚖️"], ["Stripe", "Gateway", "💠"],
  ["Checkout", "Gateway", "✅"], ["Adyen", "Gateway", "🌀"],
  ["Worldpay", "Gateway", "🌎"], ["Rapyd", "Gateway", "⚡"],
  ["Bank Transfer", "Bank", "🏦"], ["Wire Transfer", "Bank", "📨"],
  ["SEPA", "Bank", "🇪🇺"], ["SWIFT", "Bank", "✈️"],
  ["ACH", "Bank", "🇺🇸"], ["Instant EFT", "Bank", "⚡"],
  ["USSD", "Mobile Money", "⌨️"], ["POS Terminal", "Card", "🧮"],
  ["ATM Deposit", "Bank", "🏧"], ["Agent Cash-in", "Mobile Money", "🧑‍💼"],
  ["Gift Card", "Voucher", "🎁"], ["Top-up Voucher", "Voucher", "🎫"],
  [" paysafecard", "Voucher", "🧷"], ["Neosurf", "Voucher", "🎟️"],
  ["CashU", "Voucher", "💵"], ["Mobile Top-up", "Mobile Money", "📶"],
  ["AirtelTigo", "Mobile Money", "🔴"], ["Safaricom", "Mobile Money", "🟢"],
  ["Zamtel Kwacha", "Mobile Money", "🟡"], ["Unitel", "Mobile Money", "🟣"],
  ["Mobilink JazzCash", "Mobile Money", "🎷"], ["Easypaisa", "Mobile Money", "💚"],
  ["bKash", "Mobile Money", "🐦"], ["Nagad", "Mobile Money", "🟠"],
  ["GCash", "E-Wallet", "💙"], ["PayMaya", "E-Wallet", "💚"],
  ["TrueMoney", "E-Wallet", "❤️"], ["Dana", "E-Wallet", "💙"],
  ["OVO", "E-Wallet", "💜"], ["GoPay", "E-Wallet", "🛵"],
  ["Mercado Pago", "E-Wallet", "🛒"], ["Nubank", "Bank", "💜"],
  ["Pix", "Bank", "⚡"], ["Boleto", "Voucher", "🧾"],
  ["OXXO", "Voucher", "🏪"], ["SPEI", "Bank", "🏦"],
  ["Interac", "Bank", "🍁"], ["iDEAL", "Bank", "🇳🇱"],
  ["Sofort", "Bank", "⚡"], ["Giropay", "Bank", "💶"],
  ["Trustly", "Bank", "🤝"], ["Klarna", "Gateway", "🛍️"],
  ["Afterpay", "Gateway", "⏳"], ["Zip Pay", "Gateway", "🤐"],
  ["Venmo", "E-Wallet", "🅥"], ["Cash App", "E-Wallet", "💵"],
  ["Zelle", "Bank", "⚡"], ["Dwolla", "Gateway", "🔁"],
  ["EcoPayz", "E-Wallet", "🌿"], ["MuchBetter", "E-Wallet", "👍"],
  ["AstroPay", "E-Wallet", "⭐"], ["Jeton", "E-Wallet", "🪙"],
  ["Sticpay", "E-Wallet", "💳"], ["Perfect Money", "E-Wallet", "💯"],
  ["WebMoney", "E-Wallet", "🕸️"], ["QIWI", "E-Wallet", "🥝"],
  ["Yandex Money", "E-Wallet", "🔴"], ["Mir", "Card", "🇷🇺"],
  ["Troy", "Card", "🇹🇷"], ["Elo", "Card", "🇧🇷"],
  ["Hipercard", "Card", "💗"], ["Aura", "Card", "✨"],
  ["CartaSi", "Card", "🇮🇹"], ["Bancontact", "Card", "🇧🇪"],
  ["Swish", "Mobile Money", "🇸🇪"], ["Vipps", "Mobile Money", "🇳🇴"],
  ["MobilePay", "Mobile Money", "🇩🇰"], ["Twint", "Mobile Money", "🇨🇭"],
  ["Bizum", "Mobile Money", "🇪🇸"], ["MB Way", "Mobile Money", "🇵🇹"],
  ["Lydia", "E-Wallet", "🇫🇷"], ["Orange Bank", "Bank", "🍊"],
  ["N26", "Bank", "⬛"], ["Bunq", "Bank", "🌈"],
  ["Monzo", "Bank", "🟥"], ["Starling", "Bank", "⭐"],
  ["Chime", "Bank", "🔔"],
];

const VARIANTS = ["", " Pay", " Express", " Plus", " Pro", " Direct", " Instant", " Global"];

function buildMethods(): PayMethod[] {
  const out: PayMethod[] = [];
  const seen = new Set<string>();
  let i = 0;
  outer: for (const v of VARIANTS) {
    for (const [name, category, icon] of BASE) {
      const clean = `${name.trim()}${v}`;
      if (seen.has(clean)) continue;
      seen.add(clean);
      out.push({ id: `pm-${i}`, name: clean, category, icon });
      i++;
      if (out.length >= 1000) break outer;
    }
  }
  return out;
}

export const ALL_METHODS: PayMethod[] = buildMethods();

export default function OtherPaymentMethods() {
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ALL_METHODS;
    return ALL_METHODS.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.category.toLowerCase().includes(needle)
    );
  }, [q]);

  const visible = showAll ? filtered : filtered.slice(0, 120);

  function unavailable(m: PayMethod) {
    toast.error(`${m.name} is not available in your country`, { autoClose: 2500 });
  }

  return (
    <div className="opm-wrap">
      <div className="opm-head">
        <h3>Other payment methods <span className="opm-count">{ALL_METHODS.length}+</span></h3>
        <p className="opm-sub">Crypto is available in your country. Everything below is restricted.</p>
        <input
          className="opm-search"
          placeholder="Search 1000+ methods… (e.g. Visa, MTN, PayPal)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="opm-grid">
        {visible.map((m) => (
          <button key={m.id} className="opm-card" onClick={() => unavailable(m)} title={m.name}>
            <span className="opm-ico">{m.icon}</span>
            <span className="opm-name">{m.name}</span>
            <span className="opm-cat">{m.category}</span>
            <span className="opm-badge">Unavailable</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="opm-empty">No methods match “{q}”.</p>}
      {filtered.length > 120 && (
        <button className="opm-more" onClick={() => setShowAll((s) => !s)}>
          {showAll ? `Show less (${visible.length} / ${filtered.length})` : `Show all ${filtered.length} methods`}
        </button>
      )}
    </div>
  );
}
