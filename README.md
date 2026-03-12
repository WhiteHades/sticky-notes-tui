# opentui-sticky-notes

`opentui-sticky-notes` is a Bun + TypeScript sticky notes TUI built with OpenTUI.

It is now a much simpler sticky-note board: one canvas, soft catppuccin pastel notes, dynamic note sizing, mouse dragging, keyboard movement, and quiet autosave.

## highlights

- bun + typescript + opentui only
- minimal sticky-note board on a `#1e1e2e` canvas
- vim-friendly navigation: `h j k l`, `g`, `G`, `/`, `?`
- add, edit, delete, search, drag, and reorder notes
- autosave while editing and on quit
- one-time import from the legacy `sticky-notes` storage path into the new `opentui-sticky-notes` path
- text selection copies through OSC52

## install

```bash
bun install
```

## run

```bash
bun run start
```

For live reload during development:

```bash
bun run dev
```

## keybindings

- `a` add a note
- `enter`, `e` edit the selected note
- `d` delete the selected note
- `/` search notes
- `h`, `j`, `k`, `l` move selection between notes
- `shift+h`, `shift+j`, `shift+k`, `shift+l` move the selected note
- `f` bring the selected note to the front
- `g`, `G` jump to the first or last note
- `?` help
- `q`, `ctrl+c` quit
- `esc` closes the current modal

### mouse

- click a note to select it
- double click a note to edit it
- double click the canvas to create a note
- drag the note grip to move notes around
- select text to copy it through OSC52

## storage

The rewrite saves notes to the new app path and imports legacy data once when needed.

- Linux: `~/.local/share/opentui-sticky-notes/notes.json`
- macOS: `~/Library/Application Support/opentui-sticky-notes/notes.json`
- Windows: `%APPDATA%\opentui-sticky-notes\notes.json`

Legacy import sources:

- Linux: `~/.local/share/sticky-notes/notes.json`
- macOS: `~/Library/Application Support/StickyNotes/notes.json`
- Windows: `%APPDATA%\StickyNotes\notes.json`

## test

```bash
bun test
```

## build

```bash
bun run build
```
