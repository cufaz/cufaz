import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/polo")({
  component: PoloRouteLayout,
});

function PoloRouteLayout() {
  return <Outlet />;
}
