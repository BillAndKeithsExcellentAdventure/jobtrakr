import { StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { JobCategoryEntry } from '@/models/jobCategoryEntry';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';

const JobInvoicesPage = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: `Job Invoices`, headerShown: true }} />
        <View style={styles.headerContainer}>
          <Text>JobName={jobName}</Text>
          <Text>JobId={jobId}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default JobInvoicesPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
