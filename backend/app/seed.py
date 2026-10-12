"""Database bootstrap.

Creates the SQLite schema (if missing). No contract, obligation or renewal
rows are inserted - every piece of contract data in the UI comes from the
database or from a real upload.

Usage:
    python -m app.seed
"""

from __future__ import annotations

import sys

from .config import settings
from .database import check_database, init_db


def main() -> int:
    ok, detail = check_database()
    if not ok:
        print(f"Cannot reach database: {detail}", file=sys.stderr)
        print(f"Check backend/.env (DATABASE_URL = {settings.sqlalchemy_url}).", file=sys.stderr)
        return 1

    init_db()
    print(f"Schema is up to date ({settings.sqlalchemy_url})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
