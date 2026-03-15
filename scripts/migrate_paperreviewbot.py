"""One-time migration: PaperReviewBot CSV → ResearchBot DB.

Imports reviewed papers from PaperReviewBot output directories as projects.
Maps CSV columns to DB fields per PRD v2 data migration spec.

Usage:
    python scripts/migrate_paperreviewbot.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db import Database
from src.seed_keywords import SEED_KEYWORDS
from src.services.keyword_service import KeywordService


# Sessions to migrate
SESSIONS = [
    {
        "output_dir": Path.home() / "Projects" / "PaperReviewBot" / "output",
        "topic_config": "topic_config.json",
        "default_name": "PINN-based Digital Twin for Fatigue Analysis",
    },
    {
        "output_dir": Path.home() / "Projects" / "PaperReviewBot" / "output_bayesian_composite",
        "topic_config": "subtopic_config.json",
        "default_name": "Bayesian Optimization-based Composite Material Design",
    },
]


def parse_authors(authors_str: str) -> str:
    """Convert "Kim, J.; Park, S." → JSON [{name: "Kim, J."}, {name: "Park, S."}]"""
    if not authors_str or pd.isna(authors_str):
        return "[]"
    names = [a.strip() for a in str(authors_str).split(";") if a.strip()]
    return json.dumps([{"name": n} for n in names])


def get_project_name(session: dict) -> str:
    """Read project name from topic config file."""
    config_path = session["output_dir"] / session["topic_config"]
    if config_path.exists():
        with open(config_path) as f:
            data = json.load(f)
            return data.get("main_topic", session["default_name"])
    return session["default_name"]


def migrate_session(db: Database, session: dict) -> int:
    """Migrate one session's CSV data to DB. Returns number of papers imported."""
    output_dir = session["output_dir"]
    reviewed_csv = output_dir / "papers_reviewed.csv"

    if not reviewed_csv.exists():
        print(f"  ⚠ {reviewed_csv} not found, skipping")
        return 0

    project_name = get_project_name(session)
    print(f"  Project: {project_name}")

    # Create project
    cursor = db.conn.execute(
        "INSERT INTO projects (name, description) VALUES (?, ?)",
        (project_name, f"Migrated from PaperReviewBot: {output_dir.name}"),
    )
    project_id = cursor.lastrowid
    db.conn.commit()

    # Read CSV
    df = pd.read_csv(reviewed_csv)
    print(f"  Papers in CSV: {len(df)}")

    imported = 0
    ks = KeywordService(db.conn)

    for _, row in df.iterrows():
        title = str(row.get("title", "")).strip()
        if not title:
            continue

        doi = row.get("doi") if pd.notna(row.get("doi")) else None
        year = int(row["year"]) if pd.notna(row.get("year")) else None
        abstract = str(row.get("abstract", "")) if pd.notna(row.get("abstract")) else ""
        authors_json = parse_authors(row.get("authors", ""))
        source = str(row.get("source", "")) if pd.notna(row.get("source")) else ""
        pdf_url = str(row.get("pdf_url", "")) if pd.notna(row.get("pdf_url")) else None
        arxiv_id = str(row.get("arxiv_id", "")) if pd.notna(row.get("arxiv_id")) else None
        citation_count = int(row["citation_count"]) if pd.notna(row.get("citation_count")) else 0

        # AI fields
        ai_keywords = str(row.get("main_keywords", "")) if pd.notna(row.get("main_keywords")) else None
        ai_objective = str(row.get("objective", "")) if pd.notna(row.get("objective")) else None
        ai_method = str(row.get("method", "")) if pd.notna(row.get("method")) else None
        ai_result = str(row.get("result", "")) if pd.notna(row.get("result")) else None

        # Relevance score: normalize 1-5 → 0.0-1.0
        raw_score = row.get("relevance_score")
        ai_relevance_score = float(raw_score) / 5.0 if pd.notna(raw_score) else None

        sources_json = json.dumps([source]) if source else "[]"

        try:
            cur = db.conn.execute(
                """INSERT INTO papers (
                    project_id, doi, arxiv_id, title, authors, year, abstract,
                    pdf_url, cited_by_count, ai_relevance_score,
                    ai_keywords, ai_objective, ai_method, ai_result,
                    is_included, sources
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)""",
                (
                    project_id, doi, arxiv_id, title, authors_json, year, abstract,
                    pdf_url, citation_count, ai_relevance_score,
                    ai_keywords, ai_objective, ai_method, ai_result,
                    sources_json,
                ),
            )
            paper_id = cur.lastrowid
            imported += 1

            # Normalize and link keywords
            if ai_keywords:
                for kw in ai_keywords.split(";"):
                    kw = kw.strip()
                    if not kw:
                        continue
                    kid, canonical = ks.normalize(kw)
                    if kid is not None:
                        ks.link_paper_keyword(paper_id, kid, source="ai")

        except Exception as e:
            print(f"    ⚠ Skipped '{title[:40]}': {e}")

    db.conn.commit()
    print(f"  Imported: {imported} papers (is_included=1)")
    return imported


def main():
    db_path = Path("data/research_bot.db")
    db = Database(db_path)
    db.init_schema()
    db.seed_keywords(SEED_KEYWORDS)

    total = 0
    for i, session in enumerate(SESSIONS, 1):
        print(f"\n[{i}/{len(SESSIONS)}] Migrating: {session['output_dir'].name}")
        if not session["output_dir"].exists():
            print(f"  ⚠ Directory not found: {session['output_dir']}")
            continue
        total += migrate_session(db, session)

    print(f"\n✅ Migration complete. Total papers: {total}")

    # Verify
    row = db.conn.execute("SELECT COUNT(*) as cnt FROM papers").fetchone()
    projects = db.conn.execute("SELECT id, name FROM projects").fetchall()
    print(f"DB verification: {row['cnt']} papers in {len(projects)} projects")
    for p in projects:
        count = db.conn.execute("SELECT COUNT(*) as cnt FROM papers WHERE project_id = ?", (p['id'],)).fetchone()
        kw_count = db.conn.execute(
            "SELECT COUNT(DISTINCT pk.keyword_id) as cnt FROM paper_keywords pk JOIN papers p ON pk.paper_id = p.id WHERE p.project_id = ?",
            (p['id'],),
        ).fetchone()
        print(f"  [{p['id']}] {p['name']}: {count['cnt']} papers, {kw_count['cnt']} unique keywords linked")

    db.close()


if __name__ == "__main__":
    main()
