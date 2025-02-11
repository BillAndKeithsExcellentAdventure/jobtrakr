import { View, Text, FlatList, StyleSheet, useColorScheme } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { fetchCategoriesForJob } from '@/api/category';
import { JobCategoryEntry } from '@/models/jobCategoryEntry';
import { CategoryList } from '@/components/CategoryList';

const JobPage = () => {
  const theme = useColorScheme(); // 'light' or 'dark'
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [allJobCategories, setAllJobCategories] = useState<JobCategoryEntry[]>([]);

  useEffect(() => {
    async function loadCategoriesForJob(jobId: string) {
      const jobNum = Number(jobId);
      if (!isNaN(jobNum)) {
        const jobCategories = await fetchCategoriesForJob(jobNum);
        if (jobCategories) setAllJobCategories(jobCategories);
      }
    }
    loadCategoriesForJob(jobId);
  }, [jobId]);

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}>
      <Stack.Screen options={{ title: `Job Categories` }} />
      <View style={[styles.headerContainer]}>
        <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>{jobName}</Text>
      </View>
      <CategoryList data={allJobCategories} jobName={jobName} />
    </View>
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

export default JobPage;
