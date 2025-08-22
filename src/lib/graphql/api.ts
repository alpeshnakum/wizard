// Updated api.ts (mock API file)
import { Project, DataSource } from "../../types";
import { DEFAULT_PROJECT_DATA } from "../../constants/defaults"; // <-- ADD THIS IMPORT

const FAKE_LATENCY_MS = 400;
const PROJECTS_STORAGE_KEY = "wizard_projects";
// Add this near the top, close to PROJECTS_STORAGE_KEY
const BOUNDARY_TEMPLATES_KEY = "wizard_boundary_templates";

// Helper functions for templates
const getBoundaryTemplatesFromStorage = (): BoundaryTemplate[] => {
  try {
    return JSON.parse(localStorage.getItem(BOUNDARY_TEMPLATES_KEY) || "[]");
  } catch (error) {
    console.error(
      "Failed to parse boundary templates from localStorage",
      error
    );
    return [];
  }
};

const saveBoundaryTemplatesToStorage = (
  templates: BoundaryTemplate[]
): void => {
  try {
    localStorage.setItem(BOUNDARY_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("Failed to save boundary templates to localStorage", error);
  }
};

const getProjectsFromStorage = (): Record<string, Project> => {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || "{}");
  } catch (error) {
    console.error("Failed to parse projects from localStorage", error);
    return {};
  }
};

const saveProjectsToStorage = (projects: Record<string, Project>): void => {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects to localStorage", error);
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const seedInitialProjects = () => {
  const projectsRaw = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (projectsRaw === null) {
    console.log(
      "[API MOCK] Project storage key not found. Seeding initial data."
    );
    const initialProjects: Record<string, Project> = {
      proj_1720111800000_abcde123: {
        id: "proj_1720111800000_abcde123",
        name: "Downtown Collection Route",
        status: "Finished",
        materialLabel: "Residual Waste",
        numberOfAddresses: 245,
        numberOfBins: 312,
        createdAt: "2024-07-04T16:50:00.000Z",
        lastUpdate: "2024-07-05T10:22:00.000Z",
        currentStepIndex: 5,
        projectData: {
          name: "Downtown Collection Route",
          materialLabel: "Residual Waste",
          numberOfAddresses: 245,
          numberOfBins: 312,
          isPlanning: false,
          planningProgress: { step: "start" },
        },
        isSubmitted: true,
      },
      proj_1720335400000_fghij456: {
        id: "proj_1720335400000_fghij456",
        name: "Suburban Organic Waste",
        status: "In Progress",
        materialLabel: "Biogenic Waste",
        numberOfAddresses: 128,
        numberOfBins: 156,
        createdAt: "2024-07-07T06:56:40.000Z",
        lastUpdate: "2024-07-07T12:15:00.000Z",
        currentStepIndex: 2,
        projectData: {
          name: "Suburban Organic Waste",
          materialLabel: "Biogenic Waste",
          numberOfAddresses: 128,
          numberOfBins: 156,
          isPlanning: false,
          planningProgress: { step: "start" },
        },
        isSubmitted: false,
      },
    };
    saveProjectsToStorage(initialProjects);
  }
};
seedInitialProjects();

export const fetchProject = async (
  projectId: string
): Promise<Project | null> => {
  await sleep(FAKE_LATENCY_MS);
  const allProjects = getProjectsFromStorage();
  return allProjects[projectId] || null;
};

export const createProject = async (
  initialData: Partial<ProjectData>
): Promise<Project> => {
  await sleep(FAKE_LATENCY_MS);
  const newProjectId = `proj_${new Date().getTime()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  const now = new Date().toISOString();
  const newProject: Project = {
    id: newProjectId,
    name: initialData.name || "Untitled Project",
    status: "In Progress",
    materialLabel: "N/A",
    numberOfAddresses: 0,
    numberOfBins: 0,
    createdAt: now,
    lastUpdate: now,
    currentStepIndex: 0,
    projectData: {
      ...DEFAULT_PROJECT_DATA, // <-- START WITH ALL DEFAULTS
      ...initialData, // <-- OVERRIDE WITH SPECIFIC DATA (like the name)
      isPlanning: false,
      planningProgress: { step: "start" },
    },
    isSubmitted: false,
  };
  const allProjects = getProjectsFromStorage();
  allProjects[newProjectId] = newProject;
  saveProjectsToStorage(allProjects);
  return newProject;
};

export const updateProject = async (
  projectId: string,
  updates: Partial<Project>
): Promise<Project> => {
  await sleep(FAKE_LATENCY_MS / 2);
  const allProjects = getProjectsFromStorage();
  if (!allProjects[projectId])
    throw new Error(`Project with ID ${projectId} not found.`);
  const updatedProject = {
    ...allProjects[projectId],
    ...updates,
    projectData: {
      ...allProjects[projectId].projectData,
      ...updates.projectData,
    },
    lastUpdate: new Date().toISOString(),
  };
  allProjects[projectId] = updatedProject;
  saveProjectsToStorage(allProjects);
  return updatedProject;
};

// Create & Save a new boundary template (set)
export const saveBoundaryTemplate = async (
  name: string,
  type: string = "set"
): Promise<BoundaryTemplate> => {
  await sleep(FAKE_LATENCY_MS);
  const templates = getBoundaryTemplatesFromStorage();
  const newTemplate: BoundaryTemplate = {
    id: `bt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    name,
    type,
  };
  const updated = [...templates, newTemplate];
  saveBoundaryTemplatesToStorage(updated);
  return newTemplate;
};

