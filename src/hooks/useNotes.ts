import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Note } from "../types";
import { arrangeNotes as arrangeBoardNotes, clampPosition, createEmptyNote, findDirectionalNote, sortByBoardOrder } from "../utils/notes";
import { loadNotes, saveNotes } from "../utils/storage";

const saveDelayMs = 220;

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const skipPersistRef = useRef(true);
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orderedNotes = useMemo(() => sortByBoardOrder(notes), [notes]);

  const selectedIndex = useMemo(() => {
    if (!selectedId) {
      return orderedNotes.length > 0 ? 0 : -1;
    }

    return orderedNotes.findIndex((note) => note.note_id === selectedId);
  }, [orderedNotes, selectedId]);

  const selectedNote = selectedIndex >= 0 ? orderedNotes[selectedIndex] ?? null : orderedNotes[0] ?? null;

  const persist = useCallback(async (snapshot: Note[]) => {
    try {
      await saveNotes(snapshot);
    } catch (error) {
      console.error("failed to save notes", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await loadNotes();
        if (cancelled) {
          return;
        }

        skipPersistRef.current = true;
        setNotes(result.notes);
        setSelectedId(result.notes[0]?.note_id ?? null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("failed to load notes", error);
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
    }

    const snapshot = [...notes];
    pendingSaveRef.current = setTimeout(() => {
      void persist(snapshot);
    }, saveDelayMs);

    return () => {
      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current);
      }
    };
  }, [loaded, notes, persist]);

  useEffect(() => {
    if (orderedNotes.length === 0) {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      return;
    }

    if (!selectedId || !orderedNotes.some((note) => note.note_id === selectedId)) {
      setSelectedId(orderedNotes[0]?.note_id ?? null);
    }
  }, [orderedNotes, selectedId]);

  const selectById = useCallback((noteId: string) => {
    setSelectedId(noteId);
  }, []);

  const selectFirst = useCallback(() => {
    setSelectedId(orderedNotes[0]?.note_id ?? null);
  }, [orderedNotes]);

  const selectLast = useCallback(() => {
    setSelectedId(orderedNotes[orderedNotes.length - 1]?.note_id ?? null);
  }, [orderedNotes]);

  const addFreshNote = useCallback((boardWidth?: number) => {
    const note = createEmptyNote(notes.length, boardWidth);
    setNotes((current) => [...current, note]);
    setSelectedId(note.note_id);
    return note;
  }, [notes.length]);

  const updateNote = useCallback((noteId: string, updater: (note: Note) => Note) => {
    setNotes((current) =>
      current.map((entry) => {
        if (entry.note_id !== noteId) {
          return entry;
        }

        return updater(entry);
      }),
    );
    setSelectedId(noteId);
  }, []);

  const updateSelectedContent = useCallback(
    (content: string) => {
      if (!selectedNote) {
        return;
      }

      updateNote(selectedNote.note_id, (note) => ({
        ...note,
        content,
        updatedAt: Date.now(),
      }));
    },
    [selectedNote, updateNote],
  );

  const deleteById = useCallback((noteId: string) => {
    setNotes((current) => current.filter((entry) => entry.note_id !== noteId));
    setSelectedId((current) => (current === noteId ? null : current));
  }, []);

  const bringToFront = useCallback((noteId: string) => {
    setNotes((current) => {
      const topZ = current.reduce((highest, note) => Math.max(highest, note.z), 0);
      return current.map((note) => (note.note_id === noteId ? { ...note, z: topZ + 1, updatedAt: Date.now() } : note));
    });
    setSelectedId(noteId);
  }, []);

  const moveNote = useCallback(
    (noteId: string, x: number, y: number, maxWidth?: number, maxHeight?: number) => {
      updateNote(noteId, (note) => {
        const next = { ...note, x, y, updatedAt: Date.now() };
        if (typeof maxWidth === "number" && typeof maxHeight === "number") {
          const clamped = clampPosition(next, maxWidth, maxHeight);
          return { ...next, ...clamped };
        }
        return next;
      });
    },
    [updateNote],
  );

  const moveSelectedBy = useCallback(
    (dx: number, dy: number, maxWidth?: number, maxHeight?: number) => {
      if (!selectedNote) {
        return;
      }

      moveNote(selectedNote.note_id, selectedNote.x + dx, selectedNote.y + dy, maxWidth, maxHeight);
    },
    [moveNote, selectedNote],
  );

  const selectDirection = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      const next = findDirectionalNote(notes, selectedId, direction);
      if (next) {
        setSelectedId(next.note_id);
      }
    },
    [notes, selectedId],
  );

  const saveNow = useCallback(async () => {
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
      pendingSaveRef.current = null;
    }

    await persist(notes);
  }, [notes, persist]);

  const arrangeNotes = useCallback((boardWidth: number, boardHeight: number) => {
    setNotes((current) => arrangeBoardNotes(current, boardWidth, boardHeight));
  }, []);

  return {
    loaded,
    notes,
    orderedNotes,
    selectedIndex,
    selectedNote,
    selectById,
    selectDirection,
    selectFirst,
    selectLast,
    addFreshNote,
    updateNote,
    updateSelectedContent,
    deleteById,
    bringToFront,
    moveNote,
    moveSelectedBy,
    arrangeNotes,
    saveNow,
  };
}
