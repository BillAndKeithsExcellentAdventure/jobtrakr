import { OptionEntry } from '../components/OptionList';

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
  seedWorkItems: string; // comma separated list of workItemIds
  ownerAddress: string;
  ownerAddress2: string;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;
  ownerPhone: string;
  ownerEmail: string;
}

export function CostItemDataCodeCompareAsNumber(a: CostItemData, b: CostItemData) {
  const aValue = Number(a.code);
  const bValue = Number(b.code);
  return (aValue as number) - (bValue as number);
}

export function CostSectionDataCodeCompareAsNumber(a: CostSectionData, b: CostSectionData) {
  const aValue = Number(a.code);
  const bValue = Number(b.code);
  return (aValue as number) - (bValue as number);
}

export interface CostItemData {
  id: string;
  workItemId: string;
  code: string;
  title: string;
  bidAmount: number;
  spentAmount: number;
}

export interface CostSectionData {
  categoryId: string;
  code: string;
  title: string;
  totalBidAmount: number;
  totalSpentAmount: number;
  data: CostItemData[];
}

export interface ReceiptItemFromAI {
  description: string;
  amount: number;
}
export interface ReceiptCostWorkItem {
  label: string;
  workItemId: string;
}

export interface ReceiptItem {
  description: string;
  amount: number;
  taxable: boolean;
  proratedTax: number;
  isSelected?: boolean;
  costWorkItem?: ReceiptCostWorkItem;
}

export interface ReceiptSummary {
  vendor: string;
  receiptDate: number;
  totalAmount: number;
  totalTax: number;
}

export interface ProposedChangeOrderItem {
  label: string;
  amount: number;
  workItemEntry: OptionEntry;
}
