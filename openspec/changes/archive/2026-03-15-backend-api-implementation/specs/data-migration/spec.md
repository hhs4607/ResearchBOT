## ADDED Requirements

### Requirement: PaperReviewBot CSV import script
The system SHALL provide a one-time migration script (`scripts/migrate_paperreviewbot.py`) that imports existing PaperReviewBot CSV data into the ResearchBot database.

#### Scenario: Import output/ session
- **WHEN** the script is run for `~/Projects/PaperReviewBot/output/`
- **THEN** a project "PINN-based Digital Twin for Fatigue Analysis" is created with ~145 reviewed papers imported from papers_reviewed.csv

#### Scenario: Import output_bayesian_composite/ session
- **WHEN** the script is run for `~/Projects/PaperReviewBot/output_bayesian_composite/`
- **THEN** a project "Bayesian Optimization-based Composite Material Design" is created with ~122 reviewed papers imported

### Requirement: CSV column to DB field mapping
The migration script SHALL map CSV columns to DB fields as follows:

| CSV Column | DB Field | Transform |
|------------|----------|-----------|
| title | title | as-is |
| abstract | abstract | as-is |
| doi | doi | as-is |
| year | year | as-is |
| source | sources | wrap as JSON array ["source"] |
| pdf_url | pdf_url | as-is |
| arxiv_id | arxiv_id | as-is |
| citation_count | cited_by_count | as-is |
| authors | authors | parse to JSON [{name}] |
| main_keywords | ai_keywords | as-is |
| objective | ai_objective | as-is |
| method | ai_method | as-is |
| result | ai_result | as-is |
| relevance_score (1-5) | ai_relevance_score | normalize: score/5.0 |

Columns method_category, domain_category, sub_topic, classification_reasoning, keyword_warning are skipped (legacy fields).

#### Scenario: Authors field parsing
- **WHEN** CSV authors field is "Kim, J.; Park, S."
- **THEN** DB authors field is [{"name": "Kim, J."}, {"name": "Park, S."}]

#### Scenario: Relevance score normalization
- **WHEN** CSV relevance_score is 4
- **THEN** DB ai_relevance_score is 0.8

### Requirement: Keyword dictionary seeding from migration
The migration script SHALL also seed the keywords table from the merged abbreviation dictionaries of both source projects.

#### Scenario: Seed abbreviation mappings
- **WHEN** the migration script runs
- **THEN** the keywords table contains canonical forms like "PINN", "FEM", "SHM" with their variant lists from both 07_Research_Bot and PaperReviewBot

### Requirement: Project metadata from topic config
The migration script SHALL read `topic_config.json` and/or `subtopic_config.json` from each output directory to set the project name and description.

#### Scenario: Topic config exists
- **WHEN** output/topic_config.json contains {"main_topic": "PINN-based Digital Twin for Fatigue Analysis"}
- **THEN** the project name is set to that value

### Requirement: Imported papers marked as included
All papers imported from papers_reviewed.csv (papers that passed all pipeline stages) SHALL have is_included=1. Papers from papers_irrelevant.csv or papers_removed.csv are NOT imported.

#### Scenario: Only reviewed papers imported
- **WHEN** the migration imports from output/
- **THEN** only ~145 papers from papers_reviewed.csv are imported with is_included=1; the ~247 removed/irrelevant papers are skipped
