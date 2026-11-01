import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useProducts } from "@/context/ProductsContext";
import { Crumbs, PageBanner } from "@/components/shop/Collection";
import { ProductCard } from "@/components/shop/ProductCard";
import { useWishlist } from "@/components/shop/store";
import { infoHead } from "@/components/shop/Info";

export const Route = createFileRoute("/wishlist")({
  head: () => infoHead("Your Wishlist", "The pieces you’ve saved at DealGuru."),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids } = useWishlist();
  const { products } = useProducts();
  const items = products.filter((p) => ids.has(p.id));
  return (
    <>
      <PageBanner eyebrow="Saved for later" title="Your Wishlist" description={`${items.length} ${items.length === 1 ? "item" : "items"}`}>
        <Crumbs items={[{ label: "Wishlist" }]} />
      </PageBanner>
      <div className="container-x py-10">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={1.2} />
            <p className="mt-3 font-semibold">Your wishlist is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any product to save it here.</p>
            <Link to="/shop" className="mt-6 inline-block rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </>
  );
}
