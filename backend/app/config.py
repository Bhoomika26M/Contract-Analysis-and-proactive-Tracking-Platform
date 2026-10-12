"""Application configuration, loaded from environment variables / .env file."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database -------------------------------------------------------
    # SQLite by default: zero setup, single file, no server process.
    # Point DATABASE_URL at any other SQLAlchemy URL to swap engines.
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'contractiq.db'}"

    # --- App ------------------------------------------------------------
    APP_NAME: str = "ContractIQ API"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"

    # Comma separated list of allowed browser origins.
    CORS_ORIGINS: str = (
        "http://localhost:8443,http://127.0.0.1:8443,"
        "http://localhost:5173,http://127.0.0.1:5173"
    )

    # --- Uploads --------------------------------------------------------
    UPLOAD_DIR: Path = BACKEND_DIR / "uploads"
    MAX_UPLOAD_MB: int = 25

    @field_validator("UPLOAD_DIR", mode="before")
    @classmethod
    def _resolve_upload_dir(cls, v: Path | str) -> Path:
        p = Path(v)
        return p if p.is_absolute() else (BACKEND_DIR / p)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        url = self.DATABASE_URL.strip()
        # Accept both "postgres://" and "postgresql+psycopg2://" spellings.
        if url.startswith("postgres://"):
            url = "postgresql+psycopg2://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+psycopg2://" + url[len("postgresql://"):]
        # Resolve relative SQLite paths against the backend directory so the
        # database file never depends on the process working directory.
        if url.startswith("sqlite:///"):
            path = url[len("sqlite:///"):]
            if path != ":memory:" and not Path(path).is_absolute():
                url = f"sqlite:///{BACKEND_DIR / path}"
        return url

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()