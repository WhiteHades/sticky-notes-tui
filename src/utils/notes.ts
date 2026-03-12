import { randomUUID } from "node:crypto";

import { notePalette, theme } from "../theme";
import type { Note } from "../types";
import { compactWhitespace, wrapText } from "./text";

export type Direction = "left" | "right" | "up" | "down";

export function defaultPosition(index: number): Pick<Note, "x" | "y"> {
  return {
    x: 3 + (index % 4) * 24,
    y: 3 + Math.floor(index / 4) * 10,
  };
}

export function createEmptyNote(index = 0): Note {
  const position = defaultPosition(index);
  const now = Date.now();

  return {
    content: "",
    note_id: randomUUID(),
    x: position.x,
    y: position.y,
    z: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function normaliseLegacyContent(title: string, content: string): string {
  const safeTitle = title.trim();
  const safeContent = content.trim();

  if (!safeTitle || safeTitle.toLowerCase() === "untitled") {
    return safeContent;
  }

  if (!safeContent) {
    return safeTitle;
  }

  if (safeContent.startsWith(safeTitle)) {
    return safeContent;
  }

  return `${safeTitle}\n\n${safeContent}`;
}

export function noteText(note: Pick<Note, "content">): string {
  const text = note.content.trim();
  return text.length > 0 ? text : "empty note";
}

function hashValue(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function noteColour(noteId: string): string {
  return notePalette[hashValue(noteId) % notePalette.length] ?? theme.rosewater;
}

export function notePreview(note: Pick<Note, "content">, width = 60): string {
  return compactWhitespace(noteText(note)).slice(0, width) || "empty note";
}

export function measureNote(content: string) {
  const printable = noteText({ content });
  const compact = compactWhitespace(printable);
  const longestToken = Math.max(...compact.split(/\s+/).map((chunk) => chunk.length), 0);

  let innerWidth = 16;
  if (compact.length > 48) {
    innerWidth = 20;
  }
  if (compact.length > 120) {
    innerWidth = 24;
  }
  if (compact.length > 220) {
    innerWidth = 28;
  }

  innerWidth = Math.max(innerWidth, Math.min(28, longestToken));

  const lines = wrapText(printable, innerWidth);
  const visibleLines = lines.slice(0, 10);

  return {
    width: innerWidth + 4,
    height: Math.max(5, visibleLines.length + 3),
    lines: visibleLines,
  };
}

export function sortByBoardOrder(notes: Note[]): Note[] {
  return [...notes].sort((left, right) => left.y - right.y || left.x - right.x || left.z - right.z);
}

export function clampPosition(note: Note, maxWidth: number, maxHeight: number) {
  const { width, height } = measureNote(note.content);
  return {
    x: Math.max(0, Math.min(Math.max(0, maxWidth - width), note.x)),
    y: Math.max(1, Math.min(Math.max(1, maxHeight - height), note.y)),
  };
}

export function findDirectionalNote(notes: Note[], currentId: string | null, direction: Direction): Note | null {
  if (!currentId) {
    return sortByBoardOrder(notes)[0] ?? null;
  }

  const current = notes.find((note) => note.note_id === currentId);
  if (!current) {
    return sortByBoardOrder(notes)[0] ?? null;
  }

  const currentMetrics = measureNote(current.content);
  const currentCenterX = current.x + currentMetrics.width / 2;
  const currentCenterY = current.y + currentMetrics.height / 2;

  let best: { note: Note; score: number } | null = null;

  for (const note of notes) {
    if (note.note_id === current.note_id) {
      continue;
    }

    const metrics = measureNote(note.content);
    const centerX = note.x + metrics.width / 2;
    const centerY = note.y + metrics.height / 2;
    const dx = centerX - currentCenterX;
    const dy = centerY - currentCenterY;

    const fitsDirection =
      (direction === "left" && dx < -1) ||
      (direction === "right" && dx > 1) ||
      (direction === "up" && dy < -1) ||
      (direction === "down" && dy > 1);

    if (!fitsDirection) {
      continue;
    }

    const primary = direction === "left" || direction === "right" ? Math.abs(dx) : Math.abs(dy);
    const secondary = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
    const score = primary * 5 + secondary;

    if (!best || score < best.score) {
      best = { note, score };
    }
  }

  return best?.note ?? null;
}
