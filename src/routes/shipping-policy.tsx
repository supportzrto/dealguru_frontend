import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/shop/Info";

export const Route = createFileRoute("/shipping-policy")({
  head: () => infoHead("Shipping Policy", "Fast, tracked delivery across India."),
  component: Page,
});

function Page() {
  return (
    <InfoPage eyebrow="Customer care" title="Shipping Policy" intro="Fast, tracked delivery across India.">
      <p>Orders ship within 2–4 business days and arrive in 3–7 days depending on your location.</p><p>Shipping is free on every order — no minimum order value.</p><p>Cash on Delivery is not available; all orders are prepaid online.</p>
    </InfoPage>
  );
}
