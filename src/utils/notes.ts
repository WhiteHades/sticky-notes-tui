import { randomUUID } from "node:crypto";

import { notePalette, theme } from "../theme";
import type { Note } from "../types";
import { compactWhitespace, truncateText, wrapText } from "./text";

export type Direction = "left" | "right" | "up" | "down";

const noteGapX = 2;
const noteGapY = 1;
const noteHeight = 11;

export function boardColumns(boardWidth: number): number {
  return Math.max(1, Math.min(4, Math.floor(boardWidth / 38)));
}

export function boardNoteWidth(boardWidth: number): number {
  const columns = boardColumns(boardWidth);
  const usableWidth = Math.max(30, boardWidth - 2);
  const width = Math.floor((usableWidth - noteGapX * (columns - 1)) / columns);
  return Math.max(28, Math.min(42, width));
}

export function defaultPosition(index: number, boardWidth = 96): Pick<Note, "x" | "y"> {
  const width = boardNoteWidth(boardWidth);
  return {
    x: 1 + (index % boardColumns(boardWidth)) * (width + noteGapX),
    y: 1 + Math.floor(index / boardColumns(boardWidth)) * (noteHeight + noteGapY),
  };
}

export function createEmptyNote(index = 0, boardWidth = 96): Note {
  const position = defaultPosition(index, boardWidth);
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
  return text.length > 0 ? text : "new note";
}

export function noteTitle(note: Pick<Note, "content">, width = 26): string {
  return truncateText(compactWhitespace(noteText(note)), Math.max(8, width));
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

export function measureNote(content: string, preferredWidth = 36) {
  const printable = noteText({ content });
  const innerWidth = Math.max(16, Math.min(38, preferredWidth - 4));

  const lines = wrapText(printable, innerWidth);
  const visibleLines = lines.slice(0, 7);

  return {
    width: innerWidth + 4,
    height: noteHeight,
    lines: visibleLines,
  };
}

export function sortByBoardOrder(notes: Note[]): Note[] {
  return [...notes].sort((left, right) => left.y - right.y || left.x - right.x || left.z - right.z);
}

export function clampPosition(note: Note, maxWidth: number, maxHeight: number, preferredWidth?: number) {
  const { width, height } = measureNote(note.content, preferredWidth);
  return {
    x: Math.max(0, Math.min(Math.max(0, maxWidth - width), note.x)),
    y: Math.max(1, Math.min(Math.max(1, maxHeight - height), note.y)),
  };
}

export function arrangeNotes(notes: Note[], boardWidth: number, boardHeight: number): Note[] {
  const cardWidth = boardNoteWidth(boardWidth);

  return sortByBoardOrder(notes).map((note, index) => {
    const positioned = { ...note, ...defaultPosition(index, boardWidth) };
    return {
      ...note,
      ...clampPosition(positioned, boardWidth, boardHeight, cardWidth),
    };
  });
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
