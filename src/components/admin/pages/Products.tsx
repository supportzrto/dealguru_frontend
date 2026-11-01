// Demo only. Replace with Supabase auth, DB and storage later.
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useProducts } from "@/context/ProductsContext";
import { categoryMeta, inr, type CategorySlug, type Product } from "@/components/shop/data";
import { btnOutline, btnPrimary, EmptyState, inputCls, paginate, Pager, Panel, TableSkeleton, TableWrap, td, th } from "../ui";

export const productStatus = (p: Product) => (p.status === "draft" ? "Draft" : p.stock <= 0 ? "Out of Stock" : "Active");
const statusTone: Record<string, string> = { Active: "bg-success/15 text-success", Draft: "bg-muted text-foreground", "Out of Stock": "bg-destructive/10 text-destructive" };
export const newId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function StockInput({ p }: { p: Product }) {
  const { saveProduct } = useProducts();
  const [v, setV] = useState(String(p.stock));
  const commit = () => {
    const n = Math.max(0, Math.floor(Number(v)));
    if (!Number.isFinite(n)) { setV(String(p.stock)); return; }
    if (n !== p.stock) { saveProduct({ ...p, stock: n }); toast.success(`Stock updated for ${p.name}`); }
    setV(String(n));
  };
  return <input type="number" min={0} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()}
    aria-label={`Stock for ${p.name}`} className={`${inputCls} h-8 w-20 ${p.stock < 5 ? "border-destructive text-destructive" : ""}`} />;
}

