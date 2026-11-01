import { useState, type FormEvent, type ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight, BadgeCheck, Check, Facebook, Instagram, Youtube, RotateCcw, ShieldCheck, ShoppingBag, Truck, Ban,
} from "lucide-react";
import hero from "@/assets/hero-lighter.jpg";
import { CATEGORY_SLUGS, categoryMeta, imageFor, inr, popularList, swatch, type Product } from "./data";
import { useProducts } from "@/context/ProductsContext";
import { useSettings } from "@/context/SettingsContext";
import { deliveryFee } from "@/lib/shop/pricing";
import { ProductCard } from "./ProductCard";
import { Logo, SpeedLines } from "./Logo";
import { useCart } from "./store";

export function CtaButton({ children, to, variant = "primary" }: { children: ReactNode; to: NonNullable<LinkProps["to"]>; variant?: "primary" | "ghost" }) {
  const cls = variant === "primary"
    ? "bg-primary text-primary-foreground hover:brightness-95"
    : "border border-current/30 hover:bg-background/10";
  return (
    <Link to={to} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition hover:-translate-y-0.5 ${cls}`}>
      {children} <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function SectionHead({ eyebrow, title, right, to = "/shop" }: { eyebrow: string; title: string; right?: ReactNode; to?: NonNullable<LinkProps["to"]> }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="eyebrow text-primary">{eyebrow}</p>
        <h2 className="mt-1.5 text-[24px] font-bold tracking-tight sm:text-[28px]">{title}</h2>
      </div>
      {right ?? <Link to={to} className="flex shrink-0 items-center gap-1 text-[13px] font-medium hover:text-primary">View All <ArrowRight className="h-3.5 w-3.5" /></Link>}
    </div>
  );
}

export function Hero() {
  const { rules } = useSettings();
  const free = rules.freeMin <= 0 || rules.standardFee <= 0;
  return (
    <section className="relative overflow-hidden bg-hero text-hero-foreground">
      <img src={hero} alt="Electric arc lighter lighting a candle" width={1600} height={800}
        className="absolute inset-0 h-full w-full object-cover object-[75%_center] opacity-50 md:opacity-100" />
      <div className="absolute inset-0 bg-hero-fade" />
      <div className="container-x relative flex min-h-[480px] flex-col justify-center py-16 md:min-h-[540px]">
        <div className="max-w-lg">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-primary">Smart finds. Better living.</p>
          <h1 className="mt-4 text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-[56px]">Everyday deals,<br /><span className="text-gradient-brand">smartly picked.</span></h1>
          <p className="mt-5 max-w-md text-[16px] opacity-80">Genuine, useful products at honest prices — {free ? "with free shipping on every order." : "delivered fast across India."}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton to="/shop">Shop Now</CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustStrip() {
  const { rules } = useSettings();
  const free = rules.freeMin <= 0 || rules.standardFee <= 0;
  const trust = [
    { icon: Truck, t: free ? "Free Shipping" : "Fast Shipping", s: free ? "On every order" : "Across India" },
    { icon: ShieldCheck, t: "Secure Payments", s: "UPI, cards & more" },
    { icon: RotateCcw, t: "Easy Returns", s: "Within 7 days" },
    { icon: BadgeCheck, t: "100% Genuine", s: "Quality checked" },
  ];
  return (
    <section className="border-b border-border bg-card">
      <ul className="container-x grid grid-cols-2 gap-y-5 py-6 md:grid-cols-4">
        {trust.map(({ icon: I, t, s }) => (
          <li key={t} className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary"><I className="h-5 w-5" strokeWidth={1.8} /></span>
            <span className="text-[13px] leading-tight"><b className="block font-semibold">{t}</b><span className="text-muted-foreground">{s}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Big showcase for the top Popular Pick (or the first product). */
export function FeaturedDeal() {
  const { products } = useProducts();
  const p = popularList(products)[0] ?? products[0];
  if (!p) return null;
  return <FeaturedDealBody key={p.id} p={p} />;
}

function FeaturedDealBody({ p }: { p: Product }) {
  const { add } = useCart();
  const { rules } = useSettings();
  const [color, setColor] = useState(-1);
  const picked = color >= 0 ? p.colors[color] : undefined;
  const out = p.stock <= 0;
  const free = deliveryFee(p.price, "standard", undefined, rules) === 0;
  return (
    <section className="container-x py-14">
      <SectionHead eyebrow="Deal of the day" title="Today’s Smart Find" to="/shop" />
      <div className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-card md:grid-cols-[1.05fr_1fr]">
        <Link to="/product/$id" params={{ id: p.id }} className="relative block bg-muted">
          <img src={imageFor(p, picked)} alt={p.name} width={900} height={1200} loading="lazy" className="h-full max-h-[560px] w-full object-cover" />
          {p.badge && <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">{p.badge}</span>}
        </Link>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <h3 className="text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">{p.name}</h3>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-[36px] font-extrabold text-primary">{inr(p.price)}</span>
            {p.originalPrice > p.price && <span className="text-muted-foreground line-through">{inr(p.originalPrice)}</span>}
          </div>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            {free && <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" /> Free shipping</span>}
            <span className="flex items-center gap-1.5"><Ban className="h-4 w-4 text-primary" /> No COD — prepaid only</span>
          </p>
          {p.features && p.features.length > 0 && (
            <ul className="mt-6 space-y-2 text-[14px]">
              {p.features.slice(0, 4).map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>)}
            </ul>
          )}
          {p.colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-[13px] font-medium">Choose colour{picked && <>: <span className="capitalize text-muted-foreground">{picked}</span></>}</p>
              <div className="flex flex-wrap gap-2.5">
                {p.colors.map((c, i) => (
                  <button key={c} aria-label={`Colour ${c}`} aria-pressed={color === i} onClick={() => setColor(i)} style={{ background: swatch(c) }}
                    className={`h-8 w-8 rounded-full border border-border transition hover:scale-110 ${color === i ? "ring-2 ring-primary ring-offset-2" : ""}`} />
                ))}
              </div>
            </div>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <button disabled={out} onClick={() => add(p, { color: picked ?? p.colors[0] })}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">
              <ShoppingBag className="h-4 w-4" /> {out ? "Out of Stock" : "Add to Bag"}
            </button>
            <Link to="/product/$id" params={{ id: p.id }} className="flex h-12 items-center justify-center rounded-full border border-foreground px-6 text-sm font-semibold transition hover:bg-foreground hover:text-background">View Details</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryRow() {
  const { products } = useProducts();
  const cats = CATEGORY_SLUGS.map((c) => ({ c, items: products.filter((p) => p.category === c) })).filter((x) => x.items.length);
  if (cats.length < 2) return null;
  return (
    <section className="container-x pb-14">
      <SectionHead eyebrow="Shop by category" title="Explore Categories" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cats.map(({ c, items }) => (
          <Link key={c} to={categoryMeta[c].to} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-card">
            <img src={imageFor(items[0]!)} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg bg-muted object-cover" />
            <span className="min-w-0"><b className="block text-[14px] group-hover:text-primary">{categoryMeta[c].title}</b><span className="text-[12px] text-muted-foreground">{items.length} {items.length === 1 ? "product" : "products"}</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Other Popular Picks (hidden while the featured deal is the only one). */
export function ProductGrid() {
  const { products } = useProducts();
  const featured = popularList(products)[0] ?? products[0];
  const rest = popularList(products).filter((p) => p.id !== featured?.id);
  const list = rest.length ? rest : products.filter((p) => p.id !== featured?.id).slice(0, 8);
  if (!list.length) return null;
  return (
    <section className="container-x pb-14">
      <SectionHead eyebrow="Trending now" title="Popular Picks" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

export function PromoBanner() {
  const { rules } = useSettings();
  const free = rules.freeMin <= 0 || rules.standardFee <= 0;
  return (
    <section className="container-x pb-16">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-brand px-6 py-10 text-primary-foreground sm:px-12 sm:py-14">
        <SpeedLines className="absolute -right-4 top-1/2 h-40 -translate-y-1/2 opacity-20" />
        <div className="relative max-w-xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] opacity-90">The DealGuru promise</p>
          <h2 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight sm:text-[38px]">{free ? "Free shipping on every single order." : "Honest prices, every day."}</h2>
          <p className="mt-3 text-[15px] opacity-90">No minimum order. Pay securely online with UPI, cards, net banking or wallets.</p>
          <div className="mt-6">
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[14px] font-semibold text-background transition hover:-translate-y-0.5">Start Shopping <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pinterest(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} aria-hidden><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.8 0 1.2.6 1.2 1.4 0 .8-.5 2.1-.8 3.2-.2 1 .5 1.8 1.5 1.8 1.8 0 3.2-1.9 3.2-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.6 2.2-4.6 4.4 0 .9.3 1.8.8 2.3l.1.4-.3 1.2c0 .2-.2.3-.4.2-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.3 6.5-5.4 6.5-1.1 0-2.1-.6-2.4-1.2l-.7 2.5c-.2.9-.9 2.1-1.3 2.8A10 10 0 1 0 12 2Z" /></svg>;
}

export function Footer() {
  const { settings } = useSettings();
  const { products } = useProducts();
  const [email, setEmail] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Please enter a valid email address"); return; }
    toast.success("Subscribed! Watch your inbox for deals.");
    setEmail("");
  };
  const col = "text-[12px] font-semibold uppercase tracking-wider mb-3";
  const link = "block text-[13px] text-muted-foreground transition hover:text-primary";
  const quick: [string, NonNullable<LinkProps["to"]>][] = [["Home", "/"], ["Shop All", "/shop"], ["About Us", "/about"], ["Contact", "/contact"]];
  const shop: [string, NonNullable<LinkProps["to"]>][] = [
    ...CATEGORY_SLUGS.filter((c) => products.some((p) => p.category === c)).map((c) => [categoryMeta[c].title, categoryMeta[c].to] as [string, NonNullable<LinkProps["to"]>]),
    ["New Arrivals", "/new-arrivals"],
  ];
  const care: [string, NonNullable<LinkProps["to"]>][] = [["Shipping Policy", "/shipping-policy"], ["Returns & Exchange", "/returns-exchange"], ["FAQs", "/faqs"], ["Track Order", "/orders"]];
  const socials = [
    { I: Instagram, l: "Instagram" }, { I: Facebook, l: "Facebook" }, { I: Pinterest, l: "Pinterest" }, { I: Youtube, l: "YouTube" },
  ];
  return (
    <footer className="border-t border-border bg-beige">
      <div className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.6fr]">
        <div>
          <Logo className="h-9" />
          <p className="mt-3 text-[13px] text-muted-foreground">{settings.tagline}</p>
          <div className="mt-4 flex gap-2">{socials.map(({ I, l }) => (
            <a key={l} href="#" aria-label={l} className="grid h-8 w-8 place-items-center rounded-full border border-foreground/15 bg-card transition hover:bg-primary hover:text-primary-foreground"><I className="h-3.5 w-3.5" /></a>
          ))}</div>
        </div>
        <div><h3 className={col}>Quick Links</h3><div className="space-y-2">{quick.map(([l, to]) => <Link key={l} to={to} className={link}>{l}</Link>)}</div></div>
        <div><h3 className={col}>Shop</h3><div className="space-y-2">{shop.map(([l, to]) => <Link key={l} to={to} className={link}>{l}</Link>)}</div></div>
        <div><h3 className={col}>Customer Care</h3><div className="space-y-2">{care.map(([l, to]) => <Link key={l} to={to} className={link}>{l}</Link>)}</div></div>
        <div>
          <h3 className={col}>Get Deal Alerts</h3>
          <p className="mb-3 text-[13px] text-muted-foreground">Be first to hear about new finds and offers.</p>
          <form onSubmit={submit} className="flex gap-2" noValidate>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address"
              className="min-w-0 flex-1 rounded-full border border-input bg-card px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/40" />
            <button className="shrink-0 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:brightness-95">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="border-t border-foreground/10">
        <div className="container-x flex flex-col justify-between gap-2 py-4 text-[12px] text-muted-foreground sm:flex-row">
          <p>© 2026 {settings.storeName}. All rights reserved.</p>
          <p>Free shipping on every order · Prepaid orders only</p>
        </div>
      </div>
    </footer>
  );
}
