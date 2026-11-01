// Demo only. Replace with Supabase auth, DB and storage later.
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Printer } from "lucide-react";
import { toast } from "sonner";
import { paymentStatusOf, statusAt, timelineOf, useOrders } from "@/context/OrdersContext";
import { StatusPill } from "@/components/shop/OrderBits";
import { AddressText } from "@/components/checkout/AddressForm";
import { SummaryLines } from "@/components/checkout/OrderSummary";
import { fmtDateTime, inr } from "@/lib/shop/format";
import { btnOutline, btnPrimary, inputCls, Panel, TableSkeleton } from "../ui";
import { PayPill, StatusSelect } from "./Orders";

export function OrderDetailPage({ id }: { id: string }) {
  const { orders, ready, updateOrder } = useOrders();
  const o = orders.find((x) => x.id === id);
  const [tracking, setTracking] = useState("");
  const [note, setNote] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  useEffect(() => {
    setTracking(o?.trackingNumber ?? "");
    setNote(o?.internalNote ?? "");
  }, [o?.id, o?.trackingNumber, o?.internalNote]);

  if (!ready)
    return (
      <Panel>
        <TableSkeleton />
      </Panel>
    );
  if (!o)
    return (
      <Panel>
        <p className="py-10 text-center text-sm">
          Order not found.{" "}
          <Link to="/admin/orders" className="text-primary">
            Back to orders
          </Link>
        </p>
      </Panel>
    );
  const status = statusAt(o);
  const timeline = timelineOf(o);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/orders" className="text-[12px] text-primary hover:underline">
            ← All orders
          </Link>
          <h2 className="mt-1 flex items-center gap-3 text-2xl font-bold tracking-tight">
            {o.id} <StatusPill status={status} />
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Placed {fmtDateTime(o.createdAt)}
            {o.statusManual ? " · status managed by admin" : " · auto-updating (demo)"}
          </p>
        </div>
        <Link to="/admin/invoice/$id" params={{ id: o.id }} className={btnOutline}>
          <Printer className="h-4 w-4" /> Print Invoice
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-border">
              {o.items.map((i) => (
                <li
                  key={`${i.productId}-${i.color}-${i.size}`}
                  className="flex items-center gap-4 py-3"
                >
                  <img src={i.image} alt={i.name} className="h-20 w-16 rounded object-cover" />
                  <div className="min-w-0 flex-1 text-[13px]">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="capitalize text-muted-foreground">
                      Qty {i.qty}
                      {i.size && ` · Size ${i.size}`}
                      {i.color && ` · ${i.color}`}
                    </p>
                  </div>
                  <span className="text-[13px] font-medium">{inr(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="ml-auto mt-4 max-w-xs border-t border-border pt-4">
              <SummaryLines t={o.amounts} coupon={o.amounts.coupon} />
            </div>
          </Panel>
          <Panel title="Status timeline">
            <ol className="space-y-4">
              {timeline.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${h.status === "Cancelled" ? "bg-destructive/10 text-destructive" : "bg-success text-success-foreground"}`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-[13px]">
                    <p className="font-semibold">{h.status}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDateTime(h.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Update Status">
            <StatusSelect order={o} />
            <p className="mt-2 text-[12px] text-muted-foreground">
              {status === "Cancelled"
                ? "Cancelled orders can’t be changed. Stock was restored."
                : "Changes are shown to the customer right away."}
            </p>
          </Panel>
          <Panel title="Customer">
            <div className="space-y-1 text-[13px]">
              <p className="font-medium">{o.customerName ?? o.address.fullName}</p>
              <p className="text-muted-foreground">{o.customerEmail ?? "—"}</p>
              <p className="text-muted-foreground">+91 {o.address.phone}</p>
            </div>
            <p className="mb-1 mt-4 text-[12px] font-semibold uppercase text-muted-foreground">
              Shipping address
            </p>
            <AddressText a={o.address} />
          </Panel>
          <Panel title="Payment">
            <div className="flex items-center justify-between text-[13px]">
              <span>{o.paymentMethod}</span>
              <PayPill s={paymentStatusOf(o)} />
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              Only masked details are stored.
            </p>
          </Panel>
          <Panel title="Shipping & notes">
            <label htmlFor="tracking" className="text-[12px] font-medium">
              Tracking number
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="tracking"
                value={tracking}
                maxLength={40}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="e.g. DLV123456789"
                className={`${inputCls} min-w-0 flex-1`}
              />
              <button
                className={btnPrimary}
                disabled={savingTracking}
                onClick={async () => {
                  setSavingTracking(true);
                  try {
                    await updateOrder(o.id, {
                      trackingNumber: tracking.trim() || undefined,
                    });
                    toast.success("Tracking number saved");
                  } catch {
                    toast.error("Failed to save tracking number");
                  } finally {
                    setSavingTracking(false);
                  }
                }}
              >
                Save
              </button>
            </div>
            <label htmlFor="note" className="mt-4 block text-[12px] font-medium">
              Internal note (admin only)
            </label>
            <textarea
              id="note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-card p-3 text-[13px] outline-none focus:border-primary"
              placeholder="Add internal note"
            />
            <button
              className={`${btnOutline} mt-2`}
              disabled={savingNote}
              onClick={async () => {
                setSavingNote(true);
                try {
                  await updateOrder(o.id, {
                    internalNote: note.trim() || undefined,
                  });
                  toast.success("Note saved");
                } catch {
                  toast.error("Failed to save note");
                } finally {
                  setSavingNote(false);
                }
              }}
            >
              Save note
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
