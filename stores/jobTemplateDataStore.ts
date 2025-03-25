import { JobTemplateData } from '@/models/types';
import { create } from 'zustand';

export type JobTemplateDataStore = {
  allJobTemplates: JobTemplateData[];
  setJobTemplates: (data: JobTemplateData[]) => void;
  addJobTemplate: (jobTemplate: JobTemplateData) => void;
  removeJobTemplate: (id: string) => void;
  updateJobTemplate: (id: string, updatedItem: Partial<JobTemplateData>) => void;
};

export const useJobTemplateDataStore = create<JobTemplateDataStore>((set) => ({
  allJobTemplates: [],
  setJobTemplates: (data) => set({ allJobTemplates: data }),
  addJobTemplate: (jobTemplate) =>
    set((state) => ({ allJobTemplates: [...state.allJobTemplates, jobTemplate] })),
  removeJobTemplate: (id) =>
    set((state) => ({
      allJobTemplates: state.allJobTemplates.filter((item) => item._id !== id),
    })),
  updateJobTemplate: (id, updatedItem) =>
    set((state) => ({
      allJobTemplates: state.allJobTemplates.map((item) =>
        item._id === id ? { ...item, ...updatedItem } : item,
      ),
    })),
}));
