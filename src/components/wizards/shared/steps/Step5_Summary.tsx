import React from 'react';
import { useWizardStore } from '../../../../store/wizardStore';
import { shallow } from 'zustand/shallow';
import { Package, Truck, MapPin, Building, Recycle } from 'lucide-react';

// A selector that pulls only the data needed for this component.
// Using `shallow` comparison prevents re-renders if other parts of the project object change.
const summarySelector = (state: ReturnType<typeof useWizardStore.getState>) => {
  const projectData = state.project?.projectData || {};
  return {
    projectName: projectData.name || 'Untitled Project',
    selectedMaterial: projectData.selectedMaterial,
    customMaterialName: projectData.customMaterialName,
    vehicleType: projectData.vehicleType,
    maxVehicles: projectData.maxVehicles,
    startDepot: projectData.startDepot,
    endDepot: projectData.endDepot,
    differentEndLocation: projectData.differentEndLocation,
    recycler: projectData.recycler,
  };
};

const materialOptions = [
    { id: 'residential', label: 'Residential Waste' },
    { id: 'biogenic', label: 'Biogenic Waste' },
    { id: 'recyclable', label: 'Recyclable Materials' },
    { id: 'commercial', label: 'Commercial Waste' },
    { id: 'other', label: 'Other' },
];

const Step5_Summary: React.FC = () => {
  const {
    projectName,
    selectedMaterial,
    customMaterialName,
    vehicleType,
    maxVehicles,
    startDepot,
    endDepot,
    differentEndLocation,
    recycler,
  } = useWizardStore(summarySelector, shallow);

  const getMaterialLabel = () => {
    if (selectedMaterial === 'other') {
      return customMaterialName || 'Other (Custom)';
    }
    return materialOptions.find(opt => opt.id === selectedMaterial)?.label || 'Not specified';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Calculate</h3>
        {/* === MODIFIED PART START === */}
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          All settings are configured. Click the button below to start generating area clusters.
        </p>
        {/* === MODIFIED PART END === */}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-base font-semibold mb-4 text-gray-800">Configuration Overview</h3>
        <div className="space-y-4">
          <SummaryItem icon={Package} label="Material" value={getMaterialLabel()} />
          <SummaryItem icon={Truck} label="Vehicle Type" value={vehicleType ? `${maxVehicles} x ${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}` : 'Not specified'} />
          <SummaryItem icon={Building} label="Start Depot" value={startDepot || 'Not specified'} />
          {differentEndLocation && (
            <SummaryItem icon={MapPin} label="End Depot" value={endDepot || 'Not specified'} />
          )}
          <SummaryItem icon={Recycle} label="Recycler" value={recycler || 'Not specified'} />
        </div>
      </div>
    </div>
  );
};

// A small, reusable sub-component for consistent summary rows.
interface SummaryItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between pb-2 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center text-sm text-gray-600">
      <Icon className="w-4 h-4 mr-3 text-gray-400" />
      <span>{label}</span>
    </div>
    <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
  </div>
);

export default Step5_Summary;