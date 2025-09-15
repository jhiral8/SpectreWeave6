'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Types
interface Project {
  id: string;
  title: string;
  description?: string;
  lastModified: Date;
  created: Date;
  collaborators?: string[];
  tags?: string[];
  status: 'draft' | 'in-progress' | 'completed' | 'published';
  wordCount?: number;
  folder?: string;
}

interface ProjectContextState {
  projects: Project[];
  filteredProjects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    status: string[];
    dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
    collaborators: string[];
    tags: string[];
  };
}

// Actions
type ProjectAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_FILTERED_PROJECTS'; payload: Project[] }
  | { type: 'SET_SELECTED_PROJECT'; payload: Project | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<ProjectContextState['filters']> }
  | { type: 'CLEAR_FILTERS' };

// Initial state
const initialState: ProjectContextState = {
  projects: [],
  filteredProjects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filters: {
    status: [],
    dateRange: 'all',
    collaborators: [],
    tags: []
  }
};

// Reducer
function projectReducer(state: ProjectContextState, action: ProjectAction): ProjectContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload, isLoading: false, error: null };
    
    case 'SET_FILTERED_PROJECTS':
      return { ...state, filteredProjects: action.payload };
    
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProject: action.payload };
    
    case 'ADD_PROJECT':
      const newProjects = [...state.projects, action.payload];
      return { ...state, projects: newProjects };
    
    case 'UPDATE_PROJECT':
      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.id
          ? { ...project, ...action.payload.updates, lastModified: new Date() }
          : project
      );
      return { ...state, projects: updatedProjects };
    
    case 'DELETE_PROJECT':
      const remainingProjects = state.projects.filter(project => project.id !== action.payload);
      return {
        ...state,
        projects: remainingProjects,
        selectedProject: state.selectedProject?.id === action.payload ? null : state.selectedProject
      };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'CLEAR_FILTERS':
      return {
        ...state,
        searchQuery: '',
        filters: {
          status: [],
          dateRange: 'all',
          collaborators: [],
          tags: []
        }
      };
    
    default:
      return state;
  }
}

// Context
interface ProjectContextValue {
  state: ProjectContextState;
  actions: {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    loadProjects: () => Promise<void>;
    setFilteredProjects: (projects: Project[]) => void;
    selectProject: (project: Project | null) => void;
    createProject: (project: Omit<Project, 'id' | 'created' | 'lastModified'>) => Promise<Project>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
    setFilters: (filters: Partial<ProjectContextState['filters']>) => void;
    clearFilters: () => void;
    refreshProjects: () => Promise<void>;
  };
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

// Provider component
interface ProjectContextProviderProps {
  children: React.ReactNode;
  initialProjects?: Project[];
}

export const ProjectContextProvider: React.FC<ProjectContextProviderProps> = ({
  children,
  initialProjects = []
}) => {
  const [state, dispatch] = useReducer(projectReducer, {
    ...initialState,
    projects: initialProjects,
    filteredProjects: initialProjects
  });

  // Mock API functions (replace with real API calls)
  const loadProjects = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API call
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'My First Novel',
          description: 'An epic fantasy adventure',
          status: 'in-progress',
          created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          wordCount: 15420,
          tags: ['fantasy', 'novel'],
          collaborators: ['Alice', 'Bob']
        },
        {
          id: '2',
          title: 'Blog Post Ideas',
          description: 'Collection of blog post concepts',
          status: 'draft',
          created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          wordCount: 2340,
          tags: ['blog', 'ideas']
        }
      ];

      dispatch({ type: 'SET_PROJECTS', payload: mockProjects });
      dispatch({ type: 'SET_FILTERED_PROJECTS', payload: mockProjects });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load projects' });
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'created' | 'lastModified'>): Promise<Project> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newProject: Project = {
        ...projectData,
        id: Date.now().toString(),
        created: new Date(),
        lastModified: new Date()
      };

      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return newProject;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create project' });
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update project' });
    }
  };

  const deleteProject = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch({ type: 'DELETE_PROJECT', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete project' });
    }
  };

  // Load projects on mount
  useEffect(() => {
    if (initialProjects.length === 0) {
      loadProjects();
    }
  }, []);

  const contextValue: ProjectContextValue = {
    state,
    actions: {
      setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
      setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
      loadProjects,
      setFilteredProjects: (projects: Project[]) => dispatch({ type: 'SET_FILTERED_PROJECTS', payload: projects }),
      selectProject: (project: Project | null) => dispatch({ type: 'SET_SELECTED_PROJECT', payload: project }),
      createProject,
      updateProject,
      deleteProject,
      setSearchQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
      setFilters: (filters: Partial<ProjectContextState['filters']>) => dispatch({ type: 'SET_FILTERS', payload: filters }),
      clearFilters: () => dispatch({ type: 'CLEAR_FILTERS' }),
      refreshProjects: loadProjects
    }
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

// Hook to use project context
export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectContextProvider');
  }
  return context;
};

// Export types for external use
export type { Project, ProjectContextState };