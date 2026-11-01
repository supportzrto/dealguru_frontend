import { createFileRoute } from "@tanstack/react-router";
import { categoryMeta } from "@/components/shop/data";
import { CategoryCollection, collectionHead, validateCollectionSearch } from "@/components/shop/Collection";

const meta = categoryMeta["gadgets"];

export const Route = createFileRoute("/gadgets")({
  validateSearch: validateCollectionSearch,
  head: () => collectionHead(meta.title, meta.description),
  component: Page,
});

function Page() {
  return <CategoryCollection slug="gadgets" />;
}
