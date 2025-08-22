import React, { useMemo } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { shallow } from 'zustand/shallow';
import { WIZARD_STEPS } from '../../../constants/wizardConfig';
import { Check } from 'lucide-react';
import { ProjectData } from '../../../lib/graphql/api';

interface WizardStepIndicatorProps {
  liveProjectData: Partial<ProjectData>;
}

const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({ liveProjectData }) => {
  const { currentStepIndex } = useWizardStore(
    state => ({
      currentStepIndex: state.project?.currentStepIndex || 0,
    }),
    shallow
  );

  const visibleSteps = WIZARD_STEPS.filter(step => !step.isHidden);

  const processedSteps = useMemo(() => {
    const currentStep = WIZARD_STEPS[currentStepIndex];
    let visualActiveStepId = currentStep?.id;
    if (currentStep?.id === 'save-tour' || currentStep?.id === 'route-settings') {
      visualActiveStepId = 'areas';
    }
    
    const currentOriginalApplicableIndex = WIZARD_STEPS.slice(0, currentStepIndex + 1)
      .filter(s => s.isApplicable(liveProjectData))
      .findIndex(s => s.id === visualActiveStepId);

    return visibleSteps.map((step, index) => {
      const isApplicable = step.isApplicable(liveProjectData);
      const originalStepIndex = WIZARD_STEPS.findIndex(s => s.id === step.id);
      const thisApplicableIndex = WIZARD_STEPS.slice(0, originalStepIndex + 1)
        .filter(s => s.isApplicable(liveProjectData) && !s.isHidden)
        .length - 1;

      const isCompleted = isApplicable && thisApplicableIndex < currentOriginalApplicableIndex;
      const isCurrent = isApplicable && step.id === visualActiveStepId;
      
      let statusClasses;
      if (!isApplicable) {
        statusClasses = { iconContainer: 'border-gray-300 bg-gray-50', iconText: 'text-gray-300', labelText: 'text-gray-400 italic' };
      } else if (isCurrent) {
        statusClasses = { iconContainer: 'bg-blue-600 border-blue-600', iconText: 'text-white', labelText: 'text-blue-600 font-bold' };
      } else if (isCompleted) {
        statusClasses = { iconContainer: 'bg-emerald-500 border-emerald-500', iconText: 'text-white', labelText: 'text-emerald-600' };
      } else {
        statusClasses = { iconContainer: 'border-gray-400', iconText: 'text-gray-400', labelText: 'text-gray-500' };
      }
      
      return {
        ...step,
        displayIndex: index + 1,
        isApplicable,
        isCompleted,
        isCurrent,
        statusClasses,
      };
    });
  }, [currentStepIndex, liveProjectData, visibleSteps]);

  return (
    <nav aria-label="Wizard progress">
      <ol className="flex flex-wrap items-center gap-x-12 gap-y-4">
        {processedSteps.map((step) => (
          <li key={step.id} className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border text-sm font-medium transition-colors duration-300 ${step.statusClasses.iconContainer}`}
              aria-current={step.isCurrent ? 'step' : undefined}
            >
              {step.isCompleted ? (
                <Check className={`w-4 h-4 ${step.statusClasses.iconText}`} />
              ) : (
                <span className={step.statusClasses.iconText}>{step.displayIndex}</span>
              )}
            </div>
            <span className={`text-sm transition-colors duration-300 ${step.statusClasses.labelText}`}>
              {step.title}
              {!step.isApplicable && <span className="ml-1 text-xs">(N/A)</span>}
            </span>
          </li>
        ))}
      </ol> {/* <-- THIS IS THE FIX: Changed from ol> to </ol> */}
    </nav>
  );
};

export default WizardStepIndicator;