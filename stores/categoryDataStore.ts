import { WorkCategoryData } from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { create } from 'zustand';

export type WorkCategoryDataStore = {
  allWorkCategories: WorkCategoryData[];
  setWorkCategories: (data: WorkCategoryData[]) => void;
  addWorkCategory: (receipt: WorkCategoryData) => void;
  removeWorkCategory: (id: string) => void;
  updateWorkCategory: (id: string, updatedItem: Partial<WorkCategoryData>) => void;
};

export const useWorkCategoryDataStore = create<WorkCategoryDataStore>((set) => ({
  allWorkCategories: [],
  setWorkCategories: (data) => set({ allWorkCategories: data }),
  addWorkCategory: (vendor) => set((state) => ({ allWorkCategories: [...state.allWorkCategories, vendor] })),
  removeWorkCategory: (id) =>
    set((state) => ({
      allWorkCategories: state.allWorkCategories.filter((i) => i.id! !== id),
    })),
  updateWorkCategory: (id, updatedItem) =>
    set((state) => ({
      allWorkCategories: state.allWorkCategories.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item,
      ),
    })),
}));
