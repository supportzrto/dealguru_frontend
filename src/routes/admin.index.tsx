import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/admin/pages/Dashboard";
import { adminHead } from "@/components/admin/head";

export const Route = createFileRoute("/admin/")({
  head: () => adminHead("Dashboard"),
  component: Dashboard,
});
