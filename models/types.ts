export type TBStatus = 'Success' | 'Error' | 'NoChanges';

export interface ProjectData {
  id: string;
  code: string;
  name: string;
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
