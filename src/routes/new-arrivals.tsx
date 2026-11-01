import { createFileRoute } from "@tanstack/react-router";
import { NewArrivalsCollection, collectionHead, validateCollectionSearch } from "@/components/shop/Collection";

export const Route = createFileRoute("/new-arrivals")({
  validateSearch: validateCollectionSearch,
  head: () => collectionHead("New Arrivals", "The newest smart finds just landed at DealGuru."),
  component: NewArrivalsCollection,
});
