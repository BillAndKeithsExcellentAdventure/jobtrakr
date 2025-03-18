export interface WorkCategoryData {
  _id?: string;
  Code?: string;
  CategoryName: string;
  CategoryStatus?: string;
}

export interface WorkCategoryItemData {
  _id?: string;
  CategoryId?: string;
  Code?: string;
  ItemName: string;
  ItemStatus?: string;
}
