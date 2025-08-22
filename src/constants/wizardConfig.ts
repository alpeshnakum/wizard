import React from 'react';

import Step1_Jobs from '../components/wizards/shared/steps/Step1_Jobs';
import Step2_Fleet from '../components/wizards/shared/steps/Step2_Fleet';
import Step3_Boundaries from '../components/wizards/shared/steps/Step3_Boundaries';
import Step4_CollectionSettings from '../components/wizards/shared/steps/Step4_CollectionSettings';
import Step5_Summary from '../components/wizards/shared/steps/Step5_Summary';
import Step6_Areas from '../components/wizards/shared/steps/Step6_Areas';
import SaveTourStep from '../components/wizards/shared/steps/SaveTourStep';
import RouteSettingsStep from '../components/wizards/shared/steps/RouteSettingsStep';

import { ProjectData } from '../lib/graphql/api';
import { DEFAULT_PROJECT_DATA } from './defaults';

export interface StepConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  fields: (keyof ProjectData)[];
  isApplicable: (data: Partial<ProjectData>) => boolean;
  isHidden?: boolean;
  hideControls?: boolean;
}

export const WIZARD_STEPS: StepConfig[] = [
  { id: 'jobs', title: 'Jobs', component: Step1_Jobs, fields: ['selectedMaterial', 'customMaterialName', 'geographicArea', 'uploadedFile', 'selectedTours'], isApplicable: () => true },
  { id: 'fleet', title: 'Fleet', component: Step2_Fleet, fields: ['vehicleType', 'maxVehicles', 'startDepot', 'recycler'], isApplicable: () => true },
  { id: 'boundaries', title: 'Boundaries', component: Step3_Boundaries, fields: [], isApplicable: (data) => (data.maxVehicles ?? DEFAULT_PROJECT_DATA.maxVehicles!) > 1 },
  { id: 'collectionSettings', title: 'Collection Settings', component: Step4_CollectionSettings, fields: [], isApplicable: (data) => (data.vehicleType ?? DEFAULT_PROJECT_DATA.vehicleType!) !== 'sideloader' },
  { id: 'summary', title: 'Summary', component: Step5_Summary, fields: [], isApplicable: () => true },
  { id: 'areas', title: 'Areas & Routes', component: Step6_Areas, fields: [], isApplicable: () => true },
  { id: 'save-tour', title: 'Save Tour', component: SaveTourStep, fields: [], isApplicable: () => true, isHidden: true, hideControls: false },
  { id: 'route-settings', title: 'Route Settings', component: RouteSettingsStep, fields: [], isApplicable: () => true, isHidden: true, hideControls: false },
];