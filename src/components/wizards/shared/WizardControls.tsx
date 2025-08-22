// src/components/wizards/shared/WizardControls.tsx

import React from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { Save } from 'lucide-react'; // Assuming you want the save icon

interface WizardControlsProps {
  onBack?: () => void;
  onNext?: () => void;
  backText?: string;
  nextText?: string;
  isNextDisabled?: boolean;
}

const WizardControls: React.FC<WizardControlsProps> = ({
  onBack,
  onNext,
  backText = 'Back',
  nextText = 'Next',
  isNextDisabled = false,
}) => {
  const { goToPreviousStep, project } = useWizardStore(state => ({
    goToPreviousStep: state.goToPreviousStep,
    project: state.project,
  }));

  const isFirstStep = project?.currentStepIndex === 0;

  // Use the provided onBack function, or the store's default action.
  const handleBack = onBack || goToPreviousStep;

  return (
    <div className="p-6 bg-white border-t border-gray-200">
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirstStep && !onBack} // Disable default back on first step
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {backText}
        </button>
        {onNext && ( // Only render the "Next/Save" button if an onNext handler is provided
          <button
            type="button" // Important: type="button" to prevent form submission unless onNext handles it
            onClick={onNext}
            disabled={isNextDisabled}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {nextText === 'Save' && <Save className="w-4 h-4" />}
            {nextText}
          </button>
        )}
      </div>
    </div>
  );
};

export default WizardControls;