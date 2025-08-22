import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, Filter, Download, Package, AlertTriangle, Loader2} from 'lucide-react';
import ProjectTable from './ProjectTable';
import type { Project } from '../types';
import * as api from '../lib/graphql/api';

interface TourOptimizationProps {
  onCreateProject: () => void;
  onResumeProject: (project: { id: string; name: string }) => void; // <-- ADD THIS PROP
}

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

const TourOptimization: React.FC<TourOptimizationProps> = ({ onCreateProject, onResumeProject }) => { // <-- ACCEPT PROP
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProjects = useCallback(async () => {
    setStatus('loading');
    try {
      const fetchedProjects = await api.fetchAllProjects();
      setProjects(fetchedProjects);
      setStatus('success');
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error(`Failed to delete project ${projectId}:`, error);
      alert('Failed to delete the project. Please try again.');
    }
  }, []);

  const filteredProjects = useMemo(() => {
    if (!searchTerm) {
      return projects;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    
    return projects.filter(project =>
      (project.name ?? '').toLowerCase().includes(lowercasedFilter) ||
      (project.materialLabel ?? '').toLowerCase().includes(lowercasedFilter)
    );
  }, [projects, searchTerm]);

  const renderContent = () => {
    if (status === 'loading' || status === 'idle') {
      return (
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading Projects...</h3>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-red-900">Failed to Load Projects</h3>
          <p className="mt-1 text-sm text-red-700">There was an error communicating with the server.</p>
          <button
            onClick={fetchProjects}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first project.</p>
        </div>
      );
    }
    
    // Pass the onResumeProject handler down to the ProjectTable
    return <ProjectTable projects={filteredProjects} onDeleteProject={handleDeleteProject} onResumeProject={onResumeProject} />;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tour Optimization</h1>
          <p className="text-gray-600">Manage and optimize your route collection projects.</p>
        </div>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Project
        </button>
      </header>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="project-search" className="sr-only">Search projects</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              id="project-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search projects..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default TourOptimization;