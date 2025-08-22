import React from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { useDebounce } from 'use-debounce';
import { useWizardStore, selectCurrentStep } from '../../store/wizardStore';
import { ProjectData } from '../../lib/graphql/api';
import { DataSource } from '../../types';
import { deepEqual } from '../../store/wizardStore';
import { DEFAULT_PROJECT_DATA } from '../../constants/defaults';
import WizardHeader from './shared/WizardHeader';
import WizardStepIndicator from './shared/WizardStepIndicator';
import WizardControls from './shared/WizardControls';
import MapPanel from './shared/MapPanel';
import { Spinner } from './shared/common/Spinner';
import { ErrorDisplay } from './shared/common/ErrorDisplay';
import { ConfirmationModal } from './shared/common/ConfirmationModal';

interface WizardProps {
  projectName: string;
  projectId: string;
  onExit: () => void;
  dataSource: DataSource;
}

const FormSync: React.FC = () => {
  const { watch, formState, reset } = useFormContext<ProjectData>();
  const { project, updateProjectData } = useWizardStore(state => ({
    project: state.project,
    updateProjectData: state.updateProjectData,
  }));

  const lastSyncedDataRef = React.useRef<Partial<ProjectData> | null>(null);
  const watchedValues = watch();
  const [debouncedValues] = useDebounce(watchedValues, 1000);

  React.useEffect(() => {
    if (formState.isDirty) {
      updateProjectData(debouncedValues);
    }
  }, [debouncedValues, formState.isDirty, updateProjectData]);

  React.useEffect(() => {
    const storeData = project?.projectData;
    if (storeData && !formState.isDirty) {
      if (!deepEqual(storeData, lastSyncedDataRef.current)) {
        reset(storeData);
        lastSyncedDataRef.current = storeData;
      }
    }
  }, [project?.projectData, formState.isDirty, reset]);

  return null;
};

const Wizard: React.FC<WizardProps> = ({ projectName, projectId, onExit, dataSource }) => {
  const {
    status,
    error,
    project,
    activeModalStep,
    initializeProject,
    reset: resetStore,
    goToNextStep,
    goToPreviousStep,
    calculateClusters,
    footerOverrides,
    showConfirmBack,
    setShowConfirmBack,
    hasChangedSinceBack,
    flushChanges,
  } = useWizardStore(state => ({
    status: state.status,
    error: state.error,
    project: state.project,
    activeModalStep: state.activeModalStep,
    initializeProject: state.initializeProject,
    reset: state.reset,
    goToNextStep: state.goToNextStep,
    goToPreviousStep: state.goToPreviousStep,
    calculateClusters: state.calculateClusters,
    footerOverrides: state.footerOverrides,
    showConfirmBack: state.showConfirmBack,
    setShowConfirmBack: state.setShowConfirmBack,
    hasChangedSinceBack: state.hasChangedSinceBack,
    flushChanges: state.flushChanges,
  }));
  
  const isPlanning = project?.projectData?.isPlanning || false;
  const currentStepConfig = useWizardStore(selectCurrentStep);
  const methods = useForm<ProjectData>({ mode: 'onChange', defaultValues: DEFAULT_PROJECT_DATA });
  const liveProjectData = methods.watch();

  React.useEffect(() => {
    initializeProject({ projectId, name: projectName, dataSource });
    return () => {
      flushChanges();
      resetStore();
    };
  }, [initializeProject, resetStore, projectId, projectName, dataSource, flushChanges]);

  const handleGoToNextStep = () => {
    if (project && project.currentStepIndex === 4) {
      if (!project.projectData.clusteringResults || hasChangedSinceBack) {
        calculateClusters();
      }
    }
    goToNextStep(liveProjectData);
  };
  
  // ==================================================================
  // == THIS IS THE FIX ==
  // ==================================================================
  const handleGoBack = () => {
    // If we are on Step 6 (index 5), ALWAYS show the confirmation modal.
    // The `hasChangedSinceBack` flag is not needed here.
    if (project?.currentStepIndex === 5) {
      setShowConfirmBack(true);
    } else {
      // Otherwise, just navigate back as usual.
      goToPreviousStep(liveProjectData);
    }
  };
  // ==================================================================

  const handleConfirmGoBack = () => {
    goToPreviousStep(liveProjectData);
  };

  const renderContent = () => {
    if (status === 'loading' || status === 'idle' || !project) {
      return <div className="flex items-center justify-center h-full"><Spinner text="Loading Project..." /></div>;
    }
    if (status === 'error') {
      return <ErrorDisplay message={error || 'An unknown error occurred.'} onRetry={() => initializeProject({projectId, name: projectName, dataSource})} />;
    }
    if (!currentStepConfig) {
      return <ErrorDisplay message="Wizard configuration is invalid." />;
    }
    const CurrentStepComponent = currentStepConfig.component;
    return <CurrentStepComponent />;
  };
  
  const renderModalStep = () => { return null; };
  
  const controlsProps: any = { 
    onNext: handleGoToNextStep, 
    onBack: handleGoBack, 
    ...footerOverrides, 
  };
  if (project?.currentStepIndex === 0) { 
    controlsProps.onBack = onExit; 
    controlsProps.backText = 'Close'; 
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <WizardHeader onExit={onExit} />
      <div className="p-6 border-b border-gray-200 bg-white">
        <WizardStepIndicator liveProjectData={liveProjectData} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <FormProvider {...methods}>
          <FormSync />
          <div className="w-[650px] bg-white border-r border-gray-200 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto relative">
              {renderContent()}
            </div>
            {status === 'success' && !activeModalStep && !currentStepConfig?.hideControls && (
                isPlanning ? ( 
                  <div className="p-6 bg-white border-t border-gray-200">
                     <div className="flex space-x-3">
                       <button type="button" onClick={onExit} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Go back to Projects</button>
                     </div>
                  </div>
                 ) 
                : ( <WizardControls {...controlsProps} /> )
            )}
          </div>
        </FormProvider>
        <div className="flex-1 h-full"><MapPanel /></div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmBack}
        onCancel={() => setShowConfirmBack(false)}
        onConfirm={handleConfirmGoBack}
        title="Go Back to Previous Step?"
        message="Going back will clear your calculated results and you may need to re-calculate them. Are you sure you want to continue?"
        confirmText="Continue"
        cancelText="Stay Here"
        type="warning"
      />
    </div>
  );
};

export default Wizard;