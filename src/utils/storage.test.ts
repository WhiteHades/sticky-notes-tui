import { expect, test } from "bun:test";

import { getStoragePaths } from "./storage";

test("storage paths point to the new app name and a legacy import source", () => {
  const paths = getStoragePaths();
  expect(paths.primary).toContain("opentui-sticky-notes");
  expect(paths.legacy).toContain(process.platform === "linux" ? "sticky-notes" : "StickyNotes");
  expect(paths.primary.endsWith("notes.json")).toBe(true);
  expect(paths.legacy.endsWith("notes.json")).toBe(true);
});
