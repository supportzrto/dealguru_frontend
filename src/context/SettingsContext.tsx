
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_RULES,
  type Coupon,
  type ShippingRules,
} from "@/lib/shop/pricing";

import {
  fetchStoreSettings,
  updateStoreSettings,
  fetchCoupons,
  fetchAllCouponsAdmin,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type StoreSettings,
} from "@/lib/api/settings";

import { useAuth } from "@/context/AuthContext";

export type { StoreSettings } from "@/lib/api/settings";

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "DealGuru",
  tagline: "Smart finds. Better living.",
  announcement:
    "Free Shipping on Every Order | Prepaid Orders Only — No COD | 100% Genuine Products",
  freeMin: DEFAULT_RULES.freeMin,
  standardFee: DEFAULT_RULES.standardFee,
};

export const seedCoupons = (): Coupon[] => [
  {
    code: "GURU10",
    label: "10% off",
    pct: 10,
    active: true,
  },
  {
    code: "WELCOME20",
    label: "20% off (max ₹500)",
    pct: 20,
    max: 500,
    active: true,
  },
];

type Ctx = {
  settings: StoreSettings;
  rules: ShippingRules;
  coupons: Coupon[];
  saveSettings: (s: StoreSettings) => Promise<void>;
  saveCoupons: (c: Coupon[]) => Promise<void>;
};

const SettingsCtx = createContext<Ctx | null>(null);

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const { ready: authReady, isAdmin } = useAuth();

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const load = async () => {
      try {
        const [storeData, couponData] = await Promise.all([
          fetchStoreSettings(),
          isAdmin ? fetchAllCouponsAdmin() : fetchCoupons(),
        ]);

        if (!cancelled) {
          setSettings(storeData);
          setCoupons(couponData);
        }
      } catch (error) {
        console.error("Failed to load store settings:", error);

        if (!cancelled) {
          setSettings(DEFAULT_SETTINGS);
          setCoupons([]);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authReady, isAdmin]);

  const value = useMemo<Ctx>(
    () => ({
      settings,
      coupons,

      rules: {
        freeMin: settings.freeMin,
        standardFee: settings.standardFee,
      },

      saveSettings: async (nextSettings) => {
        const saved = await updateStoreSettings(nextSettings);
        setSettings(saved);
      },

      saveCoupons: async (nextCoupons) => {
        const existing = new Map(
          coupons.map((coupon) => [coupon.code, coupon])
        );

        const incoming = new Map(
          nextCoupons.map((coupon) => [coupon.code, coupon])
        );

        // Create new coupons and update existing coupons.
        for (const coupon of nextCoupons) {
          if (existing.has(coupon.code)) {
            await updateCoupon(coupon);
          } else {
            await createCoupon(coupon);
          }
        }

        // Delete coupons removed from the requested list.
        for (const coupon of coupons) {
          if (!incoming.has(coupon.code)) {
            await deleteCoupon(coupon.code);
          }
        }

        const refreshed = isAdmin
          ? await fetchAllCouponsAdmin()
          : await fetchCoupons();

        setCoupons(refreshed);
      },
    }),
    [settings, coupons, isAdmin]
  );

  return (
    <SettingsCtx.Provider value={value}>
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsCtx);

  if (!context) {
    throw new Error("SettingsProvider missing");
  }

  return context;
}
