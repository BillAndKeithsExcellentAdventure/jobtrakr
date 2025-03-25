export interface WorkCategoryData {
  _id?: string;
  Code: string;
  Name: string;
  Status?: string;
}

export interface WorkCategoryItemData {
  _id?: string;
  CategoryId?: string; // id of WorkCategoryData
  Code: string;
  Name: string;
  Status?: string;
}

export interface JobTemplateData {
  _id?: string;
  Name: string;
  Description: string;
  WorkItems: string[]; // array of ids to WorkCategoryItemData;
}
