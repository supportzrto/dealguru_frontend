
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_SETTINGS,
  seedCoupons,
  useSettings,
  type StoreSettings,
} from "@/context/SettingsContext";
import { Field, TextInput } from "@/components/shop/forms";
import type { Coupon } from "@/lib/shop/pricing";
import {
  btnOutline,
  btnPrimary,
  inputCls,
  Panel,
  TableWrap,
  td,
  th,
} from "../ui";

export function SettingsPage() {
  const { settings, saveSettings, coupons, saveCoupons } = useSettings();

  const [s, setS] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);

  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"pct" | "ship">("pct");
  const [pct, setPct] = useState("10");
  const [max, setMax] = useState("");

  useEffect(() => setS(settings), [settings]);

  const saveStore = async () => {
    if (!s.storeName.trim()) {
      toast.error("Store name is required");
      return;
    }

    if (!(s.freeMin >= 0) || !(s.standardFee >= 0)) {
      toast.error("Shipping values must be 0 or more");
      return;
    }

    try {
      setSaving(true);

      await saveSettings({
        ...s,
        storeName: s.storeName.trim().slice(0, 40),
        tagline: s.tagline.trim().slice(0, 80),
        announcement: s.announcement.trim().slice(0, 200),
      });

      toast.success("Settings saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addCoupon = async () => {
    const c = code.trim().toUpperCase();

    if (!/^[A-Z0-9]{3,20}$/.test(c)) {
      toast.error("Code must be 3–20 letters or numbers");
      return;
    }

    if (coupons.some((x) => x.code === c)) {
      toast.error("That code already exists");
      return;
    }

    let next: Coupon;

    if (kind === "ship") {
      next = {
        code: c,
        label: "Free delivery",
        freeShip: true,
        active: true,
      };
    } else {
      const p = Number(pct);
      const m = max ? Number(max) : undefined;

      if (!(p >= 1 && p <= 90)) {
        toast.error("Discount must be between 1 and 90%");
        return;
      }

      if (m !== undefined && (!Number.isInteger(m) || m < 1)) {
        toast.error("Maximum discount must be a positive whole number");
        return;
      }

      next = {
        code: c,
        label: m ? `${p}% off (max ₹${m})` : `${p}% off`,
        pct: p,
        max: m,
        active: true,
      };
    }

    try {
      setCouponBusy(true);

      await saveCoupons([...coupons, next]);

      setCode("");
      setMax("");
      toast.success(`Coupon ${c} added`);
    } catch (error) {
      console.error("Failed to add coupon:", error);
      toast.error("Failed to add coupon. Please try again.");
    } finally {
      setCouponBusy(false);
    }
  };

  const restoreCoupons = async () => {
    try {
      setCouponBusy(true);

      await saveCoupons(seedCoupons());

      toast.success("Default coupons restored");
    } catch (error) {
      console.error("Failed to restore coupons:", error);
      toast.error("Failed to restore coupons.");
    } finally {
      setCouponBusy(false);
    }
  };

  const toggleCoupon = async (code: string, active: boolean) => {
    try {
      setCouponBusy(true);

      await saveCoupons(
        coupons.map((coupon) =>
          coupon.code === code ? { ...coupon, active } : coupon
        )
      );

      toast.success(`Coupon ${code} ${active ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Failed to update coupon:", error);
      toast.error("Failed to update coupon.");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = async (code: string) => {
    try {
      setCouponBusy(true);

      await saveCoupons(
        coupons.filter((coupon) => coupon.code !== code)
      );

      toast.success(`Deleted ${code}`);
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      toast.error("Failed to delete coupon.");
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Store">
        <div className="space-y-4">
          <Field label="Store name" htmlFor="storeName">
            <TextInput
              id="storeName"
              value={s.storeName}
              maxLength={40}
              onChange={(e) =>
                setS({ ...s, storeName: e.target.value })
              }
            />
          </Field>

          <Field label="Tagline (footer)" htmlFor="tagline">
            <TextInput
              id="tagline"
              value={s.tagline}
              maxLength={80}
              onChange={(e) =>
                setS({ ...s, tagline: e.target.value })
              }
            />
          </Field>

          <Field
            label="Announcement bar"
            htmlFor="announcement"
            hint="Separate messages with |"
          >
            <TextInput
              id="announcement"
              value={s.announcement}
              maxLength={200}
              onChange={(e) =>
                setS({ ...s, announcement: e.target.value })
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Free shipping from (₹)" htmlFor="freeMin">
              <TextInput
                id="freeMin"
                type="number"
                min={0}
                value={s.freeMin}
                onChange={(e) =>
                  setS({ ...s, freeMin: Number(e.target.value) })
                }
              />
            </Field>

            <Field label="Standard delivery fee (₹)" htmlFor="fee">
              <TextInput
                id="fee"
                type="number"
                min={0}
                value={s.standardFee}
                onChange={(e) =>
                  setS({ ...s, standardFee: Number(e.target.value) })
                }
              />
            </Field>
          </div>

          <div className="flex gap-2">
            <button
              className={btnPrimary}
              onClick={saveStore}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save settings"}
            </button>

            <button
              className={btnOutline}
              onClick={() => setS(DEFAULT_SETTINGS)}
              disabled={saving}
            >
              Restore defaults
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        title="Coupons"
        action={
          <button
            className="text-[12px] text-muted-foreground hover:underline disabled:opacity-50"
            onClick={restoreCoupons}
            disabled={couponBusy}
          >
            Restore seed coupons
          </button>
        }
      >
        <TableWrap>
          <thead>
            <tr>
              {["Code", "Offer", "Enabled", ""].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {coupons.map((c) => (
              <tr key={c.code}>
                <td className={`${td} font-semibold`}>
                  {c.code}
                </td>

                <td className={td}>{c.label}</td>

                <td className={td}>
                  <Switch
                    checked={c.active !== false}
                    disabled={couponBusy}
                    onCheckedChange={(v) => toggleCoupon(c.code, v)}
                    aria-label={`Enable ${c.code}`}
                  />
                </td>

                <td className={td}>
                  <button
                    onClick={() => removeCoupon(c.code)}
                    disabled={couponBusy}
                    className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    aria-label={`Delete ${c.code}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}

            {!coupons.length && (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 text-center text-[13px] text-muted-foreground"
                >
                  No coupons. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CODE"
            aria-label="Coupon code"
            className={`${inputCls} w-32 uppercase`}
            disabled={couponBusy}
          />

          <select
            value={kind}
            onChange={(e) =>
              setKind(e.target.value as "pct" | "ship")
            }
            aria-label="Coupon type"
            className={inputCls}
            disabled={couponBusy}
          >
            <option value="pct">% off</option>
            <option value="ship">Free delivery</option>
          </select>

          {kind === "pct" && (
            <>
              <input
                type="number"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                aria-label="Discount percent"
                className={`${inputCls} w-20`}
                placeholder="%"
                disabled={couponBusy}
              />

              <input
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                aria-label="Maximum discount in rupees"
                className={`${inputCls} w-28`}
                placeholder="Max ₹ (opt.)"
                disabled={couponBusy}
              />
            </>
          )}

          <button
            className={btnPrimary}
            onClick={addCoupon}
            disabled={couponBusy}
          >
            {couponBusy ? "Please wait..." : "Add coupon"}
          </button>
        </div>
      </Panel>
    </div>
  );
}
