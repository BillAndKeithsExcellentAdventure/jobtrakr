import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { JobList } from '@/components/JobList';
import { JobSummary } from '@/models/jobSummary';
import React, { useEffect, useState } from 'react';
import { fetchJobList } from '@/api/job';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [allJobs, setAllJobs] = useState<JobSummary[]>([]);

  useEffect(() => {
    async function loadJobs() {
      const jobs = await fetchJobList();
      if (jobs) setAllJobs(jobs);
    }
    loadJobs();
  }, []);

  return (
    <View style={styles.container}>
      <JobList data={allJobs} />
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
});
