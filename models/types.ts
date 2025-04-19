export type TBStatus = 'Success' | 'Error' | 'NoChanges';

export type CrudResult = { status: 'Success' | 'Error'; id: string; msg: string };

export interface ProjectData {
  id: string;
  name: string;
  location: string;
  ownerName: string;
  startDate: number;
  plannedFinish: number;
  bidPrice: number;
  amountSpent: number;
  longitude: number;
  latitude: number;
  radius: number;
  favorite: number;
  thumbnail: string;
  status: string; // 'active', 'on-hold'  or 'completed'
  seedJobWorkItems: string; // comma separated list of workItemIds
}
