import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/pages/ProductForm";
import { adminHead } from "@/components/admin/head";
import { useProducts } from "@/context/ProductsContext";
import { PageSpinner } from "@/components/shop/forms";

export const Route = createFileRoute("/admin/products/$id/edit")({
  head: () => adminHead("Edit Product"),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  const { all, ready } = useProducts();
  const p = all.find((x) => x.id === id);
  if (!ready) return <PageSpinner />;
  if (!p) return <p className="py-10 text-center text-sm">Product not found. <Link to="/admin/products" className="text-primary">Back to products</Link></p>;
  return <ProductForm key={p.id} product={p} />;
}
