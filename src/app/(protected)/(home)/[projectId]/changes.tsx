import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import SwipeableChangeOrder from '@/src/components/SwipeableChangeOrder';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import {
  useAllRows,
  useIsStoreAvailableCallback,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';
import { ActionButton } from '@/src/components/ActionButton';
import { useProjectListStoreId, useProjectValue } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useAuth } from '@clerk/clerk-expo';

const getChangeOrderStatuses = async (projectId: string, token: string): Promise<string | null> => {
  try {
    // TODO: Save the backend URI in a config file
    console.log('getChangeOrderStatuses projectId:', projectId);
    // RESTful API call to generate and send PDF
    const response = await fetch(
      'https://projecthoundbackend.keith-m-bertram.workers.dev/GetChangeOrderStatuses',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: projectId }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching change order statuses:', error);
    throw new Error('Failed to fetch change order statuses. Please try again.');
  }
};

interface ChangeOrderStatus {
  change_order_id: string;
  approved: number;
  // Add other properties if needed
}

interface ChangeOrderStatusResponse {
  data: ChangeOrderStatus[];
}

const ChangeOrdersScreen = () => {
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
  const colors = useColors();
  const router = useRouter();
  const updateChangeOrder = useUpdateRowCallback(projectId, 'changeOrders');
  const auth = useAuth();

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

  // Get the update function from your TinyBase store
  // You'll need to import this from your ProjectDetailsStoreHooks
  // const updateChangeOrder = useUpdateChangeOrder(projectId);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const token = (await auth.getToken()) ?? '';
        const changeOrderStatusString = await getChangeOrderStatuses(projectId, token);
        console.log('Change Order Statuses:', changeOrderStatusString);

        if (!changeOrderStatusString) {
          console.log('No status data received');
          return;
        }

        const changeOrderStatusResponse: ChangeOrderStatusResponse = JSON.parse(changeOrderStatusString);
        console.log('Parsed Change Order Statuses:', changeOrderStatusResponse);

        // Create a map of change_order_id to status for quick lookup
        const statusMap = new Map<string, 'draft' | 'approval-pending' | 'approved' | 'cancelled'>();

        if (changeOrderStatusResponse.data && Array.isArray(changeOrderStatusResponse.data)) {
          changeOrderStatusResponse.data.forEach((statusItem) => {
            const status = statusItem.approved === 1 ? 'approved' : 'approval-pending';
            statusMap.set(statusItem.change_order_id, status);
          });
        }

        // Update all change orders with their status
        const updatedChangeOrders = allChangeOrders?.map((changeOrder) => {
          const changeOrderId = changeOrder.id;
          if (!changeOrderId) return changeOrder;
          const newStatus = statusMap.get(changeOrderId) || 'draft';
          return { ...changeOrder, status: newStatus };
        });

        if (updatedChangeOrders) {
          updatedChangeOrders.forEach((changeOrder) => {
            const changeOrderId = changeOrder.id;
            if (changeOrderId) {
              const newStatus = changeOrder.status;
              // Update the change order status in your TinyBase store
              updateChangeOrder(changeOrderId, { status: newStatus });
            }
          });
        }
      } catch (error) {
        console.error('Error fetching change order statuses:', error);
      }
    };

    // Only fetch if we have change orders
    if (allChangeOrders && allChangeOrders.length > 0) {
      fetchStatuses();
    }
  }, [auth, projectId, allChangeOrders]);

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
