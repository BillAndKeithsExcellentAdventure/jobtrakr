import { WorkItemData } from '@/models/types';
import { create } from 'zustand';

export type WorkCategoryItemDataStore = {
  allWorkCategoryItems: WorkItemData[];
  setWorkCategoryItems: (data: WorkItemData[]) => void;
  addWorkCategoryItem: (receipt: WorkItemData) => void;
  removeWorkCategoryItem: (id: string) => void;
  updateWorkCategoryItem: (id: string, updatedItem: Partial<WorkItemData>) => void;
};

export const useWorkCategoryItemDataStore = create<WorkCategoryItemDataStore>((set) => ({
  allWorkCategoryItems: [],
  setWorkCategoryItems: (data) => set({ allWorkCategoryItems: data }),
  addWorkCategoryItem: (vendor) =>
    set((state) => ({ allWorkCategoryItems: [...state.allWorkCategoryItems, vendor] })),
  removeWorkCategoryItem: (id) =>
    set((state) => ({
      allWorkCategoryItems: state.allWorkCategoryItems.filter((i) => i._id! !== id),
    })),
  updateWorkCategoryItem: (id, updatedItem) =>
    set((state) => ({
      allWorkCategoryItems: state.allWorkCategoryItems.map((item) =>
        item._id === id ? { ...item, ...updatedItem } : item,
      ),
    })),
}));
