import { createFileRoute, Link } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/head";
import { useOrders } from "@/context/OrdersContext";
import { InvoiceView } from "@/components/shop/InvoiceView";
import { PageSpinner } from "@/components/shop/forms";

export const Route = createFileRoute("/admin/invoice/$id")({
  head: () => adminHead("Invoice"),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  const { orders, ready } = useOrders();
  const o = orders.find((x) => x.id === id);
  if (!ready) return <PageSpinner />;
  if (!o) return <p className="py-10 text-center text-sm">Invoice not found.</p>;
  return <InvoiceView order={o} back={<Link to="/admin/orders/$id" params={{ id }} className="text-[13px] text-primary hover:underline">← Back to order</Link>} />;
}
