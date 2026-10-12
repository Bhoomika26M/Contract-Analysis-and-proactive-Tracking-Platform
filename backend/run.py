"""Convenience entrypoint: `python run.py` starts the API with reload."""

import os

import uvicorn

os.environ.setdefault("PYTHONUNBUFFERED", "1")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "1") == "1",
    )