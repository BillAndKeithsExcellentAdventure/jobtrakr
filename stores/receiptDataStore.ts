import { ReceiptBucketData } from 'jobdb';
import { create } from 'zustand';

type ReceiptDataStore = {
  receiptData: ReceiptBucketData[];
  setReceiptData: (data: ReceiptBucketData[]) => void;
  addReceiptData: (receipt: ReceiptBucketData) => void;
  removeReceiptData: (id: string) => void;
  updateReceiptData: (id: string, updatedReceipt: Partial<ReceiptBucketData>) => void;
};

export const useReceiptDataStore = create<ReceiptDataStore>((set) => ({
  receiptData: [],
  setReceiptData: (data) => set({ receiptData: data }),
  addReceiptData: (receipt) => set((state) => ({ receiptData: [...state.receiptData, receipt] })),
  removeReceiptData: (id) =>
    set((state) => ({
      receiptData: state.receiptData.filter((receipt) => receipt._id! !== id), // Removes the receipt with the specified id
    })),
  updateReceiptData: (id, updatedReceipt) =>
    set((state) => ({
      receiptData: state.receiptData.map((receipt) =>
        receipt._id === id ? { ...receipt, ...updatedReceipt } : receipt,
      ),
    })),
}));
