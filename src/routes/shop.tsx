import { createFileRoute } from "@tanstack/react-router";
import { AllProductsCollection, collectionHead, validateCollectionSearch } from "@/components/shop/Collection";

export const Route = createFileRoute("/shop")({
  validateSearch: validateCollectionSearch,
  head: () => collectionHead("Shop All", "Every smart find at DealGuru — honest prices, free shipping on every order."),
  component: AllProductsCollection,
});
