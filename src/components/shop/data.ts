import lighterAll from "@/assets/lighter-all.jpg.asset.json";
import lighterBlue from "@/assets/lighter-blue.jpg.asset.json";
import lighterPink from "@/assets/lighter-pink.jpg.asset.json";
import lighterRed from "@/assets/lighter-red.jpg.asset.json";
import lighterSilver from "@/assets/lighter-silver.jpg.asset.json";
import lighterBlack from "@/assets/lighter-black.jpg.asset.json";
import lighterGold from "@/assets/lighter-gold.jpg.asset.json";

/** Stored image URLs are kept as-is (CDN asset URLs and uploads never change). */
export function resolveAsset(url: string) {
  return url;
}

export type CategorySlug = "home-kitchen" | "gadgets" | "daily-essentials";
// Legacy fields kept on the type so older data still loads; not shown in the store.
export type Fabric = "Cotton" | "Rayon" | "Silk" | "Velvet" | "Linen" | "Other";
export type Occasion = "Casual" | "Festive" | "Wedding" | "Office";
export type ColorName = "black" | "silver" | "gold" | "red" | "pink" | "blue" | "navy" | "green" | "white" | "orange";

export type Product = {
  id: string;
  name: string;
  category: CategorySlug;
  image: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  /** Preset colour names or custom hex values (e.g. "#aa3366"). */
  colors: string[];
  /** Optional photo per colour, shown when that colour is picked. */
  colorImages?: Record<string, string> | undefined;
  badge?: "New" | "Bestseller" | "Sale" | undefined;
  isNew: boolean;
  createdAt: string;
  fabric: Fabric;
  occasion: Occasion;
  images?: string[] | undefined;
  description?: string | undefined;
  /** What's in the box, e.g. "1 Lighter + USB cable". */
  setIncludes?: string | undefined;
  /** Short highlight bullets shown on the product page. */
  features?: string[] | undefined;
  stock: number;
  sku: string;
  /** Optional — most products have no sizes. */
  sizes: string[];
  status: "active" | "draft";
  showInPopular: boolean;
  showInBestSellers: boolean;
  /** Sort key for Popular Picks / Best Sellers (newest first). */
  featuredAt?: string | undefined;
};

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const swatch = (c: string) => colorValues[c as ColorName] ?? c;
export const productImages = (p: Product) => (p.images?.length ? p.images : [p.image]);

export const colorValues: Record<ColorName, string> = {
  black: "oklch(0.22 0 0)",
  silver: "oklch(0.84 0.005 260)",
  gold: "oklch(0.78 0.13 85)",
  red: "oklch(0.45 0.17 22)",
  pink: "oklch(0.8 0.07 15)",
  blue: "oklch(0.52 0.15 250)",
  navy: "oklch(0.3 0.08 260)",
  green: "oklch(0.5 0.1 155)",
  white: "oklch(0.97 0.005 80)",
  orange: "oklch(0.7 0.19 48)",
};

export const allColors = Object.keys(colorValues) as ColorName[];
export const allFabrics: Fabric[] = ["Cotton", "Rayon", "Silk", "Velvet", "Linen", "Other"];
export const allOccasions: Occasion[] = ["Casual", "Festive", "Wedding", "Office"];

export const categoryMeta: Record<CategorySlug, { title: string; eyebrow: string; description: string; to: `/${CategorySlug}` }> = {
  "home-kitchen": { title: "Home & Kitchen", eyebrow: "Make home easier", description: "Clever everyday tools for your kitchen, pooja room and home.", to: "/home-kitchen" },
  gadgets: { title: "Gadgets", eyebrow: "Smart & handy", description: "Useful gadgets and rechargeable tech at honest prices.", to: "/gadgets" },
  "daily-essentials": { title: "Daily Essentials", eyebrow: "Everyday must-haves", description: "Practical finds you'll reach for every single day.", to: "/daily-essentials" },
};
export const CATEGORY_SLUGS = Object.keys(categoryMeta) as CategorySlug[];
export const isCategory = (c: unknown): c is CategorySlug => typeof c === "string" && c in categoryMeta;

