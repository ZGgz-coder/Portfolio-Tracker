from __future__ import annotations

from pathlib import Path


class PathPolicyError(ValueError):
    pass


def sanitize_relative_path(relative_path: str) -> str:
    candidate = Path(relative_path)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise PathPolicyError("Unsafe relative path")
    return str(candidate)
