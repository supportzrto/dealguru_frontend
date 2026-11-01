import { useEffect, useRef, useState } from "react";
import { Building2, Loader2, Lock, Smartphone, XCircle } from "lucide-react";
import { inr } from "@/lib/shop/format";
import { DEMO_OTP, OTP_ATTEMPTS } from "@/lib/shop/payment";
import type { PaymentChoice } from "./PaymentStep";

type Phase = "processing" | "upi" | "redirect" | "otp" | "failed";

export function PaymentOverlay({ choice, total, codEligible, onSuccess, onRetry, onSwitchCod }: {
  choice: PaymentChoice; total: number; codEligible: boolean;
  onSuccess: () => void; onRetry: () => void; onSwitchCod: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("processing");
  const [reason, setReason] = useState("");
  const [count, setCount] = useState(3);
  const done = useRef(false);
  const succeed = () => { if (done.current) return; done.current = true; onSuccess(); };
  const fail = (r: string) => { setReason(r); setPhase("failed"); };

  useEffect(() => {
    const t = setTimeout(() => {
      switch (choice.method) {
        case "card": choice.decline ? fail("Payment declined by your bank. Please try a different card or method.") : setPhase("otp"); break;
        case "upi": setPhase("upi"); break;
        case "netbanking": case "wallet": case "emi": setPhase("redirect"); break;
        default: succeed();
      }
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "upi") return;
    if (count <= 0) { succeed(); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]);

  const partner = choice.method === "netbanking" ? `${choice.bank} NetBanking` : choice.method === "wallet" ? choice.wallet : choice.method === "emi" ? `${choice.bank} EMI` : "";

  return (
    <div role="dialog" aria-modal="true" aria-live="polite" className="fixed inset-0 z-[100] grid place-items-center bg-foreground/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-card p-7 text-center shadow-card">
        {phase === "processing" && <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 font-semibold">Processing your payment securely...</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Please don’t close or refresh this page.</p>
        </>}
        {phase === "upi" && <>
          <Smartphone className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-4 font-semibold">Waiting for approval on your UPI app...</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Request of {inr(total)} sent to {choice.method === "upi" ? choice.upiId : ""}</p>
          <p className="mt-5 text-4xl font-bold tabular-nums text-primary">{count}</p>
        </>}
        {phase === "redirect" && <>
          <Building2 className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-4 font-semibold">{partner}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Demo payment page · Amount {inr(total)}</p>
          <div className="mt-6 grid gap-2">
            <button onClick={succeed} className="rounded-md bg-success py-3 text-sm font-medium text-success-foreground hover:opacity-90">Simulate Success</button>
            <button onClick={() => fail(`${partner} reported the transaction as failed.`)} className="rounded-md border border-destructive py-3 text-sm font-medium text-destructive hover:bg-destructive/10">Simulate Failure</button>
          </div>
        </>}
        {phase === "otp" && <OtpScreen total={total} onOk={succeed} onFail={() => fail("Too many incorrect OTP attempts.")} />}
        {phase === "failed" && <>
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 text-lg font-bold">Payment Failed</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{reason}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Your bag is safe — nothing was charged.</p>
          <div className="mt-6 grid gap-2">
            <button onClick={onRetry} className="rounded-md bg-foreground py-3 text-sm font-medium text-background hover:bg-primary">Try Again</button>
            {codEligible && <button onClick={onSwitchCod} className="rounded-md border border-border py-3 text-sm font-medium hover:bg-muted">Switch to Cash on Delivery</button>}
          </div>
        </>}
      </div>
    </div>
  );
}

function OtpScreen({ total, onOk, onFail }: { total: number; onOk: () => void; onFail: () => void }) {
  const [otp, setOtp] = useState("");
  const [left, setLeft] = useState(OTP_ATTEMPTS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (otp === DEMO_OTP) { onOk(); return; }
      const n = left - 1;
      setLeft(n); setOtp("");
      if (n <= 0) onFail(); else setError(`Incorrect OTP, try again (${n} attempt${n > 1 ? "s" : ""} left)`);
    }, 700);
  };
  return (
    <form onSubmit={submit}>
      <Lock className="mx-auto h-9 w-9 text-primary" />
      <p className="mt-4 font-semibold">Enter OTP</p>
      <p className="mt-1 text-[13px] text-muted-foreground">A 6-digit code was sent to your registered mobile for {inr(total)}.</p>
      <label htmlFor="otp" className="sr-only">One-time password</label>
      <input id="otp" autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(null); }}
        className="input-field mt-5 text-center text-xl tracking-[0.5em]" aria-invalid={!!error || undefined} />
      {error && <p role="alert" className="mt-2 text-[12px] text-destructive">{error}</p>}
      <p className="mt-2 text-[11px] text-muted-foreground">Demo OTP: 123456</p>
      <button disabled={otp.length !== 6 || busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-foreground py-3 text-sm font-medium text-background hover:bg-primary disabled:opacity-50">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}Verify &amp; Pay
      </button>
    </form>
  );
}
