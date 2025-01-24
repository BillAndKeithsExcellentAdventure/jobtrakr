import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { JobList } from '@/components/JobList';
import { JobSummary } from '@/models/jobSummary';

const ALLJOBS: JobSummary[] = [
  {
    name: 'Lot 123',
    startDate: new Date('2024-01-01'),
    plannedFinish: new Date('2024-06-01'),
    bidPrice: 400000,
    spentToDate: 80000, // 20% of bidPrice
    jobComplete: false,
  },
  {
    name: 'Lot XYZ',
    startDate: new Date('2024-02-01'),
    plannedFinish: new Date('2024-08-01'),
    bidPrice: 900000,
    spentToDate: 450000, // 50% of bidPrice
    jobComplete: false,
  },
  {
    name: 'Bertram Farm',
    startDate: new Date('2024-03-01'),
    plannedFinish: new Date('2024-12-01'),
    bidPrice: 1500000,
    spentToDate: 1200000, // 80% of bidPrice
    jobComplete: false,
  },
  {
    name: "Grayson's Pool",
    startDate: new Date('2024-04-01'),
    plannedFinish: new Date('2025-01-01'),
    bidPrice: 600000,
    spentToDate: 300000, // 50% of bidPrice
    jobComplete: false,
  },
  {
    name: '456 Main Street',
    startDate: new Date('2024-05-01'),
    plannedFinish: new Date('2024-10-01'),
    bidPrice: 1200000,
    spentToDate: 600000, // 50% of bidPrice
    jobComplete: false,
  },
  {
    name: '619 Elm Street',
    startDate: new Date('2024-06-01'),
    plannedFinish: new Date('2025-03-01'),
    bidPrice: 1750000,
    spentToDate: 1400000, // 80% of bidPrice
    jobComplete: false,
  },
  {
    name: '345 Dixie Hwy',
    startDate: new Date('2024-01-01'),
    plannedFinish: new Date('2024-06-01'),
    bidPrice: 400000,
    spentToDate: 80000, // 20% of bidPrice
    jobComplete: false,
  },
  {
    name: '777 Heaven Lane',
    startDate: new Date('2024-02-01'),
    plannedFinish: new Date('2024-08-01'),
    bidPrice: 900000,
    spentToDate: 450000, // 50% of bidPrice
    jobComplete: false,
  },
  {
    name: '666 Devils Way',
    startDate: new Date('2024-03-01'),
    plannedFinish: new Date('2024-12-01'),
    bidPrice: 1500000,
    spentToDate: 1200000, // 80% of bidPrice
    jobComplete: false,
  },
  {
    name: '333 Halfway House',
    startDate: new Date('2024-04-01'),
    plannedFinish: new Date('2025-01-01'),
    bidPrice: 600000,
    spentToDate: 300000, // 50% of bidPrice
    jobComplete: false,
  },
  {
    name: '4444 4th Street',
    startDate: new Date('2024-05-01'),
    plannedFinish: new Date('2024-10-01'),
    bidPrice: 1200000,
    spentToDate: 600000, // 50% of bidPrice
    jobComplete: false,
  },
  {
    name: '258 7th Ave',
    startDate: new Date('2024-06-01'),
    plannedFinish: new Date('2025-03-01'),
    bidPrice: 1750000,
    spentToDate: 1400000, // 80% of bidPrice
    jobComplete: false,
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projects</Text>
      <JobList data={ALLJOBS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
});
