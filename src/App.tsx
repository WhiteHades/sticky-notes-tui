import type { MouseEvent } from "@opentui/core";
import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { BoardCanvas } from "./components/BoardCanvas";
import { DeleteModal } from "./components/DeleteModal";
import { EditModal } from "./components/EditModal";
import { HelpModal } from "./components/HelpModal";
import { SearchModal, type SearchFocus } from "./components/SearchModal";
import { useNotes } from "./hooks/useNotes";
import { theme } from "./theme";
import type { Note } from "./types";
import { clampPosition } from "./utils/notes";
import { searchNotes } from "./utils/search";

type ModalState =
  | { type: "none" }
  | { type: "help" }
  | { type: "delete"; note: Note }
  | { type: "edit"; noteId: string }
  | { type: "search"; query: string; focus: SearchFocus; resultIndex: number };

export function App() {
  const renderer = useRenderer();
  const { width, height } = useTerminalDimensions();
  const notes = useNotes();

  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const lastCanvasClickRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const lastNoteClickRef = useRef<{ time: number; noteId: string } | null>(null);
  const dragRef = useRef<{ noteId: string; startX: number; startY: number; originX: number; originY: number } | null>(null);

  const boardWidth = Math.max(40, width - 2);
  const boardHeight = Math.max(12, height - 2);

  const searchResults = useMemo(() => {
    if (modal.type !== "search") {
      return [];
    }

    return searchNotes(notes.orderedNotes, modal.query);
  }, [modal, notes.orderedNotes]);

  const editingNote = modal.type === "edit" ? notes.notes.find((note) => note.note_id === modal.noteId) ?? null : null;

  useEffect(() => {
    const handler = (selection: { getSelectedText: () => string }) => {
      const text = selection.getSelectedText();
      if (text.trim()) {
        renderer.copyToClipboardOSC52(text);
      }
    };

    renderer.on("selection", handler);
    return () => {
      renderer.off("selection", handler);
    };
  }, [renderer]);

  const openEditor = (noteId: string) => {
    setModal({ type: "edit", noteId });
  };

  const createNoteAt = (x: number, y: number) => {
    const created = notes.addFreshNote();
    const clamped = clampPosition({ ...created, x, y }, boardWidth, boardHeight);
    notes.moveNote(created.note_id, clamped.x, clamped.y, boardWidth, boardHeight);
    notes.bringToFront(created.note_id);
    openEditor(created.note_id);
  };

  const closeModal = () => setModal({ type: "none" });

  const handleCanvasClick = (x: number, y: number) => {
    const now = Date.now();
    const last = lastCanvasClickRef.current;
    if (last && now - last.time < 260 && Math.abs(last.x - x) < 2 && Math.abs(last.y - y) < 2) {
      createNoteAt(x - 8, y - 2);
      lastCanvasClickRef.current = null;
      return;
    }

    lastCanvasClickRef.current = { time: now, x, y };
  };

  const handleNoteActivate = (noteId: string) => {
    notes.selectById(noteId);
    notes.bringToFront(noteId);

    const now = Date.now();
    const last = lastNoteClickRef.current;
    if (last && last.noteId === noteId && now - last.time < 260) {
      openEditor(noteId);
      lastNoteClickRef.current = null;
      return;
    }

    lastNoteClickRef.current = { time: now, noteId };
  };

  const handleDragStart = (noteId: string, event: MouseEvent) => {
    const note = notes.notes.find((entry) => entry.note_id === noteId);
    if (!note) {
      return;
    }

    notes.selectById(noteId);
    notes.bringToFront(noteId);
    dragRef.current = {
      noteId,
      startX: event.x,
      startY: event.y,
      originX: note.x,
      originY: note.y,
    };
  };

  const handleDrag = (noteId: string, event: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.noteId !== noteId) {
      return;
    }

    const nextX = drag.originX + (event.x - drag.startX);
    const nextY = drag.originY + (event.y - drag.startY);
    notes.moveNote(noteId, nextX, nextY, boardWidth, boardHeight);
  };

  const handleDragEnd = () => {
    dragRef.current = null;
  };

  useKeyboard((key) => {
    if (modal.type === "edit") {
      if (key.name === "escape") {
        closeModal();
      }
      return;
    }

    if (modal.type === "delete") {
      if (key.name === "enter" || key.name === "y") {
        notes.deleteSelected();
        closeModal();
        return;
      }

      if (key.name === "escape" || key.name === "n") {
        closeModal();
      }
      return;
    }

    if (modal.type === "help") {
      if (key.name === "escape" || key.name === "q" || (key.shift && key.name === "/")) {
        closeModal();
      }
      return;
    }

    if (modal.type === "search") {
      if (key.name === "escape") {
        closeModal();
        return;
      }

      if (key.name === "tab") {
        setModal((current) =>
          current.type === "search"
            ? { ...current, focus: current.focus === "query" ? "results" : "query" }
            : current,
        );
        return;
      }

      if (modal.focus === "query") {
        if ((key.name === "down" || key.name === "enter") && searchResults.length > 0) {
          setModal((current) =>
            current.type === "search" ? { ...current, focus: "results", resultIndex: 0 } : current,
          );
        }
        return;
      }

      if (key.name === "down" || key.name === "j") {
        setModal((current) =>
          current.type === "search"
            ? { ...current, resultIndex: Math.min(searchResults.length - 1, current.resultIndex + 1) }
            : current,
        );
        return;
      }

      if (key.name === "up" || key.name === "k") {
        setModal((current) =>
          current.type === "search"
            ? { ...current, resultIndex: Math.max(0, current.resultIndex - 1) }
            : current,
        );
        return;
      }

      if (key.name === "enter") {
        const match = searchResults[modal.resultIndex];
        if (match) {
          notes.selectById(match.note_id);
          closeModal();
        }
      }
      return;
    }

    if (key.ctrl && key.name === "c") {
      void notes.saveNow().finally(() => renderer.destroy());
      return;
    }

    if (key.name === "q") {
      void notes.saveNow().finally(() => renderer.destroy());
      return;
    }

    if (key.shift && key.name === "/") {
      setModal({ type: "help" });
      return;
    }

    if (key.name === "a") {
      createNoteAt(4 + (notes.orderedNotes.length % 4) * 6, 3 + (notes.orderedNotes.length % 5) * 2);
      return;
    }

    if (key.name === "/") {
      setModal({ type: "search", query: "", focus: "query", resultIndex: 0 });
      return;
    }

    if (key.name === "e" || key.name === "enter") {
      if (notes.selectedNote) {
        openEditor(notes.selectedNote.note_id);
      }
      return;
    }

    if (key.name === "d" && notes.selectedNote) {
      setModal({ type: "delete", note: notes.selectedNote });
      return;
    }

    if (key.name === "f" && notes.selectedNote) {
      notes.bringToFront(notes.selectedNote.note_id);
      return;
    }

    if (key.shift && key.name === "h") {
      notes.moveSelectedBy(-2, 0, boardWidth, boardHeight);
      return;
    }

    if (key.shift && key.name === "l") {
      notes.moveSelectedBy(2, 0, boardWidth, boardHeight);
      return;
    }

    if (key.shift && key.name === "k") {
      notes.moveSelectedBy(0, -1, boardWidth, boardHeight);
      return;
    }

    if (key.shift && key.name === "j") {
      notes.moveSelectedBy(0, 1, boardWidth, boardHeight);
      return;
    }

    if (key.name === "h" || key.name === "left") {
      notes.selectDirection("left");
      return;
    }

    if (key.name === "l" || key.name === "right") {
      notes.selectDirection("right");
      return;
    }

    if (key.name === "k" || key.name === "up") {
      notes.selectDirection("up");
      return;
    }

    if (key.name === "j" || key.name === "down") {
      notes.selectDirection("down");
      return;
    }

    if (key.name === "g" && !key.shift) {
      notes.selectFirst();
      return;
    }

    if (key.name === "g" && key.shift) {
      notes.selectLast();
    }
  });

  return (
    <box width="100%" height="100%" backgroundColor={theme.base} position="relative">
      <box position="absolute" left={2} top={1} zIndex={100}>
        <text>
          <span fg={theme.subtext1}>{notes.orderedNotes.length} notes</span>
        </text>
      </box>

      <BoardCanvas
        notes={notes.notes}
        selectedId={notes.selectedNote?.note_id ?? null}
        onActivate={handleNoteActivate}
        onCanvasClick={handleCanvasClick}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      />

      {modal.type === "edit" ? (editingNote ? <EditModal note={editingNote} onContentChange={notes.updateSelectedContent} onClose={closeModal} /> : null) : null}

      {modal.type === "delete" ? (
        <DeleteModal
          note={modal.note}
          onConfirm={() => {
            notes.deleteSelected();
            closeModal();
          }}
          onCancel={closeModal}
        />
      ) : null}

      {modal.type === "search" ? (
        <SearchModal
          query={modal.query}
          results={searchResults}
          resultIndex={Math.min(modal.resultIndex, Math.max(0, searchResults.length - 1))}
          focus={modal.focus}
          onQueryChange={(value) =>
            setModal((current) =>
              current.type === "search"
                ? { ...current, query: value, resultIndex: 0 }
                : current,
            )
          }
          onPick={(noteId) => {
            notes.selectById(noteId);
            closeModal();
          }}
        />
      ) : null}

      {modal.type === "help" ? <HelpModal /> : null}
    </box>
  );
}
