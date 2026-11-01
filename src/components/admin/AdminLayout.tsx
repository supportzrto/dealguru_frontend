// Demo only. Replace with Supabase auth, DB and storage later.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutDashboard, LogOut, Menu, Package, PlusSquare, Settings, ShieldAlert, ShoppingBag, Store, Users } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { statusAt, useOrders } from "@/context/OrdersContext";
import { LOGO_URL } from "@/components/shop/Logo";
import { PageSpinner } from "@/components/shop/forms";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package, exact: true },
  { to: "/admin/products/new", label: "Add Product", icon: PlusSquare },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function titleFor(path: string) {
  if (path === "/admin" || path === "/admin/") return "Dashboard";
  if (path.startsWith("/admin/orders/")) return "Order Details";
  if (path.startsWith("/admin/invoice")) return "Invoice";
  if (path.endsWith("/edit")) return "Edit Product";
  const hit = [...nav].reverse().find((n) => path.startsWith(n.to));
  return hit?.label ?? "Admin";
}

function useAdminLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return () => { logout(); toast.success("Logged out of admin"); navigate({ to: "/admin/login", replace: true }); };
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const doLogout = useAdminLogout();
  const item = "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition";
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2 px-3 pb-6 pt-1 text-primary" aria-label="DealGuru admin home">
        <img src={LOGO_URL} alt="DealGuru" width={1002} height={190} className="h-7 w-auto min-w-0 object-contain" />
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Admin</span>
      </Link>
      <nav className="space-y-1" aria-label="Admin">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} onClick={onNavigate} activeOptions={{ exact: "exact" in n ? n.exact : false }}
            activeProps={{ className: `${item} bg-secondary text-primary` }} inactiveProps={{ className: `${item} text-foreground hover:bg-muted` }}>
            <n.icon className="h-4 w-4" /> {n.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto space-y-1 border-t border-border pt-4">
        <Link to="/" onClick={onNavigate} className={`${item} hover:bg-muted`}><Store className="h-4 w-4" /> View Store</Link>
        <button onClick={() => { onNavigate?.(); doLogout(); }} className={`${item} w-full text-destructive hover:bg-destructive/10`}><LogOut className="h-4 w-4" /> Logout</button>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { orders, now } = useOrders();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const fresh = orders.filter((o) => statusAt(o, now) === "Confirmed").length;
  const initials = (user?.fullName ?? "A").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-card p-4 lg:block"><SidebarBody /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-card p-4">
          <SheetHeader><SheetTitle className="sr-only">Admin menu</SheetTitle></SheetHeader>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
          <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted lg:hidden" aria-label="Open admin menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <h1 className="truncate text-lg font-semibold tracking-tight">{titleFor(path)}</h1>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/admin/orders" search={{ status: "Confirmed" }} className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-muted" aria-label={`${fresh} new orders`}>
              <Bell className="h-[18px] w-[18px]" />
              {fresh > 0 && <span className="badge-dot">{fresh}</span>}
            </Link>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground" aria-hidden>{initials}</span>
              <span className="hidden text-[13px] font-medium sm:block">{user?.fullName}</span>
            </div>
          </div>
        </header>
        <div className="min-w-0 flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

/** Guards every /admin/* page: logged out → /admin/login, customers → access denied. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { ready, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const fired = useRef(false);
  useEffect(() => {
    if (!ready || isAuthenticated || fired.current) return;
    fired.current = true;
    navigate({ to: "/admin/login", replace: true });
  }, [ready, isAuthenticated, navigate]);
  if (!ready || !isAuthenticated) return <PageSpinner />;
  if (!isAdmin) return <AccessDenied />;
  return <AdminLayout>{children}</AdminLayout>;
}

export function AccessDenied() {
  return (
    <div className="grid min-h-screen place-items-center bg-blush px-4">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">This area is for DealGuru admins only.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-primary">Back to Home</Link>
      </div>
    </div>
  );
}