// Fetch all saved templates
export const fetchBoundaryTemplates = async (): Promise<BoundaryTemplate[]> => {
  await sleep(FAKE_LATENCY_MS / 2);
  return getBoundaryTemplatesFromStorage();
};

// Delete a boundary template
export const deleteBoundaryTemplate = async (
  templateId: string
): Promise<{ success: boolean }> => {
  await sleep(FAKE_LATENCY_MS / 2);
  const templates = getBoundaryTemplatesFromStorage();
  const filtered = templates.filter((t) => t.id !== templateId);
  saveBoundaryTemplatesToStorage(filtered);
  return { success: true };
};

export const submitProject = async (
  projectId: string
): Promise<{ success: boolean }> => {
  await sleep(FAKE_LATENCY_MS);
  const allProjects = getProjectsFromStorage();
  if (!allProjects[projectId])
    throw new Error(`Project with ID ${projectId} not found.`);
  allProjects[projectId].isSubmitted = true;
  allProjects[projectId].status = "Finished";
  allProjects[projectId].lastUpdate = new Date().toISOString();
  saveProjectsToStorage(allProjects);
  return { success: true };
};

export const fetchAllProjects = async (): Promise<Project[]> => {
  await sleep(FAKE_LATENCY_MS);
  const allProjects = getProjectsFromStorage();
  return Object.values(allProjects).map((p) => ({
    ...p,
    name: p.projectData.name || p.name || "Untitled Project",
    numberOfAddresses:
      p.projectData.numberOfAddresses || p.numberOfAddresses || 0,
    numberOfBins: p.projectData.numberOfBins || p.numberOfBins || 0,
  }));
};

export const deleteProject = async (
  projectId: string
): Promise<{ success: boolean; deletedId: string }> => {
  await sleep(FAKE_LATENCY_MS);
  const allProjects = getProjectsFromStorage();
  if (!allProjects[projectId]) return { success: false, deletedId: projectId };
  delete allProjects[projectId];
  saveProjectsToStorage(allProjects);
  return { success: true, deletedId: projectId };
};

// ... ALL SEARCH FUNCTIONS AND MOCK DATA GO HERE ...
const MOCK_TOURS: TourSummary[] = [
  { id: "tour-001", name: "MON-AM-Route-01", addresses: 245 },
  { id: "tour-002", name: "MON-AM-Route-02", addresses: 128 },
  { id: "tour-003", name: "TUE-PM-Industrial", addresses: 89 },
];

export const searchTours = async (
  searchTerm: string
): Promise<TourSummary[]> => {
  await sleep(300);
  if (!searchTerm) return [];
  const lowercasedTerm = searchTerm.toLowerCase();
  return MOCK_TOURS.filter((tour) =>
    tour.name.toLowerCase().includes(lowercasedTerm)
  ).slice(0, 5);
};

const MOCK_GEOGRAPHIC_DB: Record<string, GeographicArea> = {
  graz: {
    id: "city-graz",
    name: "Graz, Austria",
    type: "city",
    districts: [
      { id: "dist-jakomini", name: "Jakomini, Graz", type: "district" },
      { id: "dist-lend", name: "Lend, Graz", type: "district" },
    ],
  },
  vienna: {
    id: "city-vienna",
    name: "Vienna, Austria",
    type: "city",
    districts: [
      {
        id: "dist-innerestadt",
        name: "Innere Stadt, Vienna",
        type: "district",
      },
    ],
  },
};

