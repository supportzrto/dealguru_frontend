import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { SlidersHorizontal, Star, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  applyFilters, byCategory, categoryMeta, csv, inr, newArrivals, swatch,
  parseFilters, saleProducts, type CategorySlug, type Filters, type Product, type SortKey,
} from "./data";
import { SpeedLines } from "./Logo";
import { useProducts } from "@/context/ProductsContext";
import { ProductCard } from "./ProductCard";

const PAGE = 12;
const MAX_PRICE = 5000;
const sortLabels: Record<SortKey, string> = {
  featured: "Featured", "price-asc": "Price: Low to High", "price-desc": "Price: High to Low", newest: "Newest", rating: "Top Rated",
};

export const validateCollectionSearch = (s: Record<string, unknown>): Filters => parseFilters(s);

export function collectionHead(title: string, description: string) {
  const t = `${title} — DealGuru`;
  return {
    meta: [
      { title: t }, { name: "description", content: description },
      { property: "og:title", content: t }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

export function PageBanner({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-blush">
      <SpeedLines className="absolute -right-6 top-1/2 hidden h-28 -translate-y-1/2 text-primary/25 sm:block" />
      <div className="container-x relative py-10 sm:py-12">
        {children}
        <p className="eyebrow mt-4">{eyebrow}</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>}
      </div>
    </section>
  );
}

export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[12px] text-muted-foreground">
      <Link to="/" className="hover:text-primary">Home</Link>
      {items.map((i) => (
        <span key={i.label}> / {i.to ? <Link to={i.to} className="hover:text-primary">{i.label}</Link> : <span className="text-foreground">{i.label}</span>}</span>
      ))}
    </nav>
  );
}

function useFilters() {
  const search = useSearch({ strict: false }) as Filters;
  const navigate = useNavigate();
  const set = (patch: Partial<Filters>, keepPage = false) => {
    const next = { ...search, ...patch, ...(keepPage ? {} : { page: undefined }) };
    (Object.keys(next) as (keyof Filters)[]).forEach((k) => (next[k] === undefined || next[k] === "") && delete next[k]);
    navigate({ to: ".", search: next as never, replace: true, resetScroll: false });
  };
  return { f: search, set };
}

const toggleCsv = (v: string | undefined, item: string) => {
  const list = csv(v);
  const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  return next.length ? next.join(",") : undefined;
};

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return <div className="border-b border-border py-5"><h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider">{title}</h3>{children}</div>;
}

