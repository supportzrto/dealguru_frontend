import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AuthCard, Field, PasswordInput, SubmitButton, TextInput } from "@/components/shop/forms";
import { adminHead } from "@/components/admin/head";

const schema = z.object({ email: z.string().trim().min(1, "Email is required").email("Enter a valid email"), password: z.string().min(1, "Password is required") });
type V = z.infer<typeof schema>;

export const Route = createFileRoute("/admin_/login")({
  head: () => adminHead("Admin Login"),
  component: AdminLogin,
});

function AdminLogin() {
  const { adminLogin, isAdmin, ready } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<V>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  useEffect(() => { if (ready && isAdmin) navigate({ to: "/admin", replace: true }); }, [ready, isAdmin, navigate]);
  const onSubmit = async (v: V) => {
    setError(null);
    const r = await adminLogin(v.email, v.password);
    if (!r.ok) { setError(r.error); return; }
    toast.success("Welcome to the DealGuru admin");
    navigate({ to: "/admin", replace: true });
  };
  return (
    <div className="min-h-screen bg-blush">
      <AuthCard title="Admin Login" subtitle="Manage orders, products and settings">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">{error}</p>}
          <Field label="Email" htmlFor="email" error={errors.email?.message}><TextInput id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} /></Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message}><PasswordInput id="password" autoComplete="current-password" invalid={!!errors.password} {...register("password")} /></Field>
          <SubmitButton loading={isSubmitting} className="w-full">Login</SubmitButton>
          <p className="text-center text-[13px]"><Link to="/" className="text-primary hover:underline">← Back to store</Link></p>
        </form>
      </AuthCard>
    </div>
  );
}
