export interface JobCategoryEntry {
  jobId: string;
  categoryName: string;
  bidPrice?: number;
  spentToDate?: number;
  categoryComplete: boolean;
}
