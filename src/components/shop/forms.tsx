import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "./Logo";

export function Field({ label, error, htmlFor, children, hint }: { label: string; error?: string | undefined; htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p role="alert" className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ invalid, className = "", ...p }, ref) => (
    <input ref={ref} aria-invalid={invalid || undefined} className={`input-field ${invalid ? "border-destructive" : ""} ${className}`} {...p} />
  ),
);
TextInput.displayName = "TextInput";

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>((p, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextInput ref={ref} type={show ? "text" : "password"} className="pr-10" {...p} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export function SubmitButton({ loading, children, className = "", disabled, ...p }: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button disabled={loading || disabled} {...p}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}{children}
    </button>
  );
}

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="bg-blush px-4 py-14">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-7 shadow-card sm:p-9">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <h1 className="text-center text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}

export function PageSpinner() {
  return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" /></div>;
}

/** Client-side guard for demo auth (data lives in localStorage, so it can only be checked in the browser). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const fired = useRef(false);
  useEffect(() => {
    // The guarded page can stay mounted briefly while the URL already shows /login — never re-wrap that.
    if (!ready || isAuthenticated || fired.current || location.pathname === "/login") return;
    fired.current = true;
    navigate({ to: "/login", search: { redirect: location.href }, replace: true });
  }, [ready, isAuthenticated, location, navigate]);
  if (!ready || !isAuthenticated) return <PageSpinner />;
  return <>{children}</>;
}

export function noindexHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — DealGuru` }, { name: "description", content: description },
      { property: "og:title", content: `${title} — DealGuru` }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  };
}
