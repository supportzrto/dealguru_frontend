import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/shop/store";
import { Crumbs } from "@/components/shop/Collection";
import { noindexHead } from "@/components/shop/forms";
import { CouponBox, SummaryLines } from "@/components/checkout/OrderSummary";
import { inr } from "@/lib/shop/format";
import { imageFor } from "@/components/shop/data";
import { computeTotals } from "@/lib/shop/pricing";
import { useSettings } from "@/context/SettingsContext";

export const Route = createFileRoute("/cart")({
  head: () => noindexHead("Your Bag", "Review the items in your DealGuru shopping bag."),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, subtotal, coupon, count } = useCart();
  const { rules } = useSettings();
  const t = computeTotals({ subtotal, coupon, rules });

  if (!items.length) {
    return (
      <div className="container-x py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" strokeWidth={1.2} />
        <h1 className="mt-4 text-2xl font-bold">Your bag is empty</h1>
        <p className="mt-1 text-sm text-muted-foreground">Looks like you haven’t added anything yet.</p>
        <Link to="/shop" className="mt-6 inline-block rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <Crumbs items={[{ label: "Bag" }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Your Bag <span className="text-lg font-normal text-muted-foreground">({count} items)</span></h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((i) => (
            <li key={i.key} className="flex gap-4 p-4">
              <Link to="/product/$id" params={{ id: i.product.id }} className="shrink-0">
                <img src={imageFor(i.product, i.color)} alt={i.product.name} className="h-32 w-24 rounded-md bg-muted object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link to="/product/$id" params={{ id: i.product.id }} className="truncate font-medium hover:text-primary">{i.product.name}</Link>
                  <button onClick={() => setQty(i.key, 0)} aria-label={`Remove ${i.product.name}`} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <p className="mt-0.5 text-[13px] capitalize text-muted-foreground">
                  {i.size && <>Size: {i.size}</>}{i.size && i.color && " · "}{i.color && <>Colour: {i.color}</>}
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">{inr(i.product.price)} each</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-md border border-border">
                    <button aria-label="Decrease quantity" className="grid h-8 w-8 place-items-center hover:bg-muted" onClick={() => setQty(i.key, i.qty - 1)}><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-8 text-center text-sm" aria-live="polite">{i.qty}</span>
                    <button aria-label="Increase quantity" className="grid h-8 w-8 place-items-center hover:bg-muted" onClick={() => setQty(i.key, i.qty + 1)}><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <span className="font-semibold text-primary">{inr(i.product.price * i.qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit space-y-5 rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <CouponBox />
          <SummaryLines t={t} coupon={coupon?.code} />
          {t.delivery > 0 && <p className="text-[12px] text-muted-foreground">Add {inr(rules.freeMin - subtotal)} more for free delivery.</p>}
          <Link to="/checkout" className="block w-full rounded-md bg-foreground py-3 text-center text-sm font-medium text-background transition hover:bg-primary">Proceed to Checkout</Link>
          <Link to="/shop" className="block text-center text-[13px] text-primary hover:underline">Continue Shopping</Link>
        </aside>
      </div>
    </div>
  );
}
