import { describe, expect, it } from "vitest";

import { formatTodoAge } from "./todo-age";

const NOW = new Date("2026-07-19T12:00:00Z");

describe("formatTodoAge", () => {
  it("returns null for a task created today", () => {
    expect(formatTodoAge("2026-07-19T01:00:00Z", NOW)).toBeNull();
  });

  it("returns null for a task created in the future", () => {
    expect(formatTodoAge("2026-07-20T01:00:00Z", NOW)).toBeNull();
  });

  it("formats sub-two-week ages in days", () => {
    expect(formatTodoAge("2026-07-17T01:00:00Z", NOW)).toBe("2d");
    expect(formatTodoAge("2026-07-14T01:00:00Z", NOW)).toBe("5d");
    expect(formatTodoAge("2026-07-06T01:00:00Z", NOW)).toBe("13d");
  });

  it("switches to weeks at 14 days", () => {
    expect(formatTodoAge("2026-07-05T01:00:00Z", NOW)).toBe("2w");
    expect(formatTodoAge("2026-06-21T01:00:00Z", NOW)).toBe("4w");
  });
});
