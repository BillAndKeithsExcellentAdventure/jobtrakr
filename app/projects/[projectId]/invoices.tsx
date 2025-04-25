import { StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsStoreAvailableCallback } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';

const ProjectInvoicesPage = () => {
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: `Project Invoices`, headerShown: true }} />
        <View style={styles.headerContainer}>
          {!projectIsReady ? (
            <Text>Waiting....</Text>
          ) : (
            <>
              <Text>ProjectName={projectName}</Text>
              <Text>ProjectId={projectId}</Text>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ProjectInvoicesPage;

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
