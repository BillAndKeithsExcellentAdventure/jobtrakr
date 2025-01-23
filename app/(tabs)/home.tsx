import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { JobList } from '@/components/JobList';
import { JobSummary } from '@/models/jobSummary';

const ALLJOBS: JobSummary[] = [
  { name: 'Lot 123', jobComplete: false },
  { name: 'Lot XYZ', jobComplete: false },
  { name: 'Bertram Farm', jobComplete: false },
  { name: "Grayson's Pool", jobComplete: false },
  { name: '456 Main Street', jobComplete: false },
  { name: '619 Elm Street', jobComplete: false },
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
