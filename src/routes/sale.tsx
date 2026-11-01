import { createFileRoute } from "@tanstack/react-router";
import { SaleCollection, collectionHead, validateCollectionSearch } from "@/components/shop/Collection";

export const Route = createFileRoute("/sale")({
  validateSearch: validateCollectionSearch,
  head: () => collectionHead("Deals", "Limited-time deals on smart everyday finds at DealGuru."),
  component: SaleCollection,
});
