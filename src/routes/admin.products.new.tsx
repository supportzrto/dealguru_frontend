import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/pages/ProductForm";
import { adminHead } from "@/components/admin/head";

export const Route = createFileRoute("/admin/products/new")({
  head: () => adminHead("Add Product"),
  component: () => <ProductForm />,
});
