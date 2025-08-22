import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import debounce from "lodash.debounce";
import * as api from "../lib/graphql/api";
import {
  Project,
  ProjectData,
  DataSource,
  ClusterResult,
} from "../lib/graphql/api";
import { WIZARD_STEPS } from "../constants/wizardConfig";

// ==================================================================
// == THIS IS THE FIX ==
// ==================================================================
// The function is now exported so other files can import and use it.
export function deepEqual(a: any, b: any): boolean {
  // ==================================================================
  if (a === b) return true;
  if (a == null || b == null || typeof a !== "object" || typeof b !== "object")
    return a === b;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let key of keysA)
    if (!b.hasOwnProperty(key) || !deepEqual(a[key], b[key])) return false;
  return true;
}

export interface UploadedFile {
  file?: File;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "success" | "error";
  error?: string;
  rowCount?: number;
}

export interface WizardControlsProps {
  onBack?: () => void;
  onNext?: () => void;
  backText?: string;
  nextText?: string;
  isNextDisabled?: boolean;
}

type WizardStatus = "idle" | "loading" | "error" | "success" | "submitting";
export type ModalStep = null;

interface WizardState {
  status: WizardStatus;
  error: string | null;
  project: Project | null;
  isSaving: boolean;
  pendingSave: boolean;
  activeModalStep: ModalStep;
  selectedClusterId: string | null;
  selectedClusterName: string | null;
  footerOverrides: WizardControlsProps | null;
  showConfirmBack: boolean;
  hasChangedSinceBack: boolean;
  projectDataSnapshot: Partial<ProjectData> | null;
}

interface WizardActions {
  reset: () => void;
  initializeProject: (initialData: {
    projectId: string;
    name: string;
    dataSource?: DataSource;
  }) => Promise<void>;
  updateProjectData: (data: Partial<ProjectData>) => void;
  flushChanges: () => Promise<void>;
  goToStep: (stepIndex: number) => Promise<void>;
  goToNextStep: (liveData?: Partial<ProjectData>) => Promise<void>;
  goToPreviousStep: (liveData?: Partial<ProjectData>) => Promise<void>;
  openModal: (step: ModalStep) => void;
  closeModal: () => void;
  calculateClusters: () => Promise<void>;
  startSaveTourFlow: (clusterId: string) => void;
  cancelSaveTour: () => void;
  saveTour: (formData: any) => Promise<void>;
  setFooterOverrides: (overrides: WizardControlsProps | null) => void;
  startRouteSettingsFlow: (clusterId: string, clusterName: string) => void;
  cancelRouteSettings: () => void;
  saveRouteSettings: (formData: any) => Promise<void>;
  setShowConfirmBack: (show: boolean) => void;
  setHasChangedSinceBack: (has: boolean) => void;
}

const initialState: WizardState = {
  status: "idle",
  error: null,
  project: null,
  isSaving: false,
  pendingSave: false,
  activeModalStep: null,
  selectedClusterId: null,
  selectedClusterName: null,
  footerOverrides: null,
  showConfirmBack: false,
  hasChangedSinceBack: false,
  projectDataSnapshot: null,
};

