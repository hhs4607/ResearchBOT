"""PubMed Entrez API client.

API: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
Rate limit: 3 req/sec (10 with API key).
Two-step: search IDs → fetch details.
"""

from __future__ import annotations

import logging
import time
import xml.etree.ElementTree as ET

import httpx

from src.search import SearchResult

logger = logging.getLogger(__name__)

SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

MONTH_MAP = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "may": "05", "jun": "06", "jul": "07", "aug": "08",
    "sep": "09", "oct": "10", "nov": "11", "dec": "12",
}


def search(query: str, *, max_results: int = 20, config=None) -> list[SearchResult]:
    api_key = getattr(config, "ncbi_api_key", "") if config else ""

    ids = _search_ids(query, max_results, api_key)
    if not ids:
        return []

    papers = _fetch_details(ids, api_key)
    delay = 0.35 if api_key else 1.0
    time.sleep(delay)
    return papers


def _search_ids(query: str, limit: int, api_key: str) -> list[str]:
    params = {"db": "pubmed", "term": query, "retmax": limit, "retmode": "json"}
    if api_key:
        params["api_key"] = api_key
    resp = httpx.get(SEARCH_URL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json().get("esearchresult", {}).get("idlist", [])


def _fetch_details(ids: list[str], api_key: str) -> list[SearchResult]:
    params = {
        "db": "pubmed",
        "id": ",".join(ids),
        "retmode": "xml",
        "rettype": "abstract",
    }
    if api_key:
        params["api_key"] = api_key
    resp = httpx.get(FETCH_URL, params=params, timeout=60)
    resp.raise_for_status()

    root = ET.fromstring(resp.text)
    results = []

    for i, article in enumerate(root.findall(".//PubmedArticle")):
        medline = article.find(".//MedlineCitation")
        art = medline.find(".//Article") if medline is not None else None
        if art is None:
            continue

        title_el = art.find(".//ArticleTitle")
        title = title_el.text if title_el is not None and title_el.text else ""

        abstract_el = art.find(".//Abstract/AbstractText")
        abstract = abstract_el.text if abstract_el is not None and abstract_el.text else ""

        year_el = art.find(".//Journal/JournalIssue/PubDate/Year")
        year = int(year_el.text) if year_el is not None and year_el.text else None

        journal_el = art.find(".//Journal/Title")
        journal = journal_el.text if journal_el is not None and journal_el.text else ""

        # DOI
        doi = None
        for eid in article.findall(".//ArticleIdList/ArticleId"):
            if eid.get("IdType") == "doi":
                doi = eid.text
                break

        pmid_el = medline.find(".//PMID")
        pmid = pmid_el.text if pmid_el is not None else ""

        # Authors with affiliation
        authors = []
        for a in art.findall(".//AuthorList/Author"):
            fore = a.findtext("ForeName") or ""
            last = a.findtext("LastName") or ""
            name = f"{fore} {last}".strip()
            aff_el = a.find(".//AffiliationInfo/Affiliation")
            entry = {"name": name}
            if aff_el is not None and aff_el.text:
                entry["affiliation"] = aff_el.text
            if name:
                authors.append(entry)

        # Keywords (author keywords + MeSH)
        kw_els = art.findall(".//KeywordList/Keyword")
        mesh_els = article.findall(".//MeshHeadingList/MeshHeading/DescriptorName")
        kw_list = [el.text for el in kw_els if el.text] or [el.text for el in mesh_els if el.text]

        results.append(SearchResult(
            title=title,
            authors=authors,
            year=year,
            venue=journal,
            abstract=abstract,
            doi=doi,
            url=f"https://doi.org/{doi}" if doi else f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            author_keywords=kw_list[:10],
            source_name="pubmed",
            source_id=pmid,
            source_rank=i,
            source_total=len(ids),
        ))

    return results
