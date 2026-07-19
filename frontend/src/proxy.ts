import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 renamed `middleware.ts`/`middleware` to `proxy.ts`/`proxy` - this
// is otherwise the same request-time hook, just relocated. Clerk's
// clerkMiddleware() still returns a plain (request) => response handler, so
// it plugs in under the new name with no other changes.
//
// This only populates the Clerk auth() context for the request - it does NOT
// gate routes. Clerk deprecated middleware/path-based route matching
// (createRouteMatcher + auth.protect() here) in favor of "resource-based"
// checks: each protected layout/page calls auth() itself and redirects if
// signed out, so protection can't drift from what middleware thinks the URL
// pattern is. See src/app/app/layout.tsx (added in Phase 1) for that check.
export const proxy = clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