export const searchGeographicArea = async (
  searchTerm: string
): Promise<GeographicArea[]> => {
  await sleep(400);
  if (!searchTerm) return [];
  const lowercasedTerm = searchTerm.toLowerCase();
  return Object.values(MOCK_GEOGRAPHIC_DB).filter((area) =>
    area.name.toLowerCase().includes(lowercasedTerm)
  );
};

export const searchBoundaryTemplates = async (
  searchTerm: string
): Promise<BoundaryTemplate[]> => {
  await sleep(300);
  if (!searchTerm) return [];
  const lowercasedTerm = searchTerm.toLowerCase();
  const builtIn: BoundaryTemplate[] = [
    { id: "bt-1", name: "Downtown River Boundary", type: "river" },
    { id: "bt-2", name: "Industrial Railway Split", type: "railway" },
    { id: "bt-3", name: "Highway A9 Corridor", type: "highway" },
  ];
  const saved = getBoundaryTemplatesFromStorage();
  return [...builtIn, ...saved]
    .filter((template) => template.name.toLowerCase().includes(lowercasedTerm))
    .slice(0, 5);
};

const MOCK_LOCATIONS: Location[] = [
  { id: "loc-1", name: "Main Depot", address: "1 Industrial Way, Graz" },
  { id: "loc-2", name: "Westside Depot", address: "456 Market St, Graz" },
  { id: "loc-3", name: "City Recycler", address: "789 Recycle Rd, Vienna" },
];

export const searchLocations = async (
  searchTerm: string
): Promise<Location[]> => {
  await sleep(350);
  if (!searchTerm) return [];
  const lowercasedTerm = searchTerm.toLowerCase();
  return MOCK_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(lowercasedTerm) ||
      loc.address.toLowerCase().includes(lowercasedTerm)
  ).slice(0, 3);
};

const MOCK_NATURAL_BARRIERS: NaturalBarrier[] = [
  // FIX: Added unique 'id' to each barrier
  {
    id: "nat_rivers_1",
    type: "rivers",
    label: "Rivers (>20m width)",
    available: true,
  },
  {
    id: "nat_railways_1",
    type: "railways",
    label: "Railways",
    available: true,
  },
];

export const fetchNaturalBarriers = async (): Promise<NaturalBarrier[]> => {
  await sleep(500);
  // Ensure the mock data has the 'selected' property initialized
  return MOCK_NATURAL_BARRIERS.map((b) => ({ ...b, selected: false }));
};

// Centralized container types API
export const fetchContainerTypes = async (): Promise<string[]> => {
  await sleep(300);
  // In a real backend, this would be fetched from the database
  return ["120L", "240L", "360L", "660L", "1100L", "1280L"];
};

// Centralized material types API
export const fetchMaterialTypes = async (): Promise<
  Array<{ id: string; label: string; density: number }>
> => {
  await sleep(300);
  return [
    { id: "residual", label: "Residual Waste", density: 0.25 },
    { id: "biogenic", label: "Biogenic Waste", density: 0.15 },
    { id: "paper", label: "Paper & Cardboard", density: 0.08 },
    { id: "plastic", label: "Plastic & Metal", density: 0.12 },
    { id: "glass", label: "Glass", density: 0.4 },
    { id: "other", label: "Other", density: 0.2 },
  ];
};

export const calculateAreas = async (
  project: Project,
  onProgress: (progress: { step: string; message: string }) => void
): Promise<ClusteringResults> => {
  // This is a placeholder for a more complex calculation.
  // In a real scenario, this would likely involve heavy computation or external API calls.
  // For now, simulate progress with steps matching the UI's planningSteps ids.
  onProgress({ step: "start", message: "Initiating Calculation..." });
  await sleep(1000);
  onProgress({ step: "collecting-data", message: "Collecting Data..." });
  await sleep(1500);
  onProgress({
    step: "preparing-network",
    message: "Preparing Street Network...",
  });
  await sleep(2000);
  onProgress({ step: "generating-areas", message: "Generating Areas..." });
  await sleep(1000);
  // For the mock, we can return the same data as getClusteringResults
  const results = await getClusteringResults();
  return results;
};

export interface CollectionRoadTemplate {
  id: string;
  name: string;
  type: "multilane-set" | "highspeed-set";
}

const MOCK_COLLECTION_ROAD_TEMPLATES: CollectionRoadTemplate[] = [
  { id: "cr-1", name: "City Center Multilane Roads", type: "multilane-set" },
  { id: "cr-2", name: "Highway A2 Access Roads", type: "highspeed-set" },
  { id: "cr-3", name: "Downtown One-Way Streets", type: "multilane-set" },
];

