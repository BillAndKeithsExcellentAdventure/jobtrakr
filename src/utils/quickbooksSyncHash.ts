import {
  InvoiceData,
  ReceiptData,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import * as Crypto from 'expo-crypto';

type NormalizedLineItem = {
  amount: number;
  description: string;
  workItemId: string;
  projectId?: string;
};

type BillSyncPayload = {
  amount: number;
  description: string;
  vendorId: string;
  invoiceDate: number;
  dueDate: number;
  imageId: string;
  notes: string;
  lineItems: NormalizedLineItem[];
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
  projectId: lineItem.projectId ?? '',
});

const compareLineItems = (a: NormalizedLineItem, b: NormalizedLineItem) => {
  if (a.workItemId !== b.workItemId) return a.workItemId.localeCompare(b.workItemId);
  if (a.description !== b.description) return a.description.localeCompare(b.description);
  const projectA = a.projectId || '';
  const projectB = b.projectId || '';
  if (projectA !== projectB) return projectA.localeCompare(projectB);
  return a.amount - b.amount;
};

export const getReceiptSyncHash = async (
  receipt: ReceiptData,
  lineItems: WorkItemCostEntry[],
): Promise<string> => {
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

  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, JSON.stringify(payload));
  return hash;
};

export const getBillSyncHash = async (
  invoice: InvoiceData,
  lineItems: WorkItemCostEntry[],
): Promise<string> => {
  const payload: BillSyncPayload = {
    amount: invoice.amount,
    description: invoice.description,
    vendorId: invoice.vendorId,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    imageId: invoice.imageId,
    notes: invoice.notes,
    lineItems: lineItems.map(normalizeLineItem).sort(compareLineItems),
  };

  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, JSON.stringify(payload));
  return hash;
};
