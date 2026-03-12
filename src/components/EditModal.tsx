import { useRef } from "react";

import type { TextareaRenderable } from "@opentui/core";

import type { Note } from "../types";
import { theme } from "../theme";
import { ModalFrame } from "./ModalFrame";

export interface EditModalProps {
  note: Note;
  onContentChange: (value: string) => void;
  onClose: () => void;
}

export function EditModal({ note, onContentChange, onClose }: EditModalProps) {
  const contentRef = useRef<TextareaRenderable | null>(null);

  return (
    <ModalFrame title=" note " accent={theme.surface1} width={76} height={22}>
      <box flexGrow={1} padding={1} backgroundColor={theme.base}>
        <textarea
          key={note.note_id}
          ref={contentRef}
          initialValue={note.content}
          onContentChange={() => onContentChange(contentRef.current?.plainText ?? "")}
          focused
          width={72}
          height={18}
          wrapMode="word"
          backgroundColor={theme.base}
          focusedBackgroundColor={theme.base}
          textColor={theme.text}
          focusedTextColor={theme.text}
          selectionBg={theme.surface2}
          selectionFg={theme.text}
          cursorColor={theme.text}
          placeholder="write"
          placeholderColor={theme.overlay1}
        />
      </box>

      <box height={2} paddingX={1} justifyContent="flex-end" alignItems="center" onMouseDown={onClose}>
        <text>
          <span fg={theme.red}>esc</span>
          <span fg={theme.overlay1}> close</span>
        </text>
      </box>
    </ModalFrame>
  );
}
