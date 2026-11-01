import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/shop/Info";

export const Route = createFileRoute("/contact")({
  head: () => infoHead("Contact", "Questions about an order or a product? Reach out anytime."),
  component: Page,
});

function Page() {
  return (
    <InfoPage eyebrow="We’re here to help" title="Contact" intro="Questions about an order or a product? Reach out anytime.">
      <p>Email us at <b>support@dealguru.com</b> or call <b>+91 98765 43210</b>, Monday to Saturday, 10am–7pm IST.</p><p>We usually reply within one business day.</p>
    </InfoPage>
  );
}
