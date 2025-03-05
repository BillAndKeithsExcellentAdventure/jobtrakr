import { ReceiptBucketData } from 'jobdb';
import { create } from 'zustand';

type ReceiptDataStore = {
  allJobReceipts: ReceiptBucketData[];
  setReceiptData: (data: ReceiptBucketData[]) => void;
  addReceiptData: (receipt: ReceiptBucketData) => void;
  removeReceiptData: (id: string) => void;
  updateReceiptData: (id: string, updatedReceipt: Partial<ReceiptBucketData>) => void;
};

export const useReceiptDataStore = create<ReceiptDataStore>((set) => ({
  allJobReceipts: [],
  setReceiptData: (data) => set({ allJobReceipts: data }),
  addReceiptData: (receipt) => set((state) => ({ allJobReceipts: [...state.allJobReceipts, receipt] })),
  removeReceiptData: (id) =>
    set((state) => ({
      allJobReceipts: state.allJobReceipts.filter((receipt) => receipt._id! !== id), // Removes the receipt with the specified id
    })),
  updateReceiptData: (id, updatedReceipt) =>
    set((state) => ({
      allJobReceipts: state.allJobReceipts.map((receipt) =>
        receipt._id === id ? { ...receipt, ...updatedReceipt } : receipt,
      ),
    })),
}));
