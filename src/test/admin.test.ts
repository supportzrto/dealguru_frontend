import { describe, expect, it } from "vitest";
import { applyStatus, paymentStatusOf, statusAt, type Order } from "@/context/OrdersContext";
import { computeTotals, findCoupon } from "@/lib/shop/pricing";
import { productSchema } from "@/lib/shop/productSchema";
import { products } from "@/components/shop/data";

const order = (o: Partial<Order> = {}): Order => ({
  id: "DG-1", userId: "u", items: [], address: {} as Order["address"],
  delivery: { method: "standard", eta: "", giftWrap: false, notes: "" }, paymentMethod: "Cash on Delivery",
  amounts: { subtotal: 0, discount: 0, delivery: 0, giftWrap: 0, cod: 49, giftCard: 0, total: 0 }, createdAt: new Date(0).toISOString(), ...o,
});

describe("admin rules", () => {
  it("admin-set status wins over the demo timer", () => {
    const o = applyStatus(order({ createdAt: new Date().toISOString() }), "Shipped");
    expect(o.statusManual).toBe(true);
    expect(statusAt(o, Date.now() + 3600_000)).toBe("Shipped");
  });
  it("each status change adds a timeline entry", () => {
    const o = applyStatus(applyStatus(order({ createdAt: new Date().toISOString() }), "Packed"), "Shipped");
    expect(o.history!.map((h) => h.status)).toEqual(["Confirmed", "Packed", "Shipped"]);
  });
  it("delivered COD orders become Paid", () => {
    expect(paymentStatusOf(order())).toBe("Pending");
    expect(paymentStatusOf(applyStatus(order(), "Delivered"))).toBe("Paid");
  });
  it("disabled coupons are rejected", () => {
    expect(findCoupon("GURU10", [{ code: "GURU10", label: "", pct: 10, active: false }])).toBeUndefined();
  });
  it("shipping rules from settings apply", () => {
    expect(computeTotals({ subtotal: 2500, rules: { freeMin: 3000, standardFee: 79 } }).delivery).toBe(79);
  });
  it("original price must be at least the price", () => {
    const base = { name: "Test", category: "home-kitchen", description: "", features: "", setIncludes: "", price: 1000, originalPrice: 900, stock: 2, sku: "A-1", images: ["x"], colors: ["pink"], sizes: ["M"], fabric: "Cotton", occasion: "Casual", badge: "None", showInPopular: false, showInBestSellers: false, isNew: false, status: "active" };
    expect(productSchema.safeParse(base).success).toBe(false);
    expect(productSchema.safeParse({ ...base, originalPrice: 1000 }).success).toBe(true);
  });
  it("sizes are optional", () => {
    const base = { name: "Test", category: "home-kitchen", description: "", features: "", setIncludes: "", price: 100, originalPrice: 100, stock: 2, sku: "A-1", images: ["x"], colors: ["pink"], sizes: [], fabric: "Other", occasion: "Casual", badge: "None", showInPopular: false, showInBestSellers: false, isNew: false, status: "active" };
    expect(productSchema.safeParse(base).success).toBe(true);
    expect(productSchema.safeParse({ ...base, category: "co-ord-sets" }).success).toBe(false);
  });
  it("the lighter is the featured Popular Pick", () => {
    expect(products.filter((p) => p.showInPopular).map((p) => p.id)).toEqual(["dg1"]);
  });
});