export function ProductsPage() {
  const { all, ready, saveProduct, saveMany, removeProducts } = useProducts();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [stock, setStock] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string[] | null>(null);

  const filtered = useMemo(() => all.filter((p) =>
    p.name.toLowerCase().includes(q.trim().toLowerCase()) &&
    (cat === "all" || p.category === cat) &&
    (status === "all" || productStatus(p) === status) &&
    (stock === "all" || (stock === "low" ? p.stock > 0 && p.stock < 5 : stock === "out" ? p.stock <= 0 : p.stock >= 5))), [all, q, cat, status, stock]);
  const pg = paginate(filtered, page);
  const reset = (fn: () => void) => { fn(); setPage(1); };
  const pageIds = pg.items.map((p) => p.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const duplicate = (p: Product) => {
    const copy = { ...p, id: newId(), name: `${p.name} (Copy)`, sku: `${p.sku}-C`, status: "draft" as const, createdAt: new Date().toISOString(), featuredAt: new Date().toISOString() };
    if (saveProduct(copy)) toast.success("Product duplicated as draft");
    else toast.error("Storage is full — remove some images and try again");
  };
  const bulkStatus = (s: Product["status"]) => {
    saveMany(all.filter((p) => selected.has(p.id)).map((p) => ({ ...p, status: s })));
    toast.success(`${selected.size} products set to ${s === "active" ? "Active" : "Draft"}`);
    setSelected(new Set());
  };
  const sel = "h-9 bg-card text-[13px]";

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => reset(() => setQ(e.target.value))} placeholder="Search products" aria-label="Search products" className={`${inputCls} w-full pl-9`} />
        </label>
        <Select value={cat} onValueChange={(v) => reset(() => setCat(v))}>
          <SelectTrigger className={`${sel} w-[150px]`} aria-label="Filter by category"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All categories</SelectItem>{(Object.keys(categoryMeta) as CategorySlug[]).map((c) => <SelectItem key={c} value={c}>{categoryMeta[c].title}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => reset(() => setStatus(v))}>
          <SelectTrigger className={`${sel} w-[140px]`} aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>{["all", "Active", "Draft", "Out of Stock"].map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={stock} onValueChange={(v) => reset(() => setStock(v))}>
          <SelectTrigger className={`${sel} w-[140px]`} aria-label="Filter by stock"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All stock</SelectItem><SelectItem value="in">In stock (5+)</SelectItem><SelectItem value="low">Low (1–4)</SelectItem><SelectItem value="out">Out of stock</SelectItem></SelectContent>
        </Select>
        <Link to="/admin/products/new" className={btnPrimary}><Plus className="h-4 w-4" /> Add Product</Link>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md bg-secondary px-3 py-2 text-[13px]">
          <span className="font-medium">{selected.size} selected</span>
          <button className={btnOutline} onClick={() => bulkStatus("active")}>Set Active</button>
          <button className={btnOutline} onClick={() => bulkStatus("draft")}>Set Draft</button>
          <button className={`${btnOutline} text-destructive`} onClick={() => setConfirm([...selected])}><Trash2 className="h-4 w-4" /> Delete selected</button>
          <button className="ml-auto text-[12px] text-muted-foreground hover:underline" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {!ready ? <TableSkeleton /> : !filtered.length ? (
        <EmptyState icon={Package} title="No products found" text="Try a different search or add a new product." action={<Link to="/admin/products/new" className={btnPrimary}>Add Product</Link>} />
      ) : (
        <>
          <TableWrap>
            <thead><tr>
              <th className={th}><input type="checkbox" className="accent-primary" checked={allOnPage} aria-label="Select all on this page"
                onChange={() => setSelected((s) => { const n = new Set(s); pageIds.forEach((id) => (allOnPage ? n.delete(id) : n.add(id))); return n; })} /></th>
              {["Product", "Category", "Price", "Original", "Stock", "Status", "Badge", "Placement", "Active", "Actions"].map((h) => <th key={h} className={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {pg.items.map((p) => {
                const s = productStatus(p);
                const tags = [p.showInPopular && "Popular", p.showInBestSellers && "Best Seller", p.isNew && "New", p.originalPrice > p.price && "Sale"].filter(Boolean) as string[];
                return (
                  <tr key={p.id}>
                    <td className={td}><input type="checkbox" className="accent-primary" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} /></td>
                    <td className={`${td} min-w-[240px]`}><div className="flex items-center gap-3"><img src={p.images?.[0] ?? p.image} alt="" className="h-12 w-10 rounded object-cover" /><span className="min-w-0 max-w-[180px]"><span className="block truncate font-medium">{p.name}</span><span className="text-[11px] text-muted-foreground">{p.sku}</span></span></div></td>
                    <td className={td}>{categoryMeta[p.category].title}</td>
                    <td className={`${td} font-semibold`}>{inr(p.price)}</td>
                    <td className={`${td} text-muted-foreground`}>{p.originalPrice > p.price ? inr(p.originalPrice) : "—"}</td>
                    <td className={td}><StockInput key={`${p.id}-${p.stock}`} p={p} /></td>
                    <td className={td}><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusTone[s]}`}>{s}</span></td>
                    <td className={td}>{p.badge ?? "—"}</td>
                    <td className={td}><div className="flex max-w-[160px] flex-wrap gap-1">{tags.length ? tags.map((t) => <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-primary">{t}</span>) : "—"}</div></td>
                    <td className={td}><Switch checked={p.status === "active"} onCheckedChange={(v) => { saveProduct({ ...p, status: v ? "active" : "draft" }); toast.success(`${p.name} is now ${v ? "Active" : "Draft"}`); }} aria-label={`Toggle ${p.name} active`} /></td>
                    <td className={td}>
                      <div className="flex gap-1">
                        <Link to="/admin/products/$id/edit" params={{ id: p.id }} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted" aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></Link>
                        <button onClick={() => duplicate(p)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted" aria-label={`Duplicate ${p.name}`}><Copy className="h-4 w-4" /></button>
                        <button onClick={() => setConfirm([p.id])} className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10" aria-label={`Delete ${p.name}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          <Pager page={pg.page} pages={pg.pages} onPage={setPage} />
        </>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete {confirm?.length === 1 ? "this product" : `${confirm?.length} products`}?</AlertDialogTitle>
          <AlertDialogDescription>They will be removed from the store, and from any shopper’s bag or wishlist. This can’t be undone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirm) { removeProducts(confirm); toast.success(confirm.length === 1 ? "Product deleted" : `${confirm.length} products deleted`); setSelected(new Set()); } setConfirm(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
