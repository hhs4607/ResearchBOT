"""Configuration — loads from config.yaml + .env environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
CONFIG_FILE = PROJECT_ROOT / "config.yaml"


def _load_yaml() -> dict:
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


@dataclass
class SearchModeConfig:
    sources: list[str] = field(default_factory=list)


@dataclass
class ScoringConfig:
    weights: dict[str, float] = field(default_factory=lambda: {
        "text_match": 0.30,
        "relevance": 0.20,
        "citations": 0.15,
        "multi_source": 0.15,
        "recency": 0.10,
        "abstract": 0.10,
        "semantic": 0.00,
    })
    penalty_threshold: float = 0.30
    penalty_factor: float = 0.50


@dataclass
class Config:
    # Database
    db_path: Path = field(default_factory=lambda: PROJECT_ROOT / "data" / "research_bot.db")

    # Search
    default_search_mode: str = "standard"
    limit_per_source: int = 20
    search_modes: dict[str, SearchModeConfig] = field(default_factory=dict)

    # Scoring
    scoring: ScoringConfig = field(default_factory=ScoringConfig)

    # LLM
    gemini_model: str = "gemini-2.5-flash"

    # Export
    csv_default_columns: list[str] = field(default_factory=lambda: [
        "title", "first_author", "doi", "venue", "year",
        "ai_keywords", "ai_objective", "ai_method", "ai_result",
    ])

    # API keys (from .env)
    gemini_api_key: str = ""
    openalex_email: str = ""
    s2_api_key: str = ""
    crossref_email: str = ""
    ncbi_api_key: str = ""
    zotero_user_id: str = ""
    zotero_api_key: str = ""


def load_config() -> Config:
    """Load configuration from config.yaml and .env."""
    load_dotenv()
    cfg_yaml = _load_yaml()
    config = Config()

    # Database — env var takes priority, then YAML, then default
    env_db_path = os.environ.get("DATABASE_PATH")
    if env_db_path:
        config.db_path = Path(env_db_path)
    else:
        db_cfg = cfg_yaml.get("database", {})
        if "path" in db_cfg:
            config.db_path = PROJECT_ROOT / db_cfg["path"]

    # Search
    search_cfg = cfg_yaml.get("search", {})
    config.default_search_mode = search_cfg.get("default_mode", config.default_search_mode)
    config.limit_per_source = search_cfg.get("limit_per_source", config.limit_per_source)

    modes_cfg = search_cfg.get("modes", {})
    for mode_name, mode_data in modes_cfg.items():
        config.search_modes[mode_name] = SearchModeConfig(
            sources=mode_data.get("sources", [])
        )

    # Scoring
    scoring_cfg = cfg_yaml.get("scoring", {})
    weights = scoring_cfg.get("weights", {})
    if weights:
        config.scoring.weights.update(weights)
    penalty = scoring_cfg.get("penalty", {})
    if "threshold" in penalty:
        config.scoring.penalty_threshold = penalty["threshold"]
    if "factor" in penalty:
        config.scoring.penalty_factor = penalty["factor"]

    # LLM
    llm_cfg = cfg_yaml.get("llm", {})
    config.gemini_model = llm_cfg.get("model", config.gemini_model)

    # Export
    export_cfg = cfg_yaml.get("export", {})
    csv_cfg = export_cfg.get("csv", {})
    if "default_columns" in csv_cfg:
        config.csv_default_columns = csv_cfg["default_columns"]

    # API keys from environment
    config.gemini_api_key = os.environ.get("GEMINI_API_KEY", "")
    config.openalex_email = os.environ.get("OPENALEX_EMAIL", "")
    config.s2_api_key = os.environ.get("S2_API_KEY", "") or os.environ.get("SEMANTIC_SCHOLAR_API_KEY", "")
    config.crossref_email = os.environ.get("CROSSREF_EMAIL", "")
    config.ncbi_api_key = os.environ.get("NCBI_API_KEY", "")
    config.zotero_user_id = os.environ.get("ZOTERO_USER_ID", "")
    config.zotero_api_key = os.environ.get("ZOTERO_API_KEY", "")

    # Ensure data directory exists
    config.db_path.parent.mkdir(parents=True, exist_ok=True)

    return config
