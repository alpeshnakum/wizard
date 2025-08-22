import React from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { shallow } from 'zustand/shallow';
import { Layers, Route, Package, Truck } from 'lucide-react';
import { WIZARD_STEPS } from '../../../constants/wizardConfig';

const MapPanel: React.FC = () => {
  const { currentStepId, projectData } = useWizardStore(state => ({
    currentStepId: state.project ? WIZARD_STEPS[state.project.currentStepIndex]?.id : 'jobs',
    projectData: state.project?.projectData, // Can be undefined initially
  }), shallow);

  const getStepInfo = () => {
    switch (currentStepId) {
      case 'jobs':
        return { icon: Package, title: 'Data Configuration', description: 'Configure job data and material types.' };
      case 'fleet':
        return { icon: Truck, title: 'Fleet Setup', description: 'Define vehicle capacities and depot locations.' };
      case 'boundaries':
      case 'collectionSettings':
        return { icon: Layers, title: 'Defining Constraints', description: 'Draw boundaries and define road rules.' };
      case 'summary':
      case 'areas':
      default:
        return { icon: Route, title: 'Route Preview', description: 'Review settings and view results.' };
    }
  };

  const { icon: Icon, title, description } = getStepInfo();

  // THE FIX IS HERE: Add fallbacks for projectData properties
  const projectName = projectData?.name || '...';
  const material = projectData?.selectedMaterial || 'N/A';
  const vehicles = projectData?.maxVehicles || 'N/A';

  return (
    <div className="flex-1 bg-gray-100 h-full">
      <div className="h-full flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10 space-y-4 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-sm">
                <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-full"><Icon className="w-8 h-8 text-blue-600" /></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
                <div className="mt-4 pt-4 border-t border-gray-200 text-left space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Project:</span><span className="font-medium text-gray-700">{projectName}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Material:</span><span className="font-medium text-gray-700 capitalize">{material}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Vehicles:</span><span className="font-medium text-gray-700">{vehicles}</span></div>
                </div>
            </div>
        </div>

        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-1 space-y-1">
            <button className="p-2 hover:bg-gray-100 rounded" aria-label="Zoom in"><span className="text-lg font-bold text-gray-700">+</span></button>
            <button className="p-2 hover:bg-gray-100 rounded" aria-label="Zoom out"><span className="text-lg font-bold text-gray-700">-</span></button>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;