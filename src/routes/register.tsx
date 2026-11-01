import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { registerSchema, type RegisterValues } from "@/lib/shop/validators";
import { AuthCard, Field, PasswordInput, SubmitButton, TextInput, noindexHead } from "@/components/shop/forms";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof s["redirect"] === "string" && s["redirect"].startsWith("/") ? s["redirect"] : undefined,
  }),
  head: () => noindexHead("Create Account", "Create your DealGuru account."),
  component: RegisterPage,
});

function RegisterPage() {
  const { redirect } = Route.useSearch();
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirm: "", terms: false as unknown as true },
  });

  const onSubmit = async (v: RegisterValues) => {
    const r = await signUp(v);
    if (!r.ok) { setError("email", { message: r.error }); return; }
    toast.success("Account created successfully");
    navigate({ to: "/login", search: { email: v.email.trim().toLowerCase(), redirect } });
  };

  return (
    <AuthCard title="Create your account" subtitle="Join DealGuru for faster checkout and order tracking">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Full Name" htmlFor="fullName" error={errors.fullName?.message}>
          <TextInput id="fullName" autoComplete="name" invalid={!!errors.fullName} {...register("fullName")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <TextInput id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <div className="flex">
            <span className="grid place-items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-[13px] text-muted-foreground">+91</span>
            <TextInput id="phone" inputMode="numeric" maxLength={10} autoComplete="tel-national" className="rounded-l-none" invalid={!!errors.phone} {...register("phone")} />
          </div>
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Confirm Password" htmlFor="confirm" error={errors.confirm?.message}>
          <PasswordInput id="confirm" autoComplete="new-password" invalid={!!errors.confirm} {...register("confirm")} />
        </Field>
        <div>
          <label className="flex items-start gap-2 text-[13px]">
            <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-primary" {...register("terms")} />
            <span>I agree to the <Link to="/faqs" className="text-primary hover:underline">Terms &amp; Privacy Policy</Link></span>
          </label>
          {errors.terms && <p role="alert" className="mt-1 text-[12px] text-destructive">{errors.terms.message}</p>}
        </div>
        <SubmitButton loading={isSubmitting} className="w-full">Create Account</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          Already have an account? <Link to="/login" search={redirect ? { redirect } : {}} className="font-medium text-primary hover:underline">Login</Link>
        </p>
      </form>
    </AuthCard>
  );
}
