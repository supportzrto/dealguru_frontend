
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { noindexHead, PageSpinner, RequireAuth } from "@/components/shop/forms";
import { AddressText } from "@/components/checkout/AddressForm";
import { firstName, fmtDate, inr } from "@/lib/shop/format";

export const Route = createFileRoute("/order-success/$orderId")({
  head: () => noindexHead(
    "Order Received",
    "Your DealGuru order has been received."
  ),
  component: () => (
    <RequireAuth>
      <Success />
    </RequireAuth>
  ),
});

const COLORS = [
  "var(--primary)",
  "var(--star)",
  "var(--success)",
  "var(--tint-lilac)",
  "var(--tint-pink)",
];

function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 42 }, (_, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLORS[i % COLORS.length],
            animationDelay: `${(i % 7) * 0.12}s`,
            transform: `rotate(${i * 25}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function Success() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const { ready, getOrder } = useOrders();

  const order = getOrder(orderId);

  if (!ready) return <PageSpinner />;

  if (!order) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link to="/orders" className="mt-4 inline-block text-primary">
          View my orders
        </Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "Paid";

  return (
    <div className="bg-blush py-12">
      <Confetti />

      <div className="container-x max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-7 text-center shadow-card sm:p-10">
          <div className="animate-check-pop mx-auto grid h-20 w-20 place-items-center rounded-full bg-success">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--success-foreground)" }}
            >
              <path
                className="animate-check-draw"
                d="M5 12.5l4.5 4.5L19 7.5"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Thank you, {firstName(user?.fullName ?? "")}! Your order has been received.
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {isPaid
              ? "Your payment has been verified. We'll start processing your order."
              : "Your order is saved successfully. Payment is still pending and your order will be confirmed after payment verification."}
          </p>

          <div className="mt-6 rounded-lg border border-border p-4">
            <p className="text-[13px] text-muted-foreground">
              Payment Status
            </p>
            <p className={`mt-1 font-semibold ${isPaid ? "text-success" : "text-amber-600"}`}>
              {isPaid ? "Paid" : "Payment Pending"}
            </p>
          </div>

          <dl className="mt-6 grid gap-4 rounded-lg bg-muted p-5 text-left text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Order ID</dt>
              <dd className="font-semibold">{order.id}</dd>
            </div>

            <div>
              <dt className="text-muted-foreground">Order date</dt>
              <dd className="font-semibold">{fmtDate(order.createdAt)}</dd>
            </div>

            <div>
              <dt className="text-muted-foreground">Payment Method</dt>
              <dd className="font-semibold">{order.paymentMethod}</dd>
            </div>

            <div>
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-semibold text-primary">
                {inr(order.amounts.total)}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground">Estimated delivery</dt>
              <dd className="font-semibold">
                {fmtDate(order.delivery.eta)}
              </dd>
            </div>

            <div>
              <dt className="mb-1 text-muted-foreground">Delivering to</dt>
              <dd>
                <AddressText a={order.address} />
              </dd>
            </div>
          </dl>

          <ul className="mt-6 divide-y divide-border text-left">
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.color}-${item.size}`}
                className="flex items-center gap-3 py-3 text-[13px]"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-14 w-11 rounded object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="capitalize text-muted-foreground">
                    Qty {item.qty}
                    {item.size && ` · ${item.size}`}
                    {item.color && ` · ${item.color}`}
                  </p>
                </div>

                <span className="font-medium">
                  {inr(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/orders/$id"
              params={{ id: order.id }}
              className="rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-primary"
            >
              View Order
            </Link>

            <Link
              to="/shop"
              className="rounded-md border border-foreground px-6 py-3 text-sm font-medium hover:bg-foreground hover:text-background"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
