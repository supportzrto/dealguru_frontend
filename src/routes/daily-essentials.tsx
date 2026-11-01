import { createFileRoute } from "@tanstack/react-router";
import { categoryMeta } from "@/components/shop/data";
import { CategoryCollection, collectionHead, validateCollectionSearch } from "@/components/shop/Collection";

const meta = categoryMeta["daily-essentials"];

export const Route = createFileRoute("/daily-essentials")({
  validateSearch: validateCollectionSearch,
  head: () => collectionHead(meta.title, meta.description),
  component: Page,
});

function Page() {
  return <CategoryCollection slug="daily-essentials" />;
}
