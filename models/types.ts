export type TBStatus = 'Success' | 'Error' | 'NoChanges';

export interface WorkCategoryData {
  _id: string;
  code: string;
  name: string;
  status: string;
}

export interface WorkCategoryItemData {
  _id?: string;
  categoryId?: string; // id of WorkCategoryData
  code: string;
  name: string;
  status?: string;
}

export interface JobTemplateData {
  _id?: string;
  Name: string;
  Description: string;
  WorkItems: string[]; // array of ids to WorkCategoryItemData;
}
