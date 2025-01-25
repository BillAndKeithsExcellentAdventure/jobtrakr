export interface JobCategoryEntry {
  jobId: number;
  categoryName:
    | 'Pre-Construction'
    | 'Site Work'
    | 'Framing'
    | 'Exterior Finishes'
    | 'Interior Finishes'
    | 'Mechanical'
    | 'Electrical';
  bidPrice?: number;
  spentToDate?: number;
  categoryComplete: boolean;
}
