import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/shop/Info";

export const Route = createFileRoute("/faqs")({
  head: () => infoHead("FAQs", "Answers to the questions we hear most."),
  component: Page,
});

function Page() {
  return (
    <InfoPage eyebrow="Customer care" title="FAQs" intro="Answers to the questions we hear most.">
      <p><b>Is shipping really free?</b> Yes — shipping is free on every order, with no minimum.</p><p><b>Do you offer Cash on Delivery?</b> No. All orders are prepaid — pay securely with UPI, cards, net banking or wallets.</p><p><b>How do I charge the electric arc lighter?</b> Plug the included USB Type-C cable into any phone charger or laptop USB port.</p><p><b>Do you ship outside India?</b> Not yet — we currently deliver across India only.</p><p><b>Can I cancel my order?</b> Yes, before it ships. Just contact us.</p>
    </InfoPage>
  );
}
