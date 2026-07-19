import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Without this, render() from one test leaks DOM nodes into the next test
// in the same file, since globals:false means RTL's own auto-cleanup
// (which hooks a global afterEach) has nothing to attach to.
afterEach(() => {
  cleanup();
});
