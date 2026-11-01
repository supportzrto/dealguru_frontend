import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/components/admin/pages/Customers";
import { adminHead } from "@/components/admin/head";

export const Route = createFileRoute("/admin/customers")({
  head: () => adminHead("Customers"),
  component: CustomersPage,
});
