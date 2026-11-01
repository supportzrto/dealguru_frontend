import { createFileRoute, redirect } from "@tanstack/react-router";

// Old category removed in the rebrand — send visitors home instead of a 404.
export const Route = createFileRoute("/suits")({
  beforeLoad: () => { throw redirect({ to: "/", replace: true }); },
});
