import type { MouseEvent } from "@opentui/core";

import type { Note } from "../types";
import { theme } from "../theme";
import { boardNoteWidth } from "../utils/notes";
import { NoteCard } from "./NoteCard";

export interface BoardCanvasProps {
  notes: Note[];
  selectedId: string | null;
  boardWidth: number;
  onActivate: (noteId: string) => void;
  onCanvasClick: () => void;
  onDragStart: (noteId: string, event: MouseEvent) => void;
  onDrag: (noteId: string, event: MouseEvent) => void;
  onDragEnd: () => void;
}

export function BoardCanvas({
  notes,
  selectedId,
  boardWidth,
  onActivate,
  onCanvasClick,
  onDragStart,
  onDrag,
  onDragEnd,
}: BoardCanvasProps) {
  const cardWidth = boardNoteWidth(boardWidth);

  return (
    <box
      flexGrow={1}
      width="100%"
      height="100%"
      position="relative"
      backgroundColor={theme.panel}
      border
      borderStyle="single"
      borderColor={theme.surface1}
      title=" notes "
      onMouseDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        onCanvasClick();
      }}
    >
      {notes.map((note) => (
        <NoteCard
          key={note.note_id}
          note={note}
          cardWidth={cardWidth}
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
