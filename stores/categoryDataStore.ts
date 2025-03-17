import { JobCategoryData } from 'jobdb';
import { create } from 'zustand';

export type JobCategoryDataStore = {
  allJobCategories: JobCategoryData[];
  setJobCategories: (data: JobCategoryData[]) => void;
  addJobCategories: (receipt: JobCategoryData) => void;
  removeJobCategories: (id: string) => void;
  updateJobCategories: (id: string, updatedItem: Partial<JobCategoryData>) => void;
};

export const useJobCategoryDataStore = create<JobCategoryDataStore>((set) => ({
  allJobCategories: [],
  setJobCategories: (data) => set({ allJobCategories: data }),
  addJobCategories: (vendor) => set((state) => ({ allJobCategories: [...state.allJobCategories, vendor] })),
  removeJobCategories: (id) =>
    set((state) => ({
      allJobCategories: state.allJobCategories.filter((i) => i._id! !== id),
    })),
  updateJobCategories: (id, updatedItem) =>
    set((state) => ({
      allJobCategories: state.allJobCategories.map((item) =>
        item._id === id ? { ...item, ...updatedItem } : item,
      ),
    })),
}));
