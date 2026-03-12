import { theme } from "../theme";
import { ModalFrame } from "./ModalFrame";

const shortcuts = [
  ["a", "new note"],
  ["enter", "edit selected"],
  ["d", "delete selected"],
  ["/", "search"],
  ["h j k l", "move selection"],
  ["shift+h j k l", "move note"],
  ["f", "bring front"],
  ["q", "quit"],
] as const;

export interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <ModalFrame title=" help " accent={theme.surface1} width={42} height={14} onDismiss={onClose}>
      <box flexGrow={1} padding={1} gap={0} flexDirection="column" backgroundColor={theme.base}>
        {shortcuts.map(([keyLabel, meaning]) => (
          <box key={keyLabel} height={1} justifyContent="space-between">
            <text>
              <span fg={theme.text}>{keyLabel}</span>
            </text>
            <text>
              <span fg={theme.overlay1}>{meaning}</span>
            </text>
          </box>
        ))}
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
