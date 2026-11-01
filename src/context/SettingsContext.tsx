// Demo only. Replace with Supabase auth, DB and storage later.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { COUPONS, DEFAULT_RULES, type Coupon, type ShippingRules } from "@/lib/shop/pricing";
import { ensureDataVersion, onStorageKey, readStore, STORAGE_KEYS, writeStore } from "@/lib/storage";

export type StoreSettings = { storeName: string; tagline: string; announcement: string; freeMin: number; standardFee: number };
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "DealGuru",
  tagline: "Smart finds. Better living.",
  announcement: "Free Shipping on Every Order | Prepaid Orders Only — No COD | 100% Genuine Products",
  freeMin: DEFAULT_RULES.freeMin,
  standardFee: DEFAULT_RULES.standardFee,
};
export const seedCoupons = (): Coupon[] => Object.values(COUPONS).map((c) => ({ ...c, active: true }));

type Ctx = {
  settings: StoreSettings;
  rules: ShippingRules;
  coupons: Coupon[];
  saveSettings: (s: StoreSettings) => void;
  saveCoupons: (c: Coupon[]) => void;
};
const SettingsCtx = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [coupons, setCoupons] = useState<Coupon[]>(seedCoupons);
  useEffect(() => {
    ensureDataVersion();
    const load = () => {
      setSettings({ ...DEFAULT_SETTINGS, ...readStore<Partial<StoreSettings>>(STORAGE_KEYS.settings, {}) });
      setCoupons(readStore<Coupon[] | null>(STORAGE_KEYS.coupons, null) ?? seedCoupons());
    };
    load();
    const a = onStorageKey(STORAGE_KEYS.settings, load), b = onStorageKey(STORAGE_KEYS.coupons, load);
    return () => { a(); b(); };
  }, []);
  const value = useMemo<Ctx>(() => ({
    settings, coupons,
    rules: { freeMin: settings.freeMin, standardFee: settings.standardFee },
    saveSettings: (s) => { setSettings(s); writeStore(STORAGE_KEYS.settings, s); },
    saveCoupons: (c) => { setCoupons(c); writeStore(STORAGE_KEYS.coupons, c); },
  }), [settings, coupons]);
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export function useSettings() {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error("SettingsProvider missing");
  return c;
}
