// Demo only. Replace with Supabase auth, DB and storage later.
// The catalog lives in localStorage ("dealguru_products"), seeded from data.ts on first load.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isCategory, products as seed, resolveAsset, type Product } from "@/components/shop/data";
import { ensureDataVersion, onStorageKey, readStore, STORAGE_KEYS, writeStore } from "@/lib/storage";

type Ctx = {
  ready: boolean;
  /** Every product, including drafts (admin). */
  all: Product[];
  /** Products visible on the storefront (drafts hidden). */
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  /** Returns false when storage is full. */
  saveProduct: (p: Product) => boolean;
  saveMany: (list: Product[]) => boolean;
  removeProducts: (ids: string[]) => void;
  /** Adds (positive) or removes (negative) stock per product id. */
  adjustStock: (changes: { productId: string; qty: number }[]) => void;
};
const ProductsCtx = createContext<Ctx | null>(null);

/** Older stored products may miss newer fields — fill them from the seed shape. */
function normalize(p: Partial<Product> & { id: string }): Product {
  const base = seed.find((s) => s.id === p.id);
  const fixed = { ...p, ...(p.image ? { image: resolveAsset(p.image) } : {}), ...(p.images ? { images: p.images.map(resolveAsset) } : {}) };
  return {
    stock: 10, sku: p.id.toUpperCase(), sizes: [], status: "active", showInPopular: false, showInBestSellers: false,
    ...(base ?? {}), ...fixed,
  } as Product;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<Product[]>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureDataVersion();
    const load = () => {
      const stored = readStore<Product[] | null>(STORAGE_KEYS.products, null);
      if (!stored) { writeStore(STORAGE_KEYS.products, seed); setAll(seed); }
      else setAll(stored.filter((p) => isCategory(p.category)).map(normalize)); // drop any old-category products
    };
    load();
    setReady(true);
    return onStorageKey(STORAGE_KEYS.products, load);
  }, []);

  const value = useMemo<Ctx>(() => {
    const commit = (next: Product[]) => {
      const ok = writeStore(STORAGE_KEYS.products, next);
      if (ok) setAll(next);
      return ok;
    };
    const current = () => readStore<Product[] | null>(STORAGE_KEYS.products, null)?.map(normalize) ?? all;
    const visible = all.filter((p) => p.status === "active");
    return {
      ready, all, products: visible,
      getProduct: (id) => visible.find((p) => p.id === id),
      saveProduct: (p) => {
        const list = current();
        return commit(list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list]);
      },
      saveMany: (ps) => {
        const map = new Map(ps.map((p) => [p.id, p]));
        return commit(current().map((x) => map.get(x.id) ?? x));
      },
      removeProducts: (ids) => { commit(current().filter((x) => !ids.includes(x.id))); },
      adjustStock: (changes) => {
        commit(current().map((x) => {
          const d = changes.filter((c) => c.productId === x.id).reduce((n, c) => n + c.qty, 0);
          return d ? { ...x, stock: Math.max(0, x.stock + d) } : x;
        }));
      },
    };
  }, [all, ready]);

  return <ProductsCtx.Provider value={value}>{children}</ProductsCtx.Provider>;
}

export function useProducts() {
  const c = useContext(ProductsCtx);
  if (!c) throw new Error("ProductsProvider missing");
  return c;
}
