# opentui-sticky-notes

`opentui-sticky-notes` is a Bun + TypeScript sticky notes TUI built with OpenTUI.

It replaces the old Textual/Python grid with a cleaner two-pane layout inspired by `btop` and `lazygit`: rounded borders, tight spacing, stronger focus states, vim-friendly movement, and modal flows that stay keyboard-first.

## highlights

- bun + typescript + opentui only
- edge-to-edge panel layout with rounded borders
- vim-friendly navigation: `h j k l`, `g`, `G`, `/`, `?`
- add, edit, delete, search, sort, pin, and colour notes
- debounced autosave plus manual `ctrl+s`
- one-time import from the legacy `sticky-notes` storage path into the new `opentui-sticky-notes` path

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

### global

- `q`, `ctrl+c` quit
- `?` help
- `ctrl+s` save immediately
- `o` cycle sort mode
- `1-9` set the selected note colour

### notes pane

- `j`, `k` move between notes
- `g`, `G` jump to first or last note
- `l` move focus into the preview pane
- `a` add a note
- `e`, `enter` edit the selected note
- `d` delete the selected note
- `p` toggle pin
- `/` search notes

### preview pane

- `j`, `k` scroll note content
- `pageup`, `pagedown` scroll faster
- `h` move focus back to the notes pane
- `e`, `enter` edit the selected note

### modal flows

- `tab`, `shift+tab` move between fields
- `esc` close the current modal
- `ctrl+s` save from the edit modal

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
