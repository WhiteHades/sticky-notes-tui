import type { MouseEvent } from "@opentui/core";

import type { Note } from "../types";
import { theme } from "../theme";
import { measureNote, noteColour, noteText } from "../utils/notes";

export interface NoteCardProps {
  note: Note;
  selected: boolean;
  onActivate: (noteId: string) => void;
  onDragStart: (noteId: string, event: MouseEvent) => void;
  onDrag: (noteId: string, event: MouseEvent) => void;
  onDragEnd: () => void;
}

export function NoteCard({ note, selected, onActivate, onDragStart, onDrag, onDragEnd }: NoteCardProps) {
  const tint = noteColour(note.note_id);
  const metrics = measureNote(note.content);

  return (
    <box
      position="absolute"
      left={note.x}
      top={note.y}
      width={metrics.width}
      height={metrics.height}
      zIndex={note.z}
      border
      borderStyle="rounded"
      borderColor={selected ? theme.text : theme.base}
      backgroundColor={tint}
      flexDirection="column"
      onMouseDown={(event) => {
        event.stopPropagation();
        onActivate(note.note_id);
      }}
    >
      <box
        height={1}
        justifyContent="center"
        alignItems="center"
        onMouseDown={(event) => {
          event.stopPropagation();
          onDragStart(note.note_id, event);
        }}
        onMouseDrag={(event) => {
          event.stopPropagation();
          onDrag(note.note_id, event);
        }}
        onMouseDragEnd={(event) => {
          event.stopPropagation();
          onDragEnd();
        }}
      >
        <text fg={theme.base}>..</text>
      </box>
      <box flexGrow={1} paddingX={1} paddingBottom={1}>
        <text selectable fg={theme.base}>
          {noteText(note)}
        </text>
      </box>
    </box>
  );
}
