import { Text, View } from '@/src/components/Themed';
import { useAuthToken } from '@/src/context/AuthTokenContext';
import { useColors } from '@/src/context/ColorsContext';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/src/components/ActionButton';
import SwipeableChangeOrder from '@/src/components/SwipeableChangeOrder';
import { API_BASE_URL } from '@/src/constants/app-constants';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import {
  useAllRows,
  useIsStoreAvailableCallback,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAuth } from '@clerk/clerk-expo';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';

const getChangeOrderStatuses = async (projectId: string, token: string): Promise<string | null> => {
  try {
    console.log('getChangeOrderStatuses projectId:', projectId);
    const response = await fetch(`${API_BASE_URL}/GetChangeOrderStatuses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId: projectId }),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching change order statuses:', error);
    throw new Error('Failed to fetch change order statuses. Please try again.');
  } finally {
    console.log('Completed getChangeOrderStatuses call');
  }
};

interface ChangeOrderStatus {
  change_order_id: string;
  approved: number;
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
  const { token } = useAuthToken();
  const appSettings = useAppSettings();
  const currentProject = useProject(projectId);

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

  // Check if required app settings are defined
  const isAppSettingsComplete =
    appSettings.companyName?.trim() && appSettings.ownerName?.trim() && appSettings.email?.trim();

  // Check if required project owner info is defined
  const isProjectOwnerInfoComplete = currentProject?.ownerName?.trim() && currentProject?.ownerEmail?.trim();

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        if (!token) {
          console.log('No token available');
          return;
        }
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
        ) : !isAppSettingsComplete ? (
          <View style={styles.messageContainer}>
            <Text txtSize="sub-title" style={{ color: colors.text }}>
              Before creating change orders, the name and email of your company's owner or primary contact are
              required.
            </Text>
            <Text txtSize="sub-title" style={{ color: colors.text }}>
              Please make sure the required data are defined in the company settings to continue.
            </Text>
            <ActionButton
              style={{ minWidth: 200 }}
              onPress={() => router.push('/appSettings/SetAppSettings')}
              type={'action'}
              title="Edit Company Settings"
            />
          </View>
        ) : !isProjectOwnerInfoComplete ? (
          <View style={styles.messageContainer}>
            <Text txtSize="sub-title" style={{ color: colors.text }}>
              Before creating change orders, the name and email of the project's owner or primary contact are
              required.
            </Text>
            <Text txtSize="sub-title" style={{ color: colors.text }}>
              Please make sure the required data are defined in the project info to continue.
            </Text>
            <ActionButton
              style={{ minWidth: 200 }}
              onPress={() =>
                router.push({
                  pathname: '/[projectId]/edit',
                  params: {
                    projectId,
                    projectName,
                  },
                })
              }
              type={'action'}
              title="Edit Project Info"
            />
          </View>
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
            <View
              style={{
                width: '100%',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text txtSize="title" style={{ marginVertical: 5 }}>
                Project Change Orders
              </Text>
            </View>

            <FlatList
              style={{ marginTop: 10, width: '100%', flex: 1 }}
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
  messageContainer: {
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
});
