import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Building2, Check, CreditCard, Gift, Loader2, Lock, ShieldCheck, Smartphone, Wallet, CalendarClock } from "lucide-react";
import { inr } from "@/lib/shop/format";
import { codAllowed, COD_ENABLED, COD_FEE, COD_MAX_TOTAL, emiAllowed, emiMonthly, EMI_MIN_TOTAL, GIFT_CARDS } from "@/lib/shop/pricing";
import { cardBrand, DECLINE_CARD, digits, expiryValid, formatCardNumber, formatExpiry, maskCard, UPI_RE, type CardBrand } from "@/lib/shop/payment";
import { cardSchema, type CardValues } from "@/lib/shop/validators";
import { Field, SubmitButton, TextInput } from "@/components/shop/forms";

export type PaymentChoice =
  | { method: "upi"; upiId: string }
  | { method: "card"; brand: CardBrand; last4: string; decline: boolean }
  | { method: "netbanking"; bank: string }
  | { method: "wallet"; wallet: string }
  | { method: "emi"; bank: string; months: number; monthly: number }
  | { method: "cod" }
  | { method: "giftcard" };

export function paymentLabel(c: PaymentChoice): string {
  switch (c.method) {
    case "upi": return `UPI: ${c.upiId}`;
    case "card": return maskCard(c.brand, c.last4);
    case "netbanking": return `Net Banking: ${c.bank}`;
    case "wallet": return `Wallet: ${c.wallet}`;
    case "emi": return `EMI: ${c.bank} · ${c.months} months × ${inr(c.monthly)}`;
    case "cod": return "Cash on Delivery";
    case "giftcard": return "Gift Card / Store Credit";
  }
}

type Method = PaymentChoice["method"];
const METHODS: { id: Exclude<Method, "giftcard"> | "gift"; label: string; icon: typeof Smartphone }[] = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", icon: Building2 },
  { id: "wallet", label: "Wallets", icon: Wallet },
  { id: "emi", label: "EMI", icon: CalendarClock },
  // Cash on Delivery is switched off (prepaid only) — see COD_ENABLED in pricing.ts.
  ...(COD_ENABLED ? [{ id: "cod" as const, label: "Cash on Delivery", icon: Banknote }] : []),
  { id: "gift", label: "Gift Card / Store Credit", icon: Gift },
];
const BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB", "Bank of Baroda", "Yes Bank"];
const MORE_BANKS = ["Canara Bank", "Union Bank", "IndusInd", "IDFC First", "Federal Bank", "Indian Bank"];
const WALLETS = ["Paytm", "PhonePe", "Amazon Pay", "Mobikwik", "Freecharge"];
const UPI_APPS = [["Google Pay", "okaxis"], ["PhonePe", "ybl"], ["Paytm", "paytm"], ["BHIM", "upi"]] as const;

function Pill({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={active}
      className={`rounded-md border px-3 py-2.5 text-[13px] font-medium transition disabled:opacity-40 ${active ? "border-primary bg-secondary text-primary" : "border-border bg-card hover:border-foreground"}`}>
      {children}
    </button>
  );
}

