'use client';

import React from 'react';
import { Plus, FileText, Calendar, Users } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description?: string;
  lastModified: Date;
  collaborators?: number;
  status: 'draft' | 'in-progress' | 'completed' | 'published';
  wordCount?: number;
}

interface ProjectLibrarySectionProps {
  user: any;
  onProjectOpen?: (project: Project) => void;
  onProjectEdit?: (project: Project) => void;
  onProjectDuplicate?: (project: Project) => void;
  onProjectArchive?: (project: Project) => void;
  onProjectDelete?: (project: Project) => void;
  className?: string;
}

const ProjectLibrarySection: React.FC<ProjectLibrarySectionProps> = ({
  user,
  onProjectOpen,
  onProjectEdit,
  onProjectDuplicate,
  onProjectArchive,
  onProjectDelete,
  className = ''
}) => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Mock some projects for now
  React.useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'My First Novel',
        description: 'A thrilling adventure story about courage and friendship.',
        lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        collaborators: 2,
        status: 'in-progress',
        wordCount: 12500
      },
      {
        id: '2',
        title: 'Poetry Collection',
        description: 'A collection of poems inspired by nature and life experiences.',
        lastModified: new Date(Date.now() - 5 * 60 * 60 * 1000),
        collaborators: 0,
        status: 'draft',
        wordCount: 3200
      },
      {
        id: '3',
        title: 'Technical Documentation',
        description: 'Complete guide for the new software system.',
        lastModified: new Date(Date.now() - 1 * 60 * 60 * 1000),
        collaborators: 5,
        status: 'completed',
        wordCount: 25000
      }
    ];
    setProjects(mockProjects);
  }, []);
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
      case 'in-progress':
        return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      case 'completed':
        return 'bg-green-600/20 text-green-300 border-green-500/30';
      case 'published':
        return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-surgena text-white">Project Library</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-slate-800/60 border border-purple-700/30 rounded-lg p-6 ai-neural-border animate-pulse">
              <div className="h-4 bg-purple-600/20 rounded mb-3"></div>
              <div className="h-3 bg-purple-600/20 rounded mb-2"></div>
              <div className="h-3 bg-purple-600/20 rounded mb-4 w-3/4"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-purple-600/20 rounded w-1/3"></div>
                <div className="h-6 bg-purple-600/20 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-surgena text-white">Project Library</h2>
        <button
          onClick={() => console.log('Create new project')}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors ai-confidence-border"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-surgena text-white mb-2">No projects yet</h3>
          <p className="text-purple-300/70 mb-6">Create your first writing project to get started</p>
          <button
            onClick={() => console.log('Create new project')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors ai-confidence-border"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectOpen?.(project)}
              className="bg-slate-800/60 border border-purple-700/30 rounded-lg p-6 hover:bg-slate-700/60 hover:border-purple-600/50 cursor-pointer transition-all ai-neural-border ai-data-flow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-surgena text-white truncate flex-1 mr-2">
                  {project.title}
                </h3>
                <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              
              {project.description && (
                <p className="text-sm text-purple-300/70 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-purple-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(project.lastModified)}</span>
                  </div>
                  
                  {project.collaborators && project.collaborators > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{project.collaborators}</span>
                    </div>
                  )}
                </div>
                
                {project.wordCount && (
                  <div className="text-purple-300/70">
                    {project.wordCount.toLocaleString()} words
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { ProjectLibrarySection };