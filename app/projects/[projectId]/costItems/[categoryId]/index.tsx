import { Text, View } from '@/components/Themed';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import { useColors } from '@/context/ColorsContext';
import {
  useAllRows as useAllConfigRows,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { useProject } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import { useAllRows, useIsStoreAvailableCallback } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { FontAwesome5, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CostItemData, CostItemDataCodeCompareAsNumber } from '../../index';
import SwipeableCostSummary from '../../SwipeableCostSummary';
import { ActionButtonProps } from '@/components/ButtonBar';
import RightHeaderMenu from '@/components/RightHeaderMenu';

const ITEM_HEIGHT = 45;

const CategorySpecificCostItemsPage = () => {
  const router = useRouter();

  const { projectId, categoryId, bidAmount, amountSpent } = useLocalSearchParams<{
    projectId: string;
    categoryId: string;
    bidAmount: string;
    amountSpent: string;
  }>();
  const colors = useColors();
  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);
  const { removeActiveProjectId, addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const allActualCostItems = useAllRows(projectId, 'workItemCostEntries');
  const allProjectCategories = useAllConfigRows('categories', WorkCategoryCodeCompareAsNumber);
  const allWorkItems = useAllConfigRows('workItems', WorkItemDataCodeCompareAsNumber);

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);

  const projectData = useProject(projectId);

  if (!projectData) {
    // Redirect to the projects list if no project data is found
    return <Redirect href="/projects" />;
  }

  const costItemsCategory = useMemo(
    () => allProjectCategories.find((c) => c.id === categoryId),
    [allProjectCategories, categoryId],
  );

  const costItemSummaries = useMemo(() => {
    const costItems: CostItemData[] = [];
    const workItemMap = new Map(allWorkItems.map((w) => [w.id, w]));
    for (const costItem of allWorkItemSummaries) {
      const workItem = workItemMap.get(costItem.workItemId);
      if (!workItem || workItem.categoryId !== categoryId) continue;

      const spentAmount = allActualCostItems
        .filter((i) => i.workItemId === workItem.id)
        .reduce((sum, item) => sum + item.amount, 0);

      costItems.push({
        id: costItem.id,
        workItemId: workItem.id,
        code: workItem.code,
        title: workItem.name,
        bidAmount: costItem.bidAmount,
        spentAmount: spentAmount,
      });
    }

    return costItems.sort(CostItemDataCodeCompareAsNumber);
  }, [allWorkItemSummaries, allWorkItems, allActualCostItems, categoryId]);

  // get a list of unused work items not represented in allWorkItemSummaries and in the current category
  const unusedWorkItemsIdsInCategory = useMemo(
    () =>
      allWorkItems
        .filter(
          (w) => !allWorkItemSummaries.some((s) => s.workItemId === w.id) && w.categoryId === categoryId,
        )
        .map((wi) => wi.id),
    [allWorkItemSummaries, allWorkItems, categoryId],
  );

  const unusedWorkItemsInCategoryString = useMemo(
    () => unusedWorkItemsIdsInCategory.join(','),
    [unusedWorkItemsIdsInCategory],
  );

  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      ...(unusedWorkItemsIdsInCategory.length > 0
        ? [
            {
              icon: <FontAwesome6 name="circle-dollar-to-slot" size={28} color={colors.iconColor} />,
              label: 'Add Cost Items',
              onPress: (e, actionContext) => {
                setHeaderMenuModalVisible(false);
                router.push({
                  pathname: '/projects/[projectId]/costItems/[categoryId]/addCostItems',
                  params: {
                    projectId,
                    categoryId,
                    categoryName: costItemsCategory?.name,
                    categoryCode: costItemsCategory?.code,
                    availableWorkItemIds: unusedWorkItemsInCategoryString,
                  },
                });
              },
            } as ActionButtonProps,
          ]
        : []),
      ...(allWorkItemSummaries.length > 0
        ? [
            {
              icon: <FontAwesome5 name="search-dollar" size={28} color={colors.iconColor} />,
              label: 'Set Estimate Costs',
              onPress: (e, actionContext) => {
                setHeaderMenuModalVisible(false);
                router.push(
                  `/projects/${projectId}/setEstimatedCosts/?projectName=${encodeURIComponent(
                    projectData!.name,
                  )}&categoryId=${categoryId}`,
                );
              },
            } as ActionButtonProps,
          ]
        : []),
    ],
    [colors, allWorkItemSummaries],
  );

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Cost Breakdown',
          headerRight: () => {
            if (Platform.OS === 'ios')
              return (
                <Pressable
                  style={{ marginRight: 0 }}
                  onPress={() => {
                    setHeaderMenuModalVisible(!headerMenuModalVisible);
                  }}
                >
                  {({ pressed }) => (
                    <MaterialCommunityIcons
                      name="menu"
                      size={28}
                      color={colors.iconColor}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              );
            return (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  alignContent: 'flex-end',
                  backgroundColor: 'transparent',
                }}
              >
                {unusedWorkItemsIdsInCategory.length > 0 && (
                  <Pressable
                    style={{ marginRight: 0 }}
                    onPress={() => {
                      router.push({
                        pathname: '/projects/[projectId]/costItems/[categoryId]/addCostItems',
                        params: {
                          projectId,
                          categoryId,
                          categoryName: costItemsCategory?.name,
                          categoryCode: costItemsCategory?.code,
                          availableWorkItemIds: unusedWorkItemsInCategoryString,
                        },
                      });
                    }}
                  >
                    <FontAwesome6 name="circle-dollar-to-slot" size={24} color={colors.iconColor} />
                  </Pressable>
                )}
                <Pressable
                  style={{ marginRight: 0 }}
                  onPress={() => {
                    router.push(
                      `/projects/${projectId}/setEstimatedCosts/?projectName=${encodeURIComponent(
                        projectData!.name,
                      )}&categoryId=${categoryId}`,
                    );
                  }}
                >
                  <FontAwesome5 name="search-dollar" size={24} color={colors.iconColor} />
                </Pressable>
              </View>
            );
          },
        }}
      />

      <View style={styles.container}>
        {!projectIsReady ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <View style={[styles.headerContainer, { borderColor: colors.border }]}>
              <Text txtSize="title" text={projectData.name} />
              <Text txtSize="sub-title" text={costItemsCategory?.name} />
              <View
                style={{
                  marginTop: 5,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Text text={`estimate: ${bidAmount}`} />
                <Text text={`spent: ${amountSpent}`} />
              </View>
            </View>
            <View style={{ flex: 1, paddingBottom: 5 }}>
              <View style={{ marginVertical: 5, alignItems: 'center' }}>
                <Text txtSize="title" text="Individual Cost Items" />
              </View>
              <View
                style={{
                  width: '100%',
                  paddingLeft: 10,
                  paddingRight: 36,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  backgroundColor: colors.sectionHeaderBG,
                }}
              >
                <Text style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }} text="Description" />
                <Text style={{ width: 100, textAlign: 'right' }} text="Estimate $" />
                <Text style={{ width: 100, textAlign: 'right' }} text="Spent $" />
              </View>
              <FlashList
                showsVerticalScrollIndicator={false}
                data={costItemSummaries}
                renderItem={({ item }) => (
                  <SwipeableCostSummary
                    item={item}
                    sectionCode={costItemsCategory?.code ?? ''}
                    projectId={projectId}
                  />
                )}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text>No data available</Text>}
                estimatedItemSize={ITEM_HEIGHT}
              />
            </View>
            {headerMenuModalVisible && (
              <RightHeaderMenu
                modalVisible={headerMenuModalVisible}
                setModalVisible={setHeaderMenuModalVisible}
                buttons={rightHeaderMenuButtons}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 5,
    borderTopWidth: 1,
  },

  headerContainer: {
    marginTop: 5,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5,
    borderBottomWidth: 1,
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
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 16,
  },
});

export default CategorySpecificCostItemsPage;
