import { ProjectOut, PaperOut } from "../types";

export const MOCK_PROJECTS: ProjectOut[] = [
  {
    id: 1,
    name: "PINN Fatigue Review 2026",
    description: "Literature review on PINN-based fatigue prediction",
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-15T14:30:00Z",
    paper_counts: {
      total: 150,
      included: 80,
      excluded: 30,
      undecided: 40,
    },
    search_count: 12,
  },
  {
    id: 2,
    name: "LLM Agent Architectural Patterns",
    description: "Survey of modern LLM agent frameworks",
    created_at: "2026-03-10T09:00:00Z",
    updated_at: "2026-03-14T11:20:00Z",
    paper_counts: {
      total: 45,
      included: 15,
      excluded: 5,
      undecided: 25,
    },
    search_count: 3,
  },
];

export const MOCK_PAPERS: PaperOut[] = [
  {
    id: 101,
    title: "PINN-based fatigue life prediction for composite structures",
    authors: [
      { name: "Kim, J.", affiliation: "KAIST" },
      { name: "Park, S.", affiliation: "Seoul National University" },
    ],
    year: 2024,
    venue: "Composites Part B",
    doi: "10.1016/j.compositesb.2024.111234",
    url: "https://doi.org/10.1016/j.compositesb.2024.111234",
    cited_by_count: 23,
    is_open_access: true,
    ai_relevance_score: 0.87,
    ai_keywords: "PINN; fatigue; composite; life prediction; damage mechanics",
    is_included: true,
    sources: ["openalex", "semantic_scholar", "crossref"],
    discovered_at: "2026-03-15T09:30:00Z",
  },
  {
    id: 102,
    title: "A review of Physics-Informed Neural Networks in solid mechanics",
    authors: [{ name: "Smith, A." }, { name: "Jones, B." }],
    year: 2023,
    venue: "Archives of Computational Methods in Engineering",
    doi: "10.1007/s11831-023-12345-6",
    cited_by_count: 112,
    is_open_access: false,
    ai_relevance_score: 0.92,
    ai_keywords: "PINN; solid mechanics; review; deep learning",
    is_included: null,
    sources: ["semantic_scholar"],
    discovered_at: "2026-03-14T08:15:00Z",
  },
];
