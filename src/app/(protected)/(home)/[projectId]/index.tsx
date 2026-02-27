import { ActionButton } from '@/src/components/ActionButton';
import { ActionButtonProps, ButtonBar } from '@/src/components/ButtonBar';
import { DeleteProjectConfirmationModal } from '@/src/components/DeleteProjectConfirmationModal';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { SvgImage } from '@/src/components/SvgImage';
import { Text, View } from '@/src/components/Themed';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
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
  useClearProjectDetailsStoreCallback,
  useCostUpdater,
  useDeleteRowCallback,
  useIsStoreAvailableCallback,
  useSeedWorkItemsIfNecessary,
  useWorkItemSpentUpdater,
  useWorkItemsWithoutCosts,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import { doesProjectExistInQuickBooks, addProjectToQuickBooks } from '@/src/utils/quickbooksAPI';
import { FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { File, Paths } from 'expo-file-system';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';

const ProjectDetailsPage = () => {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const colors = useColors();
  const projectData = useProject(projectId);
  const processDeleteProject = useDeleteProjectCallback();
  const { removeActiveProjectId, addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
  const clearProjectDetailsStore = useClearProjectDetailsStoreCallback(projectId);
  const allProjectCategories = useAllConfigRows('categories', WorkCategoryCodeCompareAsNumber);
  const allWorkItems = useAllConfigRows('workItems', WorkItemDataCodeCompareAsNumber);
  const allCustomers = useAllConfigRows('customers');
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [deleteConfirmationModalVisible, setDeleteConfirmationModalVisible] = useState<boolean>(false);
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const allActualCostItems = useAllRows(projectId, 'workItemCostEntries');
  const removeWorkItemSummary = useDeleteRowCallback(projectId, 'workItemSummaries');
  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);
  const workItemsWithoutCosts = useWorkItemsWithoutCosts(projectId);
  const allChangeOrders = useAllRows(projectId, 'changeOrders');
  const { isConnectedToQuickBooks } = useNetwork();
  const { orgId, userId, getToken } = useAuth();
  const isConnectedToQBRef = useRef(isConnectedToQuickBooks);
  const syncedProjectsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    isConnectedToQBRef.current = isConnectedToQuickBooks;
  }, [isConnectedToQuickBooks]);

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  const projectCustomer = useMemo(() => {
    return allCustomers.find((c) => c.id === projectData?.customerId);
  }, [allCustomers, projectData]);

  const projectCustomerQbId = useMemo(() => projectCustomer?.accountingId, [projectCustomer]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);

  // QuickBooks sync on project details page mount
  useEffect(() => {
    if (!projectId || !projectData || !orgId || !userId || !getToken || !projectCustomerQbId) return;

    // Prevent sync from running multiple times for the same projectId
    if (syncedProjectsRef.current.has(projectId)) {
      //console.log('[QBSync] Project already synced in this session:', projectId);
      return;
    }

    const syncWithQuickBooks = async () => {
      // Mark as synced immediately to prevent concurrent re-runs triggered by
      // unstable dependency references (getToken, projectData, projectCustomerQbId)
      // before any async work completes.
      syncedProjectsRef.current.add(projectId);
      console.log('[QBSync] Starting QB sync for project:', projectId);

      if (!isConnectedToQBRef.current) {
        console.log('[QBSync] QB not connected, skipping sync');
        return;
      }

      try {
        const projectName = projectData.name;

        const exists = await doesProjectExistInQuickBooks(orgId, projectId, userId, getToken);
        console.log('[QBSync] Project existence check result:', { projectId, exists });

        if (exists) {
          console.log('[QBSync] Project already exists in QuickBooks');
          return;
        }

        console.log('[QBSync] Adding project to QB with params:', {
          orgId,
          userId,
          projectId,
          projectName,
          customerId: projectCustomerQbId,
        });

        await addProjectToQuickBooks(
          orgId,
          userId,
          { customerId: projectCustomerQbId, projectName, projectId },
          getToken,
        );
        console.log('[QBSync] Project added to QuickBooks successfully');
      } catch (error) {
        console.error('[QBSync] Failed to sync project with QuickBooks:', error);
        if (error instanceof Error) {
          console.error('[QBSync] Error message:', error.message);
          console.error('[QBSync] Error stack:', error.stack);
        }
      }
    };

    syncWithQuickBooks();
  }, [projectId, orgId, userId, getToken, projectData, projectCustomerQbId]);

  useSeedWorkItemsIfNecessary(projectId);
  useCostUpdater(projectId);
  useBidAmountUpdater(projectId);
  useWorkItemSpentUpdater(projectId);

  const numWorkItemSummaries = useMemo(() => allWorkItemSummaries.length, [allWorkItemSummaries]);
  const numCompletedWorkItemSummaries = useMemo(
    () => allWorkItemSummaries.filter((wis) => wis.complete).length,
    [allWorkItemSummaries],
  );

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
        .filter((i) => i.workItemId === workItem.id && (i.projectId ? i.projectId === projectId : true))
        .reduce((sum, item) => sum + item.amount, 0);

      let section = sections.find((sec) => sec.categoryId === category.id);
      if (!section) {
        section = {
          categoryId: category.id,
          code: category.code,
          title: category.name,
          totalBidAmount: 0,
          totalSpentAmount: 0,
          totalBalance: 0,
          data: [],
        };
        sections.push(section);
      }

      const balance = costItem.complete ? 0 : costItem.bidAmount - spentAmount;

      section.data.push({
        id: costItem.id,
        workItemId: workItem.id,
        code: workItem.code,
        title: workItem.name,
        bidAmount: costItem.bidAmount,
        spentAmount: spentAmount,
        balance: balance,
        complete: costItem.complete,
      });
    }

    sections.forEach((section) => {
      section.totalBidAmount = section.data.reduce((sum, item) => sum + item.bidAmount, 0);
      section.totalSpentAmount = section.data.reduce((sum, item) => sum + item.spentAmount, 0);
      section.totalBalance = section.data.reduce((sum, item) => sum + item.balance, 0);
    });

    return sections.sort(CostSectionDataCodeCompareAsNumber);
  }, [allWorkItemSummaries, allActualCostItems, workItemMap, categoryMap]);

  // create projectBalance by summing sectionData totalBalance
  const projectBalance = useMemo(() => {
    return sectionData.reduce((sum, section) => sum + section.totalBalance, 0);
  }, [sectionData]);

  // get a list of unused work items not represented in allWorkItemSummaries
  const unusedWorkItems = useMemo(
    () => allWorkItems.filter((w) => !allWorkItemSummaries.some((i) => i.workItemId === w.id)),
    [allWorkItems, allWorkItemSummaries],
  );

  // get a list of all unique categories from unusedWorkItems
  const unusedCategories = useMemo(() => {
    const usedCategoryIds = new Set(
      unusedWorkItems.map((wi) => {
        return wi.categoryId;
      }),
    );

    return Array.from(usedCategoryIds);
  }, [unusedWorkItems]);

  const unusedCategoriesString = useMemo(() => unusedCategories.join(','), [unusedCategories]);

  // add up total quotedPrice from changeOrders and projectData.quotedPrice
  const totalQuotedPrice = useMemo(() => {
    // sum change order quoted prices if change order status is 'approved'
    const changeOrdersTotal = allChangeOrders
      .filter((co) => co.status === 'approved')
      .reduce((sum, co) => sum + (co.quotedPrice ?? 0), 0);

    console.log('projectData?.quotedPrice:', projectData?.quotedPrice);
    console.log('changeOrdersTotal:', changeOrdersTotal);

    return (projectData?.quotedPrice ?? 0) + changeOrdersTotal;
  }, [projectData, allChangeOrders]);

  const ExportCostItems = useCallback(async () => {
    if (!projectId || !projectData) return;

    try {
      // Create CSV header
      const header = 'Code,Category,Work Item,Estimate,Cost,Cost Type\n';

      // Group work items by category and work item, then sort
      const sortedWorkItems = allWorkItems
        .map((workItem) => {
          const category = categoryMap.get(workItem.categoryId);
          const workItemSummary = allWorkItemSummaries.find((summary) => summary.workItemId === workItem.id);
          const costs = allActualCostItems
            .filter((cost) => cost.workItemId === workItem.id)
            .map((c) => ({
              amount: parseFloat(c.amount.toFixed(2)),
              documentationType: c.documentationType || '',
            }));

          return {
            catCode: parseInt(category?.code || '0'),
            workItemCode: parseInt(workItem.code || '0'),
            code: `${category?.code}.${workItem.code}`,
            category: (category?.name || '').replace(/,/g, ' '),
            workItem: workItem.name.replace(/,/g, ' '),
            estimate: workItemSummary?.bidAmount || 0,
            costs,
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
        const totalCost = item.costs.reduce((sum, cost) => sum + cost.amount, 0);

        // First row for this work item with all details and total cost
        csvRows.push(
          `'${item.code}',${item.category},${item.workItem},${item.estimate.toFixed(2)},${totalCost.toFixed(
            2,
          )},`,
        );

        // Subsequent rows for individual costs (if there are multiple costs)
        if (item.costs.length > 1) {
          item.costs.forEach((cost) => {
            csvRows.push(`,,,,${cost.amount.toFixed(2)},${cost.documentationType}`);
          });
        } else if (item.costs.length === 1) {
          // Update the first row to include cost type if there's only one cost
          csvRows[csvRows.length - 1] = csvRows[csvRows.length - 1] + item.costs[0].documentationType;
        }
      });

      // Combine header and content
      const fullContent = header + csvRows.join('\n');

      // Create file path in cache directory
      const fileName = `${projectData.name.replace(/[^a-zA-Z0-9]/g, '_')}_costs_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      const file = new File(Paths.cache, fileName);

      // Write the file
      file.write(fullContent);

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
                await Sharing.shareAsync(file.uri, {
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

  const handleConfirmDelete = useCallback(async () => {
    if (!projectId) return;

    // Navigate back to Project List screen
    router.back();

    // Defer deletion until after navigation begins rendering
    requestAnimationFrame(async () => {
      const result = processDeleteProject(projectId);
      if (result.status === 'Success') {
        removeActiveProjectId(projectId);
        await clearProjectDetailsStore();
      }
    });
  }, [projectId, router, processDeleteProject, removeActiveProjectId, clearProjectDetailsStore]);

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
              // Show the confirmation modal with text verification
              setDeleteConfirmationModalVisible(true);
            },
          },
        ]);
        return;
      } else if (menuItem === 'CleanCostItems' && projectId) {
        if (workItemsWithoutCosts.length === 0) {
          Alert.alert(
            'No Cost Items to Clean',
            'There are no cost items without estimates or costs to clean.',
          );
          return;
        }
        Alert.alert(
          'Clean Cost Items',
          'Are you sure you want to clean cost items that do not have any estimate or costs associated with it? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clean-up',
              onPress: () => {
                workItemsWithoutCosts.forEach((wi) => {
                  removeWorkItemSummary(wi.id);
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
      router,
      projectId,
      projectData,
      unusedCategoriesString,
      workItemsWithoutCosts,
      removeWorkItemSummary,
      ExportCostItems,
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
      ...(workItemsWithoutCosts.length > 0
        ? [
            {
              icon: <FontAwesome5 name="broom" size={28} color={colors.iconColor} />,
              label: 'Cost Item Cleanup',
              onPress: (e, actionContext) => {
                handleMenuItemPress('CleanCostItems', actionContext);
              },
            } as ActionButtonProps,
          ]
        : []),
      ...(allWorkItemSummaries.length > 0
        ? [
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
    [colors, allWorkItemSummaries, handleMenuItemPress, unusedCategories, workItemsWithoutCosts],
  );

  const projectActionButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <FontAwesome name="sticky-note-o" size={24} color={colors.iconColor} />,
        label: 'Notes',
        onPress: (e, actionContext) => {
          if (projectId && projectData)
            router.push({
              pathname: '/[projectId]/notes',
              params: {
                projectId: projectId,
                projectName: projectData.name,
              },
            });
        },
      },
      {
        icon: <FontAwesome name="photo" size={24} color={colors.iconColor} />,
        label: 'Photos',
        onPress: (e, actionContext) => {
          if (projectId && projectData)
            router.push({
              pathname: '/[projectId]/photos',
              params: {
                projectId: projectId,
                projectName: projectData.name,
              },
            });
        },
      },
      {
        icon: <Ionicons name="receipt-outline" size={24} color={colors.iconColor} />,
        label: 'Receipts',
        onPress: (e, actionContext) => {
          if (projectId && projectData)
            router.push({
              pathname: '/[projectId]/receipts',
              params: {
                projectId: projectId,
                projectName: projectData.name,
              },
            });
        },
      },
      {
        icon: <Entypo name="text-document" size={24} color={colors.iconColor} />,
        label: 'Bills',
        onPress: (e, actionContext) => {
          if (projectId && projectData)
            router.push({
              pathname: '/[projectId]/invoices',
              params: {
                projectId: projectId,
                projectName: projectData.name,
              },
            });
        },
      },
      {
        icon: <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={colors.iconColor} />,
        label: 'Changes',
        onPress: (e, actionContext) => {
          if (projectId && projectData)
            router.push({
              pathname: '/[projectId]/changes',
              params: {
                projectId: projectId,
                projectName: projectData.name,
              },
            });
        },
      },
    ],
    [colors, router, projectId, projectData],
  );

  const handleSetPriceQuotePress = useCallback(() => {
    if (projectId && projectData)
      router.push({
        pathname: '/[projectId]/setPriceQuote',
        params: {
          projectId: projectId,
          projectName: projectData.name,
        },
      });
  }, [router, projectId, projectData]);

  const renderItem = (item: CostSectionData, projectId: string) => {
    const showSection = (): void => {
      // use router to push to the cost items page
      router.push({
        pathname: '/[projectId]/costItems/[categoryId]',
        params: {
          projectId,
          categoryId: item.categoryId,
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
          },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={showSection}>
          <View>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                overflow: 'hidden',
                color: colors.sectionFG,
                backgroundColor: colors.listBackground,
                fontWeight: '700',
                marginLeft: 10,
              }}
              text={`${item.code} ${item.title}`}
            />

            <View
              style={{
                backgroundColor: colors.listBackground,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.listBackground,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Text
                  style={{ flex: 1, textAlign: 'right', color: colors.sectionFG }}
                  text={formatCurrency(item.totalBidAmount, false, true)}
                />
                <Text
                  style={{ flex: 1, textAlign: 'right', color: colors.sectionFG }}
                  text={formatCurrency(item.totalSpentAmount, false, true)}
                />
                <Text
                  style={{ flex: 1, textAlign: 'right', color: colors.sectionFG }}
                  text={formatCurrency(item.totalBalance, false, true)}
                />
              </View>

              <View
                style={{
                  paddingLeft: 5,
                  alignItems: 'center',
                  backgroundColor: colors.listBackground,
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name={'chevron-right'} size={24} color={colors.sectionFG} />
              </View>
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
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          title: 'Project Overview',
          headerRight: () => (
            <View
              style={{
                minWidth: 30,
                minHeight: 30,
                gap: 16,
                alignItems: 'center',
                flexDirection: 'row',
                backgroundColor: 'transparent',
                marginRight: Platform.OS === 'android' ? 16 : 0,
              }}
            >
              {isConnectedToQuickBooks && <SvgImage fileName="qb-logo" width={26} height={26} />}
              <Pressable
                style={{ alignItems: 'center' }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => {
                  setHeaderMenuModalVisible(!headerMenuModalVisible);
                }}
              >
                <MaterialCommunityIcons name="menu" size={28} color={colors.iconColor} />
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
              {totalQuotedPrice && totalQuotedPrice > 0 ? (
                <>
                  <Text text={`quote: ${formatCurrency(totalQuotedPrice, true)}`} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                    <Text text={`est: ${formatCurrency(projectData.bidPrice, true)}`} />
                    <Text text={`bal: ${formatCurrency(projectBalance, true)}`} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                    <Text text={`spent: ${formatCurrency(projectData.amountSpent, true)}`} />
                    <Text text={`complete: ${numCompletedWorkItemSummaries} of ${numWorkItemSummaries}`} />
                  </View>
                </>
              ) : (
                <>
                  <ActionButton
                    title="Set Initial Price Quote"
                    onPress={handleSetPriceQuotePress}
                    type={'action'}
                  />
                </>
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: 5 }}>
              <View style={{ marginBottom: 5, alignItems: 'center' }}>
                <Text txtSize="title" text="Cost Summary" />
              </View>
              <View
                style={{
                  width: '100%',
                  paddingLeft: 10,
                  paddingRight: 36,
                  paddingVertical: 5,
                  gap: 5,
                  flexDirection: 'row',
                  backgroundColor: colors.sectionHeaderBG,
                }}
              >
                <Text style={{ width: '33%', textAlign: 'right' }} text="Estimate $" />
                <Text style={{ width: '33%', textAlign: 'right' }} text="Spent $" />
                <Text style={{ width: '33%', textAlign: 'right' }} text="Balance $" />
              </View>
              <FlashList
                showsVerticalScrollIndicator={false}
                data={sectionData}
                renderItem={({ item }) => renderItem(item, projectId)}
                keyExtractor={(item) => item.categoryId}
                ListEmptyComponent={<Text>No data available</Text>}
              />
            </View>
            {projectData && (
              <View
                style={[
                  styles.buttonBarContainer,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <ButtonBar buttons={projectActionButtons} actionContext={projectData} standalone={true} />
              </View>
            )}
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
      {deleteConfirmationModalVisible && projectData && (
        <DeleteProjectConfirmationModal
          isVisible={deleteConfirmationModalVisible}
          onClose={() => setDeleteConfirmationModalVisible(false)}
          onConfirmDelete={handleConfirmDelete}
          projectName={projectData.name}
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
  buttonBarContainer: {
    borderRadius: 15,
    borderWidth: 2,
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 5,
  },
});

export default ProjectDetailsPage;
