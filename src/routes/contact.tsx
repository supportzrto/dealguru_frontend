
import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/shop/Info";

export const Route = createFileRoute("/contact")({
  head: () =>
    infoHead(
      "Contact Us",
      "Contact DealGuru customer support for product and order assistance."
    ),
  component: Page,
});

function Page() {
  return (
    <InfoPage
      eyebrow="We're here to help"
      title="Contact Us"
      intro="Need help with an order or have a question about a product? Our team is here to assist you."
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-[#142039]">
            Get in touch
          </h2>
          <p className="mt-2 text-slate-500">
            Reach out to us through email or phone. We're happy to help.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <a
            href="mailto:support@dealguru.store"
            className="group rounded-2xl border border-orange-100 bg-[#FFFAF5] p-6 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
              ✉
            </div>
            <h3 className="mt-5 font-semibold text-[#142039]">
              Email Support
            </h3>
            <p className="mt-2 break-all text-sm text-[#F05A00]">
              support@dealguru.store
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Send us your questions anytime.
            </p>
          </a>

          <a
            href="tel:+917093419456"
            className="group rounded-2xl border border-orange-100 bg-[#FFFAF5] p-6 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
              ☎
            </div>
            <h3 className="mt-5 font-semibold text-[#142039]">
              Call Us
            </h3>
            <p className="mt-2 text-sm text-[#F05A00]">
              +91 70934 19456
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Speak directly with our support team.
            </p>
          </a>
        </div>

        <div className="rounded-2xl bg-[#142039] p-6 text-white md:p-8">
          <h3 className="text-lg font-semibold">Customer Support Hours</h3>
          <p className="mt-3 text-sm leading-7 text-white/75">
            Monday to Sunday
            <br />
            10:00 AM – 7:00 PM IST
          </p>
        </div>

        <p className="text-center text-sm text-slate-500">
          We usually reply to email enquiries within one business day.
        </p>
      </div>
    </InfoPage>
  );
}
