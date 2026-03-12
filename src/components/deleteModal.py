from textual.containers import Grid
from textual.screen import ModalScreen
from textual.widgets import Button, Label


class DeleteModal(ModalScreen[bool]):
    BINDINGS = [("escape", "dismiss", "Close")]

    def compose(self):
        with Grid(id="deleteModalContainer"):
            yield Label("Delete this note?", id="question")
            yield Button("Delete", variant="error", id="yes")
            yield Button("Keep", variant="primary", id="no")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "yes":
            self.dismiss(True)
        else:
            self.dismiss(False)

    async def action_dismiss(self, result: bool | None = None) -> None:
        self.dismiss(False if result is None else result)
