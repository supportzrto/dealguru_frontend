import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/shop/Info";

export const Route = createFileRoute("/about")({
  head: () => infoHead("About Us", "DealGuru finds smart, genuine everyday products and brings them to you at honest prices."),
  component: Page,
});

function Page() {
  return (
    <InfoPage eyebrow="Our story" title="About Us" intro="DealGuru finds smart, genuine everyday products and brings them to you at honest prices.">
      <p>DealGuru began with a simple idea: useful products shouldn’t cost a fortune. We hand-pick practical, quality-checked finds that make everyday life a little easier — and keep our prices honest.</p><p>Every order ships free, and checkout is fully prepaid and secure, so you get your smart finds without the fuss.</p>
    </InfoPage>
  );
}
