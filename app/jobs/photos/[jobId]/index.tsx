import { StyleSheet, SafeAreaView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { JobCategoryEntry } from '@/models/jobCategoryEntry';
import { Text, View } from '@/components/Themed';

const JobPhotosPage = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [allJobCategories, setAllJobCategories] = useState<JobCategoryEntry[]>([]);

  /*   useEffect(() => {
    async function loadCategoriesForJob(jobId: string) {
      const jobNum = Number(jobId);
      if (!isNaN(jobNum)) {
        const jobCategories = await fetchCategoriesForJob(jobNum);
        if (jobCategories) setAllJobCategories(jobCategories);
      }
    }
    loadCategoriesForJob(jobId);
  }, [jobId]);
 */

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: `Job Photos`, headerShown: true }} />
        <View style={styles.headerContainer}>
          <Text>JobName={jobName}</Text>
          <Text>JobId={jobId}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  itemContainer: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default JobPhotosPage;
