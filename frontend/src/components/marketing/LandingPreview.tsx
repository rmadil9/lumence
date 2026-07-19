// Static marketing visual only - sample content, not wired to any data.
// Mirrors Design/lumence-mockups .html's "Landing page" hero screenshot frame.
export function LandingPreview() {
  return (
    <div className="overflow-hidden rounded-panel border border-hairline bg-surface shadow-sm">
      <div className="flex h-14 items-center justify-between border-b border-hairline px-6">
        <span className="text-[15px] font-medium tracking-tight text-ink">
          Lumence
        </span>
        <div className="flex items-center gap-5 text-meta text-ink-soft">
          <span>🔥 9</span>
          <span>✦ 12 / 20</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-hover text-[11px]">
            MR
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="flex flex-col gap-2 border-b border-hairline px-6 py-5 md:w-[35%] md:border-b-0 md:border-r">
          <h2 className="text-lg font-medium text-ink">Today</h2>
          <p className="text-meta text-ink-soft">Sunday, July 19</p>
          <ul className="mt-3 flex flex-col gap-2">
            <li className="flex items-center gap-2 text-task text-ink">
              <span className="h-4 w-4 shrink-0 rounded border border-hairline" />
              Review PR #482 — auth refactor
              <span className="ml-auto rounded-full border border-hairline px-1.5 text-meta text-ink-soft">
                5d
              </span>
            </li>
            <li className="flex items-center gap-2 text-task text-ink">
              <span className="h-4 w-4 shrink-0 rounded border border-hairline" />
              Reply to Priya about the launch date
              <span className="ml-auto rounded-full border border-hairline px-1.5 text-meta text-ink-soft">
                2d
              </span>
            </li>
            <li className="flex items-center gap-2 text-task text-ink">
              <span className="h-4 w-4 shrink-0 rounded border border-hairline" />
              Outline the newsletter intro
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-4 px-6 py-5 md:w-[65%]">
          <p className="text-scratchpad text-ink/90">
            Shipping isn&apos;t the hard part anymore. Deciding what actually
            deserves to ship is where the week went.
          </p>
          <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-3">
            <span className="rounded-full border border-ink/80 bg-black/[0.04] px-3 py-1 text-meta text-ink">
              𝕏
            </span>
            <span className="rounded-full border border-hairline px-3 py-1 text-meta text-ink-soft">
              in LinkedIn
            </span>
            <span className="text-meta text-ink-soft">218 / 280</span>
            <span className="ml-auto rounded-full bg-ink px-4 py-1 text-meta text-white">
              𝕏 Post to X ↗
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
