import { ActionButtonProps } from '@/src/components/ButtonBar';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { Text, View } from '@/src/components/Themed';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { CostSectionData, CostSectionDataCodeCompareAsNumber } from '@/src/models/types';
import {
  useAllRows as useAllConfigRows,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useDeleteProjectCallback, useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import {
  useAllRows,
  useBidAmountUpdater,
  useCostUpdater,
  useDeleteRowCallback,
  useIsStoreAvailableCallback,
  useSeedWorkItemsIfNecessary,
  useSetWorkItemSpentSummaryCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const ITEM_HEIGHT = 45;

const ProjectDetailsPage = () => {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const colors = useColors();
  const projectData = useProject(projectId);
  const processDeleteProject = useDeleteProjectCallback();
  const { removeActiveProjectId, addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
  const allProjectCategories = useAllConfigRows('categories', WorkCategoryCodeCompareAsNumber);
  const allWorkItems = useAllConfigRows('workItems', WorkItemDataCodeCompareAsNumber);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const updateWorkItemSpentSummary = useSetWorkItemSpentSummaryCallback(projectId);
  const allActualCostItems = useAllRows(projectId, 'workItemCostEntries');
  const allReceiptItems = useAllRows(projectId, 'receipts');
  const removeCostItem = useDeleteRowCallback(projectId, 'workItemCostEntries');
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

  useSeedWorkItemsIfNecessary(projectId);
  useCostUpdater(projectId);
  useBidAmountUpdater(projectId);

  const workItemMap = useMemo(() => {
    return new Map(allWorkItems.map((w) => [w.id, w]));
  }, [allWorkItems]);

  const categoryMap = useMemo(() => {
    return new Map(allProjectCategories.map((c) => [c.id, c]));
  }, [allProjectCategories]);

  const sectionData = useMemo(() => {
    const sections: CostSectionData[] = [];

    for (const costItem of allWorkItemSummaries) {
      const workItem = workItemMap.get(costItem.workItemId);
      if (!workItem) continue;

      const category = categoryMap.get(workItem.categoryId);
      if (!category) continue;

      const spentAmount = allActualCostItems
        .filter((i) => i.workItemId === workItem.id)
        .reduce((sum, item) => sum + item.amount, 0);

      // update the spent amount per workItem
      updateWorkItemSpentSummary(costItem.workItemId, { spentAmount: spentAmount });

      let section = sections.find((sec) => sec.categoryId === category.id);
      if (!section) {
        section = {
          categoryId: category.id,
          code: category.code,
          title: category.name,
          totalBidAmount: 0,
          totalSpentAmount: 0,
          data: [],
        };
        sections.push(section);
      }

      section.data.push({
        id: costItem.id,
        workItemId: workItem.id,
        code: workItem.code,
        title: workItem.name,
        bidAmount: costItem.bidAmount,
        spentAmount: spentAmount,
      });
    }

    sections.forEach((section) => {
      section.totalBidAmount = section.data.reduce((sum, item) => sum + item.bidAmount, 0);
      section.totalSpentAmount = section.data.reduce((sum, item) => sum + item.spentAmount, 0);
    });

    return sections.sort(CostSectionDataCodeCompareAsNumber);
  }, [allWorkItemSummaries, allActualCostItems, workItemMap, categoryMap, updateWorkItemSpentSummary]);

  // get a list of unused work items not represented in allWorkItemSummaries
  const unusedWorkItems = useMemo(
    () => allWorkItems.filter((w) => !allWorkItemSummaries.some((i) => i.workItemId === w.id)),
    [allWorkItems, allWorkItemSummaries],
  );

  // get a list of all unique categories from unusedWorkItems
  const unusedCategories = useMemo(() => {
    const usedCategories = new Set(
      allWorkItemSummaries.map((ws) => {
        const wrkItem = workItemMap.get(ws.workItemId);
        return wrkItem ? categoryMap.get(wrkItem.categoryId) : null;
      }),
    );

    return Array.from(
      new Set(
        unusedWorkItems.map((w) => w.categoryId).filter((id) => !usedCategories.has(categoryMap.get(id))),
      ),
    );
  }, [unusedWorkItems, allWorkItemSummaries, workItemMap, categoryMap]);

  const unusedCategoriesString = useMemo(() => unusedCategories.join(','), [unusedCategories]);

  const ExportCostItems = useCallback(async () => {
    if (!projectId || !projectData) return;

    try {
      // Create CSV header
      const header = 'Code,Category,Work Item,Estimate,Cost\n';

      // Group work items by category and work item, then sort
      const sortedWorkItems = allWorkItems
        .map((workItem) => {
          const category = categoryMap.get(workItem.categoryId);
          const workItemSummary = allWorkItemSummaries.find((summary) => summary.workItemId === workItem.id);
          const costs = allActualCostItems.filter((cost) => cost.workItemId === workItem.id);

          return {
            catCode: parseInt(category?.code || '0'),
            workItemCode: parseInt(workItem.code || '0'),
            code: `${category?.code}.${workItem.code}`,
            category: (category?.name || '').replace(/,/g, ' '),
            workItem: workItem.name.replace(/,/g, ' '),
            estimate: workItemSummary?.bidAmount || 0,
            costs: costs.map((c) => parseFloat(c.amount.toFixed(2))),
          };
        })
        .sort((a, b) => {
          // Compare categories first
          const catCompare = a.catCode - b.catCode;
          if (catCompare !== 0) return catCompare;
          // Then compare work items
          return a.workItemCode - b.workItemCode;
        });

      // Build CSV rows
      const csvRows: string[] = [];

      sortedWorkItems.forEach((item) => {
        const totalCost = item.costs.reduce((sum, cost) => sum + cost, 0);

        // First row for this work item with all details and total cost
        csvRows.push(
          `'${item.code},${item.category},${item.workItem},${item.estimate.toFixed(2)},${totalCost.toFixed(
            2,
          )}`,
        );

        // Subsequent rows for individual costs (if there are multiple costs)
        if (item.costs.length > 1) {
          item.costs.forEach((cost) => {
            csvRows.push(`,,,,${cost.toFixed(2)}`);
          });
        }
      });

      // Combine header and content
      const fullContent = header + csvRows.join('\n');

      // Create file path in cache directory
      const fileName = `${projectData.name.replace(/[^a-zA-Z0-9]/g, '_')}_costs_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      // Write the file
      await FileSystem.writeAsStringAsync(filePath, fullContent);

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        Alert.alert('Export Complete', 'Would you like to share this file?', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Share',
            onPress: async () => {
              try {
                await Sharing.shareAsync(filePath, {
                  mimeType: 'text/csv',
                  dialogTitle: 'Share Cost Items Export',
                });
              } catch (error) {
                console.error('Error sharing file:', error);
                Alert.alert('Error', 'Failed to share the export file');
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error exporting cost items:', error);
      Alert.alert('Error', 'Failed to export cost items');
    }
  }, [projectId, projectData, allWorkItems, categoryMap, allWorkItemSummaries, allActualCostItems]);

  const handleMenuItemPress = useCallback(
    (menuItem: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (menuItem === 'Edit' && projectId) {
        router.push({
          pathname: '/[projectId]/edit',
          params: { projectId, projectName: projectData!.name },
        });
        return;
      } else if (menuItem === 'SetEstimates' && projectId) {
        router.push({
          pathname: '/[projectId]/setEstimatedCosts',
          params: { projectId, projectName: projectData!.name },
        });
        return;
      } else if (menuItem === 'AddCostCategory' && projectId) {
        router.push({
          pathname: '/[projectId]/addCostCategory',
          params: {
            projectId,
            projectName: projectData!.name,
            availableCategories: unusedCategoriesString,
          },
        });
        return;
      } else if (menuItem === 'Delete' && projectId) {
        Alert.alert('Delete Project', 'Are you sure you want to delete this project?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            onPress: () => {
              const result = processDeleteProject(projectId);
              if (result.status === 'Success') {
                removeActiveProjectId(projectId);
              }
              router.replace('/');
            },
          },
        ]);
        return;
      } else if (menuItem === 'CleanCostItems' && projectId) {
        Alert.alert(
          'Clean Cost Items',
          'Are you sure you want to clean cost items that do not have a match receipt?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clean-up',
              onPress: () => {
                // remove all cost items that do not have a matching receipt
                const costItemsToRemove = allActualCostItems.filter(
                  (costItem) =>
                    !allReceiptItems.some(
                      (r) => r.id === costItem.parentId && costItem.documentationType === 'receipt',
                    ),
                );
                costItemsToRemove.forEach((item) => {
                  const result = removeCostItem(item.id);
                  if (result.status !== 'Success') {
                    console.error(`Error cleaning cost item ${item.id}: ${result.msg}`);
                  }
                });
              },
            },
          ],
        );
        return;
      } else if (menuItem === 'ExportCostItems' && projectId) {
        ExportCostItems();
        return;
      }
    },
    [
      projectId,
      projectData,
      router,
      processDeleteProject,
      removeActiveProjectId,
      ExportCostItems,
      allActualCostItems,
      allReceiptItems,
      removeCostItem,
      unusedCategoriesString,
    ],
  );

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <FontAwesome name="edit" size={28} color={colors.iconColor} />,
        label: 'Edit Project Info',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Edit', actionContext);
        },
      },
      ...(unusedCategories.length > 0
        ? [
            {
              icon: <FontAwesome6 name="circle-dollar-to-slot" size={28} color={colors.iconColor} />,
              label: 'Add Cost Category',
              onPress: (e, actionContext) => {
                handleMenuItemPress('AddCostCategory', actionContext);
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
                handleMenuItemPress('SetEstimates', actionContext);
              },
            } as ActionButtonProps,
          ]
        : []),
      {
        icon: <FontAwesome name="trash" size={28} color={colors.iconColor} />,
        label: 'Delete Project',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Delete', actionContext);
        },
      },
      ...(allWorkItemSummaries.length > 0
        ? [
            {
              icon: <FontAwesome5 name="broom" size={28} color={colors.iconColor} />,
              label: 'Cost Item Cleanup',
              onPress: (e, actionContext) => {
                handleMenuItemPress('CleanCostItems', actionContext);
              },
            } as ActionButtonProps,
            {
              icon: <MaterialCommunityIcons name="export" size={28} color={colors.iconColor} />,
              label: 'Export Cost Items',
              onPress: (e, actionContext) => {
                handleMenuItemPress('ExportCostItems', actionContext);
              },
            } as ActionButtonProps,
          ]
        : []),
    ],
    [colors, allWorkItemSummaries, handleMenuItemPress, unusedCategories],
  );

  const renderItem = (item: CostSectionData, projectId: string) => {
    const showSection = (): void => {
      // use router to push to the cost items page
      router.push({
        pathname: '/[projectId]/costItems/[categoryId]',
        params: {
          projectId,
          categoryId: item.categoryId,
          bidAmount: formatCurrency(item.totalBidAmount, true, true),
          amountSpent: formatCurrency(item.totalSpentAmount, true, true),
        },
      });
    };

    return (
      <View
        style={[
          styles.header,
          {
            borderColor: colors.border,
            backgroundColor: colors.listBackground,
            borderBottomWidth: 1,
            alignItems: 'center',
            height: ITEM_HEIGHT,
          },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={showSection} hitSlop={10}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.listBackground,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              numberOfLines={1}
              style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', color: colors.sectionFG }}
              text={item.title}
            />
            <Text
              style={{ width: 100, textAlign: 'right', color: colors.sectionFG }}
              text={formatCurrency(item.totalBidAmount, false, true)}
            />
            <Text
              style={{ width: 100, textAlign: 'right', color: colors.sectionFG }}
              text={formatCurrency(item.totalSpentAmount, false, true)}
            />
            <View
              style={{
                width: 36,
                paddingLeft: 5,
                alignItems: 'center',
                backgroundColor: colors.listBackground,
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name={'chevron-right'} size={24} color={colors.sectionFG} />
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  if (!projectData) {
    // Redirect to the projects list if no project data is found
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Project Overview',
          headerRight: () => (
            <View style={{ marginRight: 0 }}>
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
            </View>
          ),
        }}
      />

      <View style={styles.container}>
        {!projectIsReady ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <View style={styles.headerContainer}>
              <Text txtSize="title" text={projectData.name} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Text text={`start: ${formatDate(projectData.startDate)}`} />
                <Text text={`estimate: ${formatCurrency(projectData.bidPrice, true)}`} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Text text={`due: ${formatDate(projectData.plannedFinish)}`} />
                <Text text={`spent: ${formatCurrency(projectData.amountSpent, true)}`} />
              </View>
            </View>
            <View style={{ flex: 1, paddingBottom: 5 }}>
              <View style={{ marginBottom: 5, alignItems: 'center' }}>
                <Text txtSize="title" text="Cost Item Summary" />
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
                data={sectionData}
                renderItem={({ item }) => renderItem(item, projectId)}
                keyExtractor={(item) => item.categoryId}
                ListEmptyComponent={<Text>No data available</Text>}
              />
            </View>
          </>
        )}
      </View>
      {headerMenuModalVisible && (
        <RightHeaderMenu
          modalVisible={headerMenuModalVisible}
          setModalVisible={setHeaderMenuModalVisible}
          buttons={rightHeaderMenuButtons}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
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
});

export default ProjectDetailsPage;
