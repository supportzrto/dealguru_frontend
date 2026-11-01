// Demo only. Replace with Supabase auth, DB and storage later.
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 shadow-soft ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string | number; hint?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-bold tracking-tight">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="py-10 text-center">
      <Icon className="mx-auto h-9 w-9 text-muted-foreground" strokeWidth={1.3} />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {text && <p className="mt-1 text-[13px] text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return <div className="space-y-2" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
}

/** Horizontally scrollable table wrapper for small screens. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="-mx-5 overflow-x-auto px-5"><table className="w-full min-w-[760px] text-left text-[13px]">{children}</table></div>;
}
export const th = "border-b border-border py-2.5 pr-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
export const td = "border-b border-border py-3 pr-3 align-middle";

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const btn = "grid h-8 w-8 place-items-center rounded-md border border-border bg-card disabled:opacity-40 hover:border-foreground";
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-[13px]">
      <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
      <span>Page {page} of {pages}</span>
      <button className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}

export const inputCls = "h-9 rounded-md border border-border bg-card px-3 text-[13px] outline-none focus:border-primary";
export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60";
export const btnOutline = "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-[13px] font-medium transition hover:border-foreground disabled:opacity-50";

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function paginate<T>(list: T[], page: number, size = 10) {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(page, pages);
  return { pages, page: p, items: list.slice((p - 1) * size, p * size) };
}
