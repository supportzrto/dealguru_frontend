
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Ban,
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  categoryMeta,
  discountPct,
  inr,
  isCategory,
  productImages,
  swatch,
  type Product,
} from "./data";
import { useProducts } from "@/context/ProductsContext";
import { useSettings } from "@/context/SettingsContext";
import { deliveryFee } from "@/lib/shop/pricing";
import { Crumbs, ProductRow } from "./Collection";
import { useCart, useWishlist } from "./store";

export function ProductDetail({ p }: { p: Product }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const { ids, toggle } = useWishlist();
  const { rules } = useSettings();

  const gallery = productImages(p);
  const [img, setImg] = useState(0);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState<string | undefined>(
    p.sizes.includes("M") ? "M" : p.sizes[0]
  );
  const [qty, setQty] = useState(1);

  const cat = isCategory(p.category)
    ? categoryMeta[p.category]
    : undefined;

  const { products } = useProducts();
  const out = p.stock <= 0;

  const related = products
    .filter((x) => x.id !== p.id)
    .sort(
      (a, b) =>
        Number(b.category === p.category) -
        Number(a.category === p.category)
    )
    .slice(0, 4);

  const wished = ids.has(p.id);
  const freeShip =
    deliveryFee(p.price, "standard", undefined, rules) === 0;

  const pickColor = (i: number) => {
    setColor(i);
    const src = p.colorImages?.[p.colors[i] ?? ""];
    const at = src ? gallery.indexOf(src) : -1;
    if (at >= 0) setImg(at);
  };

  const opts = { qty, color: p.colors[color], size };

  return (
    <>
      <div className="container-x min-w-0 max-w-full py-4 sm:py-6">
        <Crumbs
          items={[
            ...(cat ? [{ label: cat.title, to: cat.to }] : []),
            { label: p.name },
          ]}
        />
      </div>

      <div className="container-x grid min-w-0 max-w-full grid-cols-1 gap-6 overflow-hidden pb-12 sm:gap-10 sm:pb-16 md:grid-cols-2">

        {/* Product Gallery */}
        <div className="flex min-w-0 max-w-full flex-col-reverse gap-3 sm:flex-row">

          {gallery.length > 1 && (
            <div className="no-scrollbar flex w-full min-w-0 gap-2 overflow-x-auto pb-1 sm:w-16 sm:max-h-[640px] sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pb-0">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImg(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={img === i}
                  className={`w-[62px] shrink-0 overflow-hidden rounded-md border-2 bg-muted transition sm:w-full ${
                    img === i
                      ? "border-primary"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={src}
                    alt={`${p.name} view ${i + 1}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="relative min-w-0 w-full flex-1 self-start overflow-hidden rounded-xl bg-muted">
            <img
              src={gallery[img] ?? p.image}
              alt={p.name}
              className="aspect-[3/4] w-full object-cover transition duration-500"
            />

            {out && (
              <div className="absolute inset-0 grid place-items-center bg-background/60">
                <span className="rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background">
                  Out of Stock
                </span>
              </div>
            )}

            {p.badge && (
              <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                {p.badge}
              </span>
            )}
          </div>
        </div>

        {/* Product Information */}
        <div className="min-w-0 w-full">
          {cat && <p className="eyebrow">{cat.title}</p>}

          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {p.name}
          </h1>

          {p.reviewCount > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-star text-star" />
              <span className="font-medium text-foreground">
                {p.rating}
              </span>
              <span>· {p.reviewCount} reviews</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-baseline gap-3 sm:mt-5">
            <span className="text-3xl font-bold text-primary">
              {inr(p.price)}
            </span>

            {p.originalPrice > p.price && (
              <>
                <span className="text-muted-foreground line-through">
                  {inr(p.originalPrice)}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {discountPct(p)}% OFF
                </span>
              </>
            )}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Inclusive of all taxes{freeShip && " · Free shipping"}
          </p>

          {/* Colours */}
          {p.colors.length > 0 && (
            <div className="mt-5 sm:mt-6">
              <p className="mb-2 text-[13px] font-medium">
                Colour:{" "}
                <span className="capitalize text-muted-foreground">
                  {p.colors[color]}
                </span>
              </p>

              <div className="flex flex-wrap gap-3">
                {p.colors.map((c, i) => (
                  <button
                    key={c}
                    aria-label={`Colour ${c}`}
                    aria-pressed={color === i}
                    onClick={() => pickColor(i)}
                    style={{ background: swatch(c) }}
                    className={`h-8 w-8 shrink-0 rounded-full border border-border transition ${
                      color === i
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {p.sizes.length > 0 && (
            <div className="mt-5 sm:mt-6">
              <p className="mb-2 text-[13px] font-medium">Size</p>

              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={`h-10 min-w-12 rounded-md border px-3 text-[13px] font-medium transition ${
                      size === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Bag */}
          <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
            <div className="flex h-12 shrink-0 items-center rounded-md border border-border bg-card">
              <button
                aria-label="Decrease quantity"
                className="grid h-full w-9 place-items-center hover:bg-muted sm:w-10"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="w-7 text-center text-sm">{qty}</span>

              <button
                aria-label="Increase quantity"
                className="grid h-full w-9 place-items-center hover:bg-muted sm:w-10"
                onClick={() =>
                  setQty((q) => Math.min(Math.max(1, p.stock), q + 1))
                }
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => add(p, opts)}
              disabled={out}
              className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-foreground sm:px-6"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {out ? "Out of Stock" : "Add to Bag"}
              </span>
            </button>

            <button
              onClick={() => toggle(p.id)}
              aria-label={
                wished ? "Remove from wishlist" : "Add to wishlist"
              }
              aria-pressed={wished}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-border bg-card transition hover:border-primary"
            >
              <Heart
                className={`h-5 w-5 ${
                  wished ? "fill-primary text-primary" : ""
                }`}
              />
            </button>
          </div>

          {/* Buy Now */}
          <button
            disabled={out}
            onClick={() => {
              if (add(p, { ...opts, silent: true })) {
                navigate({ to: "/checkout" });
              }
            }}
            className="mt-3 h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy Now
          </button>

          {!out && p.stock < 5 && (
            <p className="mt-2 text-[13px] font-medium text-destructive">
              Only {p.stock} left
            </p>
          )}

          {/* Benefits */}
          <ul className="mt-5 grid min-w-0 gap-3 rounded-lg border border-border bg-card p-3 text-[13px] sm:grid-cols-3 sm:p-4">
            <li className="flex min-w-0 items-center gap-2">
              <Truck className="h-4 w-4 shrink-0 text-primary" />
              <span>{freeShip ? "Free shipping" : "Fast shipping"}</span>
            </li>

            <li className="flex min-w-0 items-center gap-2">
              <Ban className="h-4 w-4 shrink-0 text-primary" />
              <span>Prepaid only, no COD</span>
            </li>

            <li className="flex min-w-0 items-center gap-2">
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>Genuine product</span>
            </li>
          </ul>

          {/* Features */}
          {p.features && p.features.length > 0 && (
            <ul className="mt-5 space-y-2 text-[14px]">
              {p.features.map((f) => (
                <li key={f} className="flex min-w-0 gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">{f}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Product Information */}
          <Accordion
            type="single"
            collapsible
            defaultValue="desc"
            className="mt-5 sm:mt-6"
          >
            <AccordionItem value="desc">
              <AccordionTrigger>Description</AccordionTrigger>
              <AccordionContent className="break-words text-muted-foreground">
                {p.description?.trim() ||
                  `${p.name} — a smart everyday find from DealGuru.`}
              </AccordionContent>
            </AccordionItem>

            {p.setIncludes && (
              <AccordionItem value="box">
                <AccordionTrigger>What’s in the box</AccordionTrigger>
                <AccordionContent className="break-words text-muted-foreground">
                  {p.setIncludes}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="ship">
              <AccordionTrigger>Shipping &amp; Returns</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ships in 2–4 business days across India
                {freeShip ? " with free shipping" : ""}. Cash on Delivery is
                not available — all orders are prepaid. Easy returns within
                7 days of delivery.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <ProductRow
          eyebrow="More smart finds"
          title="You May Also Like"
          items={related}
        />
      )}
    </>
  );
}
