## ADDED Requirements

### Requirement: 7-signal composite relevance scoring
The system SHALL compute a composite relevance score (0.0–1.0) for each paper using 7 weighted signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| text_match | 0.30 | Keyword matching with acronym expansion |
| relevance | 0.20 | API-provided relevance/rank score |
| citations | 0.15 | Log-normalized citation count |
| multi_source | 0.15 | Number of sources that found this paper |
| recency | 0.10 | Year-based linear decay (current=1.0, -5yr=0.5, -10yr=0.0) |
| abstract | 0.10 | Has abstract (1.0), TLDR only (0.5), none (0.0) |
| semantic | 0.00 | Reserved for future SPECTER2 integration |

#### Scenario: High-relevance paper scoring
- **WHEN** a paper matches all keywords, has 50+ citations, is from 2024, found in 3 sources, has full abstract
- **THEN** the composite score is >= 0.80

#### Scenario: Low-relevance paper with penalty
- **WHEN** a paper has text_match < 0.30
- **THEN** the total score is multiplied by penalty factor 0.50

### Requirement: Gemini keyword and OMR extraction
The system SHALL use Gemini 2.5 Flash to extract from each paper's abstract: (1) keywords (semicolon-separated, minimum 5), (2) objective (1 sentence), (3) method (1 sentence), (4) result (1 sentence). Extraction results are stored in ai_keywords, ai_objective, ai_method, ai_result fields.

#### Scenario: Successful extraction
- **WHEN** a paper with abstract is processed by Gemini
- **THEN** ai_keywords, ai_objective, ai_method, ai_result are populated

#### Scenario: Paper without abstract
- **WHEN** a paper has no abstract
- **THEN** Gemini extraction is skipped; ai_keywords remains NULL

### Requirement: Keyword auto-normalization after extraction
The system SHALL auto-normalize AI-extracted keywords against the canonical keyword dictionary before storing. If a variant matches, the canonical form is used. If no match, the raw keyword is stored as-is (user can normalize later).

#### Scenario: Known variant normalization
- **WHEN** Gemini extracts "physics-informed neural network"
- **THEN** it is normalized to canonical "PINN" and stored as paper_keywords with keyword_id pointing to "PINN"

#### Scenario: Unknown keyword passthrough
- **WHEN** Gemini extracts "multi-fidelity surrogate"
- **THEN** if no canonical match exists, it is stored as-is in ai_keywords (not in paper_keywords until user creates canonical entry)
