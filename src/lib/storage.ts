// Demo only. Replace with Supabase auth, DB and storage later.
// Every localStorage key the DealGuru demo uses lives here.
export const STORAGE_KEYS = {
  users: "dealguru_users", // registered accounts (customers + seeded admin), passwords hashed
  session: "dealguru_session", // id of the signed-in user (local or session storage)
  products: "dealguru_products", // full catalog, seeded from components/shop/data.ts
  orders: "dealguru_orders", // every order placed in this browser
  settings: "dealguru_settings", // store name, tagline, announcement, shipping rules
  coupons: "dealguru_coupons", // coupon list managed in admin settings
  cart: "dealguru_cart",
  wishlist: "dealguru_wishlist",
  coupon: "dealguru_coupon", // coupon applied to the current bag
  dataVersion: "dealguru_data_version", // bump DATA_VERSION to clear + reseed catalog/orders/settings
} as const;

export { readStore, writeStore } from "@/lib/shop/format";

/** Subscribe to changes of one key made in other tabs. */
export function onStorageKey(key: string, fn: () => void) {
  const h = (e: StorageEvent) => { if (e.key === key || e.key === null) fn(); };
  window.addEventListener("storage", h);
  return () => window.removeEventListener("storage", h);
}

export const DATA_VERSION = 3;

/** One-time reset: when the stored data version is missing or old, drop catalog, orders and settings so they reseed. */
export function ensureDataVersion() {
  try {
    if (Number(localStorage.getItem(STORAGE_KEYS.dataVersion)) >= DATA_VERSION) return;
    [STORAGE_KEYS.products, STORAGE_KEYS.orders, STORAGE_KEYS.settings, STORAGE_KEYS.coupons, STORAGE_KEYS.cart, STORAGE_KEYS.coupon].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(STORAGE_KEYS.dataVersion, String(DATA_VERSION));
  } catch { /* storage unavailable */ }
}
