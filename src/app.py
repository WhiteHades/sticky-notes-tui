import copy
import uuid

from storage import NoteStorage
from textual import work
from textual.app import App, ComposeResult
from textual.containers import ScrollableContainer
from textual.screen import ModalScreen
from textual.timer import Timer
from textual.widgets import Footer, Header, Static

from components.deleteModal import DeleteModal
from components.editModal import EditModal
from components.searchModal import SearchModal
from components.stickyNote import StickyNote
from models import Note


class StickyNotesApp(App):
    TITLE = "notes"
    column_count = 3
    default_note: Note = Note("untitled")
    save_delay = 0.3

    BINDINGS = [
        ("a", "add_note", "Add"),
        ("e", "edit_note", "Edit"),
        ("r", "delete_note", "Remove"),
        ("s", "search_notes", "Search"),
        ("o", "sort_notes", "Sort"),
        ("ctrl+s", "save_notes", "Save"),
        ("ctrl+l", "load_notes", "Load"),
        ("right", "focus_next", "Next"),
        ("l", "focus_next", "Next"),
        ("left", "focus_previous", "Prev"),
        ("h", "focus_previous", "Prev"),
        ("up", "move_up", "Up"),
        ("k", "move_up", "Up"),
        ("down", "move_down", "Down"),
        ("j", "move_down", "Down"),
        ("ctrl+c", "quit", "Quit"),
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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.storage: NoteStorage | None = None
        self.notes_by_id: dict[str, StickyNote] = {}
        self._save_timer: Timer | None = None

    def on_key(self, event) -> None:
        if isinstance(self.screen, ModalScreen):
            return
        if event.key in self.COLORS:
            focused_widget = self.screen.focused
            if isinstance(focused_widget, StickyNote):
                focused_widget.user_color = self.COLORS[event.key]
                focused_widget.color = self.COLORS[event.key]
                self.queue_save()

    def action_move_up(self):
        for _ in range(self.column_count):
            self.action_focus_previous()

    def action_move_down(self):
        for _ in range(self.column_count):
            self.action_focus_next()

    def on_mount(self) -> None:
        self.storage = NoteStorage()
        self.dark = True
        self.load_saved_notes()

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with ScrollableContainer(id="notes"):
            pass
        yield Footer()

    @work
    async def action_add_note(self):
        new_note = copy.deepcopy(self.default_note)
        new_note.note_id = str(uuid.uuid4())
        sticky_note = StickyNote(note=new_note)
        container = self.query_one("#notes")
        container.mount(sticky_note)
        self.notes_by_id[new_note.note_id] = sticky_note
        sticky_note.scroll_visible()
        sticky_note.focus()
        self.queue_save()

    def action_sort_notes(self):
        self.sort_notes()
        self.notify("Notes sorted", severity="information")

    def sort_notes(self):
        container = self.query_one("#notes")
        notes = list(self.query(StickyNote))
        if not notes:
            return
        container.sort_children(key=lambda w: self._note_sort_key(w))
        self.queue_save()

    @work
    async def action_delete_note(self):
        focused_widget = self.screen.focused
        if focused_widget is not None and isinstance(focused_widget, StickyNote):
            confirm = await self.push_screen_wait(DeleteModal())
            if confirm:
                self.notes_by_id.pop(focused_widget.note.note_id, None)
                focused_widget.remove()
                self.queue_save()

    @work
    async def action_edit_note(self):
        focused_widget = self.screen.focused
        if focused_widget is not None and isinstance(focused_widget, StickyNote):
            updated = await self.push_screen_wait(EditModal(focused_widget.note))
            if updated:
                focused_widget.note = updated
                focused_widget.priority_level = updated.priority
                focused_widget.is_pinned = updated.pinned
                focused_widget.update_title()
                focused_widget.update_border_color()
                content_widget = focused_widget.query_one(
                    "#noteContent", expect_type=Static
                )
                content_widget.update(updated.content)
                self.action_sort_notes()

    @work
    async def action_search_notes(self):
        all_notes = [sn.note for sn in self.notes_by_id.values()]
        if not all_notes:
            self.notify("No notes to search", severity="warning")
            return

        selected = await self.push_screen_wait(SearchModal(all_notes))
        if selected is not None:
            widget = self.notes_by_id.get(selected.note_id)
            if widget is not None:
                widget.focus()
                widget.scroll_visible()
                return
            self.notify("Could not find the note", severity="error")

    def load_saved_notes(self):
        if self.storage is None:
            return
        notes_with_colors = self.storage.load_notes()
        container = self.query_one("#notes")
        self.notes_by_id.clear()
        container.remove_children()

        if notes_with_colors:
            widgets = []
            for note, color in notes_with_colors:
                if color == "white":
                    color = None
                sticky_note = StickyNote(note=note)
                sticky_note.user_color = color
                if color is not None:
                    sticky_note.color = color
                sticky_note.priority_level = note.priority
                sticky_note.is_pinned = note.pinned
                widgets.append(sticky_note)
                self.notes_by_id[note.note_id] = sticky_note
            container.mount_all(widgets)

    def action_save_notes(self):
        self._save_notes(notify=True)

    def _save_notes(self, notify: bool = False) -> bool:
        if self._save_timer is not None:
            self._save_timer.stop()
            self._save_timer = None

        notes_with_colors: list[tuple[Note, str | None]] = [
            (sn.note, sn.user_color) for sn in self.query(StickyNote)
        ]

        ok = bool(self.storage and self.storage.save_notes(notes_with_colors))
        if notify:
            if ok:
                self.notify(
                    f"Saved {len(notes_with_colors)} notes", severity="information"
                )
            else:
                self.notify("Failed to save notes", severity="error")
        return ok

    def action_load_notes(self):
        self.load_saved_notes()

    def queue_save(self) -> None:
        if self._save_timer is not None:
            self._save_timer.stop()
        self._save_timer = self.set_timer(
            self.save_delay,
            lambda: self._save_notes(notify=False),
            name="save-notes",
        )

    def _on_resize(self, event):
        notes_container = self.query_one("#notes")
        self.column_count = max(1, event.size.width // 36)
        notes_container.styles.grid_size_columns = self.column_count
        return super()._on_resize(event)

    def _note_sort_key(self, widget) -> tuple[int, int, str]:
        if isinstance(widget, StickyNote):
            return widget.sort_key
        return (0, 0, "")

    async def action_quit(self) -> None:
        self._save_notes(notify=False)
        await super().action_quit()