export const useWizardStore = create<WizardState & WizardActions>()(
  immer((set, get) => {
    const _saveProject = async (): Promise<void> => {
      const { project, isSaving } = get();
      if (!project || isSaving) return;

      set({ isSaving: true });
      try {
        const projectToSave = JSON.parse(JSON.stringify(project));
        if (projectToSave.projectData?.uploadedFile) {
          delete projectToSave.projectData.uploadedFile.file;
        }
        await api.updateProject(project.id, {
          currentStepIndex: projectToSave.currentStepIndex,
          projectData: projectToSave.projectData,
        });
        set({ pendingSave: false });
      } catch (err: any) {
        set({ error: err.message || "Failed to save progress." });
      } finally {
        set({ isSaving: false });
      }
    };

    const debouncedSave = debounce(_saveProject, 1500);

    return {
      ...initialState,
      reset: () => set(initialState),
      initializeProject: async ({ projectId }) => {
        set({ status: "loading", error: null, project: null });
        try {
          const project = await api.fetchProject(projectId);
          if (!project) {
            throw new Error(`Project with ID ${projectId} could not be found.`);
          }
          set({ project, status: "success" });
        } catch (err: any) {
          set({
            status: "error",
            error: err.message || "Could not load project.",
          });
        }
      },
      updateProjectData: (data) => {
        const currentState = get();
        if (!currentState.project) return;

        const potentialNewData = {
          ...currentState.project.projectData,
          ...data,
        };

        if (deepEqual(currentState.project.projectData, potentialNewData)) {
          return;
        }

        set((state) => {
          if (state.project) {
            // Create a new object to avoid read-only property assignment
            const newProjectData = { ...state.project.projectData, ...data };

            // Handle the uploadedFile.file property separately to avoid read-only issues
            if (data.uploadedFile) {
              newProjectData.uploadedFile = {
                ...data.uploadedFile,
                file:
                  data.uploadedFile.file ||
                  state.project.projectData.uploadedFile?.file,
              };
            }

            state.project.projectData = newProjectData;
            state.pendingSave = true;

            if (
              state.project.currentStepIndex < 5 &&
              state.projectDataSnapshot
            ) {
              if (
                !deepEqual(state.project.projectData, state.projectDataSnapshot)
              ) {
                state.hasChangedSinceBack = true;
                if (state.project.projectData.clusteringResults) {
                  state.project.projectData.clusteringResults = undefined;
                  state.project.projectData.isPlanning = false;
                }
              }
            }
          }
        });

        debouncedSave();
      },
      flushChanges: async () => {
        debouncedSave.cancel();
        if (get().pendingSave) {
          await _saveProject();
        }
      },
      goToStep: async (stepIndex) => {
        await get().flushChanges();
        const { project } = get();
        if (!project || stepIndex < 0 || stepIndex >= WIZARD_STEPS.length)
          return;
        const updatedProjectState = { ...project, currentStepIndex: stepIndex };
        set((state) => {
          if (state.project) {
            state.project.currentStepIndex = stepIndex;
          }
          if (stepIndex === 5) {
            state.projectDataSnapshot = JSON.parse(
              JSON.stringify(state.project?.projectData)
            );
          }
        });
        try {
          await api.updateProject(updatedProjectState.id, {
            currentStepIndex: updatedProjectState.currentStepIndex,
          });
        } catch (error) {
          console.error("Failed to save step navigation:", error);
        }
      },
      goToNextStep: async (liveData) => {
        const { project } = get();
        if (!project) return;

        const dataForApplicabilityCheck = liveData || project.projectData;

        let nextIndex = project.currentStepIndex + 1;
        while (nextIndex < WIZARD_STEPS.length) {
          const nextStep = WIZARD_STEPS[nextIndex];
          if (
            !nextStep.isHidden &&
            nextStep.isApplicable(dataForApplicabilityCheck)
          ) {
            await get().goToStep(nextIndex);
            return;
          }
          nextIndex++;
        }
      },
      goToPreviousStep: async (liveData) => {
        const { project } = get();
        if (!project) return;

        if (project.currentStepIndex === 5) {
          get().setHasChangedSinceBack(false);
        }

        const dataForApplicabilityCheck = liveData || project.projectData;

        let prevIndex = project.currentStepIndex - 1;
        while (prevIndex >= 0) {
          const prevStep = WIZARD_STEPS[prevIndex];
          if (
            !prevStep.isHidden &&
            prevStep.isApplicable(dataForApplicabilityCheck)
          ) {
            await get().goToStep(prevIndex);
            return;
          }
          prevIndex--;
        }
      },
      openModal: (step) => set({ activeModalStep: step }),
      closeModal: () => set({ activeModalStep: null }),
      calculateClusters: async () => {
        await get().flushChanges();
        const { project } = get();
        if (!project) return;
        get().updateProjectData({
          isPlanning: true,
          planningProgress: { step: "start" },
        });
        try {
          const results = await api.calculateAreas(project, (progress) => {
            set((draft) => {
              if (draft.project) {
                draft.project.projectData.planningProgress = {
                  step: progress.step,
                };
              }
            });
          });
          get().updateProjectData({
            clusteringResults: results,
            isPlanning: false,
          });
        } catch (err: any) {
          set({
            status: "error",
            error: err.message || "Failed to calculate clusters.",
          });
          get().updateProjectData({ isPlanning: false });
        }
      },
      startSaveTourFlow: (clusterId: string) => {
        const stepIndex = WIZARD_STEPS.findIndex(
          (step) => step.id === "save-tour"
        );
        if (stepIndex === -1) return;
        set({ selectedClusterId: clusterId });
        get().goToStep(stepIndex);
      },
      cancelSaveTour: () => {
        const stepIndex =
          WIZARD_STEPS.findIndex((step) => step.id === "areas") ?? 0;
        set({ selectedClusterId: null, selectedClusterName: null });
        get().goToStep(stepIndex);
      },
      saveTour: async (formData) => {
        console.log("Saving tour...", formData);
        get().cancelSaveTour();
      },
      setFooterOverrides: (overrides) => set({ footerOverrides: overrides }),
      startRouteSettingsFlow: (clusterId, clusterName) => {
        const stepIndex = WIZARD_STEPS.findIndex(
          (step) => step.id === "route-settings"
        );
        if (stepIndex === -1) return;
        set({ selectedClusterId: clusterId, selectedClusterName: clusterName });
        get().goToStep(stepIndex);
      },
      cancelRouteSettings: () => {
        const stepIndex =
          WIZARD_STEPS.findIndex((step) => step.id === "areas") ?? 0;
        set({ selectedClusterId: null, selectedClusterName: null });
        get().goToStep(stepIndex);
      },
      saveRouteSettings: async (formData) => {
        const { selectedClusterId } = get();
        console.log(
          `Saving settings for cluster ${selectedClusterId}...`,
          formData
        );
        alert("Route Settings Saved!");
        get().cancelRouteSettings();
      },
      setShowConfirmBack: (show) => set({ showConfirmBack: show }),
      setHasChangedSinceBack: (has) => set({ hasChangedSinceBack: has }),
    };
  })
);

export const selectCurrentStep = (state: WizardState & WizardActions) => {
  if (!state.project) return null;
  return WIZARD_STEPS[state.project.currentStepIndex] || null;
};
