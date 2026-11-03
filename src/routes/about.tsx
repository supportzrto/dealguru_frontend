import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/shop/Info";

export const Route = createFileRoute("/about")({
  head: () =>
    infoHead(
      "About Us",
      "DealGuru finds smart, genuine everyday products and brings them to you at honest prices."
    ),
  component: Page,
});

function Page() {
  return (
    <InfoPage
      eyebrow="Our Story"
      title="About DealGuru"
      intro="Smart finds. Better living. Discover useful everyday products at prices that make sense."
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-[#142039]">
            Making Everyday Shopping Smarter
          </h2>
          <p className="mt-3">
            DealGuru started with a simple belief: finding useful, quality
            products shouldn't mean spending more. We bring together practical
            everyday essentials that make life easier, more convenient and
            enjoyable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#142039]">
            What Makes DealGuru Different?
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Smart Product Finds", "Practical products selected for everyday needs."],
              ["Honest Pricing", "Great value without unnecessary markups."],
              ["Free Shipping", "Enjoy free shipping on every order."],
              ["Secure Shopping", "A simple and secure prepaid checkout experience."],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-xl border border-orange-100 bg-[#FFFAF5] p-5"
              >
                <h3 className="font-semibold text-[#142039]">{title}</h3>
                <p className="mt-2 text-sm">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-[#142039] p-6 text-white md:p-8">
          <h2 className="text-2xl font-bold">Our Promise</h2>
          <p className="mt-3 text-sm leading-7 text-white/75">
            We aim to make online shopping straightforward with useful
            products, honest prices, free shipping and a smooth shopping
            experience.
          </p>
        </section>
      </div>
    </InfoPage>
  );
}