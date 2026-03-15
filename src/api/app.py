"""FastAPI application factory."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import load_config
from src.db import Database
from src.seed_keywords import SEED_KEYWORDS


@asynccontextmanager
async def lifespan(app: FastAPI):
    config = load_config()
    db = Database(config.db_path)
    db.init_schema()
    db.seed_keywords(SEED_KEYWORDS)

    app.state.config = config
    app.state.db = db
    yield
    db.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title="ResearchBot API",
        version="2.0.0",
        description="Review paper database builder",
        lifespan=lifespan,
    )

    frontend_url = os.environ.get("FRONTEND_URL", "")
    allowed_origins = ["http://localhost:3000"]
    if frontend_url:
        allowed_origins.append(frontend_url)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from src.api.routers import projects, search, papers, keywords, export
    app.include_router(projects.router, prefix="/api")
    app.include_router(search.router, prefix="/api")
    app.include_router(papers.router, prefix="/api")
    app.include_router(keywords.router, prefix="/api")
    app.include_router(export.router, prefix="/api")

    return app
