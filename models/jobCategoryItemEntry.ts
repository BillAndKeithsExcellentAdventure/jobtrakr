export interface JobCategoryItemEntry {
  jobId: string;
  categoryName: string;
  itemName:string;
  bidPrice?: number;
  spentToDate?: number;
  categoryComplete: boolean;
}