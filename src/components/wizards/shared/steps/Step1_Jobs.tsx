import React from 'react';
import { useWizardStore } from '../../../../store/wizardStore';
import { Loader2 } from 'lucide-react';

// Import the specialized step components we've built
import Step1_Jobs_CSV from './Step1_Jobs_CSV';
import Step1_Jobs_AI from './Step1_Jobs_AI';
import Step1_Jobs_Existing from './Step1_Jobs_Existing';

/**
 * Step 1: Jobs - Dispatcher Component
 *
 * This component acts as a router or dispatcher for the first step of the wizard.
 * It reads the `dataSource` from the project's data (which was set during project creation)
 * and dynamically renders the appropriate specialized "Jobs" component (CSV, AI, or Existing).
 *
 * This pattern keeps the wizard configuration simple while allowing for complex,
 * specialized UI for each data source type.
 */
const Step1_Jobs: React.FC = () => {
  // Select the dataSource from the project data in the Zustand store.
  const dataSource = useWizardStore(state => state.project?.projectData.dataSource);

  // Render the correct component based on the dataSource.
  switch (dataSource) {
    case 'csv':
      return <Step1_Jobs_CSV />;
    case 'ai-generate':
      return <Step1_Jobs_AI />;
    case 'existing':
      return <Step1_Jobs_Existing />;
    
    // Default case handles the initial loading state or any unexpected values.
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Loading data source...</p>
        </div>
      );
  }
};

export default Step1_Jobs;