function FilterPanel({ items }: { items: Product[] }) {
  const { f, set } = useFilters();
  const colorsIn = [...new Set(items.flatMap((p) => p.colors))];
  const [price, setPrice] = useState(f.max ?? MAX_PRICE);
  useEffect(() => setPrice(f.max ?? MAX_PRICE), [f.max]);
  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-semibold">Filters</h2>
        <button onClick={() => set({ color: undefined, rating: undefined, max: undefined })} className="text-[12px] text-primary hover:underline">Clear all</button>
      </div>
      <FilterGroup title="Price">
        <Slider min={0} max={MAX_PRICE} step={100} value={[price]} onValueChange={(v) => setPrice(v[0] ?? MAX_PRICE)}
          onValueCommit={(v) => { const n = v[0] ?? MAX_PRICE; set({ max: n >= MAX_PRICE ? undefined : n }); }} aria-label="Maximum price" />
        <div className="mt-3 flex justify-between text-[12px] text-muted-foreground"><span>₹0</span><span>Up to {inr(price)}</span></div>
      </FilterGroup>
      <FilterGroup title="Colour">
        <div className="flex flex-wrap gap-2.5">
          {colorsIn.map((c) => {
            const on = csv(f.color).includes(c);
            return (
              <button key={c} aria-label={`Colour ${c}`} aria-pressed={on} onClick={() => set({ color: toggleCsv(f.color, c) })} style={{ background: swatch(c) }}
                className={`h-6 w-6 rounded-full border border-border transition hover:scale-110 ${on ? "ring-2 ring-primary ring-offset-2" : ""}`} />
            );
          })}
        </div>
      </FilterGroup>
      <FilterGroup title="Rating">
        <div className="space-y-2">
          {[4, 3].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-[13px]">
              <input type="radio" name="rating" className="h-3.5 w-3.5 accent-primary" checked={f.rating === r} onChange={() => set({ rating: r })} />
              {r}<Star className="h-3 w-3 fill-star text-star" /> &amp; up
            </label>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function Chips() {
  const { f, set } = useFilters();
  const chips: { label: string; clear: () => void }[] = [
    ...csv(f.color).map((c) => ({ label: c, clear: () => set({ color: toggleCsv(f.color, c) }) })),
    ...(f.rating ? [{ label: `${f.rating}★ & up`, clear: () => set({ rating: undefined }) }] : []),
    ...(f.max != null ? [{ label: `Up to ${inr(f.max)}`, clear: () => set({ max: undefined }) }] : []),
  ];
  if (!chips.length) return null;
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {chips.map((c) => (
        <button key={c.label} onClick={c.clear} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px] capitalize transition hover:border-primary hover:text-primary">
          {c.label}<X className="h-3 w-3" aria-label={`Remove ${c.label}`} />
        </button>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return <div className="overflow-hidden rounded-lg border border-border bg-card"><Skeleton className="aspect-[3/4] rounded-none" /><div className="space-y-2 p-3"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-1/2" /></div></div>;
}

export function CollectionPage({ eyebrow, title, description, items, showDiscount = false, alsoLike }:
  { eyebrow: string; title: string; description: string; items: Product[]; showDiscount?: boolean; alsoLike?: Product[] }) {
  const { f, set } = useFilters();
  const [drawer, setDrawer] = useState(false);
  const filtered = useMemo(() => applyFilters(items, f), [items, f]);
  const page = Math.max(1, f.page ?? 1);
  const shown = filtered.slice(0, page * PAGE);
  const key = JSON.stringify({ ...f, page: undefined, title });
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, [key]);

  return (
    <>
      <PageBanner eyebrow={eyebrow} title={title} description={description}>
        <Crumbs items={[{ label: title }]} />
      </PageBanner>
      <div className="container-x py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawer(true)} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[13px] font-medium lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <p className="text-[13px] text-muted-foreground">{filtered.length} {filtered.length === 1 ? "product" : "products"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[13px] text-muted-foreground sm:inline">Sort by</span>
            <Select value={f.sort ?? "featured"} onValueChange={(v) => set({ sort: v === "featured" ? undefined : (v as SortKey) })}>
              <SelectTrigger className="h-9 w-[170px] bg-card text-[13px]" aria-label="Sort products"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(sortLabels) as SortKey[]).map((k) => <SelectItem key={k} value={k}>{sortLabels[k]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="hidden lg:block"><div className="sticky top-24"><FilterPanel items={items} /></div></aside>
          <div className="min-w-0">
            <Chips />
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}</div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
                <p className="text-lg font-semibold">New deals are coming soon</p>
                <p className="mt-1 text-sm text-muted-foreground">Nothing here just yet — check out everything else we have in store.</p>
                <Link to="/shop" className="mt-5 inline-block rounded-md bg-foreground px-5 py-2.5 text-[13px] font-medium text-background hover:bg-primary">Shop All Products</Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
                <p className="text-lg font-semibold">Nothing matches those filters</p>
                <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or two — there’s plenty more to discover.</p>
                <button onClick={() => set({ color: undefined, rating: undefined, max: undefined })}
                  className="mt-5 rounded-md bg-foreground px-5 py-2.5 text-[13px] font-medium text-background hover:bg-primary">Clear filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {shown.map((p) => <ProductCard key={p.id} p={p} showDiscount={showDiscount} />)}
                </div>
                {shown.length < filtered.length && (
                  <div className="mt-10 text-center">
                    <button onClick={() => set({ page: page + 1 }, true)} className="rounded-md border border-foreground px-6 py-2.5 text-[13px] font-medium transition hover:bg-foreground hover:text-background">
                      Load more ({filtered.length - shown.length} left)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {alsoLike && alsoLike.length > 0 && <ProductRow title="You May Also Like" eyebrow="More to explore" items={alsoLike} />}
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-80 overflow-y-auto bg-card">
          <SheetHeader><SheetTitle className="sr-only">Filters</SheetTitle></SheetHeader>
          <div className="px-4 pb-6"><FilterPanel items={items} /></div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ProductRow({ title, eyebrow, items }: { title: string; eyebrow: string; items: Product[] }) {
  return (
    <section className="container-x pb-14">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mb-6 mt-1.5 text-[22px] font-bold tracking-tight">{title}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}

export function CategoryCollection({ slug }: { slug: CategorySlug }) {
  const m = categoryMeta[slug];
  const { products } = useProducts();
  const alsoLike = useMemo(() => {
    const others = products.filter((p) => p.category !== slug);
    if (!others.length) return [];
    return [...new Set([0, 1, 2, 3].map((i) => others[(i * 13 + slug.length * 5) % others.length]!))];
  }, [slug, products]);
  return <CollectionPage eyebrow={m.eyebrow} title={m.title} description={m.description} items={byCategory(slug, products)} alsoLike={alsoLike} />;
}

export function NewArrivalsCollection() {
  const { products } = useProducts();
  return <CollectionPage eyebrow="Just landed" title="New Arrivals" description="The newest smart finds at DealGuru." items={newArrivals(products)} />;
}
export function SaleCollection() {
  const { products } = useProducts();
  return <CollectionPage eyebrow="Limited time" title="Deals" description="Handpicked products at special prices." items={saleProducts(products)} showDiscount />;
}
export function AllProductsCollection() {
  const { products } = useProducts();
  return <CollectionPage eyebrow="Everything in store" title="Shop All" description="Smart finds at honest prices — free shipping on every order." items={products} />;
}
