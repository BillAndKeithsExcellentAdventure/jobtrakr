export interface JobCategoryEntry {
  jobId: number;
  categoryName: string;
  bidPrice?: number;
  spentToDate?: number;
  categoryComplete: boolean;
}
