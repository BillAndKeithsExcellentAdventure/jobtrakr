export type TBStatus = 'Success' | 'Error' | 'NoChanges';

export interface ProjectData {
  _id?: any;
  code?: string;
  name?: string;
  jobTypeId?: string;
  location?: string;
  ownerName?: string;
  startDate?: number;
  plannedFinish?: number;
  bidPrice?: number;
  longitude?: number;
  latitude?: number;
  radius?: number;
  favorite?: number;
  thumbnail?: string;
  jobStatus?: string;
}

export interface WorkCategoryData {
  _id: string;
  code: string;
  name: string;
  status: string;
}

export interface WorkItemData {
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
}

export interface JobTemplateWorkItemData {
  _id?: string;
  templateId: string;
  workItemIds: string;
}

export interface VendorData {
  _id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  mobilePhone?: string;
  businessPhone?: string;
  notes?: string;
}

export interface NoteData {
  id?: string;
  task: string;
  completed: boolean;
}
