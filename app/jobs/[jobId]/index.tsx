import { ActionButtonProps } from '@/components/ButtonBar';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import { useAllRows } from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { useProject, useDeleteProjectCallback, useProjectValue } from '@/tbStores/ListOfProjectsStore';
import { isValidProjectDetailsStoreCallback } from '@/tbStores/projectDetails/workItemCostEntries';
import { useAddWorkItemSummary, useAllWorkItemSummaries } from '@/tbStores/projectDetails/workItemsSummary';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter, Stack, useLocalSearchParams, Redirect, Router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Alert, SectionList } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CostItemData {
  id: string;
  code: string;
  title: string;
  bidAmount: number;
  spentAmount: number;
}

interface CostSectionData {
  id: string;
  code: string;
  title: string;
  totalBidAmount: number;
  totalSpentAmount: number;
  data: CostItemData[];
  isExpanded: boolean;
}

const JobDetailsPage = () => {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const projectData = useProject(jobId);
  const processDeleteProject = useDeleteProjectCallback();
  const { removeActiveProjectId, addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
  const allWorkItemSummaries = useAllWorkItemSummaries(jobId);
  const allJobCategories = useAllRows('categories');
  const allWorkItems = useAllRows('workItems');
  const colorScheme = useColorScheme();
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [sectionData, setSectionData] = useState<CostSectionData[]>([]);
  const expandedSectionIdRef = useRef<string>(''); // Ref to keep track of the expanded section ID
  const [seedWorkItems, setSeedWorkItems] = useProjectValue(jobId, 'seedJobWorkItems');
  const addWorkItemSummary = useAddWorkItemSummary(jobId);

  useEffect(() => {
    if (jobId) {
      addActiveProjectIds([jobId]);
    }
  }, [jobId]);

  const seedInitialData = useCallback((): void => {
    if (allWorkItemSummaries.length > 0 || !seedWorkItems) return;

    const workItemIds = seedWorkItems.split(',');
    console.log('Initializing project with the following workitems.', workItemIds);
    setSeedWorkItems(''); // Clear the seedWorkItems after seeding
    for (const workItemId of workItemIds) {
      if (!workItemId) continue;
      addWorkItemSummary({
        workItemId,
        bidAmount: 0,
        spentAmount: 0,
      });
    }
  }, [seedWorkItems, allWorkItemSummaries]);

  useEffect(() => {
    if (activeProjectIds.includes(jobId)) {
      if (jobId && seedWorkItems && allWorkItemSummaries.length === 0) {
        console.log('Seeding initial data for project', jobId);
        seedInitialData();
      }
    }
  }, [jobId, seedWorkItems, allWorkItemSummaries]);

  useEffect(() => {
    const sections: CostSectionData[] = [];
    for (const costItem of allWorkItemSummaries) {
      const workItem = allWorkItems.find((item) => item.id === costItem.workItemId);
      if (workItem) {
        const category = allJobCategories.find((cat) => cat.id === workItem.categoryId);
        if (category) {
          const section = sections.find((sec) => sec.id === category.id);
          if (section) {
            section.data.push({
              id: workItem.id,
              code: workItem.code,
              title: workItem.name,
              bidAmount: costItem.bidAmount,
              spentAmount: costItem.spentAmount,
            });
          } else {
            sections.push({
              id: category.id,
              code: category.code,
              title: category.name,
              totalBidAmount: 0,
              totalSpentAmount: 0,
              isExpanded: expandedSectionIdRef.current === category.id,
              data: [
                {
                  id: workItem.id,
                  code: workItem.code,
                  title: workItem.name,
                  bidAmount: costItem.bidAmount,
                  spentAmount: costItem.spentAmount,
                },
              ],
            });
          }
        }
      }
    }
    // Sort sections by code
    sections.sort((a, b) => a.code.localeCompare(b.code));

    // Sort items within each section
    sections.forEach((section) => {
      section.data.sort((a, b) => a.code.localeCompare(b.code));
    });

    // sum up the bid and spent amounts for each section
    sections.forEach((section) => {
      section.totalBidAmount = section.data.reduce((sum, item) => sum + item.bidAmount, 0);
      section.totalSpentAmount = section.data.reduce((sum, item) => sum + item.spentAmount, 0);
    });

    // Set the section data state
    setSectionData(sections);
  }, [allWorkItemSummaries, allJobCategories, allWorkItems]);

  // Define colors based on the color scheme (dark or light)
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            screenBackground: Colors.dark.background,
            listBackground: Colors.dark.listBackground,
            itemBackground: Colors.dark.itemBackground,
            iconColor: Colors.dark.iconColor,
            shadowColor: Colors.dark.shadowColor,
            borderColor: Colors.dark.borderColor,
            bottomSheetBackground: Colors.dark.bottomSheetBackground,
            text: Colors.dark.text,
          }
        : {
            screenBackground: Colors.light.background,
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            iconColor: Colors.light.iconColor,
            shadowColor: Colors.light.shadowColor,
            borderColor: Colors.light.borderColor,
            bottomSheetBackground: Colors.light.bottomSheetBackground,
            text: Colors.light.text,
          },
    [colorScheme],
  );

  const handleMenuItemPress = useCallback(
    (menuItem: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (menuItem === 'Edit' && jobId) {
        router.push(`/jobs/${jobId}/edit/?jobName=${projectData!.name}`);
        return;
      } else if (menuItem === 'Delete' && jobId) {
        Alert.alert('Delete Project', 'Are you sure you want to delete this project?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            onPress: () => {
              const result = processDeleteProject(jobId);
              if (result.status === 'Success') {
                removeActiveProjectId(jobId);
              }
              router.replace('/jobs');
            },
          },
        ]);

        return;
      }
    },
    [jobId, projectData, router, processDeleteProject],
  );

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <FontAwesome name="edit" size={28} color={colors.iconColor} />,
        label: 'Edit Job Info',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Edit', actionContext);
        },
      },
      {
        icon: <FontAwesome name="trash" size={28} color={colors.iconColor} />,
        label: 'Delete Job',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Delete', actionContext);
        },
      },
    ],
    [colors],
  );

  const toggleSection = (id: string) => {
    expandedSectionIdRef.current = expandedSectionIdRef.current === id ? '' : id;

    setSectionData((prevData) =>
      prevData.map((section) =>
        section.id === id
          ? { ...section, isExpanded: !section.isExpanded }
          : { ...section, isExpanded: false },
      ),
    );
  };

  if (!projectData) {
    // Redirect to the jobs list if no project data is found
    return <Redirect href="/jobs" />;
  }

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Job Overview',
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
              backgroundColor: colors.borderColor,
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
              section.isExpanded ? renderItem(item, section.id, section.code, colors, jobId, router) : null
            }
            renderSectionHeader={({ section }) => renderSectionHeader(section, toggleSection, colors)}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text>No data available</Text>}
          />
        </View>
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
  colors: typeof Colors.light | typeof Colors.dark,
) => {
  return (
    <View
      style={[
        styles.header,
        {
          borderColor: colors.borderColor,
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
          <Text style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }} text={section.title} />
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

const renderItem = (
  item: CostItemData,
  sectionId: string,
  sectionCode: string,
  colors: typeof Colors.light | typeof Colors.dark,
  jobId: string,
  router: Router,
) => {
  return (
    <Pressable
      onPress={() => {
        router.push(`/jobs/${jobId}/${item.id}`);
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          height: 40,
          paddingLeft: 5,
          alignItems: 'center',
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        <Text
          style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}
          text={`${sectionCode}.${item.code} - ${item.title}`}
        />
        <Text
          style={{ width: 100, textAlign: 'right', overflow: 'hidden' }}
          text={formatCurrency(item.bidAmount, false, true)}
        />
        <Text
          style={{ width: 100, textAlign: 'right', overflow: 'hidden' }}
          text={formatCurrency(item.spentAmount, false, true)}
        />
        <View style={{ width: 41, paddingLeft: 5, alignItems: 'center' }}>
          <MaterialIcons name="chevron-right" size={28} color={colors.iconColor} />
        </View>
      </View>
    </Pressable>
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

export default JobDetailsPage;
