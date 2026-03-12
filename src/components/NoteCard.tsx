import type { MouseEvent } from "@opentui/core";

import type { Note } from "../types";
import { theme } from "../theme";
import { measureNote, noteColour, noteText, noteTitle } from "../utils/notes";

export interface NoteCardProps {
  note: Note;
  cardWidth: number;
  selected: boolean;
  onActivate: (noteId: string) => void;
  onDragStart: (noteId: string, event: MouseEvent) => void;
  onDrag: (noteId: string, event: MouseEvent) => void;
  onDragEnd: () => void;
}

export function NoteCard({ note, cardWidth, selected, onActivate, onDragStart, onDrag, onDragEnd }: NoteCardProps) {
  const tint = noteColour(note.note_id);
  const metrics = measureNote(note.content, cardWidth);
  const title = noteTitle(note, Math.max(12, cardWidth - 10));
  const visibleBody = metrics.lines.slice(0, 6).join("\n");

  return (
    <box
      position="absolute"
      left={note.x}
      top={note.y}
      width={metrics.width}
      height={metrics.height}
      zIndex={note.z}
      border
      borderStyle={selected ? "heavy" : "single"}
      borderColor={selected ? theme.text : tint}
      backgroundColor={theme.crust}
      flexDirection="column"
      onMouseDown={(event) => {
        event.stopPropagation();
        onActivate(note.note_id);
      }}
    >
      <box
        height={1}
        justifyContent="space-between"
        alignItems="center"
        paddingX={1}
        backgroundColor={selected ? theme.selectionSoft : theme.mantle}
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
        <text>
          <span fg={selected ? theme.text : tint}>{title}</span>
        </text>
        <text>
          <span fg={selected ? theme.selection : tint}>●</span>
        </text>
      </box>
      <box flexGrow={1} paddingX={1} paddingTop={1} paddingBottom={1} backgroundColor={selected ? theme.panel : theme.base}>
        <text selectable fg={selected ? theme.text : theme.subtext1}>
          {visibleBody || noteText(note)}
        </text>
      </box>
    </box>
  );
}
