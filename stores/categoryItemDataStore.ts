import { WorkCategoryItemData } from '@/app/models/types';
import { create } from 'zustand';

export type WorkCategoryItemDataStore = {
  allJobCategoryItems: WorkCategoryItemData[];
  setJobCategoryItems: (data: WorkCategoryItemData[]) => void;
  addJobCategoryItems: (receipt: WorkCategoryItemData) => void;
  removeJobCategoryItems: (id: string) => void;
  updateJobCategoryItems: (id: string, updatedItem: Partial<WorkCategoryItemData>) => void;
};

export const useWorkCategoryItemDataStore = create<WorkCategoryItemDataStore>((set) => ({
  allJobCategoryItems: [],
  setJobCategoryItems: (data) => set({ allJobCategoryItems: data }),
  addJobCategoryItems: (vendor) =>
    set((state) => ({ allJobCategoryItems: [...state.allJobCategoryItems, vendor] })),
  removeJobCategoryItems: (id) =>
    set((state) => ({
      allJobCategoryItems: state.allJobCategoryItems.filter((i) => i._id! !== id),
    })),
  updateJobCategoryItems: (id, updatedItem) =>
    set((state) => ({
      allJobCategoryItems: state.allJobCategoryItems.map((item) =>
        item._id === id ? { ...item, ...updatedItem } : item,
      ),
    })),
}));
