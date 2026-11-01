import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/shop/Info";

export const Route = createFileRoute("/returns-exchange")({
  head: () => infoHead("Returns & Exchange", "Easy returns within 7 days of delivery."),
  component: Page,
});

function Page() {
  return (
    <InfoPage eyebrow="Customer care" title="Returns &amp; Exchange" intro="Easy returns within 7 days of delivery.">
      <p>Not quite right? Return or exchange unused items in their original packaging within 7 days of delivery.</p><p>Refunds are processed to your original payment method within 5–7 business days after we receive the item.</p>
    </InfoPage>
  );
}
