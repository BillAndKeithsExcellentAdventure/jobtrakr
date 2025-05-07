import { ActionButtonProps } from '@/components/ButtonBar';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { Text, View } from '@/components/Themed';
import { ColorSchemeColors, useColors } from '@/context/ColorsContext';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import { useAllRows as useAllConfigRows } from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  useProject,
  useDeleteProjectCallback,
  useProjectValue,
} from '@/tbStores/listOfProjects/ListOfProjectsStore';
import {
  useAddRowCallback,
  useAllRows,
  useBidAmountUpdater,
  useCostUpdater,
  useIsStoreAvailableCallback,
  useSeedWorkItemsIfNecessary,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter, Stack, useLocalSearchParams, Redirect, Router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Alert, SectionList } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableCostSummary from './SwipeableCostSummary';

export interface CostItemData {
  id: string;
  code: string;
  title: string;
  bidAmount: number;
  spentAmount: number;
}

export interface CostSectionData {
  id: string;
  code: string;
  title: string;
  totalBidAmount: number;
  totalSpentAmount: number;
  data: CostItemData[];
  isExpanded: boolean;
}

const ProjectDetailsPage = () => {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const colors = useColors();
  const projectData = useProject(projectId);
  const processDeleteProject = useDeleteProjectCallback();
  const { removeActiveProjectId, addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
  const allProjectCategories = useAllConfigRows('categories');
  const allWorkItems = useAllConfigRows('workItems');
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
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

  const [expandedSectionId, setExpandedSectionId] = useState<string>('');
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

      costItem.spentAmount = allActualCostItems
        .filter((i) => i.workItemId === workItem.id)
        .reduce((sum, item) => sum + item.amount, 0);

      let section = sections.find((sec) => sec.id === category.id);
      if (!section) {
        section = {
          id: category.id,
          code: category.code,
          title: category.name,
          totalBidAmount: 0,
          totalSpentAmount: 0,
          isExpanded: expandedSectionId === category.id,
          data: [],
        };
        sections.push(section);
      }

      section.data.push({
        id: workItem.id,
        code: workItem.code,
        title: workItem.name,
        bidAmount: costItem.bidAmount,
        spentAmount: costItem.spentAmount,
      });
    }

    sections.forEach((section) => {
      section.data.sort((a, b) => a.code.localeCompare(b.code));
      section.totalBidAmount = section.data.reduce((sum, item) => sum + item.bidAmount, 0);
      section.totalSpentAmount = section.data.reduce((sum, item) => sum + item.spentAmount, 0);
    });

    sections.sort((a, b) => a.code.localeCompare(b.code));
    return sections;
  }, [allWorkItemSummaries, allWorkItems, allProjectCategories, expandedSectionId, allActualCostItems]);

  const handleMenuItemPress = useCallback(
    (menuItem: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (menuItem === 'Edit' && projectId) {
        router.push(`/projects/${projectId}/edit/?projectName=${encodeURIComponent(projectData!.name)}`);
        return;
      } else if (menuItem === 'SetEstimates' && projectId) {
        router.push(
          `/projects/${projectId}/setEstimatedCosts/?projectName=${encodeURIComponent(projectData!.name)}`,
        );
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

  const toggleSection = (id: string) => {
    setExpandedSectionId((prevId) => (prevId === id ? '' : id));
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
                  flexDirection: 'row',
                  backgroundColor: colors.border,
                }}
              >
                <Text style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }} text="Description" />
                <Text style={{ width: 100, textAlign: 'right' }} text="Estimate $" />
                <Text style={{ width: 100, textAlign: 'right' }} text="Spent $" />
              </View>
              <SectionList
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                sections={sectionData}
                renderItem={({ item, section }) =>
                  section.isExpanded ? (
                    <SwipeableCostSummary
                      item={item}
                      sectionId={section.id}
                      sectionCode={section.code}
                      projectId={projectId}
                    />
                  ) : null
                }
                renderSectionHeader={({ section }) => renderSectionHeader(section, toggleSection, colors)}
                keyExtractor={(item) => item.id}
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

const renderSectionHeader = (
  section: CostSectionData,
  toggleSection: (id: string) => void,
  colors: ColorSchemeColors,
) => {
  return (
    <View
      style={[
        styles.header,
        {
          borderColor: colors.border,
          backgroundColor: colors.listBackground,
          borderBottomWidth: 1,
          alignItems: 'center',
          height: 40,
        },
      ]}
    >
      <Pressable style={{ flex: 1 }} onPress={() => toggleSection(section.id)} hitSlop={10}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.listBackground,
          }}
        >
          <Text
            numberOfLines={1}
            style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}
            text={section.title}
          />
          <Text
            style={{ width: 100, textAlign: 'right' }}
            text={formatCurrency(section.totalBidAmount, false, true)}
          />
          <Text
            style={{ width: 100, textAlign: 'right' }}
            text={formatCurrency(section.totalSpentAmount, false, true)}
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
            <Ionicons
              name={section.isExpanded ? 'chevron-up-sharp' : 'chevron-down-sharp'}
              size={20}
              color={colors.iconColor}
            />
          </View>
        </View>
      </Pressable>
    </View>
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
    height: 45,
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 16,
  },
});

export default ProjectDetailsPage;
