import { ReceiptData, WorkItemCostEntry } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';

type NormalizedLineItem = {
  amount: number;
  description: string;
  workItemId: string;
};

type ReceiptSyncPayload = {
  amount: number;
  description: string;
  vendorId: string;
  paymentAccountId: string;
  receiptDate: number;
  imageId: string;
  notes: string;
  lineItems: NormalizedLineItem[];
};

const normalizeLineItem = (lineItem: WorkItemCostEntry): NormalizedLineItem => ({
  amount: lineItem.amount,
  description: lineItem.label,
  workItemId: lineItem.workItemId,
});

const compareLineItems = (a: NormalizedLineItem, b: NormalizedLineItem) => {
  if (a.workItemId !== b.workItemId) return a.workItemId.localeCompare(b.workItemId);
  if (a.description !== b.description) return a.description.localeCompare(b.description);
  return a.amount - b.amount;
};

export const getReceiptSyncHash = (receipt: ReceiptData, lineItems: WorkItemCostEntry[]): string => {
  const payload: ReceiptSyncPayload = {
    amount: receipt.amount,
    description: receipt.description,
    vendorId: receipt.vendorId,
    paymentAccountId: receipt.paymentAccountId,
    receiptDate: receipt.receiptDate,
    imageId: receipt.imageId,
    notes: receipt.notes,
    lineItems: lineItems.map(normalizeLineItem).sort(compareLineItems),
  };

  return JSON.stringify(payload);
};
