from __future__ import annotations

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.infrastructure.exporters.pro_template_generator import generate_pro_template


if __name__ == "__main__":
    template_path, map_path = generate_pro_template(ROOT_DIR)
    print(f"Generated PRO template: {template_path}")
    print(f"Generated map file: {map_path}")
