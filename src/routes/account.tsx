import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, type Address } from "@/context/AuthContext";
import {
  passwordSchema,
  profileSchema,
  type PasswordValues,
  type ProfileValues,
} from "@/lib/shop/validators";
import {
  Field,
  noindexHead,
  PasswordInput,
  RequireAuth,
  SubmitButton,
  TextInput,
} from "@/components/shop/forms";
import { Crumbs } from "@/components/shop/Collection";
import { AddressForm, AddressText } from "@/components/checkout/AddressForm";

export const Route = createFileRoute("/account")({
  head: () => noindexHead("My Account", "Manage your DealGuru profile, addresses and password."),
  component: () => (
    <RequireAuth>
      <Account />
    </RequireAuth>
  ),
});

function Account() {
  return (
    <div className="container-x max-w-4xl py-8">
      <Crumbs items={[{ label: "My Account" }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">My Account</h1>
      <Tabs defaultValue="profile" className="mt-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Profile />
        </TabsContent>
        <TabsContent value="addresses">
          <Addresses />
        </TabsContent>
        <TabsContent value="password">
          <ChangePassword />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const card = "mt-4 rounded-lg border border-border bg-card p-6";

function Profile() {
  const { user, updateProfile } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? "", phone: user?.phone ?? "" },
  });
  return (
    <form
      noValidate
      className={`${card} grid max-w-xl gap-4`}
      onSubmit={handleSubmit(async (v) => {
        try {
          await updateProfile(v);
          reset(v);
          toast.success("Profile updated");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Profile update failed");
        }
      })}
    >
      <Field label="Full Name" htmlFor="p-name" error={errors.fullName?.message}>
        <TextInput id="p-name" invalid={!!errors.fullName} {...register("fullName")} />
      </Field>
      <Field label="Email" htmlFor="p-email" hint="Email can’t be changed.">
        <TextInput id="p-email" value={user?.email ?? ""} readOnly disabled className="bg-muted" />
      </Field>
      <Field label="Phone" htmlFor="p-phone" error={errors.phone?.message}>
        <TextInput
          id="p-phone"
          inputMode="numeric"
          maxLength={10}
          invalid={!!errors.phone}
          {...register("phone")}
        />
      </Field>
      <div>
        <SubmitButton loading={isSubmitting} disabled={!isDirty}>
          Save Changes
        </SubmitButton>
      </div>
    </form>
  );
}

function Addresses() {
  const { user, saveAddress, deleteAddress, setDefaultAddress } = useAuth();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const list = user?.addresses ?? [];
  if (editing) {
    return (
      <div className={card}>
        <h2 className="mb-4 font-semibold">{editing === "new" ? "Add address" : "Edit address"}</h2>
        <AddressForm
          initial={
            editing === "new"
              ? { fullName: user?.fullName ?? "", phone: user?.phone ?? "" }
              : editing
          }
          onCancel={() => setEditing(null)}
          onSubmit={async (v) => {
            try {
              await saveAddress(v, editing === "new" ? undefined : editing.id);
              setEditing(null);
              toast.success("Address saved");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Address save failed");
            }
          }}
        />
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((a) => (
          <div
            key={a.id}
            className={`rounded-lg border bg-card p-5 ${a.isDefault ? "border-primary" : "border-border"}`}
          >
            <AddressText a={a} />
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px]">
              {a.isDefault ? (
                <span className="font-medium text-primary">Default</span>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await setDefaultAddress(a.id);
                      toast.success("Default address updated");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Update failed");
                    }
                  }}
                  className="text-primary hover:underline"
                >
                  Set as default
                </button>
              )}
              <button
                onClick={() => setEditing(a)}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteAddress(a.id);
                    toast.success("Address deleted");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Delete failed");
                  }
                }}
                className="flex items-center gap-1 text-destructive hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setEditing("new")}
          className="grid min-h-40 place-items-center rounded-lg border-2 border-dashed border-border text-[13px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add new address
          </span>
        </button>
      </div>
    </div>
  );
}

function ChangePassword() {
  const { changePassword } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  });
  return (
    <form
      noValidate
      className={`${card} grid max-w-xl gap-4`}
      onSubmit={handleSubmit(async (v) => {
        const r = await changePassword(v.current, v.next);
        if (!r.ok) {
          setError("current", { message: r.error });
          return;
        }
        reset();
        toast.success("Password updated");
      })}
    >
      <Field label="Current Password" htmlFor="pw-cur" error={errors.current?.message}>
        <PasswordInput
          id="pw-cur"
          autoComplete="current-password"
          invalid={!!errors.current}
          {...register("current")}
        />
      </Field>
      <Field label="New Password" htmlFor="pw-new" error={errors.next?.message}>
        <PasswordInput
          id="pw-new"
          autoComplete="new-password"
          invalid={!!errors.next}
          {...register("next")}
        />
      </Field>
      <Field label="Confirm New Password" htmlFor="pw-conf" error={errors.confirm?.message}>
        <PasswordInput
          id="pw-conf"
          autoComplete="new-password"
          invalid={!!errors.confirm}
          {...register("confirm")}
        />
      </Field>
      <div>
        <SubmitButton loading={isSubmitting}>Update Password</SubmitButton>
      </div>
    </form>
  );
}
