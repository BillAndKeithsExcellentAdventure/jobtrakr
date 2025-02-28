import { JobData } from 'jobdb';
import { create } from 'zustand';

type JobDataStore = {
  allJobs: JobData[];
  setAllJobs: (data: JobData[]) => void;
  addJob: (job: JobData) => void;
  removeJob: (id: string) => void;
  updateJob: (id: string, updatedJob: Partial<JobData>) => void;
};

const futureDay = new Date('2099-12-31'); // A default far future date

const sortJobData = (jobData: JobData[]): JobData[] => {
  return jobData
    .sort((a, b) => (b.Favorite ?? 0) - (a.Favorite ?? 0)) // Sort by Favorite in descending order
    .sort((a, b) =>
      a.Favorite === b.Favorite
        ? (a.PlannedFinish ? a.PlannedFinish.getTime() : futureDay.getTime()) -
          (b.PlannedFinish ? b.PlannedFinish.getTime() : futureDay.getTime())
        : 0,
    );
};

export const useJobDataStore = create<JobDataStore>((set) => ({
  allJobs: [],
  setAllJobs: (data) => set({ allJobs: sortJobData(data) }), // Apply sorting on setJobData
  addJob: (job) =>
    set((state) => {
      const updatedJobData = [...state.allJobs, job]; // Add new job
      return { allJobs: sortJobData(updatedJobData) }; // Apply sorting after adding the new job
    }),
  removeJob: (id) =>
    set((state) => ({
      allJobs: state.allJobs.filter((job) => job._id! !== id),
    })),
  updateJob: (id, updatedJob) =>
    set((state) => {
      // Update the job if it exists
      const updatedJobData = state.allJobs.map((job) => (job._id === id ? { ...job, ...updatedJob } : job));
      // Sort the updated jobData array
      return { allJobs: sortJobData(updatedJobData) };
    }),
}));
