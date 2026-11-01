import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/admin/pages/Settings";
import { adminHead } from "@/components/admin/head";

export const Route = createFileRoute("/admin/settings")({
  head: () => adminHead("Settings"),
  component: SettingsPage,
});