export function PaymentStep({ total, giftCredit, setGiftCredit, initial, onContinue }: {
  total: number; // total before COD fee, after gift card
  giftCredit: number;
  setGiftCredit: (n: number) => void;
  initial?: PaymentChoice | undefined;
  onContinue: (c: PaymentChoice) => void;
}) {
  const [tab, setTab] = useState<(typeof METHODS)[number]["id"]>(initial && initial.method !== "giftcard" ? initial.method : "upi");
  const covered = total <= 0;

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-star/50 bg-star/10 px-4 py-2.5 text-center text-[12px] font-semibold uppercase tracking-wide">
        Demo mode – no real payment will be charged
      </div>
      <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
        <div role="tablist" aria-label="Payment methods" className="flex gap-2 overflow-x-auto md:flex-col no-scrollbar">
          {METHODS.map(({ id, label, icon: I }) => (
            <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-[13px] font-medium transition ${tab === id ? "border-primary bg-secondary text-primary" : "border-border bg-card hover:border-foreground"}`}>
              <I className="h-4 w-4 shrink-0" />{label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="min-w-0 rounded-lg border border-border bg-card p-5">
          {covered && tab !== "gift" ? (
            <CoveredPanel onContinue={() => onContinue({ method: "giftcard" })} />
          ) : (
            <>
              {tab === "upi" && <UpiPanel onContinue={onContinue} />}
              {tab === "card" && <CardPanel onContinue={onContinue} />}
              {tab === "netbanking" && <BankPanel onContinue={(bank) => onContinue({ method: "netbanking", bank })} />}
              {tab === "wallet" && <WalletPanel onContinue={(wallet) => onContinue({ method: "wallet", wallet })} />}
              {tab === "emi" && <EmiPanel total={total} onContinue={onContinue} />}
              {tab === "cod" && <CodPanel total={total} onContinue={() => onContinue({ method: "cod" })} />}
              {tab === "gift" && <GiftPanel credit={giftCredit} setCredit={setGiftCredit} covered={covered} onContinue={() => onContinue({ method: "giftcard" })} />}
            </>
          )}
        </div>
      </div>
      {!COD_ENABLED && <p className="text-center text-[12px] text-muted-foreground">Cash on Delivery is not available — all orders are prepaid.</p>}
      <p className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Secure &amp; Encrypted · <ShieldCheck className="h-3.5 w-3.5" /> 100% safe payments</p>
    </div>
  );
}

function CoveredPanel({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-4 text-[13px]">
      <p>Your gift card covers the full amount. No further payment needed.</p>
      <SubmitButton type="button" onClick={onContinue}>Continue to Review</SubmitButton>
    </div>
  );
}

function UpiPanel({ onContinue }: { onContinue: (c: PaymentChoice) => void }) {
  const [id, setId] = useState("");
  const [state, setState] = useState<"idle" | "verifying" | "verified">("idle");
  const [error, setError] = useState<string | null>(null);
  const verify = () => {
    if (!UPI_RE.test(id.trim())) { setError("Enter a valid UPI ID, e.g. name@okhdfc"); return; }
    setError(null); setState("verifying");
    setTimeout(() => setState("verified"), 1000);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {UPI_APPS.map(([app, handle]) => (
          <Pill key={app} active={id.endsWith(`@${handle}`)} onClick={() => { setId(`${id.split("@")[0] || "yourname"}@${handle}`); setState("idle"); }}>{app}</Pill>
        ))}
      </div>
      <Field label="UPI ID" htmlFor="upi" error={error ?? undefined}>
        <div className="flex gap-2">
          <TextInput id="upi" placeholder="name@okhdfc" value={id} invalid={!!error} onChange={(e) => { setId(e.target.value); setState("idle"); setError(null); }} />
          <button type="button" onClick={verify} disabled={state === "verifying" || !id}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-foreground px-4 text-[13px] font-medium hover:bg-foreground hover:text-background disabled:opacity-50">
            {state === "verifying" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {state === "verified" ? <><Check className="h-4 w-4 text-success" /> Verified</> : "Verify"}
          </button>
        </div>
      </Field>
      <SubmitButton type="button" disabled={state !== "verified"} onClick={() => onContinue({ method: "upi", upiId: id.trim() })}>Continue to Review</SubmitButton>
    </div>
  );
}

function CardPanel({ onContinue }: { onContinue: (c: PaymentChoice) => void }) {
  const { register, handleSubmit, setValue, watch, setError, formState: { errors, isSubmitting } } = useForm<CardValues>({
    resolver: zodResolver(cardSchema), defaultValues: { number: "", name: "", expiry: "", cvv: "", save: false },
  });
  const brand = cardBrand(watch("number"));
  const submit = (v: CardValues) => {
    if (!expiryValid(v.expiry)) { setError("expiry", { message: "Enter a valid, unexpired date (MM/YY)" }); return; }
    const n = digits(v.number);
    // Only brand + last 4 leave this form. Full number and CVV are discarded.
    onContinue({ method: "card", brand, last4: n.slice(-4), decline: n === DECLINE_CARD });
  };
  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Card Number" htmlFor="cc-num" error={errors.number?.message}>
          <div className="relative">
            <TextInput id="cc-num" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" invalid={!!errors.number}
              {...register("number", { onChange: (e) => setValue("number", formatCardNumber(e.target.value)) })} />
            {brand !== "Card" && <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-muted px-2 py-0.5 text-[11px] font-bold">{brand}</span>}
          </div>
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Name on Card" htmlFor="cc-name" error={errors.name?.message}><TextInput id="cc-name" autoComplete="cc-name" invalid={!!errors.name} {...register("name")} /></Field>
      </div>
      <Field label="Expiry (MM/YY)" htmlFor="cc-exp" error={errors.expiry?.message}>
        <TextInput id="cc-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="08/29" invalid={!!errors.expiry}
          {...register("expiry", { onChange: (e) => setValue("expiry", formatExpiry(e.target.value)) })} />
      </Field>
      <Field label="CVV" htmlFor="cc-cvv" error={errors.cvv?.message}>
        <TextInput id="cc-cvv" type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="•••" invalid={!!errors.cvv} {...register("cvv")} />
      </Field>
      <label className="flex items-center gap-2 text-[13px] sm:col-span-2"><input type="checkbox" className="h-3.5 w-3.5 accent-primary" {...register("save")} /> Save card for future (only the last 4 digits are kept)</label>
      <p className="rounded-md bg-muted px-3 py-2 text-[12px] text-muted-foreground sm:col-span-2">
        Demo mode: use any valid-looking card, e.g. <b>4111 1111 1111 1111</b>. Use <b>4000 0000 0000 0002</b> to test a declined payment.
      </p>
      <div className="sm:col-span-2"><SubmitButton loading={isSubmitting}>Continue to Review</SubmitButton></div>
    </form>
  );
}

function BankPanel({ onContinue }: { onContinue: (b: string) => void }) {
  const [bank, setBank] = useState("");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{BANKS.map((b) => <Pill key={b} active={bank === b} onClick={() => setBank(b)}>{b}</Pill>)}</div>
      <label className="block text-[13px] font-medium" htmlFor="more-banks">More banks</label>
      <select id="more-banks" className="input-field" value={MORE_BANKS.includes(bank) ? bank : ""} onChange={(e) => setBank(e.target.value)}>
        <option value="">Select another bank</option>
        {MORE_BANKS.map((b) => <option key={b}>{b}</option>)}
      </select>
      <SubmitButton type="button" disabled={!bank} onClick={() => onContinue(bank)}>Continue to Review</SubmitButton>
    </div>
  );
}

function WalletPanel({ onContinue }: { onContinue: (w: string) => void }) {
  const [w, setW] = useState("");
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Wallets" className="grid gap-2 sm:grid-cols-2">
        {WALLETS.map((x) => (
          <label key={x} className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-[13px] font-medium ${w === x ? "border-primary bg-secondary" : "border-border"}`}>
            <input type="radio" name="wallet" className="accent-primary" checked={w === x} onChange={() => setW(x)} />{x}
          </label>
        ))}
      </div>
      <SubmitButton type="button" disabled={!w} onClick={() => onContinue(w)}>Continue to Review</SubmitButton>
    </div>
  );
}

