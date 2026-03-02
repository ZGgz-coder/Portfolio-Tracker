from __future__ import annotations

from pathlib import Path

from config.settings import resolve_export_root, settings
from app.infrastructure.storage.path_policy import sanitize_relative_path


class NetworkFolderStorage:
    def __init__(self, root: Path | str | None = None):
        if root is None:
            self.root = settings.export_root
        elif isinstance(root, Path):
            self.root = root
        else:
            self.root = resolve_export_root(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def write_bytes(self, relative_path: str, content: bytes) -> Path:
        safe_rel = sanitize_relative_path(relative_path)
        target = self.root / safe_rel
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("wb") as fh:
            fh.write(content)
        return target
