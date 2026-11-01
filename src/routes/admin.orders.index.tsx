import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/components/admin/pages/Orders";
import { adminHead } from "@/components/admin/head";

export const Route = createFileRoute("/admin/orders/")({
  head: () => adminHead("Orders"),
  validateSearch: (s: Record<string, unknown>): { status?: string | undefined } => ({ status: typeof s["status"] === "string" ? s["status"] : undefined }),
  component: P,
});
function P() { return <OrdersPage initialStatus={Route.useSearch().status} />; }
