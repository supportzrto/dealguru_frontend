import { createFileRoute } from "@tanstack/react-router";
import { CategoryRow, FeaturedDeal, Hero, ProductGrid, PromoBanner, TrustStrip } from "@/components/shop/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DealGuru | Smart finds. Better living." },
      { name: "description", content: "Shop smart, genuine everyday products at DealGuru — honest prices, free shipping on every order and secure prepaid checkout." },
      { property: "og:title", content: "DealGuru | Smart finds. Better living." },
      { property: "og:description", content: "Smart everyday finds at honest prices, with free shipping on every order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <FeaturedDeal />
      <CategoryRow />
      <ProductGrid />
      <PromoBanner />
    </>
  );
}
