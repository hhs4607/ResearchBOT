"""Paper deduplication service.

Dedup strategy:
1. DOI exact match (primary)
2. Cross-source ID match (openalex_id, s2_id, arxiv_id)
3. Fuzzy title match with rapidfuzz ratio >= 90 (secondary)

When duplicates found, metadata is merged (richest version of each field).
"""

from __future__ import annotations

import re

from rapidfuzz import fuzz

from src.search import SearchResult


class UnionFind:
    """Union-Find for transitive duplicate grouping."""

    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, x: int, y: int) -> None:
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1


def _normalize_title(title: str) -> str:
    title = title.lower().strip()
    title = re.sub(r"[^\w\s]", "", title)
    title = re.sub(r"\s+", " ", title)
    return title


def _richness_score(r: SearchResult) -> int:
    """Score how complete a result's metadata is."""
    score = 0
    if r.title:
        score += 1
    if r.abstract:
        score += 2
    if r.doi:
        score += 1
    if r.authors:
        score += 1
    if r.year:
        score += 1
    if r.venue:
        score += 1
    if r.cited_by_count > 0:
        score += 1
    if r.tldr:
        score += 1
    if r.pdf_url:
        score += 1
    return score


def _merge_two(primary: SearchResult, secondary: SearchResult) -> SearchResult:
    """Merge secondary into primary, filling in missing fields."""
    if not primary.abstract and secondary.abstract:
        primary.abstract = secondary.abstract
    if not primary.doi and secondary.doi:
        primary.doi = secondary.doi
    if not primary.venue and secondary.venue:
        primary.venue = secondary.venue
    if not primary.pdf_url and secondary.pdf_url:
        primary.pdf_url = secondary.pdf_url
    if not primary.tldr and secondary.tldr:
        primary.tldr = secondary.tldr
    if not primary.openalex_id and secondary.openalex_id:
        primary.openalex_id = secondary.openalex_id
    if not primary.s2_id and secondary.s2_id:
        primary.s2_id = secondary.s2_id
    if not primary.arxiv_id and secondary.arxiv_id:
        primary.arxiv_id = secondary.arxiv_id
    if secondary.cited_by_count > primary.cited_by_count:
        primary.cited_by_count = secondary.cited_by_count
    if not primary.is_open_access and secondary.is_open_access:
        primary.is_open_access = True
    if not primary.authors and secondary.authors:
        primary.authors = secondary.authors
    elif secondary.authors and len(secondary.authors) > len(primary.authors):
        # Take the richer authors list (might have affiliations)
        has_aff = any("affiliation" in a for a in secondary.authors)
        if has_aff:
            primary.authors = secondary.authors

    # Track all sources
    if secondary.source_name and secondary.source_name not in (primary.raw_metadata.get("_all_sources") or []):
        all_sources = primary.raw_metadata.get("_all_sources", [primary.source_name])
        all_sources.append(secondary.source_name)
        primary.raw_metadata["_all_sources"] = all_sources

    return primary


def deduplicate(results: list[SearchResult], *, title_threshold: int = 90) -> list[SearchResult]:
    """Deduplicate search results from multiple sources.

    Returns merged, unique results sorted by richness.
    """
    if len(results) <= 1:
        return results

    n = len(results)
    uf = UnionFind(n)

    # Build lookup indexes
    doi_map: dict[str, list[int]] = {}
    oaid_map: dict[str, list[int]] = {}
    s2id_map: dict[str, list[int]] = {}
    arxid_map: dict[str, list[int]] = {}

    for i, r in enumerate(results):
        if r.doi:
            doi_map.setdefault(r.doi.lower(), []).append(i)
        if r.openalex_id:
            oaid_map.setdefault(r.openalex_id, []).append(i)
        if r.s2_id:
            s2id_map.setdefault(r.s2_id, []).append(i)
        if r.arxiv_id:
            arxid_map.setdefault(r.arxiv_id, []).append(i)

    # Phase 1: exact ID match
    for idx_list in list(doi_map.values()) + list(oaid_map.values()) + list(s2id_map.values()) + list(arxid_map.values()):
        for j in range(1, len(idx_list)):
            uf.union(idx_list[0], idx_list[j])

    # Phase 2: fuzzy title match (only for unmatched papers)
    normalized = [_normalize_title(r.title) for r in results]
    for i in range(n):
        if not normalized[i]:
            continue
        for j in range(i + 1, n):
            if uf.find(i) == uf.find(j):
                continue  # already grouped
            if not normalized[j]:
                continue
            len_ratio = len(normalized[i]) / max(len(normalized[j]), 1)
            if len_ratio < 0.5 or len_ratio > 2.0:
                continue
            score = fuzz.ratio(normalized[i], normalized[j])
            if score >= title_threshold:
                uf.union(i, j)

    # Merge groups
    groups: dict[int, list[int]] = {}
    for i in range(n):
        root = uf.find(i)
        groups.setdefault(root, []).append(i)

    merged: list[SearchResult] = []
    for members in groups.values():
        # Sort by richness, merge into best
        members.sort(key=lambda idx: _richness_score(results[idx]), reverse=True)
        primary = results[members[0]]
        # Initialize all_sources
        primary.raw_metadata["_all_sources"] = [primary.source_name]
        for idx in members[1:]:
            primary = _merge_two(primary, results[idx])
        merged.append(primary)

    return merged
