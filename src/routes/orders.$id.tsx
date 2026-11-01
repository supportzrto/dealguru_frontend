
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, FileText, X } from "lucide-react";
import { toast } from "sonner";

import {
  canCancel,
  statusAt,
  useOrders,
} from "@/context/OrdersContext";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  noindexHead,
  PageSpinner,
  RequireAuth,
} from "@/components/shop/forms";

import { Crumbs } from "@/components/shop/Collection";
import { StatusPill } from "@/components/shop/OrderBits";
import { AddressText } from "@/components/checkout/AddressForm";
import { SummaryLines } from "@/components/checkout/OrderSummary";
import { fmtDate, fmtDateTime, inr } from "@/lib/shop/format";

export const Route = createFileRoute("/orders/$id")({
  head: () => noindexHead(
    "Order Details",
    "Track your DealGuru order."
  ),
  component: () => (
    <RequireAuth>
      <OrderDetail />
    </RequireAuth>
  ),
});

const TRACKING_STEPS = [
  "Pending Payment",
  "Processing",
  "Shipped",
  "Delivered",
] as const;

function OrderDetail() {
  const { id } = Route.useParams();

  const { ready, getOrder, cancelOrder } = useOrders();

  const [confirm, setConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const order = getOrder(id);

  if (!ready) return <PageSpinner />;

  if (!order) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link
          to="/orders"
          className="mt-4 inline-block text-primary"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const status = statusAt(order);
  const cancelled = status === "Cancelled";
  const reached = TRACKING_STEPS.indexOf(
    status as (typeof TRACKING_STEPS)[number]
  );

  const handleCancel = async () => {
    setCancelling(true);

    try {
      await cancelOrder(order.id);
      setConfirm(false);
      toast.success("Order cancelled successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel order"
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container-x py-8">
      <Crumbs
        items={[
          { label: "My Orders", to: "/orders" },
          { label: order.id },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {order.id}
            <StatusPill status={status} />
          </h1>

          <p className="mt-1 text-[13px] text-muted-foreground">
            Placed on {fmtDateTime(order.createdAt)}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/invoice/$id"
            params={{ id: order.id }}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-[13px] font-medium hover:border-foreground"
          >
            <FileText className="h-4 w-4" />
            Download Invoice
          </Link>

          {canCancel(status) && (
            <button
              onClick={() => setConfirm(true)}
              className="rounded-md border border-destructive px-4 py-2 text-[13px] font-medium text-destructive hover:bg-destructive/10"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <section
        className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-6"
        aria-label="Tracking"
      >
        <h2 className="mb-6 font-semibold">Order Tracking</h2>

        {cancelled ? (
          <p className="flex items-center gap-2 text-[13px] text-destructive">
            <X className="h-4 w-4" />
            This order has been cancelled.
          </p>
        ) : (
          <>
            {status === "Pending Payment" && (
              <p className="mb-5 text-[13px] text-amber-600">
                Payment is pending. Order processing will begin after
                payment verification.
              </p>
            )}

            <ol className="grid gap-6 sm:grid-cols-4 sm:gap-0">
              {TRACKING_STEPS.map((step, index) => {
                const done = reached >= 0 && index <= reached;

                return (
                  <li
                    key={step}
                    className="relative flex gap-3 sm:flex-col sm:items-center sm:text-center"
                  >
                    {index > 0 && (
                      <span
                        className={`absolute hidden h-0.5 sm:block sm:left-[-50%] sm:right-1/2 sm:top-4 ${
                          done ? "bg-success" : "bg-border"
                        }`}
                      />
                    )}

                    <span
                      className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        done
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </span>

                    <div className="text-[13px] sm:mt-2">
                      <p
                        className={
                          done
                            ? "font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {step}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {order.trackingNumber && (
          <p className="mt-6 text-[13px] text-muted-foreground">
            Tracking number:{" "}
            <b className="text-foreground">
              {order.trackingNumber}
            </b>
          </p>
        )}

        {!cancelled &&
          status !== "Delivered" &&
          status !== "Pending Payment" && (
            <p className="mt-6 text-[13px] text-muted-foreground">
              Estimated delivery:{" "}
              <b className="text-foreground">
                {fmtDate(order.delivery.eta)}
              </b>
            </p>
          )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Items</h2>

          <ul className="divide-y divide-border">
            {order.items.map((item, index) => (
              <li
                key={`${item.productId}-${item.color}-${item.size}-${index}`}
                className="flex items-center gap-4 py-3"
              >
                {item.productId ? (
                  <Link
                    to="/product/$id"
                    params={{ id: item.productId }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-16 rounded object-cover"
                    />
                  </Link>
                ) : (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-16 rounded object-cover"
                  />
                )}

                <div className="min-w-0 flex-1 text-[13px]">
                  <p className="truncate font-medium">
                    {item.name}
                  </p>

                  <p className="capitalize text-muted-foreground">
                    Qty {item.qty}
                    {item.size && ` · ${item.size}`}
                    {item.color && ` · ${item.color}`}
                  </p>
                </div>

                <span className="text-[13px] font-medium">
                  {inr(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-3 font-semibold">
              Delivery Address
            </h2>

            <AddressText a={order.address} />
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-3 font-semibold">Payment</h2>

            <p className="mb-2 text-[13px] text-muted-foreground">
              {order.paymentMethod}
            </p>

            <p className="mb-4 text-[13px] font-semibold">
              Payment Status: {order.paymentStatus ?? "Pending"}
            </p>

            <SummaryLines
              t={order.amounts}
              coupon={order.amounts.coupon}
            />
          </section>
        </div>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>
            Cancel this order?
          </AlertDialogTitle>

          <AlertDialogDescription>
            This unpaid order will be cancelled and its reserved
            product stock will be restored.
          </AlertDialogDescription>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              Keep Order
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={cancelling}
              onClick={(event) => {
                event.preventDefault();
                void handleCancel();
              }}
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
