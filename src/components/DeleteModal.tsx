import type { Note } from "../types";
import { theme } from "../theme";
import { notePreview } from "../utils/notes";
import { ModalFrame } from "./ModalFrame";

export interface DeleteModalProps {
  note: Note;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ note, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <ModalFrame title=" remove note " accent={theme.red} width={42} height={9} onDismiss={onCancel}>
      <box flexGrow={1} padding={1} gap={1} flexDirection="column" justifyContent="center" backgroundColor={theme.base}>
        <text>
          <span fg={theme.text}>delete this note?</span>
        </text>
        <text>
          <span fg={theme.overlay1}>{notePreview(note, 32)}</span>
        </text>
      </box>

      <box height={2} paddingX={1} justifyContent="center" alignItems="center" gap={2}>
        <box border borderStyle="rounded" borderColor={theme.red} paddingX={1} onMouseDown={onConfirm}>
          <text>
            <span fg={theme.red}>delete</span>
          </text>
        </box>
        <box border borderStyle="rounded" borderColor={theme.surface1} paddingX={1} onMouseDown={onCancel}>
          <text>
            <span fg={theme.text}>keep</span>
          </text>
        </box>
      </box>
    </ModalFrame>
  );
}
