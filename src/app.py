import copy
import uuid
from storage import NoteStorage
from textual.app import App, ComposeResult
from textual.screen import ModalScreen
from textual.widgets import Header, Footer, Static
from textual.containers import ScrollableContainer
from textual import work
from components.deleteModal import DeleteModal
from components.editModal import EditModal
from components.searchModal import SearchModal
from components.stickyNote import StickyNote
from models import Note


class StickyNotesApp(App):
    TITLE = "notes"
    column_count = 3
    storage: NoteStorage = None
    default_note: Note = Note("New title", content="New")

    BINDINGS = [
        ("d", "toggle_dark_mode", "toggle dark mode"),
        ("ctrl+c", "quit", "Force Quit"),
        ("right", "focus_next", "Next"),
        ("l", "focus_next", "Next"),
        ("left", "focus_previous", "Prev"),
        ("h", "focus_previous", "Prev"),
        ("up", "move_up", "Move Up"),
        ("k", "move_up", "Move Up"),
        ("down", "move_down", "Move Down"),
        ("j", "move_down", "Move Down"),
        ("a", "add_note", "add a new note"),
        ("r", "delete_note", "delete a note"),
        ("e", "edit_note", "edit a note"),
        ("1-9", " ", "border color"),
        ("s", "search_notes", "search notes"),
        ("o", "sort_notes", "Sort notes"),
        ("ctrl+s", "save_notes", "Save notes"),
        ("ctrl+l", "load_notes", "Load notes"),
    ]
    CSS_PATH = "style.css"

    COLORS = {
        "1": "#f38ba8",
        "2": "#fab387",
        "3": "#f9e2af",
        "4": "#a6e3a1",
        "5": "#94e2d5",
        "6": "#89dceb",
        "7": "#89b4fa",
        "8": "#cba6f7",
        "9": "#f5e0dc",
    }

    def on_key(self, event) -> None:
        if isinstance(self.screen, ModalScreen):
            return

        if event.key in self.COLORS:
            focused_widget = self.screen.focused
            if isinstance(focused_widget, StickyNote):
                focused_widget.color = self.COLORS[event.key]

    def action_move_up(self):
        for _ in range(self.column_count):
            self.action_focus_previous()

    def action_move_down(self):
        for _ in range(self.column_count):
            self.action_focus_next()

    def on_mount(self) -> None:
        self.storage = NoteStorage()
        self.load_saved_notes()
        self.dark = True

    def compose(self) -> ComposeResult:
        yield Header()
        with ScrollableContainer(id="notes"):
            pass
        yield Footer()

    def action_toggle_dark_mode(self):
        self.action_toggle_dark()

    @work
    async def action_add_note(self):
        new_note = copy.deepcopy(self.default_note)
        new_note.note_id = str(uuid.uuid4())
        stickyNote = StickyNote(note=new_note)
        container = self.query_one("#notes")
        container.mount(stickyNote)
        stickyNote.scroll_visible()
        self.action_save_notes()

    def action_sort_notes(self):
        self.sort_notes()
        self.notify("Notes sorted!", severity="information")

    def sort_notes(self):
        container = self.query_one("#notes")
        notes = list(self.query(StickyNote))

        if not notes:
            return

        sorted_notes = sorted(notes, key=lambda n: (-n.is_pinned, -n.priority_level))

        for i, note in enumerate(sorted_notes):
            container.move_child(note, after=len(container.children) - 1)
        self.action_save_notes()

    @work
    async def action_delete_note(self):
        focused_widget = self.screen.focused

        if focused_widget is not None and isinstance(focused_widget, StickyNote):
            confirm = await self.push_screen_wait(DeleteModal())
            if confirm:
                focused_widget.remove()
                self.action_save_notes()

    @work
    async def action_edit_note(self):
        focused_widget = self.screen.focused
        if focused_widget is not None and isinstance(focused_widget, StickyNote):
            updatedNote = await self.push_screen_wait(EditModal(focused_widget.note))
            if updatedNote:
                focused_widget.note = updatedNote

                focused_widget.priority_level = updatedNote.priority
                focused_widget.is_pinned = updatedNote.pinned

                focused_widget.update_title()

                content_widget = focused_widget.query_one("#noteContent")
                content_widget.update(updatedNote.content)
                self.action_sort_notes()

    @work
    async def action_search_notes(self):
        all_sticky_notes = list(self.query(StickyNote))
        all_notes = [sn.note for sn in all_sticky_notes]

        if not all_notes:
            self.notify("No notes to search!", severity="warning")
            return

        selected_note = await self.push_screen_wait(SearchModal(all_notes))

        if selected_note is not None:
            for sticky_note in all_sticky_notes:
                if sticky_note.note.note_id == selected_note.note_id:
                    sticky_note.focus()
                    sticky_note.scroll_visible()
                    self.notify(
                        f"Found: {selected_note.noteTitle}", severity="information"
                    )
                    return

            self.notify("Could not find the note", severity="error")

    def load_saved_notes(self):
        notes_with_colors = self.storage.load_notes()

        if notes_with_colors:
            container = self.query_one("#notes")
            for widget in list(self.query(StickyNote)):
                widget.remove()

            for note, color in notes_with_colors:
                if color == "white":
                    color = None
                sticky_note = StickyNote(note=note)
                sticky_note.user_color = color
                if color is not None:
                    sticky_note.color = color
                sticky_note.priority_level = note.priority
                sticky_note.is_pinned = note.pinned
                container.mount(sticky_note)

            self.notify(
                f"Loaded {len(notes_with_colors)} notes!", severity="information"
            )

    def action_save_notes(self):
        notes_with_colors = []
        for sticky_note in self.query(StickyNote):
            notes_with_colors.append((sticky_note.note, sticky_note.color))

        if self.storage.save_notes(notes_with_colors):
            self.notify(
                f"Saved {len(notes_with_colors)} notes!", severity="information"
            )
        else:
            self.notify("Failed to save notes", severity="error")

    def action_load_notes(self):
        self.load_saved_notes()

    def _on_resize(self, event):
        notes_container = self.query_one("#notes")
        self.column_count = max(1, event.size.width // 40)
        notes_container.styles.grid_size_columns = self.column_count
        return super()._on_resize(event)
