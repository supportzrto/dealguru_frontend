// Demo only. Replace with Supabase auth, DB and storage later.
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  IndianRupee,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ALL_STATUSES, statusAt, useOrders } from "@/context/OrdersContext";
import { useProducts } from "@/context/ProductsContext";
import { categoryMeta, type CategorySlug } from "@/components/shop/data";
import { StatusPill } from "@/components/shop/OrderBits";
import { fmtDate, inr } from "@/lib/shop/format";
import { EmptyState, Panel, StatCard, TableSkeleton, TableWrap, td, th } from "../ui";

const PIE = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--success)",
  "var(--destructive)",
];
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function Dashboard() {
  const { orders, ready, now } = useOrders();
  const { all, saveProduct } = useProducts();
  const { customers } = useAuth();

  const data = useMemo(() => {
    const live = orders.filter((o) => !o.cancelledAt);
    const today = dayKey(new Date(now));
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const trend = days.map((d) => {
      const list = live.filter((o) => dayKey(new Date(o.createdAt)) === dayKey(d));
      return {
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        revenue: list.reduce((n, o) => n + o.amounts.total, 0),
        orders: list.length,
      };
    });
    const byStatus = ALL_STATUSES.map((s) => ({
      name: s,
      value: orders.filter((o) => statusAt(o) === s).length,
    })).filter((x) => x.value);
    const cat: Record<string, number> = {};
    const units: Record<string, number> = {};
    for (const o of live)
      for (const i of o.items) {
        const p = all.find((x) => x.id === i.productId);
        const c = p ? categoryMeta[p.category].title : "Other";
        cat[c] = (cat[c] ?? 0) + i.price * i.qty;
        units[i.productId] = (units[i.productId] ?? 0) + i.qty;
      }
    const top = Object.entries(units)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, n]) => {
        const p = all.find((x) => x.id === id);
        const item = live.flatMap((o) => o.items).find((i) => i.productId === id)!;
        return {
          id,
          name: p?.name ?? item.name,
          image: p?.images?.[0] ?? p?.image ?? item.image,
          units: n,
          exists: !!p,
        };
      });
    return {
      total: orders.length,
      today: orders.filter((o) => dayKey(new Date(o.createdAt)) === today).length,
      revenue: live.reduce((n, o) => n + o.amounts.total, 0),
      pending: orders.filter((o) => !["Delivered", "Cancelled"].includes(statusAt(o))).length,
      trend,
      byStatus,
      top,
      byCat: (Object.keys(categoryMeta) as CategorySlug[]).map((c) => ({
        name: categoryMeta[c].title,
        sales: cat[categoryMeta[c].title] ?? 0,
      })),
    };
  }, [orders, all, now]);

  const low = all.filter((p) => p.stock < 5).sort((a, b) => a.stock - b.stock);
  const restock = async (id: string) => {
    const p = all.find((x) => x.id === id);
    if (!p) return;

    try {
      await saveProduct({ ...p, stock: p.stock + 20 });

      toast.success(`Restocked ${p.name}`, {
        description: `Stock is now ${p.stock + 20}`,
      });
    } catch (error) {
      toast.error(`Failed to restock ${p.name}`);
    }
  };
  const noOrders = ready && orders.length === 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={ShoppingBag} label="Total Orders" value={data.total} />
        <StatCard icon={CalendarDays} label="Today's Orders" value={data.today} />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={inr(data.revenue)}
          hint="Excludes cancelled orders"
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={data.pending}
          hint="Not yet delivered"
        />
        <StatCard icon={Package} label="Total Products" value={all.length} />
        <StatCard icon={Users} label="Total Customers" value={customers.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue & Orders · last 7 days" className="xl:col-span-2">
          {noOrders ? (
            <EmptyState
              icon={TrendingUp}
              title="No sales yet"
              text="Revenue will appear here once customers start ordering."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis
                    yAxisId="r"
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                    width={56}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <YAxis
                    yAxisId="o"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                    width={28}
                  />
                  <Tooltip formatter={(v: number, n: string) => (n === "Revenue" ? inr(v) : v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    yAxisId="r"
                    name="Revenue"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="o"
                    name="Orders"
                    dataKey="orders"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel title="Orders by Status">
          {noOrders ? (
            <EmptyState icon={ShoppingBag} title="No orders yet" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={data.byStatus.length > 1 ? 2 : 0}
                  >
                    {data.byStatus.map((s) => (
                      <Cell key={s.name} fill={PIE[ALL_STATUSES.indexOf(s.name)]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Recent Orders"
          className="xl:col-span-2"
          action={
            <Link
              to="/admin/orders"
              className="text-[13px] font-medium text-primary hover:underline"
            >
              View all
            </Link>
          }
        >
          {!ready ? (
            <TableSkeleton />
          ) : noOrders ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              text="New customer orders show up here instantly — even from another tab."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  {["Order ID", "Customer", "Date", "Total", "Payment", "Status", ""].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id}>
                    <td className={`${td} font-medium`}>{o.id}</td>
                    <td className={td}>{o.customerName ?? o.address.fullName}</td>
                    <td className={td}>{fmtDate(o.createdAt)}</td>
                    <td className={`${td} font-semibold`}>{inr(o.amounts.total)}</td>
                    <td className={td}>{o.paymentMethod}</td>
                    <td className={td}>
                      <StatusPill status={statusAt(o)} />
                    </td>
                    <td className={td}>
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: o.id }}
                        className="rounded-md border border-border px-3 py-1 text-[12px] font-medium hover:border-primary hover:text-primary"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
        <Panel title="Top Selling Products">
          {data.top.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No sales yet"
              text="Best sellers appear after the first orders."
            />
          ) : (
            <ul className="space-y-3">
              {data.top.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="w-4 text-[12px] font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <img src={p.image} alt={p.name} className="h-12 w-10 rounded object-cover" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{p.name}</span>
                  <span className="text-[12px] text-muted-foreground">{p.units} sold</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Sales by Category" className="xl:col-span-2">
          {noOrders ? (
            <EmptyState icon={TrendingUp} title="No category sales yet" />
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byCat} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                    width={56}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip formatter={(v: number) => inr(v)} />
                  <Bar dataKey="sales" name="Sales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel title="Low Stock Alerts">
          {low.length === 0 ? (
            <EmptyState icon={Package} title="All stocked up" text="No products under 5 units." />
          ) : (
            <ul className="space-y-3">
              {low.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{p.name}</span>
                    <span className="text-[11px] text-destructive">{p.stock} left</span>
                  </span>
                  <button
                    onClick={() => restock(p.id)}
                    className="rounded-md border border-border px-2.5 py-1 text-[12px] font-medium hover:border-primary hover:text-primary"
                    aria-label={`Restock ${p.name} by 20`}
                  >
                    Restock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
