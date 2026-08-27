import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getCachedUser } from "@/lib/authGuard";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const user = await getCachedUser();
      if (user) return { user };
    } catch {}

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
