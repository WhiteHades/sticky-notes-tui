from textual.containers import Horizontal, Vertical
from textual.screen import ModalScreen
from textual.timer import Timer
from textual.widgets import Button, Input, Label, ListItem, ListView

from models import Note


class SearchModal(ModalScreen[Note]):
    BINDINGS = [("escape", "dismiss", "Close")]
    MAX_RESULTS = 20
    SEARCH_DELAY = 0.08

    def __init__(self, notes: list[Note], **kwargs):
        super().__init__(**kwargs)
        self.all_notes = notes
        self.matching_notes: list[Note] = []
        self.search_index = [
            (note, f"{note.noteTitle}\n{note.content}\n{note.tags}".casefold())
            for note in notes
        ]
        self._pending_query = ""
        self._search_timer: Timer | None = None

    def compose(self):
        with Vertical(id="searchContainer"):
            yield Label("Search Notes", id="searchTitle")
            yield Input(
                placeholder="search by title, content, or tags...", id="searchInput"
            )
            yield ListView(id="searchResults")
            with Horizontal(id="searchButtons"):
                yield Button("Close", variant="primary", id="close")

    def on_mount(self) -> None:
        self.query_one("#searchInput", Input).focus()
        self._render_results([], "type to search...")

    def on_input_changed(self, event: Input.Changed) -> None:
        self._pending_query = event.value.casefold().strip()
        if self._search_timer is not None:
            self._search_timer.stop()
        self._search_timer = self.set_timer(
            self.SEARCH_DELAY,
            self._flush_search,
            name="search-debounce",
        )

    def _flush_search(self) -> None:
        self._search_timer = None
        query = self._pending_query
        if not query:
            self.matching_notes = []
            self._render_results([], "type to search...")
            return

        matches: list[Note] = []
        for note, haystack in self.search_index:
            if query in haystack:
                matches.append(note)
                if len(matches) >= self.MAX_RESULTS:
                    break

        self.matching_notes = matches
        if matches:
            self._render_results(matches)
        else:
            self._render_results([], f"no matches for '{query}'")

    def _render_results(
        self, notes: list[Note], empty_message: str | None = None
    ) -> None:
        results_view = self.query_one("#searchResults", ListView)
        results_view.clear()

        if not notes:
            results_view.append(ListItem(Label(empty_message or "no matches")))
            return

        items = []
        for note in notes:
            title = note.noteTitle.strip() or "untitled"
            preview = " ".join(note.content.split())[:60]
            tags = note.tags.strip()
            line = f"  {title}"
            if preview:
                line = f"{line} - {preview}"
            if tags:
                line = f"{line}  #{tags}"
            items.append(ListItem(Label(line)))
        results_view.extend(items)

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        index = event.list_view.index
        if index is not None and 0 <= index < len(self.matching_notes):
            self.dismiss(self.matching_notes[index])

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "close":
            self.dismiss(None)

    async def action_dismiss(self, result: Note | None = None) -> None:
        if self._search_timer is not None:
            self._search_timer.stop()
            self._search_timer = None
        self.dismiss(result)
