import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailPage } from "@/components/admin/pages/OrderDetail";
import { adminHead } from "@/components/admin/head";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => adminHead("Order Details"),
  component: Page,
});
function Page() { return <OrderDetailPage id={Route.useParams().id} />; }
