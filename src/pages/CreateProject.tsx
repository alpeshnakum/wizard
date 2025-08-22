// src/pages/CreateProject.tsx

import { useState } from 'react';
import { useForm, Controller, Control } from 'react-hook-form';
import {
  ArrowLeft,
  Upload,
  Database,
  Sparkles,
  MapPin,
  Loader2,
} from 'lucide-react';

import type { NewProject, ProjectType, DataSource } from '../types';
import Wizard from '../components/wizards/Wizard';
import { ReoptimizeSelector } from '../components/wizards/shared/ReoptimizeSelector';
import * as api from '../lib/graphql/api';
import { Project } from '../lib/graphql/api'; // <-- ADD Project IMPORT

interface CreateProjectProps {
  onBack: () => void;
}

const CreateProject: React.FC<CreateProjectProps> = ({ onBack }) => {
  const [isCreating, setIsCreating] = useState(false);
  // --- MODIFICATION: Store the actual created project object ---
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<NewProject>({
    mode: 'onChange',
    shouldUnregister: false,
    defaultValues: {
      name: '',
      type: 'newly-optimize',
      dataSource: 'csv',
      selectedTours: [],
    },
  });

  const projectType = watch('type');
  const projectName = watch('name');

  // --- MODIFICATION: onSubmit now creates the project in the API ---
  const onSubmit = async (data: NewProject) => {
    setIsCreating(true);
    try {
      // 1. Create the project via the API first.
      const newProject = await api.createProject({
        name: data.name,
        dataSource: data.dataSource,
      });
      // 2. Set the returned project object (with a real ID) as active.
      setActiveProject(newProject);
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Error: Could not create the project.");
      setIsCreating(false); // Reset creating state on error
    }
    // No need for finally block, as we navigate away on success
  };

  if (activeProject) {
    return (
      <Wizard
        projectId={activeProject.id} // <-- Pass the REAL project ID
        projectName={activeProject.name}
        dataSource={activeProject.projectData.dataSource!}
        onExit={onBack}
      />
    );
  }

  return (
    <div className="h-full flex">
      <div className="w-[600px] bg-white border-r border-gray-200 flex flex-col">
        <header className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-md" aria-label="Back to projects">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{projectName || 'New Project'}</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
              <input
                id="project-name"
                type="text"
                {...register('name', { 
                  required: 'Project name is required.',
                  maxLength: { value: 50, message: 'Project name cannot exceed 50 characters.'}
                })}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., Q3 Residential Waste Collection"
                aria-invalid={!!errors.name}
              />
              <div className="flex justify-between mt-1 text-xs">
                {errors.name && <span className="text-red-600">{errors.name.message}</span>}
                <span className="text-gray-500 ml-auto">{projectName.length}/50</span>
              </div>
            </div>

            <Controller name="type" control={control} render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Project Type</label>
                <div className="space-y-3">
                  <ProjectTypeOption id="type-newly-optimize" value="newly-optimize" label="Newly Optimize Tours" description="Create optimization from fresh data sources" field={field} />
                  <ProjectTypeOption id="type-reoptimize" value="reoptimize" label="Reoptimize Existing Tours" description="Load and reoptimize existing tour configurations" field={field} />
                </div>
              </div>
            )}/>

            {projectType === 'newly-optimize' && <DataSourceSelector control={control} />}
            {projectType === 'reoptimize' && <ReoptimizeSelector control={control} />}
          </div>

          <footer className="p-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <button type="button" onClick={onBack} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                type="submit"
                disabled={!isValid || isCreating}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
              </button>
            </div>
          </footer>
        </form>
      </div>
      <div className="flex-1 bg-gray-100">
        <div className="h-full flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50"><div className="absolute inset-0 opacity-20"><svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg></div></div>
          <div className="relative z-10 space-y-4 text-center">
            <MapPin className="w-16 h-16 text-blue-600 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900">Map Visualization</h3>
            <p className="text-base text-gray-500 max-w-md">Your selected data and optimization results will be displayed here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components (No changes needed) ---
const ProjectTypeOption = ({ id, value, label, description, field }: { id: string, value: ProjectType, label: string, description: string, field: any }) => (
  <label htmlFor={id} className="flex items-start space-x-3 cursor-pointer">
    <input id={id} type="radio" {...field} value={value} checked={field.value === value} className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
    <div className="flex-1">
      <div className="text-sm font-medium text-gray-900">{label}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </div>
  </label>
);
const DataSourceSelector = ({ control }: { control: Control<NewProject> }) => (
  <Controller
    name="dataSource"
    control={control}
    render={({ field }) => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Data Source</label>
        <div className="space-y-3">
          <DataSourceOption id="source-csv" value="csv" label="Upload from CSV" description="Import data from a CSV file" icon={Upload} field={field} />
          <DataSourceOption id="source-existing" value="existing" label="Choose from Existing Data" description="Select from previously stored data" icon={Database} field={field} />
          <DataSourceOption id="source-ai" value="ai-generate" label="Generate Data with AI" description="Use AI assistance to create data" icon={Sparkles} field={field} isBeta />
        </div>
      </div>
    )}
  />
);
const DataSourceOption = ({ id, value, label, description, icon: Icon, field, isBeta = false }: { id: string, value: DataSource, label: string, description: string, icon: React.ElementType, field: any, isBeta?: boolean }) => (
  <label htmlFor={id} className={`flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${field.value === value ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}>
    <input id={id} type="radio" {...field} value={value} checked={field.value === value} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
    <Icon className={`w-5 h-5 ${value === 'ai-generate' ? 'text-amber-500' : 'text-gray-400'}`} />
    <div className="flex-1">
      <div className="text-sm font-medium text-gray-900 flex items-center">
        {label}
        {isBeta && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Beta</span>}
      </div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  </label>
);

export default CreateProject;