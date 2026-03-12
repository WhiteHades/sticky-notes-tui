from dataclasses import dataclass, field
import uuid


@dataclass(slots=True)
class Note:
    noteTitle: str
    content: str = ""
    tags: str = ""
    priority: int = 0
    pinned: bool = False
    note_id: str = field(default_factory=lambda: str(uuid.uuid4()))
