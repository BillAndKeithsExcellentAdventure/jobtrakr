import { JobCategoryEntry } from '@/models/jobCategoryEntry';

const ALLJOBCATEGORYDATA: JobCategoryEntry[] = [
  {
    jobId: 1,
    categoryName: 'Pre-Construction',
    bidPrice: 12000,
    spentToDate: 4800, // 40% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 1,
    categoryName: 'Site Work',
    bidPrice: 20000,
    spentToDate: 10000, // 50% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 1,
    categoryName: 'Framing',
    bidPrice: 25000,
    spentToDate: 12500, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 1,
    categoryName: 'Exterior Finishes',
    bidPrice: 18000,
    spentToDate: 9000, // 50% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 1,
    categoryName: 'Interior Finishes',
    bidPrice: 8500,
    spentToDate: 3400, // 40% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 1,
    categoryName: 'Mechanical',
    bidPrice: 14000,
    spentToDate: 5600, // 40% of bidPrice
    categoryComplete: true,
  },

  {
    jobId: 2,
    categoryName: 'Pre-Construction',
    bidPrice: 15000,
    spentToDate: 7500, // 50% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 2,
    categoryName: 'Site Work',
    bidPrice: 20000,
    spentToDate: 10000, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 2,
    categoryName: 'Framing',
    bidPrice: 22000,
    spentToDate: 8800, // 40% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 2,
    categoryName: 'Exterior Finishes',
    bidPrice: 18000,
    spentToDate: 7200, // 40% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 3,
    categoryName: 'Pre-Construction',
    bidPrice: 12000,
    spentToDate: 6000, // 50% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 3,
    categoryName: 'Site Work',
    bidPrice: 15000,
    spentToDate: 7500, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 3,
    categoryName: 'Framing',
    bidPrice: 18000,
    spentToDate: 7200, // 40% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 3,
    categoryName: 'Interior Finishes',
    bidPrice: 16000,
    spentToDate: 9600, // 60% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 4,
    categoryName: 'Site Work',
    bidPrice: 11000,
    spentToDate: 6600, // 60% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 4,
    categoryName: 'Framing',
    bidPrice: 13000,
    spentToDate: 6500, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 4,
    categoryName: 'Electrical',
    bidPrice: 16000,
    spentToDate: 8000, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 4,
    categoryName: 'Mechanical',
    bidPrice: 22000,
    spentToDate: 11000, // 50% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 5,
    categoryName: 'Framing',
    bidPrice: 14000,
    spentToDate: 7000, // 50% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 5,
    categoryName: 'Exterior Finishes',
    bidPrice: 18000,
    spentToDate: 7200, // 40% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 5,
    categoryName: 'Interior Finishes',
    bidPrice: 22000,
    spentToDate: 11000, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 5,
    categoryName: 'Mechanical',
    bidPrice: 13000,
    spentToDate: 6500, // 50% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 6,
    categoryName: 'Pre-Construction',
    bidPrice: 14000,
    spentToDate: 5600, // 40% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 6,
    categoryName: 'Site Work',
    bidPrice: 10000,
    spentToDate: 5000, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 6,
    categoryName: 'Electrical',
    bidPrice: 17000,
    spentToDate: 8500, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 6,
    categoryName: 'Mechanical',
    bidPrice: 25000,
    spentToDate: 10000, // 40% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 7,
    categoryName: 'Framing',
    bidPrice: 16000,
    spentToDate: 6400, // 40% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 7,
    categoryName: 'Exterior Finishes',
    bidPrice: 13000,
    spentToDate: 6500, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 7,
    categoryName: 'Mechanical',
    bidPrice: 18000,
    spentToDate: 9000, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 7,
    categoryName: 'Interior Finishes',
    bidPrice: 15000,
    spentToDate: 9000, // 60% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 8,
    categoryName: 'Site Work',
    bidPrice: 12000,
    spentToDate: 6000, // 50% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 8,
    categoryName: 'Framing',
    bidPrice: 19000,
    spentToDate: 7600, // 40% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 8,
    categoryName: 'Electrical',
    bidPrice: 16000,
    spentToDate: 8000, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 8,
    categoryName: 'Mechanical',
    bidPrice: 20000,
    spentToDate: 8000, // 40% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 9,
    categoryName: 'Pre-Construction',
    bidPrice: 12000,
    spentToDate: 6000, // 50% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 9,
    categoryName: 'Site Work',
    bidPrice: 15000,
    spentToDate: 7500, // 50% of bidPrice
    categoryComplete: true,
  },
  {
    jobId: 9,
    categoryName: 'Framing',
    bidPrice: 17000,
    spentToDate: 6800, // 40% of bidPrice
    categoryComplete: false,
  },
  {
    jobId: 9,
    categoryName: 'Interior Finishes',
    bidPrice: 18000,
    spentToDate: 10800, // 60% of bidPrice
    categoryComplete: true,
  },
];

// Simulate an async function to load JSON data (like fetching from an API or reading from a file)
export function loadJobCategoryData(jobId: number): Promise<JobCategoryEntry[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulating a successful data load with a slight delay
      const success = true; // You can toggle this to simulate errors
      if (success) {
        const specifiedJobCategories = ALLJOBCATEGORYDATA.filter((e) => e.jobId === jobId);
        resolve(specifiedJobCategories);
      } else {
        reject(new Error('Failed to load data'));
      }
    }, 300);
  });
}
