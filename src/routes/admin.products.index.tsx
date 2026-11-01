import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/admin/pages/Products";
import { adminHead } from "@/components/admin/head";

export const Route = createFileRoute("/admin/products/")({
  head: () => adminHead("Products"),
  component: ProductsPage,
});