export const searchCollectionRoads = async (
  searchTerm: string
): Promise<CollectionRoadTemplate[]> => {
  await sleep(300);
  if (!searchTerm) return [];
  const lowercasedTerm = searchTerm.toLowerCase();
  return MOCK_COLLECTION_ROAD_TEMPLATES.filter((template) =>
    template.name.toLowerCase().includes(lowercasedTerm)
  ).slice(0, 10);
};

// ==================================================================
// == ADAPTATIONS IMPLEMENTED BELOW ==
// ==================================================================

/**
 * Fetches specific project data, including planning progress.
 * Note: This might be slightly redundant with fetchProject but represents a more focused data fetch.
 */
export const getProjectData = async (): Promise<ProjectData> => {
  await sleep(FAKE_LATENCY_MS);
  return {
    ...DEFAULT_PROJECT_DATA,
    id: "mock-project-1",
    name: "Mock Project",
    clusteringResults: undefined,
    planningProgress: {
      step: "start",
    },
    isPlanning: false,
  } as ProjectData;
};

/**
 * Fetches the results of a clustering calculation.
 */
export const getClusteringResults = async (): Promise<ClusteringResults> => {
  await sleep(FAKE_LATENCY_MS);
  return {
    clustersGenerated: 3,
    addressesAssigned: 120,
    unassignedPoints: 5,
    clusters: [
      {
        id: "cluster-1",
        name: "North Zone",
        color: "#ef4444", // Use hex color for bg-[${color}]
        addresses: 40,
        bins: 10,
        estimatedTime: "1h 20m",
        load: 75,
        isOptimized: false,
      },
      {
        id: "cluster-2",
        name: "South Zone",
        color: "#3b82f6",
        addresses: 50,
        bins: 12,
        estimatedTime: "1h 40m",
        load: 80,
        isOptimized: true,
      },
      {
        id: "cluster-3",
        name: "East Zone",
        color: "#22c55e",
        addresses: 30,
        bins: 8,
        estimatedTime: "50m",
        load: 60,
        isOptimized: false,
      },
    ],
  };
};

// ==================================================================
// == TYPE DEFINITIONS ==
// ==================================================================

export interface ProjectData {
  id?: string;
  name: string;
  dataSource?: DataSource;
  selectedTours: string[];
  selectedMaterial: string;
  customMaterialName?: string;
  geographicArea?: GeographicArea | null;
  binDensity: "low" | "medium" | "high";
  containerTypes: string[];
  containerDistribution: Record<string, number>;
  vehicleType: string;
  maxVehicles: number;
  maxWorkingTime: number;
  breakDuration: number;
  breakAfter: number;
  limitSettings: {
    type: "weight_volume" | "weight" | "volume" | "containers";
    strict: boolean;
    weight: number;
    volume: number;
    containers: number;
  };
  startDepot: string;
  endDepot: string;
  differentEndLocation: boolean;
  recycler: string;
  recyclerTime: number;
  lastUsedDepots: string[];
  lastUsedRecyclers: string[];
  boundaries: any[];
  collectionRoads: any[];
  uploadedFile?: UploadedFile;
  csvData?: any[];
  hasFrequency?: boolean;
  containerSettings?: Record<string, any>;
  clusteringResults?: ClusteringResults;
  isPlanning?: boolean;
  planningProgress?: { step: string; message?: string };
  numberOfAddresses?: number;
  numberOfBins?: number;
  materialLabel?: string;
}

export interface TourSummary {
  id: string;
  name: string;
  addresses: number;
}

export interface GeographicArea {
  id: string;
  name: string;
  type: "city" | "district" | "region";
  districts?: GeographicArea[];
}

export interface BoundaryTemplate {
  id: string;
  name: string;
  type: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
}

export interface NaturalBarrier {
  id: string;
  type: string;
  label: string;
  available: boolean;
  selected?: boolean;
}

export interface ClusterResult {
  id: string;
  name: string;
  color: string;
  addresses: number;
  bins: number;
  estimatedTime: string;
  load: number;
  isOptimized: boolean;
}

export interface ClusteringResults {
  clustersGenerated: number;
  addressesAssigned: number;
  unassignedPoints: number;
  clusters: ClusterResult[];
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

export interface CollectionRoad {
  id: string;
  name: string;
  type: string;
}

export interface SuggestedRoad {
  id: string;
  name: string;
  type: string;
}
