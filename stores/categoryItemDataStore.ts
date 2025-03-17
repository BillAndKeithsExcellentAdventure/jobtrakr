import { JobCategoryItemData } from 'jobdb';
import { create } from 'zustand';

export type JobCategoryItemDataStore = {
  allJobCategoryItems: JobCategoryItemData[];
  setJobCategoryItems: (data: JobCategoryItemData[]) => void;
  addJobCategoryItems: (receipt: JobCategoryItemData) => void;
  removeJobCategoryItems: (id: string) => void;
  updateJobCategoryItems: (id: string, updatedItem: Partial<JobCategoryItemData>) => void;
};

export const useJobCategoryItemDataStore = create<JobCategoryItemDataStore>((set) => ({
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
