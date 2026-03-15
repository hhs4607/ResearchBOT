"""Gemini LLM client for keyword/OMR extraction.

Called separately from search — only on saved papers, on demand.
"""

from __future__ import annotations

import json
import logging

from google import genai

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """Analyze this academic paper and extract structured information.

Title: {title}
Abstract: {abstract}

Return a JSON object with these fields:
- "keywords": list of 5-10 specific technical keywords (not generic like "research" or "analysis")
- "objective": one sentence describing the research objective
- "method": one sentence describing the methodology
- "result": one sentence describing the key findings

Return ONLY valid JSON, no markdown formatting."""


def extract_paper_info(
    title: str,
    abstract: str,
    *,
    api_key: str,
    model: str = "gemini-2.5-flash",
) -> dict | None:
    """Extract keywords and OMR from a paper's title+abstract.

    Returns {"keywords": [...], "objective": "...", "method": "...", "result": "..."}
    or None on failure.
    """
    if not abstract:
        return None

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents=EXTRACTION_PROMPT.format(title=title, abstract=abstract),
        )

        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

        data = json.loads(text)
        return {
            "keywords": data.get("keywords", []),
            "objective": data.get("objective", ""),
            "method": data.get("method", ""),
            "result": data.get("result", ""),
        }
    except Exception as e:
        logger.warning("Gemini extraction failed for '%s': %s", title[:50], e)
        return None
