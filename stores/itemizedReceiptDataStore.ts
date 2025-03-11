import { create } from 'zustand';

export type ReceiptItemEntry = {
  label: string;
  amount: number;
  _id?: string;
  receiptId: string;
  category?: string;
  subCategory?: string;
};

export type ItemizedReceiptDataStore = {
  allReceiptItems: ReceiptItemEntry[];
  setReceiptItems: (data: ReceiptItemEntry[]) => void;
  addReceiptItem: (receipt: ReceiptItemEntry) => void;
  removeReceiptItem: (id: string) => void;
  updateReceiptItem: (id: string, updatedItem: Partial<ReceiptItemEntry>) => void;
};

export const useItemizedReceiptDataStore = create<ItemizedReceiptDataStore>((set) => ({
  allReceiptItems: [],
  setReceiptItems: (data) => set({ allReceiptItems: data }),
  addReceiptItem: (vendor) => set((state) => ({ allReceiptItems: [...state.allReceiptItems, vendor] })),
  removeReceiptItem: (id) =>
    set((state) => ({
      allReceiptItems: state.allReceiptItems.filter((i) => i._id! !== id),
    })),
  updateReceiptItem: (id, updatedItem) =>
    set((state) => ({
      allReceiptItems: state.allReceiptItems.map((item) =>
        item._id === id ? { ...item, ...updatedItem } : item,
      ),
    })),
}));
