import { useState } from "react";
import {
  Building2,
  CreditCard,
  Smartphone,
  Wallet,
  CalendarClock,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { inr } from "@/lib/shop/format";

export type PaymentChoice = {
  method: "upi" | "card" | "netbanking" | "wallet" | "emi";
};

export function paymentLabel(payment: PaymentChoice): string {
  const labels: Record<PaymentChoice["method"], string> = {
    upi: "UPI",
    card: "Credit / Debit Card",
    netbanking: "Net Banking",
    wallet: "Wallet",
    emi: "EMI",
  };

  return labels[payment.method];
}

const METHODS = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", icon: Building2 },
  { id: "wallet", label: "Wallets", icon: Wallet },
  { id: "emi", label: "EMI", icon: CalendarClock },
] as const;

type Method = PaymentChoice["method"];

export function PaymentStep({
  total,
  initial,
  onContinue,
}: {
  total: number;
  initial?: PaymentChoice | undefined;
  onContinue: (payment: PaymentChoice) => void;
}) {
  const [method, setMethod] = useState<Method>(initial?.method ?? "upi");

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border bg-muted px-4 py-3 text-center">
        <p className="text-sm font-medium">Secure Online Payment</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose your preferred payment method. Payment will be completed securely through Razorpay.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {METHODS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMethod(id)}
            aria-pressed={method === id}
            className={`flex items-center gap-3 rounded-md border p-4 text-left transition ${
              method === id
                ? "border-primary bg-secondary text-primary"
                : "border-border bg-card hover:border-foreground"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{label}</span>
            {method === id && <span className="ml-auto text-xs font-semibold">Selected</span>}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount to pay</span>
          <span className="text-lg font-bold">{inr(total)}</span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Your selected payment method will be available in the Razorpay checkout window.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onContinue({ method })}
        disabled={total <= 0}
        className="w-full rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue to Review
      </button>

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Secure Payment
        <ShieldCheck className="h-3.5 w-3.5" />
        Powered by Razorpay
      </p>
    </div>
  );
}
