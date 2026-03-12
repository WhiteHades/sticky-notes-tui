import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import type { Note, StorageLoadResult } from "../types";
import { defaultPosition, normaliseLegacyContent } from "./notes";

export interface StoragePaths {
  primary: string;
  legacy: string;
}

function appDataRoot(): string {
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support");
  }

  if (process.platform === "win32") {
    return process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
  }

  return process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
}

export function getStoragePaths(): StoragePaths {
  const root = appDataRoot();
  const primaryDir = join(root, "opentui-sticky-notes");
  const legacyDir = process.platform === "linux" ? join(root, "sticky-notes") : join(root, "StickyNotes");

  return {
    primary: join(primaryDir, "notes.json"),
    legacy: join(legacyDir, "notes.json"),
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function normaliseNote(value: unknown, index: number): Note | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const legacyTitle = typeof record.noteTitle === "string" ? record.noteTitle : "";
  const legacyContent = typeof record.content === "string" ? record.content : "";
  const content = typeof record.content === "string" && typeof record.x === "number"
    ? record.content
    : normaliseLegacyContent(legacyTitle, legacyContent);
  const noteId = typeof record.note_id === "string" && record.note_id.length > 0 ? record.note_id : randomUUID();
  const position = defaultPosition(index);
  const createdAt = typeof record.createdAt === "number" ? record.createdAt : Date.now();
  const updatedAt = typeof record.updatedAt === "number" ? record.updatedAt : createdAt;

  return {
    content,
    note_id: noteId,
    x: typeof record.x === "number" ? record.x : position.x,
    y: typeof record.y === "number" ? record.y : position.y,
    z: typeof record.z === "number" ? record.z : createdAt + index,
    createdAt,
    updatedAt,
  };
}

async function readNotes(path: string): Promise<Note[]> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map((entry, index) => normaliseNote(entry, index)).filter((note): note is Note => note !== null);
}

export async function loadNotes(paths: StoragePaths = getStoragePaths()): Promise<StorageLoadResult> {
  if (await exists(paths.primary)) {
    return {
      notes: await readNotes(paths.primary),
      imported: false,
      path: paths.primary,
    };
  }

  if (await exists(paths.legacy)) {
    const notes = await readNotes(paths.legacy);
    await saveNotes(notes, paths);
    return {
      notes,
      imported: true,
      path: paths.primary,
    };
  }

  return {
    notes: [],
    imported: false,
    path: paths.primary,
  };
}

export async function saveNotes(notes: Note[], paths: StoragePaths = getStoragePaths()): Promise<void> {
  await mkdir(dirname(paths.primary), { recursive: true });
  await writeFile(paths.primary, JSON.stringify(notes, null, 2), "utf8");
}
