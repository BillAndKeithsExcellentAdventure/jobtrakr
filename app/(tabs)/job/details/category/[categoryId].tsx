import { View, Text, FlatList, StyleSheet, useColorScheme } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { fetchItemsForCategories } from '@/api/items';
import { JobCategoryItemEntry } from '@/models/jobCategoryItemEntry';
import { CategoryItemList } from '@/components/CategoryItemList';

const CategoryItemsPage = () => {
  const theme = useColorScheme(); // 'light' or 'dark'
  const { jobId, jobName, categoryId } = useLocalSearchParams<{ jobId: string; jobName: string; categoryId: string }>();
  const [allJobCategoryItems, setAllJobCategoryItems] = useState<JobCategoryItemEntry[]>([]);

  useEffect(() => {
    async function loadCategoryItemsForJob(jobId: string, categoryName: string) {
      const jobNum = Number(jobId);
      if (!isNaN(jobNum)) {
        const jobCategoryItems = await fetchItemsForCategories(categoryName, jobNum);
        if (jobCategoryItems) setAllJobCategoryItems(jobCategoryItems);
      }
    }
    loadCategoryItemsForJob(jobId, categoryId);
  }, [jobId, categoryId]);

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}>
      <Stack.Screen options={{ title: `${categoryId} Items` }} />
      <View style={[styles.listContainer]}>
        <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>{jobName}</Text>
        <CategoryItemList data={allJobCategoryItems} jobName={jobName} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
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
