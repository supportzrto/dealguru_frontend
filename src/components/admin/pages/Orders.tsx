// Demo only. Replace with Supabase auth, DB and storage later.
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Search, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_STATUSES,
  paymentStatusOf,
  statusAt,
  useOrders,
  type Order,
  type OrderStatus,
  type RefundReviewItem,
} from "@/context/OrdersContext";
import { StatusPill } from "@/components/shop/OrderBits";
import { fmtDate, inr } from "@/lib/shop/format";
import {
  downloadCsv,
  EmptyState,
  inputCls,
  btnOutline,
  paginate,
  Pager,
  Panel,
  TableSkeleton,
  TableWrap,
  td,
  th,
} from "../ui";

const RANGES = {
  all: "All time",
  today: "Today",
  "7": "Last 7 days",
  "30": "Last 30 days",
} as const;
type Range = keyof typeof RANGES;
const methodOf = (o: Order) =>
  o.paymentMethod.includes("••••") ? "Card" : o.paymentMethod.split(/ [·(•-] ?/)[0]!.trim();

export function StatusSelect({ order, compact = false }: { order: Order; compact?: boolean }) {
  const { setStatus } = useOrders();
  const [saving, setSaving] = useState(false);

  const current = statusAt(order);
  const isPaid = paymentStatusOf(order) === "Paid";

  const allowedStatuses: OrderStatus[] =
    current === "Cancelled" || current === "Delivered"
      ? [current]
      : isPaid
        ? ["Processing", "Shipped", "Delivered", "Cancelled"]
        : ["Pending Payment", "Cancelled"];

  const handleChange = async (value: string) => {
    setSaving(true);

    try {
      await setStatus(order.id, value as OrderStatus);
      toast.success(`Order marked ${value}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update order status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Select
      value={current}
      disabled={saving || current === "Cancelled" || current === "Delivered"}
      onValueChange={handleChange}
    >
      <SelectTrigger
        className={`${compact ? "h-8 w-[150px]" : "h-10 w-[200px]"} bg-card text-[12px]`}
        aria-label={`Status for ${order.id}`}
      >
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {allowedStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RefundReviewSection() {
  const {
    refundReviews,
    refreshRefundReviews,
    recordRefund,
    syncRefund,
  } = useOrders();

  const [refundIds, setRefundIds] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      await refreshRefundReviews();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load refund reviews",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleRecord = async (item: RefundReviewItem) => {
    const refundReference = refundIds[item.payment_id]?.trim();

    if (!refundReference) {
      toast.error("Enter the Razorpay Refund ID");
      return;
    }

    setSavingId(item.payment_id);

    try {
      await recordRefund(item.payment_id, refundReference);
      setRefundIds((previous) => ({
        ...previous,
        [item.payment_id]: "",
      }));
      toast.success("Refund ID verified and recorded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record refund",
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleSync = async (item: RefundReviewItem) => {
    setSavingId(item.payment_id);

    try {
      const result = await syncRefund(item.payment_id);
      toast.success(`Refund status: ${result.razorpay_status}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sync refund",
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Refund Review</h2>
          <p className="text-xs text-muted-foreground">
            Review captured payments requiring manual refunds.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReviews}
          disabled={loading}
          className={btnOutline}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && refundReviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading refund reviews...</p>
      ) : refundReviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No refunds currently require review.
        </p>
      ) : (
        <div className="space-y-3">
          {refundReviews.map((item) => (
            <div
              key={item.payment_id}
              className="rounded-lg border border-border p-4"
            >
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{item.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.customer_email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Order ID</p>
                  <p className="break-all font-medium">{item.order_id}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Payment amount</p>
                  <p className="font-semibold">
                    {inr(Number(item.amount))}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Razorpay Payment ID</p>
                  <p className="break-all">{item.provider_payment_id}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Order status</p>
                  <p>{item.order_status}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Refund status</p>
                  <p className="font-semibold">{item.refund_status}</p>
                </div>
              </div>

              {item.refund_reference ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="break-all text-xs text-muted-foreground">
                    Refund ID: {item.refund_reference}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleSync(item)}
                    disabled={savingId === item.payment_id}
                    className={btnOutline}
                  >
                    {savingId === item.payment_id ? "Checking..." : "Sync status"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    value={refundIds[item.payment_id] ?? ""}
                    onChange={(event) =>
                      setRefundIds((previous) => ({
                        ...previous,
                        [item.payment_id]: event.target.value,
                      }))
                    }
                    placeholder="Enter Razorpay Refund ID (rfnd_...)"
                    className={`${inputCls} min-w-[240px] flex-1`}
                  />

                  <button
                    type="button"
                    onClick={() => handleRecord(item)}
                    disabled={savingId === item.payment_id}
                    className={btnOutline}
                  >
                    {savingId === item.payment_id ? "Verifying..." : "Record refund ID"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function OrdersPage({ initialStatus }: { initialStatus?: string | undefined }) {
  const { orders, ready, refundReviews, refreshRefundReviews, recordRefund, syncRefund } =
    useOrders();
  const [q, setQ] = useState("");
  const [status, setStatusF] = useState(initialStatus ?? "all");
  const [method, setMethod] = useState("all");
  const [range, setRange] = useState<Range>("all");
  const [sort, setSort] = useState("date-desc");
  const [page, setPage] = useState(1);

  const methods = useMemo(() => [...new Set(orders.map(methodOf))], [orders]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const now = Date.now();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const from =
      range === "all" ? 0 : range === "today" ? start.getTime() : now - Number(range) * 86400000;
    const list = orders.filter(
      (o) =>
        (!term ||
          [o.id, o.customerName ?? o.address.fullName, o.customerEmail ?? ""].some((v) =>
            v.toLowerCase().includes(term),
          )) &&
        (status === "all" || statusAt(o) === status) &&
        (method === "all" || methodOf(o) === method) &&
        new Date(o.createdAt).getTime() >= from,
    );
    const [k, dir] = sort.split("-");
    return [...list].sort(
      (a, b) =>
        (dir === "asc" ? 1 : -1) *
        (k === "total"
          ? a.amounts.total - b.amounts.total
          : a.createdAt.localeCompare(b.createdAt)),
    );
  }, [orders, q, status, method, range, sort]);
  const pg = paginate(filtered, page);

  const exportCsv = () => {
    downloadCsv(`dealguru-orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      [
        "Order ID",
        "Customer",
        "Email",
        "Date",
        "Items",
        "Total",
        "Payment method",
        "Payment status",
        "Order status",
      ],
      ...filtered.map((o) => [
        o.id,
        o.customerName ?? o.address.fullName,
        o.customerEmail ?? "",
        new Date(o.createdAt).toISOString(),
        o.items.reduce((n, i) => n + i.qty, 0),
        o.amounts.total,
        o.paymentMethod,
        paymentStatusOf(o),
        statusAt(o),
      ]),
    ]);
  };
  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };
  const sel = "h-9 bg-card text-[13px]";

  return (
    <>
      <RefundReviewSection />
    <Panel>
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => reset(() => setQ(e.target.value))}
            placeholder="Search order ID, name or email"
            aria-label="Search orders"
            className={`${inputCls} w-full pl-9`}
          />
        </label>
        <Select value={status} onValueChange={(v) => reset(() => setStatusF(v))}>
          <SelectTrigger className={`${sel} w-[160px]`} aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={(v) => reset(() => setMethod(v))}>
          <SelectTrigger className={`${sel} w-[160px]`} aria-label="Filter by payment method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {methods.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(v) => reset(() => setRange(v as Range))}>
          <SelectTrigger className={`${sel} w-[140px]`} aria-label="Filter by date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <SelectItem key={r} value={r}>
                {RANGES[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className={`${sel} w-[160px]`} aria-label="Sort orders">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest first</SelectItem>
            <SelectItem value="date-asc">Oldest first</SelectItem>
            <SelectItem value="total-desc">Total: high to low</SelectItem>
            <SelectItem value="total-asc">Total: low to high</SelectItem>
          </SelectContent>
        </Select>
        <button onClick={exportCsv} disabled={!filtered.length} className={btnOutline}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      {!ready ? (
        <TableSkeleton />
      ) : !filtered.length ? (
        <EmptyState
          icon={ShoppingBag}
          title={orders.length ? "No orders match these filters" : "No orders yet"}
          text={
            orders.length
              ? "Try clearing the search or filters."
              : "Orders placed on the store will appear here."
          }
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                {[
                  "Order ID",
                  "Customer",
                  "Date",
                  "Items",
                  "Total",
                  "Payment",
                  "Paid",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pg.items.map((o) => (
                <tr key={o.id}>
                  <td className={`${td} font-medium`}>{o.id}</td>
                  <td className={td}>
                    <span className="block">{o.customerName ?? o.address.fullName}</span>
                    <span className="text-[11px] text-muted-foreground">{o.customerEmail}</span>
                  </td>
                  <td className={td}>{fmtDate(o.createdAt)}</td>
                  <td className={td}>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td className={`${td} font-semibold`}>{inr(o.amounts.total)}</td>
                  <td className={td}>{o.paymentMethod}</td>
                  <td className={td}>
                    <PayPill s={paymentStatusOf(o)} />
                  </td>
                  <td className={td}>
                    <div className="flex flex-col items-start gap-1">
                      <StatusPill status={statusAt(o)} />
                      <StatusSelect order={o} compact />
                    </div>
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
          <Pager page={pg.page} pages={pg.pages} onPage={setPage} />
        </>
      )}
    </Panel>

  </>
  );
}

export function PayPill({ s }: { s: string }) {
  const tone =
    s === "Paid"
      ? "bg-success/15 text-success"
      : s === "Refunded"
        ? "bg-muted text-foreground"
        : "bg-star/20 text-foreground";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      {s}
    </span>
  );
}
