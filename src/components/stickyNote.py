from textual.widgets import Static
from textual.reactive import reactive
from models import Note


class StickyNote(Static):
    can_focus = True
    note: Note
    color = reactive("#45475a")
    user_color = reactive(None)
    priority_level = reactive(0)
    is_pinned = reactive(False, init=False)

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
        self.priority_level = note.priority
        self.is_pinned = note.pinned

    def on_mount(self, event):
        self.update_title()
        self.update_border_color()

    def compose(self):
        yield Static(self.note.content, id="noteContent")

    def update_title(self):
        pin_icon = "📌 " if self.is_pinned else ""
        priority_icon = self.get_priority_icon()

        self.border_title = f"{pin_icon}{self.note.noteTitle} {priority_icon}"
        self.styles.border_title_color = "#cdd6f4"
        self.styles.border_subtitle_color = self.color

    def get_priority_icon(self):
        """Get icon based on priority level"""
        icons = {
            0: "",  # trivial  - no icon
            1: "🔵",  # low
            2: "🟡",  # medium
            3: "🟠",  # high
            4: "🔴",  # critical
        }
        return icons.get(self.priority_level, "")

    def update_border_color(self):
        if self.user_color is not None:
            self.color = self.user_color
        else:
            self.color = self.PRIORITY_COLORS.get(self.priority_level, "white")

    def watch_color(self, color: str):
        self.styles.border = ("heavy" if self.is_pinned else "solid", color)
        self.styles.border_title_color = "#cdd6f4"
        self.styles.border_subtitle_color = color

    def watch_priority_level(self, priority: int):
        """React to priority changes"""
        self.note.priority = priority
        self.update_title()
        self.update_border_color()

    def watch_is_pinned(self, pinned: bool):
        """React to pin status changes"""
        self.note.pinned = pinned
        self.update_title()
        self.styles.border = ("heavy" if pinned else "solid", self.color)
