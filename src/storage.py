import json
import os
import platform
from pathlib import Path

from models import Note


class NoteStorage:
    def __init__(self, filename: str = "notes.json"):
        system = platform.system()
        if system == "Linux":
            xdg_data_home = Path(
                os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share")
            )
            self.storage_dir = xdg_data_home / "sticky-notes"
        elif system == "Darwin":
            self.storage_dir = (
                Path.home() / "Library" / "Application Support" / "StickyNotes"
            )
        else:
            app_data = Path(
                os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming")
            )
            self.storage_dir = app_data / "StickyNotes"

        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.filepath = self.storage_dir / filename

    def save_notes(self, notes_with_colors: list[tuple[Note, str | None]]) -> bool:
        try:
            notes_data = [
                {
                    "noteTitle": note.noteTitle,
                    "content": note.content,
                    "tags": note.tags,
                    "priority": note.priority,
                    "pinned": note.pinned,
                    "note_id": note.note_id,
                    "color": color,
                }
                for note, color in notes_with_colors
            ]

            self.filepath.write_text(
                json.dumps(notes_data, separators=(",", ":"), ensure_ascii=False),
                encoding="utf-8",
            )
            return True
        except Exception as error:
            print(f"Error saving notes: {error}")
            return False

    def load_notes(self) -> list[tuple[Note, str | None]]:
        try:
            if not self.filepath.exists():
                return []

            notes_data = json.loads(self.filepath.read_text(encoding="utf-8"))
            return [
                (
                    Note(
                        noteTitle=data.get("noteTitle", ""),
                        content=data.get("content", ""),
                        tags=data.get("tags", ""),
                        priority=data.get("priority", 0),
                        pinned=data.get("pinned", False),
                        note_id=data.get("note_id") or "",
                    ),
                    data.get("color", "white"),
                )
                for data in notes_data
            ]
        except Exception as error:
            print(f"Error loading notes: {error}")
            return []
