import { ActionButtonProps } from '@/components/ButtonBar';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { Text, View } from '@/components/Themed';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import { useColors } from '@/context/ColorsContext';
import {
  useAllRows as useAllConfigRows,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { useDeleteProjectCallback, useProject } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import {
  useAllRows,
  useBidAmountUpdater,
  useCostUpdater,
  useIsStoreAvailableCallback,
  useSeedWorkItemsIfNecessary,
  useSetWorkItemSpentSummaryCallback,
  useUpdateRowCallback,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export function CostItemDataCodeCompareAsNumber(a: CostItemData, b: CostItemData) {
  const aValue = Number(a.code);
  const bValue = Number(b.code);
  return (aValue as number) - (bValue as number);
}

export function CostSectionDataCodeCompareAsNumber(a: CostSectionData, b: CostSectionData) {
  const aValue = Number(a.code);
  const bValue = Number(b.code);
  return (aValue as number) - (bValue as number);
}

export interface CostItemData {
  id: string;
  workItemId: string;
  code: string;
  title: string;
  bidAmount: number;
  spentAmount: number;
}

export interface CostSectionData {
  categoryId: string;
  code: string;
  title: string;
  totalBidAmount: number;
  totalSpentAmount: number;
  data: CostItemData[];
}

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

  const sectionData = useMemo(() => {
    const sections: CostSectionData[] = [];
    const workItemMap = new Map(allWorkItems.map((w) => [w.id, w]));
    const categoryMap = new Map(allProjectCategories.map((c) => [c.id, c]));

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
  }, [allWorkItemSummaries, allWorkItems, allProjectCategories, allActualCostItems]);

  // get a list of unused work items not represented in allWorkItemSummaries
  const unusedWorkItems = useMemo(
    () =>
      allWorkItems.filter(
        (w) => !allWorkItemSummaries.some((i) => i.workItemId === w.id),
        [allWorkItemSummaries, allWorkItems],
      ),
    [allWorkItemSummaries, allWorkItems],
  );

  // get a list of all unique categories from unusedWorkItems
  const unusedCategories = useMemo(
    () => Array.from(new Set(unusedWorkItems.map((w) => w.categoryId))),
    [unusedWorkItems],
  );

  const unusedCategoriesString = useMemo(() => unusedCategories.join(','), [unusedCategories]);

  const handleMenuItemPress = useCallback(
    (menuItem: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (menuItem === 'Edit' && projectId) {
        router.push({
          pathname: '/projects/[projectId]/edit',
          params: { projectId, projectName: projectData!.name },
        });
        return;
      } else if (menuItem === 'SetEstimates' && projectId) {
        router.push({
          pathname: '/projects/[projectId]/setEstimatedCosts',
          params: { projectId, projectName: projectData!.name },
        });
        return;
      } else if (menuItem === 'AddCostCategory' && projectId) {
        router.push({
          pathname: '/projects/[projectId]/addCostCategory',
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
              router.replace('/projects');
            },
          },
        ]);
        return;
      }
    },
    [projectId, projectData, router, processDeleteProject, removeActiveProjectId],
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
    ],
    [colors, allWorkItemSummaries, handleMenuItemPress],
  );

  const renderItem = (item: CostSectionData, projectId: string) => {
    const showSection = (): void => {
      // use router to push to the cost items page
      router.push({
        pathname: '/projects/[projectId]/costItems/[categoryId]',
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
    return <Redirect href="/projects" />;
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
                <Text txtSize="title" text="Cost Items" />
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
                estimatedItemSize={ITEM_HEIGHT}
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

export default ProjectDetailsPage;
