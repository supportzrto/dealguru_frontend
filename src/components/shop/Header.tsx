import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Heart, LayoutDashboard, LogOut, Menu, Minus, Package, Plus, Search, Shield, ShoppingBag, User, X } from "lucide-react";
import { useProducts } from "@/context/ProductsContext";
import { useSettings } from "@/context/SettingsContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { firstName } from "@/lib/shop/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { categoryMeta, imageFor, inr, isCategory, navLinksFor } from "./data";
import { Logo } from "./Logo";
import { useCart, useUi, useWishlist } from "./store";

export function AnnouncementBar() {
  const { settings } = useSettings();
  const parts = settings.announcement.split("|").map((x) => x.trim()).filter(Boolean);
  return (
    <div className="bg-announce text-announce-foreground text-[11px]">
      <div className="container-x flex h-8 items-center justify-between gap-4">
        <p className="truncate">{parts.map((t, i) => <span key={i}>{i > 0 && <span className="opacity-60"> | </span>}{t}</span>)}</p>
        <div className="hidden shrink-0 items-center gap-5 sm:flex">
          <Link to="/orders" className="hover:opacity-70">Track Order</Link>
          <Link to="/faqs" className="hover:opacity-70">Help</Link>
          <button className="flex items-center gap-1 hover:opacity-70">INR <ChevronDown className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
}

const activeCls = "text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-primary";

export function Navbar() {
  const { products } = useProducts();
  const navLinks = navLinksFor(products);
  const { count, setOpen: openCart } = useCart();
  const { ids } = useWishlist();
  const { setSearchOpen } = useUi();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 10);
    f();
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);
  const iconBtn = "relative grid h-9 w-9 place-items-center rounded-full text-foreground transition hover:bg-muted";
  return (
    <header className={`sticky top-0 z-40 bg-card transition-shadow ${scrolled ? "shadow-nav" : ""}`}>
      <div className="container-x grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4">
        <div className="flex items-center gap-2">
          <button className={`${iconBtn} lg:hidden`} aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <Logo />
        </div>
        <nav className="hidden justify-center gap-8 text-[13px] font-medium lg:flex">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: true, includeSearch: false }} activeProps={{ className: activeCls }}
              inactiveProps={{ className: "text-foreground" }} className="relative py-1 transition-colors hover:text-primary">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-0.5 justify-self-end">
          <button className={iconBtn} aria-label="Search" onClick={() => setSearchOpen(true)}><Search className="h-[18px] w-[18px]" /></button>
          <AdminLink className={`${iconBtn} hidden sm:grid`} />
          <span className="hidden sm:block"><UserMenu className={iconBtn} /></span>
          <Link to="/wishlist" className={iconBtn} aria-label={`Wishlist, ${ids.size} items`}>
            <Heart className="h-[18px] w-[18px]" />
            {ids.size > 0 && <span className="badge-dot">{ids.size}</span>}
          </Link>
          <button className={iconBtn} aria-label={`Bag, ${count} items`} onClick={() => openCart(true)}>
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && <span className="badge-dot">{count}</span>}
          </button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-card">
          <SheetHeader><SheetTitle className="sr-only">Menu</SheetTitle><Logo onClick={() => setOpen(false)} /></SheetHeader>
          <ul className="mt-6 space-y-4 px-4 text-sm font-medium">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={() => setOpen(false)} activeOptions={{ exact: true, includeSearch: false }} activeProps={{ className: "text-primary underline underline-offset-4" }}>{l.label}</Link>
              </li>
            ))}
          </ul>
          <MobileAccount onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useUi();
  const { products } = useProducts();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const results = term ? products.filter((p) => p.name.toLowerCase().includes(term)) : [];
  const close = () => { setSearchOpen(false); setQ(""); };
  return (
    <Dialog open={searchOpen} onOpenChange={(v) => (v ? setSearchOpen(true) : close())}>
      <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 p-0">
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lighters, gadgets, home essentials…" aria-label="Search products"
            className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!term && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Start typing to find something you’ll love.</p>}
          {term && !results.length && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No products match “{q}”.</p>}
          {results.length > 0 && <p className="px-3 pb-1 pt-2 text-[11px] text-muted-foreground">{results.length} results</p>}
          {results.map((p) => (
            <Link key={p.id} to="/product/$id" params={{ id: p.id }} onClick={close} className="flex items-center gap-3 rounded-md p-2 transition hover:bg-muted">
              <img src={p.image} alt={p.name} className="h-14 w-11 shrink-0 rounded bg-muted object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{isCategory(p.category) ? categoryMeta[p.category].title : ""}</p></div>
              <span className="shrink-0 text-sm font-semibold text-primary">{inr(p.price)}</span>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CartDrawer() {
  const { items, open, setOpen, subtotal, setQty, count } = useCart();
  const { rules } = useSettings();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col bg-card p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5"><SheetTitle>Your Bag ({count})</SheetTitle></SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {!items.length && (
            <div className="py-16 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={1.2} />
              <p className="mt-3 text-sm text-muted-foreground">Your bag is empty.</p>
              <Link to="/shop" onClick={() => setOpen(false)} className="mt-4 inline-block text-sm font-medium text-primary">Start shopping →</Link>
            </div>
          )}
          {items.map((i) => (
            <div key={i.key} className="flex gap-3">
              <img src={imageFor(i.product, i.color)} alt={i.product.name} className="h-24 w-[72px] shrink-0 rounded-md bg-muted object-cover" />
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to="/product/$id" params={{ id: i.product.id }} onClick={() => setOpen(false)} className="truncate text-sm font-medium hover:text-primary">{i.product.name}</Link>
                <p className="text-xs capitalize text-muted-foreground">{[i.color, i.size].filter(Boolean).join(" · ")}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-border">
                    <button aria-label="Decrease quantity" className="grid h-7 w-7 place-items-center hover:bg-muted" onClick={() => setQty(i.key, i.qty - 1)}><Minus className="h-3 w-3" /></button>
                    <span className="w-7 text-center text-xs">{i.qty}</span>
                    <button aria-label="Increase quantity" className="grid h-7 w-7 place-items-center hover:bg-muted" onClick={() => setQty(i.key, i.qty + 1)}><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="text-sm font-semibold text-primary">{inr(i.product.price * i.qty)}</span>
                </div>
              </div>
              <button aria-label={`Remove ${i.product.name}`} onClick={() => setQty(i.key, 0)} className="self-start text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="space-y-3 border-t border-border p-5">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{inr(subtotal)}</span></div>
            <p className="text-xs text-muted-foreground">{subtotal >= rules.freeMin ? "Free shipping on this order." : `Add ${inr(rules.freeMin - subtotal)} more for free shipping.`}</p>
            <Link to="/checkout" onClick={() => setOpen(false)} className="block w-full rounded-md bg-foreground py-3 text-center text-sm font-medium text-background transition hover:bg-primary">Checkout</Link>
            <Link to="/cart" onClick={() => setOpen(false)} className="block text-center text-[13px] font-medium text-primary hover:underline">View Bag</Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return () => { logout(); toast.success("You’ve been logged out"); navigate({ to: "/", replace: true }); };
}

/** Shield link: admins go to the dashboard, everyone else to the admin login. */
function AdminLink({ className, onClick, label = false }: { className: string; onClick?: () => void; label?: boolean }) {
  const { isAdmin } = useAuth();
  return (
    <Link to={isAdmin ? "/admin" : "/admin/login"} onClick={onClick} className={className} aria-label="Admin" title="Admin">
      <Shield className={label ? "h-4 w-4" : "h-[18px] w-[18px]"} />{label && " Admin"}
    </Link>
  );
}

function UserMenu({ className }: { className: string }) {
  const { user, isAdmin } = useAuth();
  const doLogout = useLogout();
  if (!user) return <Link to="/login" className={className} aria-label="Login"><User className="h-[18px] w-[18px]" /></Link>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} aria-label="Account menu"><User className="h-[18px] w-[18px] text-primary" /></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Hi, {firstName(user.fullName)}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && <DropdownMenuItem asChild><Link to="/admin"><LayoutDashboard className="h-4 w-4" /> Admin Dashboard</Link></DropdownMenuItem>}
        <DropdownMenuItem asChild><Link to="/account"><User className="h-4 w-4" /> My Account</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/orders"><Package className="h-4 w-4" /> My Orders</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/wishlist"><Heart className="h-4 w-4" /> Wishlist</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={doLogout}><LogOut className="h-4 w-4" /> Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileAccount({ onNavigate }: { onNavigate: () => void }) {
  const { user, isAdmin } = useAuth();
  const doLogout = useLogout();
  const cls = "flex items-center gap-2 text-sm";
  return (
    <div className="mt-6 space-y-4 border-t border-border px-4 pt-6">
      {user ? <>
        <p className="text-sm font-semibold">Hi, {firstName(user.fullName)}</p>
        {isAdmin && <Link to="/admin" onClick={onNavigate} className={cls}><LayoutDashboard className="h-4 w-4" /> Admin Dashboard</Link>}
        <Link to="/account" onClick={onNavigate} className={cls}><User className="h-4 w-4" /> My Account</Link>
        <Link to="/orders" onClick={onNavigate} className={cls}><Package className="h-4 w-4" /> My Orders</Link>
        <Link to="/wishlist" onClick={onNavigate} className={cls}><Heart className="h-4 w-4" /> Wishlist</Link>
        <button onClick={() => { onNavigate(); doLogout(); }} className={cls}><LogOut className="h-4 w-4" /> Logout</button>
      </> : <>
        <Link to="/login" onClick={onNavigate} className={cls}><User className="h-4 w-4" /> Login</Link>
        <Link to="/register" onClick={onNavigate} className={cls}><Plus className="h-4 w-4" /> Create Account</Link>
      </>}
      <AdminLink className={cls} onClick={onNavigate} label />
    </div>
  );
}
