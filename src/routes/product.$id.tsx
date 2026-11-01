import { createFileRoute, Link } from "@tanstack/react-router";
import { getProduct } from "@/components/shop/data";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { PageSpinner } from "@/components/shop/forms";
import { useProducts } from "@/context/ProductsContext";

export const Route = createFileRoute("/product/$id")({
  // Seed data only feeds the page title; the live catalog (incl. admin-added products) renders the page.
  loader: ({ params }) => ({ seed: getProduct(params.id) ?? null }),
  head: ({ loaderData }) => {
    const p = loaderData?.seed;
    if (!p) return { meta: [{ title: "Product — DealGuru" }, { name: "description", content: "Smart finds at honest prices — shop at DealGuru." }, { property: "og:title", content: "Product — DealGuru" }, { property: "og:description", content: "Smart finds at honest prices — shop at DealGuru." }] };
    const t = `${p.name} — DealGuru`;
    const d = `${p.name} for ${"₹"}${p.price} with free shipping. Shop now at DealGuru.`;
    return {
      meta: [
        { title: t }, { name: "description", content: d },
        { property: "og:title", content: t }, { property: "og:description", content: d },
        { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductRoute,
  errorComponent: ProductMissing,
});

function ProductRoute() {
  const { id } = Route.useParams();
  const { seed } = Route.useLoaderData();
  const { ready, getProduct: live } = useProducts();
  const product = ready ? live(id) : seed;
  if (!product) return ready ? <ProductMissing /> : <PageSpinner />;
  return <ProductDetail key={product.id} p={product} />;
}

function ProductMissing() {
  return (
    <div className="container-x py-24 text-center">
      <h1 className="text-2xl font-bold">We couldn’t find that product</h1>
      <p className="mt-2 text-sm text-muted-foreground">It may have sold out or moved.</p>
      <Link to="/shop" className="mt-6 inline-block rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-primary">Browse All Products</Link>
    </div>
  );
}
