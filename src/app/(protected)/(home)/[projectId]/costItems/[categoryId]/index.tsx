import { Text, View } from '@/src/components/Themed';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAllRows as useAllConfigRows,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import {
  useAllRows,
  useIsStoreAvailableCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { FontAwesome5, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CostItemData, CostItemDataCodeCompareAsNumber } from '@/src/models/types';
import CostSummaryItem from '@/src/components/CostSummaryItem';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { formatCurrency } from '@/src/utils/formatters';

const CategorySpecificCostItemsPage = () => {
  const router = useRouter();

  const { projectId, categoryId } = useLocalSearchParams<{
    projectId: string;
    categoryId: string;
  }>();
  const colors = useColors();
  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
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

  // All hooks must be called before any conditional returns
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

      const balance = costItem.complete ? 0 : costItem.bidAmount - spentAmount;

      costItems.push({
        id: costItem.id,
        workItemId: workItem.id,
        code: workItem.code,
        title: workItem.name,
        bidAmount: costItem.bidAmount,
        complete: costItem.complete,
        spentAmount: spentAmount,
        balance: balance,
      });
    }

    return costItems.sort(CostItemDataCodeCompareAsNumber);
  }, [allWorkItemSummaries, allWorkItems, allActualCostItems, categoryId]);

  const numberOfCostItems = useMemo(() => costItemSummaries.length, [costItemSummaries]);
  const numberOfCompletedCostItems = useMemo(
    () => costItemSummaries.filter((ci) => ci.complete).length,
    [costItemSummaries],
  );

  const bidAmount = useMemo(
    () => costItemSummaries.reduce((sum, item) => sum + item.bidAmount, 0),
    [costItemSummaries],
  );

  const amountSpent = useMemo(
    () => costItemSummaries.reduce((sum, item) => sum + item.spentAmount, 0),
    [costItemSummaries],
  );

  // create projectBalance by summing sectionData totalBalance
  const balance = useMemo(() => {
    return costItemSummaries.reduce((sum, item) => sum + item.balance, 0);
  }, [costItemSummaries]);

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
                  pathname: '/[projectId]/costItems/[categoryId]/addCostItems',
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
                router.push({
                  pathname: '/[projectId]/setEstimatedCosts',
                  params: { projectId, projectName: projectData!.name, categoryId },
                });
              },
            } as ActionButtonProps,
          ]
        : []),
    ],
    [
      colors,
      allWorkItemSummaries,
      unusedWorkItemsIdsInCategory,
      costItemsCategory,
      projectData,
      projectId,
      categoryId,
      unusedWorkItemsInCategoryString,
      router,
    ],
  );

  if (!projectData) {
    // Redirect to the projects list if no project data is found
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Cost Breakdown',
          headerRight: () => (
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
          ),
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
                <Text text={`est: ${formatCurrency(bidAmount, true, true)}`} />
                <Text text={`bal: ${formatCurrency(balance, true, true)}`} />
              </View>
              <View
                style={{
                  marginTop: 5,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Text text={`spent: ${formatCurrency(amountSpent, true, true)}`} />
                <Text text={`complete: ${numberOfCompletedCostItems} of ${numberOfCostItems}`} />
              </View>
            </View>
            <View style={{ flex: 1, paddingBottom: 5 }}>
              <View
                style={{
                  width: '100%',
                  paddingLeft: 10,
                  paddingRight: 36,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  gap: 5,
                  backgroundColor: colors.sectionHeaderBG,
                }}
              >
                <Text style={{ width: '33%', textAlign: 'right' }} text="Estimate $" />
                <Text style={{ width: '33%', textAlign: 'right' }} text="Spent $" />
                <Text style={{ width: '33%', textAlign: 'right' }} text="Balance $" />
              </View>
              <FlatList
                showsVerticalScrollIndicator={false}
                data={costItemSummaries}
                renderItem={({ item }) => (
                  <CostSummaryItem
                    item={item}
                    sectionCode={costItemsCategory?.code ?? ''}
                    projectId={projectId}
                  />
                )}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text>No data available</Text>}
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
  headerContainer: {
    marginTop: 5,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5,
    borderBottomWidth: 1,
  },
});

export default CategorySpecificCostItemsPage;
