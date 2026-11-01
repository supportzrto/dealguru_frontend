import type { ReactNode } from "react";
import { Printer } from "lucide-react";
import type { Order } from "@/context/OrdersContext";
import { Logo } from "@/components/shop/Logo";
import { AddressText } from "@/components/checkout/AddressForm";
import { SummaryLines } from "@/components/checkout/OrderSummary";
import { fmtDate, inr } from "@/lib/shop/format";

/** Printable invoice, shared by the customer and admin pages. */
export function InvoiceView({ order: o, back }: { order: Order; back: ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-8">
      <div className="no-print mb-4 flex justify-between">
        {back}
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:bg-primary"><Printer className="h-4 w-4" /> Print / Save as PDF</button>
      </div>
      <article id="invoice" className="rounded-lg border border-border bg-card p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div><Logo /><p className="mt-2 text-[12px] text-muted-foreground">DealGuru · support@dealguru.com</p></div>
          <div className="text-right text-[13px]"><p className="text-xl font-bold">TAX INVOICE</p><p>Invoice #: INV-{o.id.slice(4)}</p><p>Order: {o.id}</p><p>Date: {fmtDate(o.createdAt)}</p></div>
        </header>
        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div><p className="mb-1 text-[12px] font-semibold uppercase text-muted-foreground">Bill / Ship to</p><AddressText a={o.address} /></div>
          <div className="text-[13px]"><p className="mb-1 text-[12px] font-semibold uppercase text-muted-foreground">Payment</p><p>{o.paymentMethod}</p></div>
        </div>
        <table className="w-full text-[13px]">
          <thead><tr className="border-y border-border text-left"><th className="py-2">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={`${i.productId}-${i.color}-${i.size}`} className="border-b border-border">
                <td className="py-2">{i.name}<span className="block text-[11px] capitalize text-muted-foreground">{[i.size, i.color].filter(Boolean).join(" · ")}</span></td>
                <td className="py-2 text-center">{i.qty}</td><td className="py-2 text-right">{inr(i.price)}</td><td className="py-2 text-right">{inr(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-6 max-w-xs"><SummaryLines t={o.amounts} coupon={o.amounts.coupon} /></div>
        <p className="mt-10 text-center text-[11px] text-muted-foreground">This is a demo invoice generated for illustration. Prices include applicable taxes.</p>
      </article>
    </div>
  );
}
