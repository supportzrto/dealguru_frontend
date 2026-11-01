import { createFileRoute, Link } from "@tanstack/react-router";
import { useOrders } from "@/context/OrdersContext";
import { noindexHead, PageSpinner, RequireAuth } from "@/components/shop/forms";
import { InvoiceView } from "@/components/shop/InvoiceView";

export const Route = createFileRoute("/invoice/$id")({
  head: () => noindexHead("Invoice", "Invoice for your DealGuru order."),
  component: () => <RequireAuth><Invoice /></RequireAuth>,
});

function Invoice() {
  const { id } = Route.useParams();
  const { ready, getOrder } = useOrders();
  const o = getOrder(id);
  if (!ready) return <PageSpinner />;
  if (!o) return <div className="container-x py-20 text-center"><h1 className="text-2xl font-bold">Invoice not found</h1></div>;
  return <InvoiceView order={o} back={<Link to="/orders/$id" params={{ id }} className="text-[13px] text-primary hover:underline">← Back to order</Link>} />;
}
