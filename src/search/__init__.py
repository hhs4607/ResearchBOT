"""Multi-source academic paper search layer.

Provides a unified SearchResult dataclass and search_all() dispatcher.
"""

from __future__ import annotations

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Unified paper result from any search source."""

    # Core metadata
    title: str = ""
    authors: list[dict] = field(default_factory=list)  # [{name, affiliation?}]
    year: int | None = None
    venue: str = ""
    abstract: str = ""
    doi: str | None = None
    url: str = ""
    pdf_url: str | None = None
    tldr: str | None = None

    # Identifiers
    openalex_id: str | None = None
    s2_id: str | None = None
    arxiv_id: str | None = None

    # Rich metadata
    cited_by_count: int = 0
    is_open_access: bool = False
    author_keywords: list[str] = field(default_factory=list)

    # Source tracking
    source_name: str = ""
    source_id: str | None = None
    source_rank: int = 0
    source_total: int = 0
    raw_metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "authors": self.authors,
            "year": self.year,
            "venue": self.venue,
            "abstract": self.abstract,
            "doi": self.doi,
            "url": self.url,
            "pdf_url": self.pdf_url,
            "tldr": self.tldr,
            "openalex_id": self.openalex_id,
            "s2_id": self.s2_id,
            "arxiv_id": self.arxiv_id,
            "cited_by_count": self.cited_by_count,
            "is_open_access": self.is_open_access,
            "author_keywords": self.author_keywords,
            "source_name": self.source_name,
            "source_id": self.source_id,
            "source_rank": self.source_rank,
            "source_total": self.source_total,
        }


# Source name constants
OPENALEX = "openalex"
SEMANTIC_SCHOLAR = "semantic_scholar"
ARXIV = "arxiv"
CROSSREF = "crossref"
PUBMED = "pubmed"
GOOGLE_SCHOLAR = "google_scholar"

ALL_SOURCES = [OPENALEX, SEMANTIC_SCHOLAR, ARXIV, CROSSREF, PUBMED, GOOGLE_SCHOLAR]

# Search mode → sources mapping (default, overridden by config.yaml)
DEFAULT_MODES = {
    "quick": [OPENALEX],
    "standard": [OPENALEX, SEMANTIC_SCHOLAR, ARXIV],
    "deep": ALL_SOURCES,
}


def search_all(
    query: str,
    *,
    sources: list[str],
    limit_per_source: int = 20,
    config: object | None = None,
) -> dict[str, list[SearchResult] | str]:
    """Search multiple sources in parallel. Returns {source: results_or_error}."""
    from src.search import openalex, semantic_scholar, arxiv_search, crossref, pubmed, google_scholar

    source_funcs = {
        OPENALEX: lambda: openalex.search(query, max_results=limit_per_source, config=config),
        SEMANTIC_SCHOLAR: lambda: semantic_scholar.search(query, max_results=limit_per_source, config=config),
        ARXIV: lambda: arxiv_search.search(query, max_results=limit_per_source),
        CROSSREF: lambda: crossref.search(query, max_results=limit_per_source, config=config),
        PUBMED: lambda: pubmed.search(query, max_results=limit_per_source, config=config),
        GOOGLE_SCHOLAR: lambda: google_scholar.search(query, max_results=limit_per_source),
    }

    results: dict[str, list[SearchResult] | str] = {}

    def _run_source(name: str):
        func = source_funcs.get(name)
        if not func:
            return name, f"Unknown source: {name}"
        try:
            return name, func()
        except Exception as e:
            logger.warning("Search failed for %s: %s", name, e)
            return name, str(e)

    with ThreadPoolExecutor(max_workers=len(sources)) as pool:
        futures = {pool.submit(_run_source, s): s for s in sources}
        for future in futures:
            name, result = future.result()
            results[name] = result

    return results
