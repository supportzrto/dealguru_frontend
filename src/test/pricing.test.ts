import { describe, expect, it } from "vitest";
import { codAllowed, computeTotals, deliveryFee, emiAllowed, emiMonthly, findCoupon, GIFT_CARDS } from "@/lib/shop/pricing";
import { cardBrand, expiryValid, UPI_RE } from "@/lib/shop/payment";
import { statusAt } from "@/context/OrdersContext";

describe("checkout pricing", () => {
  it("shipping is free on every order", () => {
    expect(deliveryFee(299)).toBe(0);
    expect(computeTotals({ subtotal: 299 }).total).toBe(299);
  });
  it("GURU10 gives 10% off", () => expect(computeTotals({ subtotal: 3000, coupon: findCoupon("guru10") }).discount).toBe(300));
  it("WELCOME20 is capped at ₹500", () => expect(computeTotals({ subtotal: 5000, coupon: findCoupon("WELCOME20") }).discount).toBe(500));
  it("unknown coupon is rejected", () => expect(findCoupon("NOPE")).toBeUndefined());
  it("gift wrap adds ₹49; COD adds nothing because it is off", () => expect(computeTotals({ subtotal: 2500, giftWrap: true, cod: true }).total).toBe(2549));
  it("gift card GURU100 takes ₹100 off", () => expect(computeTotals({ subtotal: 299, giftCardCredit: GIFT_CARDS["GURU100"] ?? 0 }).total).toBe(199));
  it("Cash on Delivery is never available", () => { expect(codAllowed(299)).toBe(false); expect(codAllowed(10000)).toBe(false); });
  it("EMI only from ₹3,000", () => { expect(emiAllowed(2999)).toBe(false); expect(emiAllowed(3000)).toBe(true); });
  it("EMI 6 months is 0% interest", () => expect(emiMonthly(6000, 6)).toBe(1000));
  it("EMI 12 months charges 14% p.a.", () => expect(emiMonthly(12000, 12)).toBe(1077));
});

describe("fake payments", () => {
  it("detects card brands", () => {
    expect(cardBrand("4111 1111 1111 1111")).toBe("Visa");
    expect(cardBrand("5500 0000 0000 0004")).toBe("Mastercard");
    expect(cardBrand("6070 0000 0000 0000")).toBe("RuPay");
  });
  it("rejects expired cards", () => {
    const now = new Date(2026, 9, 8);
    expect(expiryValid("09/26", now)).toBe(false);
    expect(expiryValid("10/26", now)).toBe(true);
  });
  it("validates UPI IDs as name@bank", () => { expect(UPI_RE.test("riya@okhdfc")).toBe(true); expect(UPI_RE.test("riya")).toBe(false); });
});

describe("order status timeline", () => {
  const created = new Date(2026, 0, 1, 10, 0).toISOString();
  const at = (min: number) => statusAt({ createdAt: created }, new Date(created).getTime() + min * 60000);
  it("advances with time", () => {
    expect(at(0)).toBe("Confirmed");
    expect(at(1)).toBe("Packed");
    expect(at(2)).toBe("Shipped");
    expect(at(3)).toBe("Out for Delivery");
    expect(at(5)).toBe("Delivered");
  });
  it("cancelled overrides", () => expect(statusAt({ createdAt: created, cancelledAt: created })).toBe("Cancelled"));
});
