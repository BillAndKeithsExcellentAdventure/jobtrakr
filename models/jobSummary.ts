export interface JobSummary {
  jobID: number;
  name: string;
  startDate?: Date;
  plannedFinish?: Date;
  bidPrice?: number;
  spentToDate?: number;
  jobComplete: boolean;
}
