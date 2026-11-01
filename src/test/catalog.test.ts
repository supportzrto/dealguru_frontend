import { describe, expect, it } from "vitest";
import { applyFilters, navLinksFor, newArrivals, products } from "@/components/shop/data";

describe("catalog rules", () => {
  it("the store sells only the electric arc lighter", () => {
    expect(products).toHaveLength(1);
    expect(products[0]!.name).toMatch(/Electric Arc Lighter/);
  });
  it("the lighter costs ₹299", () => expect(products[0]!.price).toBe(299));
  it("the lighter comes in 6 colours, each with its own photo", () => {
    const p = products[0]!;
    expect(p.colors).toEqual(["blue", "pink", "red", "silver", "black", "gold"]);
    for (const c of p.colors) expect(p.colorImages?.[c]).toBeTruthy();
  });
  it("new arrivals only include new products", () => {
    expect(newArrivals().every((p) => p.isNew)).toBe(true);
  });
  it("menu hides empty categories and Deals", () => {
    const labels = navLinksFor(products).map((l) => l.label);
    expect(labels).toContain("Home & Kitchen");
    expect(labels).not.toContain("Gadgets");
    expect(labels).not.toContain("Deals");
  });
  it("price filter keeps items at or under the max", () => {
    expect(applyFilters(products, { max: 200 })).toHaveLength(0);
    expect(applyFilters(products, { max: 300 })).toHaveLength(1);
  });
});
