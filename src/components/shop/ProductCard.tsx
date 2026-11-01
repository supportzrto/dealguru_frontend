import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { discountPct, imageFor, inr, swatch, type Product } from "./data";
import { useCart, useWishlist } from "./store";

export function ProductCard({ p, showDiscount = false }: { p: Product; showDiscount?: boolean }) {
  const out = p.stock <= 0;
  const { ids, toggle } = useWishlist();
  const { add } = useCart();
  const [color, setColor] = useState(-1); // -1 = main photo until a colour is picked
  const wished = ids.has(p.id);
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Link to="/product/$id" params={{ id: p.id }} aria-label={p.name}>
          <img src={imageFor(p, color >= 0 ? p.colors[color] : undefined)} alt={p.name} loading="lazy" width={768} height={1024} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </Link>
        {out && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/60"><span className="rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background">Out of Stock</span></div>}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {p.badge && <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold text-background">{p.badge}</span>}
          {showDiscount && <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">-{discountPct(p)}% OFF</span>}
        </div>
        <button onClick={() => toggle(p.id)} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wished}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-card shadow-soft transition hover:scale-110">
          <Heart className={`h-3.5 w-3.5 ${wished ? "fill-primary text-primary" : "text-foreground"}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug">
          <Link to="/product/$id" params={{ id: p.id }} className="hover:text-primary">{p.name}</Link>
        </h3>
        {p.reviewCount > 0 && <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Star className="h-3 w-3 fill-star text-star" />
          <span className="font-medium text-foreground">{p.rating}</span> ({p.reviewCount})
        </div>}
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold text-primary">{inr(p.price)}</span>
          {p.originalPrice > p.price && <span className="text-[11px] text-muted-foreground line-through">{inr(p.originalPrice)}</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {p.colors.map((c, i) => (
            <button key={c} aria-label={`Colour ${c}`} onClick={() => setColor(i)} style={{ background: swatch(c) }}
              className={`h-3.5 w-3.5 rounded-full border border-border transition ${color === i ? "ring-2 ring-primary ring-offset-1" : ""}`} />
          ))}
        </div>
      </div>
      <button onClick={() => add(p, { color: p.colors[Math.max(0, color)] })} disabled={out} className="flex items-center justify-between border-t border-border px-3 py-2.5 text-[12px] font-medium transition hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent">
        <span>{out ? "Out of Stock" : "+ Add to Bag"}</span><ShoppingBag className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
