// Demo only. Replace with Supabase auth, DB and storage later.
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { statusAt, useOrders } from "@/context/OrdersContext";
import { StatusPill } from "@/components/shop/OrderBits";
import { fmtDate, inr } from "@/lib/shop/format";
import { EmptyState, inputCls, paginate, Pager, Panel, TableSkeleton, TableWrap, td, th } from "../ui";

export function CustomersPage() {
  const { customers, ready } = useAuth();
  const { orders, now } = useOrders();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => customers.map((c) => {
    const mine = orders.filter((o) => o.userId === c.id);
    return { c, count: mine.length, spent: mine.filter((o) => !o.cancelledAt).reduce((n, o) => n + o.amounts.total, 0) };
  }).filter(({ c }) => [c.fullName, c.email, c.phone].some((v) => v.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => b.c.createdAt.localeCompare(a.c.createdAt)), [customers, orders, q]);
  const pg = paginate(rows, page);
  const open = customers.find((c) => c.id === openId);
  const openOrders = orders.filter((o) => o.userId === openId);

  return (
    <Panel>
      <label className="relative mb-4 block max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email or phone" aria-label="Search customers" className={`${inputCls} w-full pl-9`} />
      </label>
      {!ready ? <TableSkeleton /> : !rows.length ? <EmptyState icon={Users} title={customers.length ? "No customers match" : "No customers yet"} text="Customers who register on the store appear here." /> : (
        <>
          <TableWrap>
            <thead><tr>{["Name", "Email", "Phone", "Joined", "Orders", "Total spent"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {pg.items.map(({ c, count, spent }) => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} onKeyDown={(e) => e.key === "Enter" && setOpenId(c.id)} tabIndex={0} className="cursor-pointer hover:bg-muted/50" aria-label={`View ${c.fullName}`}>
                  <td className={`${td} font-medium`}>{c.fullName}</td>
                  <td className={td}>{c.email}</td>
                  <td className={td}>+91 {c.phone}</td>
                  <td className={td}>{fmtDate(c.createdAt)}</td>
                  <td className={td}>{count}</td>
                  <td className={`${td} font-semibold`}>{inr(spent)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pager page={pg.page} pages={pg.pages} onPage={setPage} />
        </>
      )}
      <Sheet open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-card sm:max-w-md">
          <SheetHeader><SheetTitle>{open?.fullName}</SheetTitle></SheetHeader>
          {open && <div className="mt-2 space-y-1 px-4 text-[13px] text-muted-foreground"><p>{open.email}</p><p>+91 {open.phone}</p><p>Joined {fmtDate(open.createdAt)}</p></div>}
          <h3 className="mt-6 px-4 text-[13px] font-semibold">Orders ({openOrders.length})</h3>
          <ul className="mt-2 divide-y divide-border px-4">
            {!openOrders.length && <li className="py-6 text-center text-[13px] text-muted-foreground">No orders yet.</li>}
            {openOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-[13px]">
                <div><Link to="/admin/orders/$id" params={{ id: o.id }} className="font-medium text-primary hover:underline">{o.id}</Link><p className="text-[11px] text-muted-foreground">{fmtDate(o.createdAt)}</p></div>
                <StatusPill status={statusAt(o, now)} />
                <span className="font-semibold">{inr(o.amounts.total)}</span>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </Panel>
  );
}
