import { useState } from "react";
import { Check, Tag, X } from "lucide-react";
import { inr } from "@/lib/shop/format";
import { imageFor } from "@/components/shop/data";
import type { computeTotals } from "@/lib/shop/pricing";
import { useCart, type CartItem } from "@/components/shop/store";

type Totals = ReturnType<typeof computeTotals>;

export function SummaryLines({ t, coupon }: { t: Totals; coupon?: string | undefined }) {
  const row = (label: string, value: string, cls = "") => (
    <div className={`flex justify-between ${cls}`}><span>{label}</span><span>{value}</span></div>
  );
  return (
    <div className="space-y-2 text-[13px]">
      {row("Subtotal", inr(t.subtotal))}
      {t.discount > 0 && row(`Discount${coupon ? ` (${coupon})` : ""}`, `−${inr(t.discount)}`, "text-success")}
      {row("Delivery", t.delivery === 0 ? "FREE" : inr(t.delivery), t.delivery === 0 ? "text-success" : "")}
      {t.giftWrap > 0 && row("Gift wrap", inr(t.giftWrap))}
      {t.cod > 0 && row("COD fee", inr(t.cod))}
      {t.giftCard > 0 && row("Gift card", `−${inr(t.giftCard)}`, "text-success")}
      <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><span>Total</span><span>{inr(t.total)}</span></div>
    </div>
  );
}

export function CouponBox() {
  const { coupon, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-md border border-success/40 bg-success/10 px-3 py-2.5 text-[13px]">
        <span className="flex items-center gap-2 text-success"><Check className="h-4 w-4" /><b>{coupon.code}</b> applied · {coupon.label}</span>
        <button onClick={removeCoupon} aria-label="Remove coupon" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); const ok = applyCoupon(code); setError(!ok); if (ok) setCode(""); }} className="space-y-1.5">
      <label htmlFor="coupon" className="flex items-center gap-1.5 text-[13px] font-medium"><Tag className="h-3.5 w-3.5" /> Coupon code</label>
      <div className="flex gap-2">
        <input id="coupon" value={code} onChange={(e) => { setCode(e.target.value); setError(false); }} placeholder="e.g. GURU10"
          aria-invalid={error || undefined} className={`input-field h-10 uppercase ${error ? "border-destructive" : ""}`} />
        <button disabled={!code.trim()} className="shrink-0 rounded-md border border-foreground px-4 text-[13px] font-medium transition hover:bg-foreground hover:text-background disabled:opacity-40">Apply</button>
      </div>
      {error && <p role="alert" className="text-[12px] text-destructive">Invalid coupon</p>}
    </form>
  );
}

export function MiniItems({ items }: { items: CartItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.key} className="flex gap-3">
          <div className="relative shrink-0">
            <img src={imageFor(i.product, i.color)} alt={i.product.name} className="h-16 w-12 rounded object-cover" />
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">{i.qty}</span>
          </div>
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="truncate font-medium">{i.product.name}</p>
            <p className="text-[12px] capitalize text-muted-foreground">{[i.color, i.size].filter(Boolean).join(" · ")}</p>
          </div>
          <span className="shrink-0 text-[13px] font-medium">{inr(i.product.price * i.qty)}</span>
        </li>
      ))}
    </ul>
  );
}
