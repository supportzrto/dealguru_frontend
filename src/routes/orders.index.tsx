
import { createFileRoute, Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { statusAt, useOrders } from "@/context/OrdersContext";
import { noindexHead, PageSpinner, RequireAuth } from "@/components/shop/forms";
import { Crumbs } from "@/components/shop/Collection";
import { StatusPill } from "@/components/shop/OrderBits";
import { fmtDate, inr } from "@/lib/shop/format";

export const Route = createFileRoute("/orders/")({
  head: () => noindexHead(
    "My Orders",
    "Track and manage your DealGuru orders."
  ),
  component: () => (
    <RequireAuth>
      <Orders />
    </RequireAuth>
  ),
});

function Orders() {
  const { ready, myOrders } = useOrders();

  if (!ready) return <PageSpinner />;

  return (
    <div className="container-x py-8">
      <Crumbs items={[{ label: "My Orders" }]} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        My Orders
      </h1>

      {myOrders.length === 0 ? (
        <div className="py-16 text-center">
          <Package
            className="mx-auto h-12 w-12 text-muted-foreground"
            strokeWidth={1.2}
          />

          <p className="mt-3 font-semibold">No orders yet</p>

          <p className="mt-1 text-sm text-muted-foreground">
            When you place an order, you can track it here.
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-block rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-primary"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {myOrders.map((order) => {
            const status = statusAt(order);

            return (
              <li
                key={order.id}
                className="rounded-lg border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[13px]">
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-muted-foreground">
                      Placed {fmtDate(order.createdAt)}
                    </p>
                  </div>

                  <StatusPill status={status} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 4).map((item, index) => (
                      <img
                        key={index}
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-12 rounded-md border-2 border-card object-cover"
                      />
                    ))}

                    {order.items.length > 4 && (
                      <span className="grid h-16 w-12 place-items-center rounded-md border-2 border-card bg-muted text-xs">
                        +{order.items.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {inr(order.amounts.total)}
                    </span>

                    <Link
                      to="/orders/$id"
                      params={{ id: order.id }}
                      className="rounded-md border border-foreground px-4 py-2 text-[13px] font-medium hover:bg-foreground hover:text-background"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
