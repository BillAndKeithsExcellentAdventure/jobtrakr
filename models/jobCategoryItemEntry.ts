export interface JobCategoryItemEntry {
  jobId: number;
  categoryName: string;
  itemName:string;
  bidPrice?: number;
  spentToDate?: number;
  categoryComplete: boolean;
}