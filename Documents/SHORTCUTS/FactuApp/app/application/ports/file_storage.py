from __future__ import annotations

from pathlib import Path
from typing import Protocol


class FileStorage(Protocol):
    def write_bytes(self, relative_path: str, content: bytes) -> Path: ...
