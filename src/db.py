"""SQLite database manager — 8-table schema with WAL mode."""

from __future__ import annotations

import sqlite3
from pathlib import Path

SCHEMA_SQL = """
-- Projects: a review paper = a project
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Papers: unified paper metadata from all sources
CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Identifiers
    doi TEXT,
    openalex_id TEXT,
    s2_id TEXT,
    arxiv_id TEXT,

    -- Core metadata
    title TEXT NOT NULL,
    authors TEXT,                          -- JSON array: [{name, affiliation}]
    year INTEGER,
    venue TEXT,
    abstract TEXT,
    url TEXT,
    pdf_url TEXT,
    tldr TEXT,

    -- Rich metadata
    cited_by_count INTEGER DEFAULT 0,
    is_open_access BOOLEAN DEFAULT 0,
    references_list TEXT,                  -- JSON array: [{doi?, title, year?}]
    cited_by_list TEXT,                    -- JSON array: [{doi?, title, year?}]

    -- AI-generated fields
    ai_relevance_score REAL,
    ai_keywords TEXT,                      -- semicolon-separated (Gemini raw, read-only)
    ai_objective TEXT,
    ai_method TEXT,
    ai_result TEXT,

    -- User curation
    is_included INTEGER,                   -- NULL=undecided, 1=include, 0=exclude
    user_note TEXT,

    -- Source tracking
    sources TEXT,                          -- JSON array: ["openalex","s2",...]
    raw_metadata TEXT,                     -- JSON: full API responses merged

    -- Timestamps
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Uniqueness within a project
    UNIQUE(project_id, doi),
    UNIQUE(project_id, title)
);

-- Keywords: normalized keyword dictionary
CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canonical_form TEXT NOT NULL UNIQUE,
    variants TEXT,                          -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Paper <-> Keyword junction
CREATE TABLE IF NOT EXISTS paper_keywords (
    paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    source TEXT DEFAULT 'ai',              -- 'ai' | 'author' | 'user'
    PRIMARY KEY (paper_id, keyword_id)
);

-- Search logs
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_mode TEXT DEFAULT 'standard',
    source_results TEXT,                   -- JSON: {"openalex": {"found": 18, "errors": null}, ...}
    papers_found INTEGER DEFAULT 0,
    papers_new INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search <-> Paper junction
CREATE TABLE IF NOT EXISTS search_papers (
    search_id INTEGER NOT NULL REFERENCES search_logs(id) ON DELETE CASCADE,
    paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    PRIMARY KEY (search_id, paper_id)
);

-- Paper source details
CREATE TABLE IF NOT EXISTS paper_sources (
    paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    source_id TEXT,
    metadata TEXT,                         -- JSON
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (paper_id, source)
);

-- Zotero sync tracking
CREATE TABLE IF NOT EXISTS zotero_sync (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    collection_key TEXT,
    papers_synced INTEGER DEFAULT 0,
    last_synced_at TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_papers_project ON papers(project_id);
CREATE INDEX IF NOT EXISTS idx_papers_included ON papers(project_id, is_included);
CREATE INDEX IF NOT EXISTS idx_papers_score ON papers(project_id, ai_relevance_score);
CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(project_id, year);
CREATE INDEX IF NOT EXISTS idx_paper_keywords_paper ON paper_keywords(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_keywords_keyword ON paper_keywords(keyword_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_project ON search_logs(project_id);
"""


class Database:
    """SQLite database connection manager with WAL mode."""

    def __init__(self, db_path: str | Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn: sqlite3.Connection | None = None

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = sqlite3.connect(
                str(self.db_path),
                check_same_thread=False,
            )
            self._conn.row_factory = sqlite3.Row
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.execute("PRAGMA foreign_keys=ON")
        return self._conn

    def init_schema(self) -> None:
        """Create all tables if they don't exist."""
        self.conn.executescript(SCHEMA_SQL)
        self.conn.commit()

    def seed_keywords(self, keywords: dict[str, list[str]]) -> None:
        """Seed keyword dictionary. keywords = {canonical: [variant1, variant2, ...]}"""
        import json
        cursor = self.conn.cursor()
        for canonical, variants in keywords.items():
            try:
                cursor.execute(
                    "INSERT INTO keywords (canonical_form, variants) VALUES (?, ?)",
                    (canonical, json.dumps(variants)),
                )
            except sqlite3.IntegrityError:
                pass  # already exists
        self.conn.commit()

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            self._conn = None
