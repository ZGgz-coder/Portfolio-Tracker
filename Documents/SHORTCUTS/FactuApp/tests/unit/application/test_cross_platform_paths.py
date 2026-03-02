import pytest

from config.settings import resolve_export_root


def test_unc_path_allowed_on_windows():
    path = resolve_export_root(r"\\server\share\facturas", platform_name="nt")
    assert "server" in str(path)


def test_unc_path_rejected_on_non_windows():
    with pytest.raises(ValueError):
        resolve_export_root(r"\\server\share\facturas", platform_name="posix")


def test_macos_volume_allowed_on_non_windows():
    path = resolve_export_root("/Volumes/facturas", platform_name="posix")
    assert str(path) == "/Volumes/facturas"


def test_macos_volume_rejected_on_windows():
    with pytest.raises(ValueError):
        resolve_export_root("/Volumes/facturas", platform_name="nt")


def test_relative_local_path_allowed():
    path = resolve_export_root("data/network_exports", platform_name="posix")
    assert str(path).endswith("data/network_exports")
