"use client";

import { useState } from "react";

// Mobile gets a tab switcher instead of the desktop split-pane, but no
// control that desktop lacks - see Design/lumence-design-handoff.md section 3.
export function WorkspaceShell({
  tasksPanel,
  writePanel,
}: {
  tasksPanel: React.ReactNode;
  writePanel: React.ReactNode;
}) {
  const [mobileTab, setMobileTab] = useState<"tasks" | "write">("tasks");

  return (
    <div className="flex h-full flex-col md:flex-row">
      <div className="flex border-b border-hairline md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("tasks")}
          className={`min-h-11 flex-1 text-task ${
            mobileTab === "tasks"
              ? "border-b-2 border-ink text-ink"
              : "border-b-2 border-transparent text-ink-soft"
          }`}
        >
          Tasks
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("write")}
          className={`min-h-11 flex-1 text-task ${
            mobileTab === "write"
              ? "border-b-2 border-ink text-ink"
              : "border-b-2 border-transparent text-ink-soft"
          }`}
        >
          Write
        </button>
      </div>

      <div
        className={`min-h-0 flex-1 md:flex md:w-[35%] md:flex-none md:border-r md:border-hairline ${
          mobileTab === "tasks" ? "flex" : "hidden"
        }`}
      >
        {tasksPanel}
      </div>
      <div
        className={`min-h-0 flex-1 md:flex md:w-[65%] ${
          mobileTab === "write" ? "flex" : "hidden"
        }`}
      >
        {writePanel}
      </div>
    </div>
  );
}
