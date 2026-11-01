// Pricing rules for cart & checkout. Pure functions so they can be unit-tested.
/** Free shipping on every order (threshold ₹0, fee ₹0). */
export const FREE_SHIPPING_MIN = 0;
export const STANDARD_FEE = 0;
export const EXPRESS_FEE = 199; // legacy — express delivery is no longer offered
export const GIFT_WRAP_FEE = 49;
/** Cash on Delivery is not offered — prepaid orders only. */
export const COD_ENABLED = false;
export const COD_FEE = 49;
export const COD_MAX_TOTAL = 10000;
export const EMI_MIN_TOTAL = 3000;

export type Coupon = { code: string; label: string; pct?: number | undefined; max?: number | undefined; freeShip?: boolean | undefined; active?: boolean | undefined };
/** Shipping rules editable in admin settings. */
export type ShippingRules = { freeMin: number; standardFee: number };
export const DEFAULT_RULES: ShippingRules = { freeMin: FREE_SHIPPING_MIN, standardFee: STANDARD_FEE };
export const COUPONS: Record<string, Coupon> = {
  GURU10: { code: "GURU10", label: "10% off", pct: 10 },
  WELCOME20: { code: "WELCOME20", label: "20% off (max ₹500)", pct: 20, max: 500 },
};
export const GIFT_CARDS: Record<string, number> = { GURU100: 100 };

/** Finds an active coupon by code in the given list (defaults to the seed coupons). */
export const findCoupon = (code: string, list: Coupon[] = Object.values(COUPONS)): Coupon | undefined => {
  const c = code.trim().toUpperCase();
  return list.find((x) => x.code === c && x.active !== false);
};

export type DeliveryMethod = "standard" | "express";

export function couponDiscount(subtotal: number, coupon?: Coupon | undefined) {
  if (!coupon?.pct) return 0;
  const d = Math.round((subtotal * coupon.pct) / 100);
  return coupon.max != null ? Math.min(d, coupon.max) : d;
}

export function deliveryFee(subtotal: number, method: DeliveryMethod = "standard", coupon?: Coupon | undefined, rules: ShippingRules = DEFAULT_RULES) {
  if (subtotal <= 0) return 0;
  if (coupon?.freeShip) return 0;
  if (method === "express") return EXPRESS_FEE;
  return subtotal >= rules.freeMin ? 0 : rules.standardFee;
}

export type TotalsInput = {
  subtotal: number;
  coupon?: Coupon | undefined;
  delivery?: DeliveryMethod;
  giftWrap?: boolean;
  cod?: boolean;
  giftCardCredit?: number;
  rules?: ShippingRules | undefined;
};

export function computeTotals(i: TotalsInput) {
  const discount = couponDiscount(i.subtotal, i.coupon);
  const delivery = deliveryFee(i.subtotal, i.delivery, i.coupon, i.rules);
  const giftWrap = i.giftWrap ? GIFT_WRAP_FEE : 0;
  const cod = i.cod && COD_ENABLED ? COD_FEE : 0;
  const before = i.subtotal - discount + delivery + giftWrap + cod;
  const giftCard = Math.min(i.giftCardCredit ?? 0, Math.max(0, before));
  return { subtotal: i.subtotal, discount, delivery, giftWrap, cod, giftCard, total: Math.max(0, before - giftCard) };
}

export const codAllowed = (total: number) => COD_ENABLED && total <= COD_MAX_TOTAL;
export const emiAllowed = (total: number) => total >= EMI_MIN_TOTAL;

/** 0% interest for 3 and 6 months, 14% p.a. for 9 and 12 months. */
export function emiMonthly(total: number, months: number) {
  if (months <= 6) return Math.round(total / months);
  const r = 0.14 / 12;
  const f = Math.pow(1 + r, months);
  return Math.round((total * r * f) / (f - 1));
}
