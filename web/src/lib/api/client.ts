import { ProjectListOut, ProjectDetailOut, PaperListOut, PaperDetailOut } from "./types";
import { MOCK_PROJECTS, MOCK_PAPERS } from "./mocks/data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = {
  projects: {
    list: async (): Promise<ProjectListOut> => {
      const res = await fetch(`${API_BASE}/api/projects`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    get: async (id: number): Promise<ProjectDetailOut> => {
      const res = await fetch(`${API_BASE}/api/projects/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project details");
      return res.json();
    },
    create: async (data: { name: string; description?: string }) => {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    delete: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    autoSelect: async (id: number, threshold: number) => {
      const res = await fetch(`${API_BASE}/api/projects/${id}/auto-select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
      });
      if (!res.ok) throw new Error("Failed to auto-select papers");
      return res.json();
    },
    syncZotero: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/projects/${id}/export/zotero`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to sync with Zotero");
      return res.json();
    },
    zoteroStatus: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/projects/${id}/export/zotero/status`);
      if (!res.ok) throw new Error("Failed to get Zotero status");
      return res.json();
    }
  },
  papers: {
    save: async (projectId: number, searchId: number, selections: { temp_index: number; is_included: boolean | null }[]) => {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/papers/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search_id: searchId, selections }),
      });
      if (!res.ok) throw new Error("Failed to save papers");
      return res.json();
    },
    list: async (projectId: number, params?: Record<string, string | number | boolean>): Promise<PaperListOut> => {
      const base = API_BASE || window.location.origin;
      const url = new URL(`${base}/api/projects/${projectId}/papers`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch papers");
      return res.json();
    },
    get: async (id: number): Promise<PaperDetailOut> => {
      const res = await fetch(`${API_BASE}/api/papers/${id}`);
      if (!res.ok) throw new Error("Paper not found");
      return res.json();
    },
    toggleInclude: async (id: number, is_included: boolean | null) => {
      const res = await fetch(`${API_BASE}/api/papers/${id}/include`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_included }),
      });
      if (!res.ok) throw new Error("Failed to toggle include status");
      return res.json();
    },
    update: async (id: number, data: any) => {
      const res = await fetch(`${API_BASE}/api/papers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update paper");
      return res.json();
    },
    extract: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/papers/${id}/extract`, { method: "POST" });
      if (!res.ok) throw new Error("AI Extraction failed");
      return res.json();
    },
    bulkExtract: async (projectId: number, data: any) => {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/papers/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Bulk AI Extraction failed");
      return res.json();
    },
    bulkInclude: async (projectId: number, data: any) => {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/papers/bulk-include`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Bulk include failed");
      return res.json();
    },
    bulkKeywords: async (projectId: number, data: any) => {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/papers/bulk-keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Bulk keyword assignment failed");
      return res.json();
    }
  },
  search: {
    execute: async (projectId: number, query: string, mode: string = "standard", yearMin?: number, yearMax?: number, limit?: number) => {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode,
          year_min: yearMin,
          year_max: yearMax,
          limit_per_source: limit
        }),
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    }
  },
  keywords: {
    list: async () => {
      const res = await fetch(`${API_BASE}/api/keywords`);
      if (!res.ok) throw new Error("Failed to fetch keywords");
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE}/api/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create keyword");
      return res.json();
    },
    update: async (id: number, data: any) => {
      const res = await fetch(`${API_BASE}/api/keywords/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update keyword");
      return res.json();
    },
    delete: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/keywords/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete keyword");
    }
  }
};
