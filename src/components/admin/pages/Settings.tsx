// Demo only. Replace with Supabase auth, DB and storage later.
import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SETTINGS, seedCoupons, useSettings, type StoreSettings } from "@/context/SettingsContext";
import { Field, TextInput } from "@/components/shop/forms";
import { STORAGE_KEYS } from "@/lib/storage";
import type { Coupon } from "@/lib/shop/pricing";
import { btnOutline, btnPrimary, inputCls, Panel, TableWrap, td, th } from "../ui";

export function SettingsPage() {
  const { settings, saveSettings, coupons, saveCoupons } = useSettings();
  const [s, setS] = useState<StoreSettings>(settings);
  const [reset, setReset] = useState(false);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"pct" | "ship">("pct");
  const [pct, setPct] = useState("10");
  const [max, setMax] = useState("");
  useEffect(() => setS(settings), [settings]);

  const saveStore = () => {
    if (!s.storeName.trim()) { toast.error("Store name is required"); return; }
    if (!(s.freeMin >= 0) || !(s.standardFee >= 0)) { toast.error("Shipping values must be 0 or more"); return; }
    saveSettings({ ...s, storeName: s.storeName.trim().slice(0, 40), tagline: s.tagline.trim().slice(0, 80), announcement: s.announcement.trim().slice(0, 200) });
    toast.success("Settings saved");
  };
  const addCoupon = () => {
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(c)) { toast.error("Code must be 3–20 letters or numbers"); return; }
    if (coupons.some((x) => x.code === c)) { toast.error("That code already exists"); return; }
    let next: Coupon;
    if (kind === "ship") next = { code: c, label: "Free delivery", freeShip: true, active: true };
    else {
      const p = Number(pct), m = max ? Number(max) : undefined;
      if (!(p > 0 && p <= 90)) { toast.error("Discount must be between 1 and 90%"); return; }
      next = { code: c, label: m ? `${p}% off (max ₹${m})` : `${p}% off`, pct: p, max: m, active: true };
    }
    saveCoupons([...coupons, next]);
    setCode(""); toast.success(`Coupon ${c} added`);
  };
  const doReset = () => {
    // Clears demo data back to the seed; the seeded admin is recreated on reload.
    [STORAGE_KEYS.products, STORAGE_KEYS.orders, STORAGE_KEYS.users, STORAGE_KEYS.coupons, STORAGE_KEYS.settings, STORAGE_KEYS.cart, STORAGE_KEYS.wishlist, STORAGE_KEYS.coupon].forEach((k) => localStorage.removeItem(k));
    toast.success("Demo data reset");
    setTimeout(() => window.location.assign("/admin/login"), 400);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Store">
        <div className="space-y-4">
          <Field label="Store name" htmlFor="storeName"><TextInput id="storeName" value={s.storeName} maxLength={40} onChange={(e) => setS({ ...s, storeName: e.target.value })} /></Field>
          <Field label="Tagline (footer)" htmlFor="tagline"><TextInput id="tagline" value={s.tagline} maxLength={80} onChange={(e) => setS({ ...s, tagline: e.target.value })} /></Field>
          <Field label="Announcement bar" htmlFor="announcement" hint="Separate messages with |"><TextInput id="announcement" value={s.announcement} maxLength={200} onChange={(e) => setS({ ...s, announcement: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Free shipping from (₹)" htmlFor="freeMin"><TextInput id="freeMin" type="number" min={0} value={s.freeMin} onChange={(e) => setS({ ...s, freeMin: Number(e.target.value) })} /></Field>
            <Field label="Standard delivery fee (₹)" htmlFor="fee"><TextInput id="fee" type="number" min={0} value={s.standardFee} onChange={(e) => setS({ ...s, standardFee: Number(e.target.value) })} /></Field>
          </div>
          <div className="flex gap-2">
            <button className={btnPrimary} onClick={saveStore}>Save settings</button>
            <button className={btnOutline} onClick={() => setS(DEFAULT_SETTINGS)}>Restore defaults</button>
          </div>
        </div>
      </Panel>

      <Panel title="Coupons" action={<button className="text-[12px] text-muted-foreground hover:underline" onClick={() => { saveCoupons(seedCoupons()); toast.success("Coupons restored"); }}>Restore seed coupons</button>}>
        <TableWrap>
          <thead><tr>{["Code", "Offer", "Enabled", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.code}>
                <td className={`${td} font-semibold`}>{c.code}</td>
                <td className={td}>{c.label}</td>
                <td className={td}><Switch checked={c.active !== false} onCheckedChange={(v) => saveCoupons(coupons.map((x) => (x.code === c.code ? { ...x, active: v } : x)))} aria-label={`Enable ${c.code}`} /></td>
                <td className={td}><button onClick={() => { saveCoupons(coupons.filter((x) => x.code !== c.code)); toast.success(`Deleted ${c.code}`); }} className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10" aria-label={`Delete ${c.code}`}><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {!coupons.length && <tr><td colSpan={4} className="py-6 text-center text-[13px] text-muted-foreground">No coupons. Add one below.</td></tr>}
          </tbody>
        </TableWrap>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" aria-label="Coupon code" className={`${inputCls} w-32 uppercase`} />
          <select value={kind} onChange={(e) => setKind(e.target.value as "pct" | "ship")} aria-label="Coupon type" className={inputCls}>
            <option value="pct">% off</option><option value="ship">Free delivery</option>
          </select>
          {kind === "pct" && <>
            <input type="number" value={pct} onChange={(e) => setPct(e.target.value)} aria-label="Discount percent" className={`${inputCls} w-20`} placeholder="%" />
            <input type="number" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Maximum discount in rupees" className={`${inputCls} w-28`} placeholder="Max ₹ (opt.)" />
          </>}
          <button className={btnPrimary} onClick={addCoupon}>Add coupon</button>
        </div>
      </Panel>

      <Panel title="Demo data" className="xl:col-span-2">
        <p className="text-[13px] text-muted-foreground">Clear all products, orders, customers, coupons and settings, and go back to the original demo data. You’ll be signed out.</p>
        <button className={`${btnOutline} mt-3 border-destructive text-destructive`} onClick={() => setReset(true)}><RotateCcw className="h-4 w-4" /> Reset demo data</button>
      </Panel>

      <AlertDialog open={reset} onOpenChange={setReset}>
        <AlertDialogContent>
          <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
          <AlertDialogDescription>Products, orders, customer accounts, coupons and settings go back to the seed. This can’t be undone.</AlertDialogDescription>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={doReset}>Reset</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
