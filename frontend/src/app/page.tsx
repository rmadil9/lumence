import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { LandingPreview } from "@/components/marketing/LandingPreview";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="flex h-20 items-center justify-between px-8 md:px-20">
        <span className="text-[17px] font-medium tracking-tight">Lumence</span>
        <Link href={userId ? "/app" : "/sign-in"} className="text-[15px]">
          {userId ? "Open app" : "Sign in"}
        </Link>
      </header>

      <section className="max-w-3xl px-8 pt-16 pb-20 md:px-20 md:pt-24">
        <h1 className="text-4xl font-medium leading-tight tracking-tight md:text-5xl">
          Build in public without the friction of writing about it.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink/70">
          Track the work, keep a running scratchpad, and turn a day&apos;s
          notes into a post worth shipping — all in one quiet workspace.
        </p>
        <Link
          href={userId ? "/app" : "/sign-up"}
          className="mt-10 inline-flex items-center rounded-control bg-accent px-5 py-2.5 text-[15px] font-medium text-white"
        >
          Start free
        </Link>
      </section>

      <section className="px-8 pb-28 md:px-20">
        <div className="mx-auto max-w-5xl scale-90 origin-top md:scale-100">
          <LandingPreview />
        </div>
      </section>

      <section className="px-8 pb-28 md:px-20">
        <div className="grid max-w-5xl gap-16 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-medium">The log writes itself</h3>
            <p className="mt-2 text-[15px] text-ink/70">
              Finished tasks and daily notes become the raw material for your
              next post.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium">
              One place, no context-switching
            </h3>
            <p className="mt-2 text-[15px] text-ink/70">
              Plan, write, and publish without bouncing between four
              different tabs.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium">Ship on a streak</h3>
            <p className="mt-2 text-[15px] text-ink/70">
              A gentle counter keeps you posting consistently, not perfectly.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl px-8 pb-28 md:px-20">
        <h2 className="text-3xl font-medium leading-snug tracking-tight">
          Start building in public today.
        </h2>
        <Link
          href={userId ? "/app" : "/sign-up"}
          className="mt-8 inline-flex items-center rounded-control bg-accent px-5 py-2.5 text-[15px] font-medium text-white"
        >
          Start free
        </Link>
      </section>

      <footer className="mt-auto flex h-20 items-center justify-between border-t border-hairline px-8 text-sm md:px-20">
        <span className="font-medium tracking-tight">Lumence</span>
        <a href="#">Privacy</a>
        <span className="text-ink/55">&copy; 2026 Lumence</span>
      </footer>
    </div>
  );
}