/** Seed catalog. After first load the ProductsContext (localStorage) is the source of truth. */
export const products: Product[] = [
  {
    id: "dg1",
    name: "USB Rechargeable Electric Arc Lighter",
    category: "home-kitchen",
    image: lighterAll.url,
    images: [lighterAll.url, lighterBlue.url, lighterPink.url, lighterRed.url, lighterSilver.url, lighterBlack.url, lighterGold.url],
    colors: ["blue", "pink", "red", "silver", "black", "gold"],
    colorImages: {
      blue: lighterBlue.url, pink: lighterPink.url, red: lighterRed.url,
      silver: lighterSilver.url, black: lighterBlack.url, gold: lighterGold.url,
    },
    price: 299,
    originalPrice: 299,
    rating: 0,
    reviewCount: 0,
    badge: "New",
    isNew: true,
    createdAt: "2026-10-27",
    fabric: "Other",
    occasion: "Casual",
    description:
      "A flameless electric arc lighter with a long, flexible neck. No gas, no refills — just charge it with the included USB Type-C cable and press to light. Perfect for candles, diyas, gas stoves, agarbatti, BBQs and camping.",
    setIncludes: "1 Electric Arc Lighter + USB Type-C charging cable",
    features: [
      "Rechargeable via USB Type-C — no gas or refills",
      "Flameless, windproof electric arc",
      "Flexible 360° neck reaches deep candle jars",
      "Safety switch to prevent accidental lighting",
      "Available in 6 colours",
    ],
    stock: 50,
    sku: "DG-HK-001",
    sizes: [],
    status: "active",
    showInPopular: true,
    showInBestSellers: true,
    featuredAt: "2026-10-27T00:00:00Z",
  },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);

// Selectors work on any list (defaults to the seed, the store passes the live catalog).
const featuredSort = (a: Product, b: Product) => (b.featuredAt ?? b.createdAt).localeCompare(a.featuredAt ?? a.createdAt);
export const byCategory = (c: CategorySlug, list = products) => list.filter((p) => p.category === c);
export const newArrivals = (list = products) =>
  list.filter((p) => p.isNew).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const saleProducts = (list = products) => list.filter((p) => p.originalPrice > p.price);
export const popularList = (list = products) => list.filter((p) => p.showInPopular).sort(featuredSort).slice(0, 12);
export const bestSellerList = (list = products) => list.filter((p) => p.showInBestSellers).sort(featuredSort).slice(0, 6);
export const discountPct = (p: Product) => Math.round((1 - p.price / p.originalPrice) * 100);
/** Image for the picked colour, falling back to the main image. */
export const imageFor = (p: Product, color?: string) => (color && p.colorImages?.[color]) || p.images?.[0] || p.image;

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "rating";
export type Filters = {
  sort?: SortKey | undefined;
  color?: string | undefined;
  occasion?: string | undefined;
  fabric?: string | undefined;
  rating?: number | undefined;
  max?: number | undefined;
  page?: number | undefined;
};

export const csv = (v?: string) => (v ? v.split(",").filter(Boolean) : []);

export function applyFilters(list: Product[], f: Filters): Product[] {
  const colors = csv(f.color);
  const out = list.filter((p) =>
    (f.max == null || p.price <= f.max) &&
    (!colors.length || p.colors.some((c) => colors.includes(c))) &&
    (f.rating == null || p.rating >= f.rating));
  const s = [...out];
  switch (f.sort) {
    case "price-asc": return s.sort((a, b) => a.price - b.price);
    case "price-desc": return s.sort((a, b) => b.price - a.price);
    case "newest": return s.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "rating": return s.sort((a, b) => b.rating - a.rating);
    default: return s;
  }
}

const sortKeys: SortKey[] = ["featured", "price-asc", "price-desc", "newest", "rating"];
export function parseFilters(s: Record<string, unknown>): Filters {
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const num = (v: unknown) => { const n = Number(v); return v != null && v !== "" && Number.isFinite(n) ? n : undefined; };
  const sort = str(s["sort"]) as SortKey | undefined;
  return {
    sort: sort && sortKeys.includes(sort) ? sort : undefined,
    color: str(s["color"]), rating: num(s["rating"]), max: num(s["max"]), page: num(s["page"]),
  };
}

export type NavLink = { label: string; to: "/" | "/shop" | "/new-arrivals" | "/sale" | `/${CategorySlug}` };
/** Nav links: categories and Deals only appear once they have products. */
export function navLinksFor(list: Product[]): NavLink[] {
  return [
    { label: "Home", to: "/" },
    { label: "Shop All", to: "/shop" },
    ...CATEGORY_SLUGS.filter((c) => list.some((p) => p.category === c)).map((c) => ({ label: categoryMeta[c].title, to: categoryMeta[c].to })),
    { label: "New Arrivals", to: "/new-arrivals" },
    ...(saleProducts(list).length ? [{ label: "Deals", to: "/sale" } as NavLink] : []),
  ];
}

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
