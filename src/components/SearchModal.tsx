import type { Note } from "../types";
import { theme } from "../theme";
import { notePreview } from "../utils/notes";
import { truncateText } from "../utils/text";
import { ModalFrame } from "./ModalFrame";

export type SearchFocus = "query" | "results";

export interface SearchModalProps {
  query: string;
  results: Note[];
  resultIndex: number;
  focus: SearchFocus;
  onQueryChange: (value: string) => void;
  onPick: (noteId: string) => void;
  onClose: () => void;
}

export function SearchModal({ query, results, resultIndex, focus, onQueryChange, onPick, onClose }: SearchModalProps) {
  const visibleCount = 8;
  const safeIndex = Math.max(0, Math.min(resultIndex, Math.max(0, results.length - 1)));
  const start = Math.max(0, Math.min(Math.max(0, results.length - visibleCount), safeIndex - Math.floor(visibleCount / 2)));
  const visible = results.slice(start, start + visibleCount);

  return (
    <ModalFrame title=" search " accent={theme.surface1} width={60} height={16} onDismiss={onClose}>
      <box flexGrow={1} padding={1} gap={1} flexDirection="column" backgroundColor={theme.base}>
        <box border borderStyle="rounded" borderColor={focus === "query" ? theme.text : theme.surface1} backgroundColor={theme.base} paddingX={1}>
          <input
            value={query}
            onChange={onQueryChange}
            focused={focus === "query"}
            placeholder="find text"
            backgroundColor={theme.base}
            focusedBackgroundColor={theme.base}
            textColor={theme.text}
            cursorColor={theme.text}
            placeholderColor={theme.overlay1}
          />
        </box>

        <box flexGrow={1} paddingTop={1} flexDirection="column">
          {results.length === 0 ? (
            <box flexGrow={1} justifyContent="center" alignItems="center">
              <text>
                <span fg={theme.subtext1}>{query.trim() ? "no matches" : "start typing"}</span>
              </text>
            </box>
          ) : (
            visible.map((note, index) => {
              const absoluteIndex = start + index;
              const selected = absoluteIndex === safeIndex;
              return (
                <box
                  key={note.note_id}
                  height={2}
                  paddingX={1}
                  backgroundColor={selected ? theme.surface0 : theme.base}
                  border={selected}
                  borderStyle="rounded"
                  borderColor={selected ? theme.text : theme.base}
                  onMouseDown={() => onPick(note.note_id)}
                >
                  <text>
                    <span fg={theme.text}>{truncateText(notePreview(note, 42), 42)}</span>
                  </text>
                </box>
              );
            })
          )}
        </box>
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
