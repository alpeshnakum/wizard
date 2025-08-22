import React, { useState, useEffect } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { shallow } from 'zustand/shallow';
import { Loader2, CheckCircle } from 'lucide-react';

interface WizardHeaderProps {
  onExit: () => void;
}

const WizardHeader: React.FC<WizardHeaderProps> = ({ onExit }) => {
  const { projectName, isSaving, pendingSave } = useWizardStore(
    state => ({
      projectName: state.project?.projectData.name || 'Loading Project...',
      isSaving: state.isSaving,
      pendingSave: state.pendingSave,
    }),
    shallow
  );
  
  // This state is used to briefly show "Saved!" after a save completes.
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  // This state tracks if a save was in progress to correctly trigger the confirmation.
  const [wasSaving, setWasSaving] = useState(false);

  useEffect(() => {
    // If saving begins, set wasSaving to true.
    if (isSaving) {
      setWasSaving(true);
    }

    // If saving has just finished (wasSaving is true but isSaving is now false),
    // and there are no more pending changes, then show the "Saved" confirmation.
    if (wasSaving && !isSaving && !pendingSave) {
      setShowSavedConfirmation(true);
      setWasSaving(false); // Reset for the next save cycle.
      const timer = setTimeout(() => {
        setShowSavedConfirmation(false);
      }, 2000); // Show for 2 seconds.
      return () => clearTimeout(timer);
    }
  }, [isSaving, pendingSave, wasSaving]);

  const getSaveStatus = () => {
    // Priority 1: A save is actively in progress.
    if (isSaving) {
      return <><Loader2 className="w-4 h-4 animate-spin mr-2" /><span>Saving...</span></>;
    }
    // Priority 2: A save just completed.
    if (showSavedConfirmation) {
      return <><CheckCircle className="w-4 h-4 text-green-500 mr-2" /><span>Saved</span></>;
    }
    // Priority 3: There are detected changes that have not yet been saved.
    if (pendingSave) {
        return <span className="italic">Unsaved changes</span>;
    }
    // Default state: Everything is saved and up to date.
    return <><CheckCircle className="w-4 h-4 text-gray-400 mr-2" /><span>Up to date</span></>;
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onExit} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Projects</button>
          <span className="text-gray-400">&gt;</span>
          <h1 className="text-base font-semibold text-gray-900 truncate" title={projectName}>{projectName}</h1>
        </div>
        <div className="flex items-center gap-4">
            {/* The status indicator is now the only UI needed for saving. */}
            <div className="text-sm text-gray-600 flex items-center w-36 justify-end" aria-live="polite">
              {getSaveStatus()}
            </div>
        </div>
      </div>
    </header>
  );
};

export default WizardHeader;