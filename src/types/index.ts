export interface Project {
  id: string;
  name: string;
  status: "Finished" | "In Progress";
  materialLabel: string;
  numberOfAddresses: number;
  numberOfBins: number;
  createdAt: string; // Changed from Date to string
  lastUpdate: string; // Changed from Date to string
  currentStepIndex: number;
  projectData: any; // This will be ProjectData type
  isSubmitted: boolean;
}

export type ProjectType = "reoptimize" | "newly-optimize";
export type DataSource = "csv" | "existing" | "ai-generate";

export interface NewProject {
  name: string;
  type: ProjectType;
  dataSource?: DataSource;
  selectedTours: string[]; // Changed from optional to required for form consistency
}
