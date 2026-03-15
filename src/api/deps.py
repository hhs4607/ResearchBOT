"""FastAPI dependency injection."""

from __future__ import annotations

import sqlite3

from fastapi import Request

from src.config import Config
from src.db import Database


def get_db(request: Request) -> sqlite3.Connection:
    db: Database = request.app.state.db
    return db.conn


def get_config(request: Request) -> Config:
    return request.app.state.config
