import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, INDIAN_STATES, type AddressValues } from "@/lib/shop/validators";
import { Field, SubmitButton, TextInput } from "@/components/shop/forms";

const empty: AddressValues = { fullName: "", phone: "", pincode: "", line1: "", line2: "", landmark: "", city: "", state: "", type: "Home", isDefault: false };

export function AddressForm({ initial, onSubmit, onCancel, submitLabel = "Save Address" }:
  { initial?: Partial<AddressValues>; onSubmit: (v: AddressValues) => void | Promise<void>; onCancel?: (() => void) | undefined; submitLabel?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema), defaultValues: { ...empty, ...initial },
  });
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Full Name" htmlFor="a-name" error={errors.fullName?.message}><TextInput id="a-name" invalid={!!errors.fullName} {...register("fullName")} /></Field>
      <Field label="Phone" htmlFor="a-phone" error={errors.phone?.message}><TextInput id="a-phone" inputMode="numeric" maxLength={10} invalid={!!errors.phone} {...register("phone")} /></Field>
      <Field label="Pincode" htmlFor="a-pin" error={errors.pincode?.message}><TextInput id="a-pin" inputMode="numeric" maxLength={6} invalid={!!errors.pincode} {...register("pincode")} /></Field>
      <Field label="City" htmlFor="a-city" error={errors.city?.message}><TextInput id="a-city" invalid={!!errors.city} {...register("city")} /></Field>
      <div className="sm:col-span-2"><Field label="Address Line 1" htmlFor="a-l1" error={errors.line1?.message}><TextInput id="a-l1" placeholder="House no., building, street" invalid={!!errors.line1} {...register("line1")} /></Field></div>
      <div className="sm:col-span-2"><Field label="Address Line 2" htmlFor="a-l2" error={errors.line2?.message}><TextInput id="a-l2" placeholder="Area, colony (optional)" {...register("line2")} /></Field></div>
      <Field label="Landmark (optional)" htmlFor="a-lm" error={errors.landmark?.message}><TextInput id="a-lm" {...register("landmark")} /></Field>
      <Field label="State" htmlFor="a-state" error={errors.state?.message}>
        <select id="a-state" aria-invalid={!!errors.state || undefined} className={`input-field ${errors.state ? "border-destructive" : ""}`} {...register("state")}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-[13px] font-medium">Address Type</legend>
        <div className="flex gap-3">
          {(["Home", "Work"] as const).map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 text-[13px] has-[:checked]:border-primary has-[:checked]:text-primary">
              <input type="radio" value={t} className="accent-primary" {...register("type")} /> {t}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-[13px] sm:col-span-2"><input type="checkbox" className="h-3.5 w-3.5 accent-primary" {...register("isDefault")} /> Use as default address</label>
      <div className="flex gap-3 sm:col-span-2">
        <SubmitButton loading={isSubmitting}>{submitLabel}</SubmitButton>
        {onCancel && <button type="button" onClick={onCancel} className="rounded-md border border-border px-5 text-sm font-medium hover:bg-muted">Cancel</button>}
      </div>
    </form>
  );
}

export function AddressText({ a }: { a: AddressValues }) {
  return (
    <div className="text-[13px] leading-relaxed">
      <p className="font-semibold">{a.fullName} <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">{a.type}</span></p>
      <p className="text-muted-foreground">{[a.line1, a.line2, a.landmark && `Near ${a.landmark}`].filter(Boolean).join(", ")}</p>
      <p className="text-muted-foreground">{a.city}, {a.state} – {a.pincode}</p>
      <p className="text-muted-foreground">Phone: +91 {a.phone}</p>
    </div>
  );
}
