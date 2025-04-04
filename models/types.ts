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
  name: string;
  description: string;
  workItems: string[]; // array of ids to WorkCategoryItemData;
}

export interface JobTemplateWorkItemData {
  _id?: string;
  workItemId: string;
}
