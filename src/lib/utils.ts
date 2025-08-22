// src/hooks/useDebouncedSave.ts

import { useEffect, useRef } from 'react';
import { useFormContext, FieldValues } from 'react-hook-form';
import { useWizardStore } from '../store/wizardStore';
import { useDebounce } from 'use-debounce';

export const useDebouncedSave = <T extends FieldValues>(delay: number = 1000) => {
  const { watch, formState } = useFormContext<T>();
  const updateProjectData = useWizardStore(state => state.updateProjectData);

  // Watch all form values
  const watchedValues = watch();
  
  // Debounce the watched values
  const [debouncedValues] = useDebounce(watchedValues, delay);

  // Keep track of the initial render to avoid saving on load
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip the very first render cycle
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // ==================================================================
    // == THE FIX IS HERE ==
    // ==================================================================
    // Only trigger a save if the form is "dirty" (i.e., a user has made a change).
    // A programmatic `reset()` does not make the form dirty, which is the key
    // to breaking the infinite loop between the store and the form.
    if (formState.isDirty) {
      updateProjectData(debouncedValues);
    }
  }, [debouncedValues, updateProjectData, formState.isDirty]);
};