"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface ProjectContextType {
  projectId: number | null;
  setProjectId: (id: number) => void;
  projects: any[];
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
  const [projectId, setProjectId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.projects.list(),
  });

  const projects = data?.projects || [];

  useEffect(() => {
    if (projects.length > 0 && projectId === null) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

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
