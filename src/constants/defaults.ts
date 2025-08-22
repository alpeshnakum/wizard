import { ProjectData } from "../lib/graphql/api";

export const DEFAULT_PROJECT_DATA: Partial<ProjectData> = {
  name: "Untitled Project",
  dataSource: "csv",
  selectedTours: [],
  // JOBS
  selectedMaterial: "",
  customMaterialName: "",
  geographicArea: null,
  binDensity: "medium",
  containerTypes: [], // Will be populated from API
  containerDistribution: {},
  // FLEET
  vehicleType: "rearloader",
  maxVehicles: 5,
  maxWorkingTime: 510, // 8h 30m
  breakDuration: 30,
  breakAfter: 360, // 6h
  limitSettings: {
    type: "weight_volume",
    strict: false,
    weight: 10000,
    volume: 20000,
    containers: 0,
  },
  startDepot: "",
  endDepot: "",
  differentEndLocation: false,
  recycler: "",
  recyclerTime: 30,
  lastUsedDepots: ["Main Depot", "Westside Depot"],
  lastUsedRecyclers: ["City Recycler", "North Transfer Station"],
  // BOUNDARIES
  boundaries: [],
  // COLLECTION SETTINGS
  collectionRoads: [],
};
