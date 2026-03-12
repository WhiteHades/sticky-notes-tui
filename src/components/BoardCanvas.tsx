import type { MouseEvent } from "@opentui/core";

import type { Note } from "../types";
import { theme } from "../theme";
import { NoteCard } from "./NoteCard";

export interface BoardCanvasProps {
  notes: Note[];
  selectedId: string | null;
  onActivate: (noteId: string) => void;
  onCanvasClick: (x: number, y: number) => void;
  onDragStart: (noteId: string, event: MouseEvent) => void;
  onDrag: (noteId: string, event: MouseEvent) => void;
  onDragEnd: () => void;
}

export function BoardCanvas({
  notes,
  selectedId,
  onActivate,
  onCanvasClick,
  onDragStart,
  onDrag,
  onDragEnd,
}: BoardCanvasProps) {
  return (
    <box
      flexGrow={1}
      width="100%"
      height="100%"
      position="relative"
      backgroundColor={theme.base}
      onMouseDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        onCanvasClick(event.x, event.y);
      }}
    >
      {notes.map((note) => (
        <NoteCard
          key={note.note_id}
          note={note}
          selected={note.note_id === selectedId}
          onActivate={onActivate}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
        />
      ))}
    </box>
  );
}
