export interface JobSummary {
  name: string;
  location?: string;
  bidPrice?: number;
  spentToDate?: number;
  jobComplete: boolean;
}
