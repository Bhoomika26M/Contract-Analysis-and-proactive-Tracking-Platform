import json
import os
from pathlib import Path
from threading import RLock
from typing import Any, Iterable

from sqlalchemy import Column, MetaData, String, Table, Text, create_engine, delete, insert, select


_database_url = os.getenv("CONTRACTIQ_DATABASE_URL")
if _database_url and _database_url.startswith(("postgres://", "postgresql://")):
    _database_url = _database_url.replace("postgres://", "postgresql+psycopg://", 1).replace("postgresql://", "postgresql+psycopg://", 1)
if not _database_url:
    _database_path = Path(os.getenv("CONTRACTIQ_DATABASE_PATH", "backend/contractiq.sqlite3"))
    _database_path.parent.mkdir(parents=True, exist_ok=True)
    _database_url = f"sqlite:///{_database_path.as_posix()}"
    _engine = create_engine(_database_url, connect_args={"check_same_thread": False})
else:
    _engine = create_engine(_database_url, pool_pre_ping=True)
_lock = RLock()
_metadata = MetaData()
_collections = Table(
    "collections",
    _metadata,
    Column("name", String(120), primary_key=True),
    Column("payload", Text, nullable=False),
)
_metadata.create_all(_engine)


def load_collection(name: str, initial: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    with _lock, _engine.begin() as connection:
        payload = connection.execute(select(_collections.c.payload).where(_collections.c.name == name)).scalar_one_or_none()
        if payload is not None:
            return json.loads(payload)
        values = list(initial)
        connection.execute(insert(_collections).values(name=name, payload=json.dumps(values)))
        return values


def save_collection(name: str, values: list[dict[str, Any]]) -> None:
    with _lock, _engine.begin() as connection:
        connection.execute(delete(_collections).where(_collections.c.name == name))
        connection.execute(insert(_collections).values(name=name, payload=json.dumps(values)))


class PersistentList(list[dict[str, Any]]):
    def __init__(self, name: str, initial: Iterable[dict[str, Any]] = ()) -> None:
        self._collection_name = name
        super().__init__(load_collection(name, initial))

    def _save(self) -> None:
        save_collection(self._collection_name, self)

    def append(self, value: dict[str, Any]) -> None:
        super().append(value)
        self._save()

    def extend(self, values: Iterable[dict[str, Any]]) -> None:
        super().extend(values)
        self._save()

    def insert(self, index: int, value: dict[str, Any]) -> None:
        super().insert(index, value)
        self._save()

    def pop(self, index: int = -1) -> dict[str, Any]:
        value = super().pop(index)
        self._save()
        return value

    def clear(self) -> None:
        super().clear()
        self._save()

    def remove(self, value: dict[str, Any]) -> None:
        super().remove(value)
        self._save()

    def reverse(self) -> None:
        super().reverse()
        self._save()

    def sort(self, *, key: Any = None, reverse: bool = False) -> None:
        super().sort(key=key, reverse=reverse)
        self._save()

    def __setitem__(self, index: Any, value: Any) -> None:
        super().__setitem__(index, value)
        self._save()

    def __delitem__(self, index: Any) -> None:
        super().__delitem__(index)
        self._save()