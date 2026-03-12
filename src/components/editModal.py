import copy
from textual.containers import HorizontalGroup, ScrollableContainer
from textual.screen import ModalScreen
from textual.widgets import Button, Checkbox, Input, Label, OptionList, TextArea
from textual.widgets.option_list import Option

from models import Note


class EditModal(ModalScreen[Note]):
    BINDINGS = [("escape", "dismiss", "Close")]

    note: Note
    oldNote: Note

    def __init__(self, note: Note, **kwargs):
        self.note = note
        self.oldNote = copy.deepcopy(note)
        super().__init__(**kwargs)

    def compose(self):
        with ScrollableContainer(id="editModalContainer"):
            yield Label("title")
            yield TextArea(text=self.note.noteTitle, id="title")

            yield Label("content")
            yield TextArea(text=self.note.content, id="content")

            yield Label("tags")
            yield Input(value=self.note.tags, id="tags")

            yield Label("priority")
            option_list = OptionList(
                Option("⚪ Trivial", id="0"),
                Option("🔵 Low", id="1"),
                Option("🟡 Medium", id="2"),
                Option("🟠 High", id="3"),
                Option("🔴 Critical", id="4"),
                id="priority",
            )
            if 0 <= self.note.priority <= 4:
                option_list.highlighted = self.note.priority
            yield option_list

            yield Checkbox("pinned", value=self.note.pinned, id="pinned")

            with HorizontalGroup(id="editActions"):
                yield Button("Save", variant="success", id="save")
                yield Button("Cancel", variant="primary", id="cancel")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "save":
            self.note.noteTitle = self.query_one("#title", TextArea).text
            self.note.content = self.query_one("#content", TextArea).text
            self.note.tags = self.query_one("#tags", Input).value
            self.note.pinned = self.query_one("#pinned", Checkbox).value

            priority_list = self.query_one("#priority", OptionList)
            if priority_list.highlighted is not None:
                option_id = priority_list.get_option_at_index(
                    priority_list.highlighted
                ).id
                self.note.priority = int(option_id) if option_id is not None else 0

            self.dismiss(self.note)
        else:
            self.dismiss(self.oldNote)

    async def action_dismiss(self, result: Note | None = None) -> None:
        self.dismiss(result if result is not None else self.oldNote)
