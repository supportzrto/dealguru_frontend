// Demo only. Replace with Supabase auth, DB and storage later.
// The catalog lives in localStorage ("dealguru_products"), seeded from data.ts on first load.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isCategory, products as seed, resolveAsset, type Product } from "@/components/shop/data";
import {
  ensureDataVersion,
  onStorageKey,
  readStore,
  STORAGE_KEYS,
  writeStore,
} from "@/lib/storage";
import {
  fetchProducts,
  fetchAllProductsAdmin,
  deleteProduct,
  updateProduct,
  createProduct,
} from "@/lib/api/products";
import { useAuth } from "@/context/AuthContext";

type Ctx = {
  ready: boolean;
  refreshProducts: () => Promise<void>;
  /** Every product, including drafts (admin). */
  all: Product[];
  /** Products visible on the storefront (drafts hidden). */
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  /** Returns false when storage is full. */
  saveProduct: (p: Product) => Promise<void>;
  saveMany: (ps: Product[]) => Promise<void>;
  removeProducts: (ids: string[]) => void;
  /** Adds (positive) or removes (negative) stock per product id. */
  adjustStock: (changes: { productId: string; qty: number }[]) => void;
};
const ProductsCtx = createContext<Ctx | null>(null);

/** Older stored products may miss newer fields — fill them from the seed shape. */
function normalize(p: Partial<Product> & { id: string }): Product {
  const base = seed.find((s) => s.id === p.id);
  const fixed = {
    ...p,
    ...(p.image ? { image: resolveAsset(p.image) } : {}),
    ...(p.images ? { images: p.images.map(resolveAsset) } : {}),
  };
  return {
    stock: 10,
    sku: p.id.toUpperCase(),
    sizes: [],
    status: "active",
    showInPopular: false,
    showInBestSellers: false,
    ...(base ?? {}),
    ...fixed,
  } as Product;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const { ready: authReady, isAdmin } = useAuth();

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const load = async () => {
      setReady(false);

      try {
        const data = isAdmin ? await fetchAllProductsAdmin() : await fetchProducts();

        if (!cancelled) {
          setAll(data);
        }
      } catch (error) {
        console.error("Failed to load products:", error);

        if (!cancelled) {
          setAll([]);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authReady, isAdmin]);

  const value = useMemo<Ctx>(() => {
    const commit = (next: Product[]) => {
      const ok = writeStore(STORAGE_KEYS.products, next);
      if (ok) setAll(next);
      return ok;
    };
    const current = () =>
      readStore<Product[] | null>(STORAGE_KEYS.products, null)?.map(normalize) ?? all;
    const visible = all.filter((p) => p.status === "active");
    return {
      ready,
      all,
      products: visible,
      refreshProducts: async () => {
        const data = isAdmin ? await fetchAllProductsAdmin() : await fetchProducts();

        setAll(data);
      },
      getProduct: (id) => visible.find((p) => p.id === id),
      saveProduct: async (p) => {
        const exists = current().some((x) => x.id === p.id);

        if (exists) {
          await updateProduct(p);
        } else {
          await createProduct(p);
        }

        const data = isAdmin ? await fetchAllProductsAdmin() : await fetchProducts();

        setAll(data);
      },
      saveMany: async (ps) => {
        for (const product of ps) {
          await updateProduct(product);
        }

        const data = isAdmin ? await fetchAllProductsAdmin() : await fetchProducts();

        setAll(data);
      },
      removeProducts: async (ids) => {
        for (const id of ids) {
          await deleteProduct(id);
        }

        const data = isAdmin ? await fetchAllProductsAdmin() : await fetchProducts();

        setAll(data);
      },
      adjustStock: async (changes) => {
        const updatedProducts = current().map((x) => {
          const d = changes.filter((c) => c.productId === x.id).reduce((n, c) => n + c.qty, 0);

          return d ? { ...x, stock: Math.max(0, x.stock + d) } : x;
        });

        for (const product of updatedProducts) {
          const original = current().find((x) => x.id === product.id);

          if (original && original.stock !== product.stock) {
            await updateProduct(product);
          }
        }

        const data = isAdmin ? await fetchAllProductsAdmin() : await fetchProducts();

        setAll(data);
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
