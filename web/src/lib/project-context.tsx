"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { ProjectOut } from "@/lib/api/types";

const STORAGE_KEY = "researchbot-project-id";

interface ProjectContextType {
  projectId: number | null;
  setProjectId: (id: number) => void;
  projects: ProjectOut[];
  isLoading: boolean;
  refetchProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType>({
  projectId: null,
  setProjectId: () => {},
  projects: [],
  isLoading: true,
  refetchProjects: () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectIdState] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.projects.list(),
  });

  const projects = data?.projects || [];

  const setProjectId = (id: number) => {
    setProjectIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id.toString());
    } catch {}
  };

  // Restore from localStorage on mount, then sync with fetched projects
  useEffect(() => {
    if (isLoading || initialized) return;

    let storedId: number | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) storedId = parseInt(stored, 10);
    } catch {}

    if (storedId && projects.some((p) => p.id === storedId)) {
      setProjectIdState(storedId);
    } else if (projects.length > 0) {
      setProjectId(projects[0].id);
    }

    setInitialized(true);
  }, [projects, isLoading, initialized]);

  // Handle deleted project: if current projectId is no longer in the list, reset
  useEffect(() => {
    if (!initialized || isLoading || !projectId) return;
    if (projects.length > 0 && !projects.some((p) => p.id === projectId)) {
      setProjectId(projects[0].id);
    } else if (projects.length === 0) {
      setProjectIdState(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }, [projects, projectId, initialized, isLoading]);

  return (
    <ProjectContext.Provider value={{
      projectId,
      setProjectId,
      projects,
      isLoading,
      refetchProjects: refetch,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
