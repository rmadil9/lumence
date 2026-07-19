import { auth } from "@clerk/nextjs/server";

import { AppShell } from "@/components/layout/AppShell";

// Resource-based auth check (see src/proxy.ts for why this isn't in
// middleware): protect() redirects to /sign-in itself if unauthenticated.
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();

  return <AppShell>{children}</AppShell>;
}
