import { createFileRoute, redirect } from "@tanstack/react-router";

// Old category from the previous store — send visitors to the full shop instead of a 404.
export const Route = createFileRoute("/2-piece-kurtis")({
  beforeLoad: () => { throw redirect({ to: "/shop", replace: true }); },
});
