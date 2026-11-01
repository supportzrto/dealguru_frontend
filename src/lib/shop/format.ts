export { inr } from "@/components/shop/data";

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export const fmtDateTime = (d: Date | string) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

export function readStore<T>(key: string, fallback: T, area: "local" | "session" = "local"): T {
  try {
    const raw = (area === "local" ? localStorage : sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore(key: string, value: unknown, area: "local" | "session" = "local"): boolean {
  try {
    (area === "local" ? localStorage : sessionStorage).setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // storage full or unavailable
  }
}
