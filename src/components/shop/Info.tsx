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

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children?: ReactNode }) {
  return (
    <>
      <PageBanner eyebrow={eyebrow} title={title} description={intro}><Crumbs items={[{ label: title }]} /></PageBanner>
      <div className="container-x max-w-3xl space-y-4 py-12 text-[14px] leading-relaxed text-foreground/80">{children}</div>
    </>
  );
}
