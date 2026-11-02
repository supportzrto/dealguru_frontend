import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Gift, Plus, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useCart } from "@/components/shop/store";
import { noindexHead, RequireAuth, SubmitButton } from "@/components/shop/forms";
import { AddressForm, AddressText } from "@/components/checkout/AddressForm";
import { MiniItems, SummaryLines } from "@/components/checkout/OrderSummary";
import { PaymentStep, paymentLabel, type PaymentChoice } from "@/components/checkout/PaymentStep";
import { addDays, fmtDate, inr } from "@/lib/shop/format";
import {
  codAllowed,
  computeTotals,
  deliveryFee,
  GIFT_WRAP_FEE,
  type DeliveryMethod,
} from "@/lib/shop/pricing";
import { useSettings } from "@/context/SettingsContext";
import { newOrderId } from "@/lib/shop/payment";
import { imageFor } from "@/components/shop/data";
import { toast } from "sonner";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
  };
  theme: {
    color: string;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

async function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });

  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout could not be initialized.");
  }
}

export const Route = createFileRoute("/checkout")({
  head: () => noindexHead("Checkout", "Secure checkout for your DealGuru order."),
  component: () => (
    <RequireAuth>
      <Checkout />
    </RequireAuth>
  ),
});

const STEPS = ["Address", "Delivery", "Payment", "Review"] as const;
const etaFor = (m: DeliveryMethod) => addDays(new Date(), m === "express" ? 2 : 6);
type OnlinePaymentMethod = Exclude<PaymentChoice["method"], "cod" | "giftcard">;

