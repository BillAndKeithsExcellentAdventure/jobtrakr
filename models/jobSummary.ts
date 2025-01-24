export interface JobSummary {
  name: string;
  startDate?: Date;
  plannedFinish?: Date;
  bidPrice?: number;
  spentToDate?: number;
  jobComplete: boolean;
}
