from textual.reactive import reactive
from textual.widgets import Static

from models import Note


class StickyNote(Static):
    can_focus = True
    note: Note
    color: reactive[str] = reactive("#45475a")
    priority_level: reactive[int] = reactive(0)
    is_pinned: reactive[bool] = reactive(False, init=False)

    PRIORITY_COLORS = {
        0: "#45475a",
        1: "#89b4fa",
        2: "#f9e2af",
        3: "#fab387",
        4: "#f38ba8",
    }

    PRIORITY_NAMES = {0: "Trivial", 1: "Low", 2: "Medium", 3: "High", 4: "Critical"}

    def __init__(self, note: Note, **kwargs):
        super().__init__(**kwargs)
        self.note = note
        self.user_color: str | None = None
        self.priority_level = note.priority
        self.is_pinned = note.pinned

    def on_mount(self, event):
        self.update_title()
        self.update_border_color()

    def compose(self):
        yield Static(self.note.content, id="noteContent")

    @property
    def sort_key(self) -> tuple[int, int, str]:
        return (
            -int(self.is_pinned),
            -self.priority_level,
            self.note.noteTitle.casefold(),
        )

    def update_title(self):
        pin = "📌 " if self.is_pinned else ""
        icon = self.get_priority_icon()
        self.border_title = f"{pin}{self.note.noteTitle} {icon}".rstrip()
        self.styles.border_title_color = "#cdd6f4"
        self.styles.border_subtitle_color = self.color

    def get_priority_icon(self):
        icons = {0: "", 1: "🔵", 2: "🟡", 3: "🟠", 4: "🔴"}
        return icons.get(self.priority_level, "")

    def update_border_color(self):
        if self.user_color is not None:
            self.color = self.user_color
        else:
            self.color = self.PRIORITY_COLORS.get(self.priority_level, "#45475a")

    def watch_color(self, color: str):
        border_type = "heavy" if self.is_pinned else "solid"
        self.styles.border = (border_type, color)
        self.styles.border_title_color = "#cdd6f4"
        self.styles.border_subtitle_color = color

    def watch_priority_level(self, priority: int):
        self.note.priority = priority
        self.update_title()
        self.update_border_color()

    def watch_is_pinned(self, pinned: bool):
        self.note.pinned = pinned
        self.update_title()
        border_type = "heavy" if pinned else "solid"
        self.styles.border = (border_type, self.color)
