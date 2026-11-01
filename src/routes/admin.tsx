import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminRoute } from "@/components/admin/AdminLayout";
import { adminHead } from "@/components/admin/head";

export const Route = createFileRoute("/admin")({
  head: () => adminHead("Admin"),
  component: () => <AdminRoute><Outlet /></AdminRoute>,
});
