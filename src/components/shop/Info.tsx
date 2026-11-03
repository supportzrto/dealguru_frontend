import type { ReactNode } from "react";
import { Crumbs, PageBanner } from "./Collection";

export function infoHead(title: string, description: string) {
  const t = `${title} — DealGuru`;
  return {
    meta: [
      { title: t }, { name: "description", content: description },
      { property: "og:title", content: t }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  };
}

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-[#FCFAF7]">
      <section className="relative overflow-hidden border-b border-orange-100 bg-gradient-to-br from-[#FFF0E3] via-[#FFF7EF] to-[#FFFDFC]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-orange-100/50 blur-3xl" />

        <div className="container-x relative py-16 md:py-24">
          <Crumbs items={[{ label: title }]} />

          <div className="mt-10 max-w-3xl">
            <span className="inline-flex rounded-full border border-orange-200 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#F05A00]">
              {eyebrow}
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#142039] md:text-6xl">
              {title}
              <span className="text-[#F05A00]">.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              {intro}
            </p>
          </div>

          <div className="mt-10 h-1 w-20 rounded-full bg-[#F05A00]" />
        </div>
      </section>

      <section className="container-x py-12 md:py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-orange-100/80 bg-white p-6 shadow-[0_8px_40px_rgba(20,32,57,0.04)] md:p-12">
          <div className="space-y-6 text-[15px] leading-8 text-slate-600 md:text-base">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
