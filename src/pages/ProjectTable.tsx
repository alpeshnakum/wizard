import React, { useState } from 'react';
import { Calendar, MapPin, Trash2, Package, Loader2, Play } from 'lucide-react'; // <-- ADD Play ICON
import type { Project } from '../types';

interface ProjectTableProps {
  projects: Project[];
  onDeleteProject: (projectId: string) => void;
  onResumeProject: (project: { id: string; name: string }) => void; // <-- ADD THIS PROP
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onDeleteProject, onResumeProject }) => { // <-- ACCEPT PROP
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');

  const getStatusBadge = (status: 'Finished' | 'In Progress') => {
    if (status === 'Finished') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          Finished
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        In Progress
        <Loader2 className="ml-1.5 w-3 h-3 animate-spin text-amber-800" />
      </span>
    );
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleDeleteClick = (projectId: string, projectName: string) => {
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (selectedProjectId) {
      onDeleteProject(selectedProjectId);
    }
    setShowDeleteConfirm(false);
    setSelectedProjectId(null);
    setSelectedProjectName('');
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedProjectId(null);
    setSelectedProjectName('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project Name
              </th>
              <th scope="col" className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material
              </th>
              <th scope="col" className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Addresses
              </th>
              <th scope="col" className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bins
              </th>
              <th scope="col" className="w-[12%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="w-[12%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Update
              </th>
              <th scope="col" className="w-[11%] relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* --- MODIFICATION START: Make project name a link for resuming --- */}
                  <button
                    onClick={() => onResumeProject({ id: project.id, name: project.name })}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                  >
                    {project.name}
                  </button>
                  {/* --- MODIFICATION END --- */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(project.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-900 truncate">{project.materialLabel}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-900">{project.numberOfAddresses.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{project.numberOfBins.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-900">{formatDate(project.createdAt)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-900">{formatDate(project.lastUpdate)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {/* --- MODIFICATION START: Add a Resume button for "In Progress" projects --- */}
                  {project.status === 'In Progress' && (
                    <button
                      onClick={() => onResumeProject({ id: project.id, name: project.name })}
                      className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-1"
                      aria-label={`Resume project ${project.name}`}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {/* --- MODIFICATION END --- */}
                  <button
                    onClick={() => handleDeleteClick(project.id, project.name)}
                    className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1"
                    aria-label={`Delete project ${project.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" aria-modal="true" role="dialog">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete the project "{selectedProjectName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTable;