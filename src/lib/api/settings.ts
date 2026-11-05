import { apiRequest } from "@/lib/api/client";
import type { Coupon } from "@/lib/shop/pricing";

export type StoreSettings = {
  storeName: string;
  tagline: string;
  announcement: string;
  freeMin: number;
  standardFee: number;
};

type ApiStoreSettings = {
  id: number;
  store_name: string;
  tagline: string;
  announcement: string;
  free_min: number;
  standard_fee: number;
};

function mapSettings(data: ApiStoreSettings): StoreSettings {
  return {
    storeName: data.store_name,
    tagline: data.tagline,
    announcement: data.announcement,
    freeMin: Number(data.free_min),
    standardFee: Number(data.standard_fee),
  };
}

function mapCoupon(data: Coupon): Coupon {
  return {
    code: data.code,
    label: data.label,
    pct: data.pct,
    max: data.max,
    freeShip: data.freeShip,
    active: data.active,
  };
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const data = await apiRequest<ApiStoreSettings>("/api/settings/");
  return mapSettings(data);
}

export async function updateStoreSettings(
  settings: StoreSettings
): Promise<StoreSettings> {
  const data = await apiRequest<ApiStoreSettings>("/api/settings/", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      store_name: settings.storeName,
      tagline: settings.tagline,
      announcement: settings.announcement,
      free_min: settings.freeMin,
      standard_fee: settings.standardFee,
    }),
  });

  return mapSettings(data);
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const data = await apiRequest<Coupon[]>("/api/coupons/");
  return data.map(mapCoupon);
}

export async function fetchAllCouponsAdmin(): Promise<Coupon[]> {
  const data = await apiRequest<Coupon[]>("/api/coupons/admin/all");
  return data.map(mapCoupon);
}

export async function createCoupon(coupon: Coupon): Promise<Coupon> {
  const data = await apiRequest<Coupon>("/api/coupons/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: coupon.code,
      label: coupon.label,
      pct: coupon.pct ?? null,
      max: coupon.max ?? null,
      freeShip: coupon.freeShip ?? false,
      active: coupon.active ?? true,
    }),
  });

  return mapCoupon(data);
}

export async function updateCoupon(coupon: Coupon): Promise<Coupon> {
  const data = await apiRequest<Coupon>(
    `/api/coupons/${encodeURIComponent(coupon.code)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        label: coupon.label,
        pct: coupon.pct ?? null,
        max: coupon.max ?? null,
        freeShip: coupon.freeShip ?? false,
        active: coupon.active ?? true,
      }),
    }
  );

  return mapCoupon(data);
}

export async function deleteCoupon(code: string): Promise<void> {
  await apiRequest(
    `/api/coupons/${encodeURIComponent(code)}`,
    { method: "DELETE" }
  );
}