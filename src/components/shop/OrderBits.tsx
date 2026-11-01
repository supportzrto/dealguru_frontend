import type { OrderStatus } from "@/context/OrdersContext";

const tone: Record<OrderStatus, string> = {
  Confirmed: "bg-secondary text-primary",
  Packed: "bg-accent text-foreground",
  Shipped: "bg-muted text-foreground",
  "Out for Delivery": "bg-star/20 text-foreground",
  Delivered: "bg-success/15 text-success",
  Cancelled: "bg-destructive/10 text-destructive",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone[status]}`}>{status}</span>;
}
