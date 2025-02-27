// src/store/receiptDataStore.ts
import { ReceiptBucketData } from 'jobdb';
import { create } from 'zustand';

type ReceiptDataStore = {
  receiptData: ReceiptBucketData[];
  setReceiptData: (data: ReceiptBucketData[]) => void;
  addReceiptData: (receipt: ReceiptBucketData) => void;
  removeReceiptData: (id: string) => void;
};

export const useReceiptDataStore = create<ReceiptDataStore>((set) => ({
  receiptData: [],
  setReceiptData: (data) => set({ receiptData: data }),
  addReceiptData: (receipt) => set((state) => ({ receiptData: [...state.receiptData, receipt] })),
  removeReceiptData: (id) =>
    set((state) => ({
      receiptData: state.receiptData.filter((receipt) => receipt._id!.toString() !== id), // Removes the receipt with the specified id
    })),
}));
