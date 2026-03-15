"""7-signal composite relevance scoring.

Phase 3 optimized config (0.942 accuracy on 20-query benchmark):
  text_match=0.30, relevance=0.20, citations=0.15,
  multi_source=0.15, recency=0.10, abstract=0.10, semantic=0.00

Plus penalty transform: text_match < 0.30 → score × 0.50

NO Gemini calls here — this is fast, deterministic scoring.
"""

from __future__ import annotations

import math
import re

from src.config import ScoringConfig
from src.search import SearchResult
from src.seed_keywords import SEED_KEYWORDS


def _build_expansion_map() -> dict[str, list[str]]:
    """Build lowercase acronym → expansions map from seed keywords."""
    expansion = {}
    for canonical, variants in SEED_KEYWORDS.items():
        expansion[canonical.lower()] = [v.lower() for v in variants]
        # Also map each variant back to canonical for bidirectional expansion
        for v in variants:
            expansion[v.lower()] = [canonical.lower()]
    return expansion


_EXPANSION_MAP = _build_expansion_map()


def _expand_query_terms(query: str) -> set[str]:
    """Expand query into a set of terms including acronym expansions."""
    words = set(re.findall(r"\b[\w-]+\b", query.lower()))
    expanded = set(words)
    # Try multi-word matches
    query_lower = query.lower()
    for term, expansions in _EXPANSION_MAP.items():
        if term in query_lower:
            expanded.update(expansions)
            expanded.add(term)
    return expanded


def _text_match_score(result: SearchResult, query_terms: set[str]) -> float:
    """Score keyword presence in title + abstract."""
    text = f"{result.title} {result.abstract}".lower()
    if not text.strip():
        return 0.0

    text_words = set(re.findall(r"\b[\w-]+\b", text))
    matches = query_terms & text_words

    # Also check multi-word terms
    for term in query_terms:
        if " " in term and term in text:
            matches.add(term)

    if not query_terms:
        return 0.0
    return min(len(matches) / max(len(query_terms) * 0.5, 1), 1.0)


def _relevance_signal(result: SearchResult) -> float:
    """API-provided relevance score, normalized to 0-1."""
    raw = result.raw_metadata.get("relevance_score")
    if raw is not None and isinstance(raw, (int, float)):
        return min(raw / 100.0, 1.0) if raw > 1.0 else raw
    # Fallback: use source rank position
    if result.source_total > 0:
        return 1.0 - (result.source_rank / result.source_total)
    return 0.5


def _citation_signal(result: SearchResult, max_citations: int) -> float:
    """Log-normalized citation count."""
    if max_citations <= 0:
        return 0.0
    return math.log10(1 + result.cited_by_count) / math.log10(1 + max_citations)


def _recency_signal(result: SearchResult, current_year: int = 2026) -> float:
    """Linear decay: current=1.0, -5yr=0.5, -10yr=0.0."""
    if not result.year:
        return 0.3  # unknown year → neutral
    age = current_year - result.year
    if age <= 0:
        return 1.0
    if age >= 10:
        return 0.0
    return 1.0 - (age / 10.0)


def _multi_source_signal(result: SearchResult) -> float:
    """Number of sources that found this paper."""
    all_sources = result.raw_metadata.get("_all_sources", [result.source_name])
    n = len(set(all_sources))
    if n >= 3:
        return 1.0
    if n == 2:
        return 0.5
    return 0.0


def _abstract_signal(result: SearchResult) -> float:
    """Has abstract (1.0), TLDR only (0.5), none (0.0)."""
    if result.abstract and len(result.abstract) > 50:
        return 1.0
    if result.tldr:
        return 0.5
    return 0.0


def score_results(
    results: list[SearchResult],
    query: str,
    scoring_config: ScoringConfig | None = None,
) -> list[SearchResult]:
    """Score and sort results by composite relevance. Mutates ai_relevance_score in raw_metadata."""
    if not results:
        return results

    if scoring_config is None:
        scoring_config = ScoringConfig()

    w = scoring_config.weights
    query_terms = _expand_query_terms(query)
    max_citations = max((r.cited_by_count for r in results), default=0)

    for result in results:
        signals = {
            "text_match": _text_match_score(result, query_terms),
            "relevance": _relevance_signal(result),
            "citations": _citation_signal(result, max_citations),
            "multi_source": _multi_source_signal(result),
            "recency": _recency_signal(result),
            "abstract": _abstract_signal(result),
            "semantic": 0.0,  # reserved
        }

        score = sum(w.get(k, 0) * v for k, v in signals.items())

        # Penalty transform
        if signals["text_match"] < scoring_config.penalty_threshold:
            score *= scoring_config.penalty_factor

        score = max(0.0, min(1.0, score))
        result.raw_metadata["ai_relevance_score"] = round(score, 4)
        result.raw_metadata["scoring_signals"] = {k: round(v, 4) for k, v in signals.items()}

    results.sort(key=lambda r: r.raw_metadata.get("ai_relevance_score", 0), reverse=True)
    return results
