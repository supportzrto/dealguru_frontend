<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## DealGuru storefront decisions
- Auth, cart, wishlist and orders are demo-only and live in browser localStorage via React contexts in src/context and src/components/shop/store.tsx — no backend yet; swap to Lovable Cloud auth/database later.
- Protected pages wrap their component in RequireAuth (client-side guard) because the session only exists in the browser; a beforeLoad guard cannot see it during SSR.
- Pricing, coupon, delivery, COD/EMI rules live as pure functions in src/lib/shop/pricing.ts with tests in src/test/pricing.test.ts — change rules there, not in components.
- Payments are simulated; only masked labels (brand + last 4, UPI ID) are ever stored.
- Catalog, settings and coupons live in ProductsContext / SettingsContext (localStorage, seeded from data.ts on first load); storefront components must read products from useProducts(), never import the static list. Storage keys are documented in src/lib/storage.ts.
- Admin pages live under /admin (guarded by AdminRoute in src/components/admin/AdminLayout.tsx); page bodies are in src/components/admin/pages, route files stay thin. The root layout hides storefront chrome on /admin paths.
- An order's admin-set status (statusManual) overrides the demo auto-advance timer; status transitions go through applyStatus in OrdersContext.
- Bump DATA_VERSION in src/lib/storage.ts whenever the seed catalog/category shape changes; providers call ensureDataVersion() to clear stale browser data and reseed.
- Nav, footer and home category tiles are built from live products (navLinksFor in data.ts), so empty categories and an empty Deals page stay hidden automatically.
- Per-colour product photos live in Product.colorImages; use imageFor(product, colour) wherever a product photo is shown so the picked colour's photo appears in cards, bag, checkout and orders.
- Cash on Delivery is switched off with COD_ENABLED in pricing.ts (payment tab hidden, fee ignored) rather than deleting the COD code paths, so old orders still render.