function EmiPanel({ total, onContinue }: { total: number; onContinue: (c: PaymentChoice) => void }) {
  const [bank, setBank] = useState("");
  const [months, setMonths] = useState(0);
  if (!emiAllowed(total)) return <p className="text-[13px] text-muted-foreground">EMI is available on orders of {inr(EMI_MIN_TOTAL)} or more. Add {inr(EMI_MIN_TOTAL - total)} more to unlock it.</p>;
  return (
    <div className="space-y-4">
      <p className="text-[13px] font-medium">1. Choose your bank</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{BANKS.slice(0, 4).map((b) => <Pill key={b} active={bank === b} onClick={() => setBank(b)}>{b}</Pill>)}</div>
      {bank && <>
        <p className="text-[13px] font-medium">2. Choose a tenure</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[3, 6, 9, 12].map((m) => (
            <label key={m} className={`flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 text-[13px] ${months === m ? "border-primary bg-secondary" : "border-border"}`}>
              <span className="flex items-center gap-2"><input type="radio" name="emi" className="accent-primary" checked={months === m} onChange={() => setMonths(m)} />{m} months</span>
              <span><b>{inr(emiMonthly(total, m))}</b>/mo <span className="text-[11px] text-muted-foreground">{m <= 6 ? "0% interest" : "14% p.a."}</span></span>
            </label>
          ))}
        </div>
      </>}
      <SubmitButton type="button" disabled={!bank || !months} onClick={() => onContinue({ method: "emi", bank, months, monthly: emiMonthly(total, months) })}>Continue to Review</SubmitButton>
    </div>
  );
}

function CodPanel({ total, onContinue }: { total: number; onContinue: () => void }) {
  const ok = codAllowed(total);
  return (
    <div className="space-y-4 text-[13px]">
      {ok ? (
        <p>Pay in cash when your order arrives. A COD fee of <b>{inr(COD_FEE)}</b> applies.</p>
      ) : (
        <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground">Cash on Delivery isn’t available for orders above {inr(COD_MAX_TOTAL)}. Please choose another method.</p>
      )}
      <SubmitButton type="button" disabled={!ok} onClick={onContinue}>Continue to Review</SubmitButton>
    </div>
  );
}

function GiftPanel({ credit, setCredit, covered, onContinue }: { credit: number; setCredit: (n: number) => void; covered: boolean; onContinue: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  return (
    <div className="space-y-4 text-[13px]">
      {credit > 0 ? (
        <div className="flex items-center justify-between rounded-md border border-success/40 bg-success/10 px-3 py-2.5">
          <span className="flex items-center gap-2 text-success"><Check className="h-4 w-4" />Gift card applied · {inr(credit)} off</span>
          <button type="button" onClick={() => setCredit(0)} className="text-muted-foreground hover:underline">Remove</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); const v = GIFT_CARDS[code.trim().toUpperCase()]; if (v) { setCredit(v); setCode(""); } setError(!v); }} className="space-y-1.5">
          <label htmlFor="gift" className="font-medium">Gift card or store credit code</label>
          <div className="flex gap-2">
            <input id="gift" value={code} onChange={(e) => { setCode(e.target.value); setError(false); }} className={`input-field uppercase ${error ? "border-destructive" : ""}`} placeholder="GURU100" />
            <button className="shrink-0 rounded-md border border-foreground px-4 font-medium hover:bg-foreground hover:text-background">Apply</button>
          </div>
          {error && <p role="alert" className="text-[12px] text-destructive">Invalid gift card code</p>}
          <p className="text-[12px] text-muted-foreground">Demo code: GURU100 for ₹100 off.</p>
        </form>
      )}
      {credit > 0 && (covered
        ? <SubmitButton type="button" onClick={onContinue}>Continue to Review</SubmitButton>
        : <p className="text-muted-foreground">Choose another payment method for the remaining amount.</p>)}
    </div>
  );
}
