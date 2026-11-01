import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { firstName } from "@/lib/shop/format";
import { forgotSchema, loginSchema, type LoginValues } from "@/lib/shop/validators";
import { AuthCard, Field, PasswordInput, SubmitButton, TextInput, noindexHead } from "@/components/shop/forms";

type Search = { redirect?: string | undefined; email?: string | undefined };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s["redirect"] === "string" && s["redirect"].startsWith("/") ? s["redirect"] : undefined,
    email: typeof s["email"] === "string" ? s["email"] : undefined,
  }),
  head: () => noindexHead("Login", "Sign in to your DealGuru account."),
  component: LoginPage,
});

function LoginPage() {
  const { redirect, email } = Route.useSearch();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: email ?? "", password: "", remember: true },
  });

  const onSubmit = async (v: LoginValues) => {
    setError(null);
    const r = await login(v.email, v.password, v.remember);
    if (!r.ok) { setError(r.error); return; }
    toast.success(`Welcome back, ${firstName(r.user?.fullName ?? "")}`);
    navigate({ to: redirect ?? "/", replace: true });
  };

  return (
    <AuthCard title="Welcome back" subtitle="Login to continue shopping">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">{error}</p>}
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <TextInput id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" invalid={!!errors.password} {...register("password")} />
        </Field>
        <div className="flex items-center justify-between text-[13px]">
          <label className="flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 accent-primary" {...register("remember")} /> Remember me</label>
          <button type="button" onClick={() => setForgot(true)} className="text-primary hover:underline">Forgot password?</button>
        </div>
        <SubmitButton loading={isSubmitting} className="w-full">Login</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          New to DealGuru? <Link to="/register" search={redirect ? { redirect } : {}} className="font-medium text-primary hover:underline">Create an account</Link>
        </p>
      </form>
      <ForgotDialog open={forgot} onOpenChange={setForgot} />
    </AuthCard>
  );
}

function ForgotDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{ email: string }>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });
  const close = (v: boolean) => { onOpenChange(v); if (!v) { setSent(false); reset(); } };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Reset your password</DialogTitle>
        {sent ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <p className="mt-3 font-medium">Reset link sent (demo)</p>
            <DialogDescription className="mt-1">No email is actually sent in demo mode.</DialogDescription>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit(async () => { await new Promise((r) => setTimeout(r, 600)); setSent(true); })} className="space-y-4">
            <DialogDescription>Enter your email and we’ll send you a reset link.</DialogDescription>
            <Field label="Email" htmlFor="forgot-email" error={errors.email?.message}>
              <TextInput id="forgot-email" type="email" invalid={!!errors.email} {...register("email")} />
            </Field>
            <SubmitButton loading={isSubmitting} className="w-full">Send reset link</SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