function isOnlinePaymentMethod(method: PaymentChoice["method"]): method is OnlinePaymentMethod {
  return ["upi", "card", "netbanking", "wallet", "emi"].includes(method);
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex items-center" aria-label="Checkout progress">
      {STEPS.map((s, i) => {
        const n = i + 1,
          done = step > n,
          cur = step === n;
        return (
          <li
            key={s}
            className="flex flex-1 items-center last:flex-none"
            aria-current={cur ? "step" : undefined}
          >
            <div className="flex items-center gap-2">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${done ? "bg-success text-success-foreground" : cur ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </span>
              <span
                className={`hidden text-[13px] font-medium sm:inline ${cur ? "" : "text-muted-foreground"}`}
              >
                {s}
              </span>
            </div>
            {n < STEPS.length && (
              <span className={`mx-2 h-0.5 flex-1 sm:mx-3 ${done ? "bg-success" : "bg-border"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Section({
  n,
  step,
  title,
  summary,
  onEdit,
  children,
}: {
  n: number;
  step: number;
  title: string;
  summary?: ReactNode;
  onEdit: () => void;
  children: ReactNode;
}) {
  const done = step > n,
    open = step === n;
  return (
    <section className="rounded-lg border border-border bg-card" aria-labelledby={`step-${n}`}>
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <h2
          id={`step-${n}`}
          className={`flex items-center gap-2 font-semibold ${!open && !done ? "text-muted-foreground" : ""}`}
        >
          <span className="text-[13px] text-muted-foreground">{n}.</span>
          {title}
          {done && <Check className="h-4 w-4 text-success" aria-label="completed" />}
        </h2>
        {done && (
          <button onClick={onEdit} className="text-[13px] font-medium text-primary hover:underline">
            Edit
          </button>
        )}
      </header>
      {done && summary && <div className="border-t border-border px-5 py-3">{summary}</div>}
      {open && <div className="border-t border-border p-5">{children}</div>}
    </section>
  );
}

function Checkout() {
  const { user, saveAddress, isAdmin } = useAuth();
  const { rules } = useSettings();
  const { items, subtotal, coupon, clear } = useCart();
  const { createOrder, createRazorpayPayment, verifyRazorpayPayment } = useOrders();
  const navigate = useNavigate();

  const addresses = user?.addresses ?? [];
  const [step, setStep] = useState(1);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryMethod>("standard");
  const [giftWrap, setGiftWrap] = useState(false);
  const [notes, setNotes] = useState("");
  const [giftCredit, setGiftCredit] = useState(0);
  const [payment, setPayment] = useState<PaymentChoice | undefined>();
  const [terms, setTerms] = useState(false);
  const [paying, setPaying] = useState(false);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (!addressId && addresses.length)
      setAddressId((addresses.find((a) => a.isDefault) ?? addresses[0])!.id);
  }, [addresses, addressId]);

  const base = { subtotal, coupon, delivery, giftWrap, giftCardCredit: giftCredit, rules };
  const preCod = computeTotals(base);
  const t = computeTotals({ ...base, cod: false });
  const address = addresses.find((a) => a.id === addressId);
  const codEligible = codAllowed(preCod.total);

  if (isAdmin) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold">Checkout is for customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Admin accounts can’t place orders. Log in with a customer account to shop.
        </p>
        <Link
          to="/admin"
          className="mt-6 inline-block rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-primary"
        >
          Go to Admin Dashboard
        </Link>
      </div>
    );
  }

  if (!items.length && !placed) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold">Your bag is empty</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add something you love, then come back to checkout.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-primary"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!user || !address || !addressId || !payment || paying) return;

    setPaying(true);

    try {
      if (!isOnlinePaymentMethod(payment.method)) {
        throw new Error("Please select a supported online payment method.");
      }

      // 1. Create the DealGuru order
      const order = await createOrder({
        addressId,
        items: items.map((i) => ({
          productId: i.product.id,
          qty: i.qty,
          color: i.color,
          size: i.size,
        })),
        deliveryMethod: "standard",
        giftWrap,
        notes: notes.trim().slice(0, 300),
        paymentMethod: payment.method,
        couponCode: coupon?.code,
      });

      // 2. Load Razorpay Checkout
      await loadRazorpay();

      // 3. Create Razorpay order through backend
      const razorpayOrder = await createRazorpayPayment(order.id);

      // 4. Open Razorpay Checkout
      await new Promise<void>((resolve, reject) => {
        const Razorpay = window.Razorpay;

        if (!Razorpay) {
          reject(new Error("Razorpay Checkout is unavailable."));
          return;
        }

        const checkout = new Razorpay({
          key: razorpayOrder.razorpay_key_id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "DealGuru",
          description: "Order payment",
          order_id: razorpayOrder.razorpay_order_id,

          handler: async (response) => {
            try {
              // 5. Verify payment on backend
              await verifyRazorpayPayment(order.id, response);

              setPlaced(true);
              clear();

              navigate({
                to: "/order-success/$orderId",
                params: { orderId: order.id },
                replace: true,
              });

              resolve();
            } catch (error) {
              reject(error);
            }
          },

          modal: {
            ondismiss: () => resolve(),
          },

          theme: {
            color: "#FF6A00",
          },
        });

        checkout.on("payment.failed", (response) => {
          reject(new Error(response.error?.description || "Payment failed. Please try again."));
        });

        checkout.open();
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment could not be completed.");
    } finally {
      setPaying(false);
    }
  };

  const summary = (
    <div className="space-y-5">
      <MiniItems items={items} />
      <div className="border-t border-border pt-4">
        <SummaryLines t={t} coupon={coupon?.code} />
      </div>
    </div>
  );

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Checkout</h1>
      <Stepper step={step} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Section
            n={1}
            step={step}
            title="Delivery Address"
            onEdit={() => setStep(1)}
            summary={address && <AddressText a={address} />}
          >
            {addresses.length > 0 && !adding && (
              <div
                role="radiogroup"
                aria-label="Saved addresses"
                className="grid gap-3 sm:grid-cols-2"
              >
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`cursor-pointer rounded-lg border p-4 transition ${addressId === a.id ? "border-primary bg-secondary" : "border-border hover:border-foreground"}`}
                  >
                    <div className="flex gap-3">
                      <input
                        type="radio"
                        name="address"
                        className="mt-1 accent-primary"
                        checked={addressId === a.id}
                        onChange={() => setAddressId(a.id)}
                      />
                      <div className="min-w-0">
                        <AddressText a={a} />
                        {a.isDefault && (
                          <span className="mt-1 inline-block text-[11px] font-medium text-primary">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {adding || !addresses.length ? (
              <div className={addresses.length ? "mt-2" : ""}>
                <h3 className="mb-4 text-sm font-semibold">Add a new address</h3>
                <AddressForm
                  initial={{ fullName: user?.fullName ?? "", phone: user?.phone ?? "" }}
                  submitLabel="Save & Continue"
                  onCancel={addresses.length ? () => setAdding(false) : undefined}
                  onSubmit={async (v) => {
                    try {
                      const a = await saveAddress(v);
                      setAddressId(a.id);
                      setAdding(false);
                      setStep(2);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Address save failed");
                    }
                  }}
                />
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <SubmitButton disabled={!addressId} onClick={() => setStep(2)}>
                  Deliver Here
                </SubmitButton>
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add new address
                </button>
              </div>
            )}
          </Section>

          <Section
            n={2}
            step={step}
            title="Delivery Method"
            onEdit={() => setStep(2)}
            summary={
              <p className="text-[13px]">
                {delivery === "express" ? "Express" : "Standard"} delivery · arrives by{" "}
                <b>{fmtDate(etaFor(delivery))}</b>
                {giftWrap && " · Gift wrapped"}
              </p>
            }
          >
            <div role="radiogroup" aria-label="Delivery method" className="space-y-3">
              {(
                [
                  [
                    "standard",
                    Truck,
                    "Standard Delivery",
                    "4–6 days",
                    deliveryFee(subtotal, "standard", coupon, rules) === 0
                      ? "FREE"
                      : inr(rules.standardFee),
                  ],
                ] as const
              ).map(([id, I, label, days, price]) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 ${delivery === id ? "border-primary bg-secondary" : "border-border"}`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    className="accent-primary"
                    checked={delivery === id}
                    onChange={() => setDelivery(id)}
                  />
                  <I className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1 text-[13px]">
                    <p className="font-semibold">
                      {label} <span className="font-normal text-muted-foreground">({days})</span>
                    </p>
                    <p className="text-muted-foreground">
                      Estimated delivery: {fmtDate(etaFor(id))}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold">{price}</span>
                </label>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-primary"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
              />
              <Gift className="h-4 w-4 text-primary" /> Add gift wrap (+{inr(GIFT_WRAP_FEE)})
            </label>
            <label htmlFor="notes" className="mt-4 block text-[13px] font-medium">
              Delivery notes (optional)
            </label>
            <textarea
              id="notes"
              maxLength={300}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field mt-1.5 h-auto py-2"
              placeholder="E.g. call before delivery"
            />
            <SubmitButton className="mt-5" onClick={() => setStep(3)}>
              Continue to Payment
            </SubmitButton>
          </Section>

          <Section
            n={3}
            step={step}
            title="Payment"
            onEdit={() => setStep(3)}
            summary={payment && <p className="text-[13px]">{paymentLabel(payment)}</p>}
          >
            <PaymentStep
              total={preCod.total}
              initial={payment}
              onContinue={(c) => {
                setPayment(c);
                setStep(4);
              }}
            />
          </Section>

          <Section n={4} step={step} title="Review & Place Order" onEdit={() => setStep(4)}>
            <div className="grid gap-4 text-[13px] sm:grid-cols-3">
              <div>
                <p className="mb-1 font-semibold">Deliver to</p>
                {address && <AddressText a={address} />}
              </div>
              <div>
                <p className="mb-1 font-semibold">Delivery</p>
                <p className="text-muted-foreground">
                  {delivery === "express" ? "Express" : "Standard"} · by {fmtDate(etaFor(delivery))}
                  {giftWrap && (
                    <>
                      <br />
                      Gift wrapped
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="mb-1 font-semibold">Payment</p>
                <p className="text-muted-foreground">{payment && paymentLabel(payment)}</p>
              </div>
            </div>
            <div className="mt-5 border-t border-border pt-5">
              <MiniItems items={items} />
            </div>
            <details className="mt-5 rounded-md border border-border lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13px] font-medium">
                Order summary{" "}
                <span className="flex items-center gap-1">
                  {inr(t.total)}
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <div className="border-t border-border p-4">
                <SummaryLines t={t} coupon={coupon?.code} />
              </div>
            </details>
            <label className="mt-5 flex items-start gap-2 text-[13px]">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 accent-primary"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />{" "}
              I agree to the Terms of Sale and Returns Policy.
            </label>
            <SubmitButton
              className="mt-5 w-full"
              disabled={!terms || !payment || !address}
              loading={paying}
              onClick={() => void placeOrder()}
            >
              Place Order • {inr(t.total)}
            </SubmitButton>
          </Section>
        </div>
        <aside className="hidden h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24 lg:block">
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
          {summary}
          {deliveryFee(subtotal, delivery, coupon, rules) > 0 &&
            delivery === "standard" &&
            rules.freeMin > subtotal && (
              <p className="mt-3 text-[12px] text-muted-foreground">
                Add {inr(rules.freeMin - subtotal)} more for free delivery.
              </p>
            )}
        </aside>
      </div>
    </div>
  );
}
