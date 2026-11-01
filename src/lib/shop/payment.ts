// Fake payment helpers. Demo only — never store full card numbers, CVV or UPI PIN.
export type CardBrand = "Visa" | "Mastercard" | "RuPay" | "Card";

export const DEMO_OTP = "123456";
export const DECLINE_CARD = "4000000000000002";
export const OTP_ATTEMPTS = 3;

export const digits = (s: string) => s.replace(/\D/g, "");

export function cardBrand(num: string): CardBrand {
  const n = digits(num);
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^(60|65|81|82|508)/.test(n)) return "RuPay";
  return "Card";
}

export const formatCardNumber = (s: string) => digits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

export function formatExpiry(s: string) {
  const d = digits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Valid MM/YY that is not in the past (card valid through end of month). */
export function expiryValid(s: string, now = new Date()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(s);
  if (!m) return false;
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

export const UPI_RE = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

export const maskCard = (brand: CardBrand, last4: string) => `${brand} •••• ${last4}`;

export function newOrderId() {
  return "DG-" + String(Math.floor(100000 + Math.random() * 900000));
}
