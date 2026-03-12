import type { Note } from "../types";
import { notePreview, sortByBoardOrder } from "./notes";

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

function includesScore(value: string, query: string, base: number): number {
  const index = value.indexOf(query);
  if (index === -1) {
    return 0;
  }

  return Math.max(1, base - index * 2);
}

function subsequenceScore(value: string, query: string): number {
  let queryIndex = 0;
  let previousMatch = -2;
  let score = 0;

  for (let index = 0; index < value.length && queryIndex < query.length; index += 1) {
    if (value[index] !== query[queryIndex]) {
      continue;
    }

    score += previousMatch + 1 === index ? 8 : 3;
    previousMatch = index;
    queryIndex += 1;
  }

  return queryIndex === query.length ? score : 0;
}

function scoreNote(note: Note, rawQuery: string): number {
  const query = normalise(rawQuery);
  if (!query) {
    return 0;
  }

  const content = normalise(note.content);
  const preview = normalise(notePreview(note));
  const combined = `${preview}\n${content}`;

  let score = 0;
  score += preview.startsWith(query) ? 160 : 0;
  score += includesScore(preview, query, 120);
  score += includesScore(content, query, 80);
  score += subsequenceScore(preview, query) * 4;
  score += subsequenceScore(combined, query);

  return score;
}

export function searchNotes(notes: Note[], query: string): Note[] {
  const normalised = normalise(query);
  if (!normalised) {
    return sortByBoardOrder(notes);
  }

  return notes
    .map((note) => ({ note, score: scoreNote(note, normalised) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.note.y - right.note.y || left.note.x - right.note.x)
    .map((entry) => entry.note);
}
