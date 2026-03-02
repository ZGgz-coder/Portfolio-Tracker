import pytest

from app.infrastructure.storage.path_policy import PathPolicyError, sanitize_relative_path


def test_prevent_path_traversal():
    with pytest.raises(PathPolicyError):
        sanitize_relative_path("../evil.txt")
