import { expect, test } from "bun:test";

import type { Note } from "../types";
import { searchNotes } from "./search";

const notes: Note[] = [
  {
    content: "alpha roadmap plan the alpha milestone",
    note_id: "1",
    x: 0,
    y: 0,
    z: 1,
    createdAt: 1,
    updatedAt: 1,
  },
  {
    content: "buy apples and oats",
    note_id: "2",
    x: 10,
    y: 4,
    z: 2,
    createdAt: 2,
    updatedAt: 2,
  },
  {
    content: "ship the alpha build tonight",
    note_id: "3",
    x: 0,
    y: 12,
    z: 3,
    createdAt: 3,
    updatedAt: 3,
  },
];

test("search ranks stronger leading content matches first", () => {
  const results = searchNotes(notes, "alpha");
  expect(results.map((note) => note.note_id)).toEqual(["1", "3"]);
});

test("empty query falls back to board ordering", () => {
  const results = searchNotes(notes, "");
  expect(results.map((note) => note.note_id)).toEqual(["1", "2", "3"]);
});
