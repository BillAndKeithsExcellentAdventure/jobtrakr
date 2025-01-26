import { View, Text, FlatList, StyleSheet, useColorScheme } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { CategoryList } from '@/components/CategoryList';
import { fetchItemsForCategories } from '@/api/items';
import { JobCategoryItemEntry } from '@/models/jobCategoryItemEntry';

const CategoryItemsPage = () => {
  const theme = useColorScheme(); // 'light' or 'dark'
  const { jobId, jobName, category } = useLocalSearchParams<{ jobId: string; jobName: string; category: string }>();
  const [allJobCategoryItems, setAllJobCategoryItems] = useState<JobCategoryItemEntry[]>([]);

  useEffect(() => {
    async function loadCategoryItemsForJob(jobId: string) {
      const jobNum = Number(jobId);
      if (!isNaN(jobNum)) {
        const jobCategoryItems = await fetchItemsForCategories(category, jobNum);
        if (jobCategoryItems) setAllJobCategoryItems(jobCategoryItems);
      }
    }
    loadCategoryItemsForJob(jobId);
  }, [jobId]);

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}>
      <Stack.Screen options={{ title: 'Job Categories' }} />
      <View>
        <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>{jobName}</Text>
        <CategoryList data={allJobCategoryItems} jobName={jobName} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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

export default CategoryItemsPage;
