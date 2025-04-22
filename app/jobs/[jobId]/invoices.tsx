import { StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsStoreAvailableCallback } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';

const JobInvoicesPage = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(jobId);
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();

  useEffect(() => {
    if (jobId) {
      addActiveProjectIds([jobId]);
    }
  }, [jobId]);

  useEffect(() => {
    setProjectIsReady(!!jobId && activeProjectIds.includes(jobId) && isStoreReady());
  }, [jobId, activeProjectIds, isStoreReady]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: `Job Invoices`, headerShown: true }} />
        <View style={styles.headerContainer}>
          {!projectIsReady ? (
            <Text>Waiting....ices</Text>
          ) : (
            <>
              <Text>JobName={jobName}</Text>
              <Text>JobId={jobId}</Text>
            </>
          )}
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
