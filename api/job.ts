import { JobSummary } from '@/models/jobSummary';

const ALLJOBS: JobSummary[] = [
  {
    name: 'Lot 123',
    startDate: new Date('2024-01-01'),
    plannedFinish: new Date('2024-06-01'),
    bidPrice: 400000,
    spentToDate: 80000, // 20% of bidPrice
    jobComplete: false,
    jobId: 1,
  },
  {
    name: 'Lot XYZ',
    startDate: new Date('2024-02-01'),
    plannedFinish: new Date('2024-08-01'),
    bidPrice: 900000,
    spentToDate: 450000, // 50% of bidPrice
    jobComplete: false,
    jobId: 2,
  },
  {
    name: 'Bertram Farm',
    startDate: new Date('2024-03-01'),
    plannedFinish: new Date('2024-12-01'),
    bidPrice: 1500000,
    spentToDate: 1200000, // 80% of bidPrice
    jobComplete: false,
    jobId: 3,
  },
  {
    name: "Grayson's Pool",
    startDate: new Date('2024-04-01'),
    plannedFinish: new Date('2025-01-01'),
    bidPrice: 600000,
    spentToDate: 300000, // 50% of bidPrice
    jobComplete: false,
    jobId: 4,
  },
  {
    name: '456 Main Street',
    startDate: new Date('2024-05-01'),
    plannedFinish: new Date('2024-10-01'),
    bidPrice: 1200000,
    spentToDate: 600000, // 50% of bidPrice
    jobComplete: false,
    jobId: 5,
  },
  {
    name: '619 Elm Street',
    startDate: new Date('2024-06-01'),
    plannedFinish: new Date('2025-03-01'),
    bidPrice: 1750000,
    spentToDate: 1400000, // 80% of bidPrice
    jobComplete: false,
    jobId: 6,
  },
  {
    name: '345 Dixie Hwy',
    startDate: new Date('2024-01-01'),
    plannedFinish: new Date('2024-06-01'),
    bidPrice: 400000,
    spentToDate: 80000, // 20% of bidPrice
    jobComplete: false,
    jobId: 7,
  },
  {
    name: '777 Heaven Lane',
    startDate: new Date('2024-02-01'),
    plannedFinish: new Date('2024-08-01'),
    bidPrice: 900000,
    spentToDate: 450000, // 50% of bidPrice
    jobComplete: false,
    jobId: 8,
  },
  {
    name: '666 Devils Way',
    startDate: new Date('2024-03-01'),
    plannedFinish: new Date('2024-12-01'),
    bidPrice: 1500000,
    spentToDate: 1200000, // 80% of bidPrice
    jobComplete: false,
    jobId: 9,
  },
];

// Simulate an async function to load JSON data (like fetching from an API or reading from a file)
export function loadJobData(): Promise<JobSummary[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulating a successful data load with a slight delay
      const success = true; // You can toggle this to simulate errors
      if (success) {
        resolve(ALLJOBS);
      } else {
        reject(new Error('Failed to load data'));
      }
    }, 300); 
  });
}
