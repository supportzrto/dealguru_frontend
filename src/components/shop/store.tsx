import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { readStore, writeStore } from "@/lib/shop/format";
import { findCoupon, type Coupon } from "@/lib/shop/pricing";
import { useProducts } from "@/context/ProductsContext";
import { useSettings } from "@/context/SettingsContext";
import type { Product } from "./data";

export type CartItem = { key: string; product: Product; qty: number; color?: string | undefined; size?: string | undefined };
type StoredItem = { key: string; id: string; qty: number; color?: string | undefined; size?: string | undefined };
type AddOpts = { qty?: number | undefined; color?: string | undefined; size?: string | undefined; silent?: boolean };

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  /** Returns false when blocked by stock. */
  add: (p: Product, opts?: AddOpts) => boolean;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  coupon: Coupon | undefined;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
};
type WishCtx = { ids: Set<string>; toggle: (id: string) => void };
type UiCtx = { searchOpen: boolean; setSearchOpen: (v: boolean) => void };

const CartContext = createContext<CartCtx | null>(null);
const WishlistContext = createContext<WishCtx | null>(null);
const UiContext = createContext<UiCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { ready: productsReady, getProduct, products } = useProducts();
  const { coupons } = useSettings();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cart & wishlist persist in localStorage (read after hydration).
  useEffect(() => {
    if (!productsReady || loaded) return;
    const stored = readStore<StoredItem[]>("dealguru_cart", []);
    setItems(stored.flatMap((s) => { const product = getProduct(s.id); return product ? [{ key: s.key, product, qty: s.qty, color: s.color, size: s.size }] : []; }));
    setIds(new Set(readStore<string[]>("dealguru_wishlist", [])));
    setCouponCode(readStore<string | null>("dealguru_coupon", null));
    setLoaded(true);
  }, [productsReady, loaded, getProduct]);
  // Keep bag & wishlist in sync with the live catalog: refresh product data, silently drop deleted/draft items.
  useEffect(() => {
    if (!loaded) return;
    setItems((prev) => {
      const next = prev.flatMap((i) => { const product = products.find((p) => p.id === i.product.id); return product ? [{ ...i, product }] : []; });
      return next.length === prev.length && next.every((n, k) => n.product === prev[k]!.product) ? prev : next;
    });
    setIds((prev) => {
      const next = new Set([...prev].filter((id) => products.some((p) => p.id === id)));
      return next.size === prev.size ? prev : next;
    });
  }, [products, loaded]);
  useEffect(() => {
    if (!loaded) return;
    writeStore("dealguru_cart", items.map((i) => ({ key: i.key, id: i.product.id, qty: i.qty, color: i.color, size: i.size })));
    writeStore("dealguru_wishlist", [...ids]);
    writeStore("dealguru_coupon", couponCode);
  }, [items, ids, couponCode, loaded]);

  const cart = useMemo<CartCtx>(() => ({
    items, open, setOpen,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.qty * i.product.price, 0),
    add: (product, o = {}) => {
      const key = [product.id, o.color, o.size].filter(Boolean).join("-");
      const inBag = items.filter((i) => i.product.id === product.id).reduce((n, i) => n + i.qty, 0);
      const want = o.qty ?? 1;
      if (product.stock <= 0) { toast.error("Out of stock", { description: product.name }); return false; }
      if (inBag + want > product.stock) { toast.error(`Only ${product.stock} left`, { description: product.name }); return false; }
      setItems((prev) => {
        const hit = prev.find((i) => i.key === key);
        if (hit) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + want } : i));
        return [...prev, { key, product, qty: want, color: o.color, size: o.size }];
      });
      if (!o.silent) toast.success("Added to bag", { description: product.name });
      return true;
    },
    setQty: (key, qty) => {
      const item = items.find((i) => i.key === key);
      if (item && qty > item.qty) {
        const others = items.filter((i) => i.product.id === item.product.id && i.key !== key).reduce((n, i) => n + i.qty, 0);
        if (others + qty > item.product.stock) { toast.error(`Only ${item.product.stock} left`, { description: item.product.name }); return; }
      }
      setItems((prev) => (qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i))));
    },
    clear: () => { setItems([]); setCouponCode(null); },
    coupon: couponCode ? findCoupon(couponCode, coupons) : undefined,
    applyCoupon: (code) => { const c = findCoupon(code, coupons); if (c) setCouponCode(c.code); return !!c; },
    removeCoupon: () => setCouponCode(null),
  }), [items, open, couponCode, coupons]);

  const wish = useMemo<WishCtx>(() => ({
    ids,
    toggle: (id) => setIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }),
  }), [ids]);

  return (
    <CartContext.Provider value={cart}>
      <WishlistContext.Provider value={wish}>
        <UiContext.Provider value={{ searchOpen, setSearchOpen }}>{children}</UiContext.Provider>
      </WishlistContext.Provider>
    </CartContext.Provider>
  );
}

function need<T>(v: T | null): T { if (!v) throw new Error("StoreProvider missing"); return v; }
export const useCart = () => need(useContext(CartContext));
export const useWishlist = () => need(useContext(WishlistContext));
export const useUi = () => need(useContext(UiContext));
