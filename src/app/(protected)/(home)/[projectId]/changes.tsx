import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import SwipeableChangeOrder from '@/src/components/SwipeableChangeOrder';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import {
  useAllRows,
  useIsStoreAvailableCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';
import { ActionButton } from '@/src/components/ActionButton';

const ChangeOrdersScreen = () => {
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);

  const allChangeOrders = useAllRows(projectId, 'changeOrders');

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: projectName, headerShown: true }} />
      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        {!projectIsReady ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                padding: 5,
                borderRadius: 5,
                gap: 10,
              }}
            >
              <ActionButton
                style={{ flex: 1 }}
                onPress={() =>
                  router.push({
                    pathname: '/[projectId]/changeOrder/add',
                    params: {
                      projectId,
                      projectName,
                    },
                  })
                }
                type={'action'}
                title="Add Change Order"
              />
            </View>
            <FlatList
              style={{ marginTop: 10, width: '100%', borderColor: colors.border, borderTopWidth: 1 }}
              data={allChangeOrders}
              ListEmptyComponent={() => (
                <View
                  style={{
                    padding: 20,
                    width: '100%',
                    alignItems: 'center',
                    backgroundColor: colors.background,
                  }}
                >
                  <Text txtSize="sub-title" style={{ color: colors.text }}>
                    No change orders found.
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id ?? ''}
              renderItem={({ item }) => (
                <View style={{ borderColor: colors.border, borderBottomWidth: 1 }}>
                  <SwipeableChangeOrder projectId={projectId} item={item} />
                </View>
              )}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ChangeOrdersScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items at the top vertically
    alignItems: 'center', // Center horizontally
    width: '100%',
  },
});
