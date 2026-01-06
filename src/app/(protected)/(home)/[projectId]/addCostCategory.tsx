import { ModalScreenContainerWithList } from '@/src/components/ModalScreenContainerWithList';
import { Text, TextInput, View } from '@/src/components/Themed';
import { Colors } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import {
  useAllRows,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAddRowCallback } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SectionList, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

interface ItemData {
  id: string;
  code: string;
  title: string;
  isSelected: boolean;
}

interface SectionData {
  id: string;
  code: string;
  title: string;
  data: ItemData[];
  isExpanded: boolean;
}

const AddCostCategoryWorkItemsScreen: React.FC = () => {
  const { projectId, availableCategories } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
    availableCategories: string;
  }>();
  const colors = useColors();
  const allProjectCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const { projectWorkItems } = useProjectWorkItems(projectId);
  const allWorkItems = useAllRows('workItems', WorkItemDataCodeCompareAsNumber);
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<string[]>([]);
  const [sectionData, setSectionData] = useState<SectionData[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const addWorkItemSummary = useAddRowCallback(projectId, 'workItemSummaries');
  const expandedSectionIdRef = useRef<string>('');
  const availableCategoryIds = useMemo(
    () => (availableCategories ? availableCategories.split(',') : []),
    [availableCategories],
  );

  useEffect(() => {
    const fetchAllSectionsData = () => {
      const filteredCategories = allProjectCategories.filter((category) =>
        availableCategoryIds.includes(category.id),
      );

      const sections: SectionData[] = filteredCategories.map((category) => {
        // Get work items in this category that are not already in projectWorkItems
        const items = allWorkItems
          .filter((item) => item.categoryId === category.id)
          .filter((item) => !projectWorkItems.find((pwi) => pwi.id === item.id));

        return {
          id: category.id,
          code: category.code,
          title: category.name,
          isExpanded: expandedSectionIdRef.current === category.id,
          data: items.map((item) => ({
            id: item.id,
            code: item.code,
            title: item.name,
            isSelected: selectedWorkItemIds.includes(item.id),
          })),
        };
      });

      setSectionData(sections);
    };
    fetchAllSectionsData();
  }, [allProjectCategories, allWorkItems, selectedWorkItemIds, availableCategoryIds, projectWorkItems]);

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

  const toggleAllItemsSelectedState = useCallback(
    (sectionId: string) => {
      const section = sectionData.find((section) => section.id === sectionId);
      if (!section) return;

      const allSelected = section.data.every((item) => item.isSelected);
      const sectionItemIds = section.data.map((item) => item.id);

      setSelectedWorkItemIds((prevIds) => {
        if (allSelected) {
          return prevIds.filter((id) => !sectionItemIds.includes(id));
        } else {
          return [...new Set([...prevIds, ...sectionItemIds])];
        }
      });
    },
    [sectionData],
  );

  const toggleItemSelectedState = useCallback((_: string, itemId: string) => {
    setSelectedWorkItemIds((prevIds) => {
      if (prevIds.includes(itemId)) {
        return prevIds.filter((id) => id !== itemId);
      } else {
        return [...prevIds, itemId];
      }
    });
  }, []);

  const addSelectedWorkItems = useCallback(() => {
    if (selectedWorkItemIds.length < 1) return;

    for (const workItemId of selectedWorkItemIds) {
      if (!workItemId) continue;
      addWorkItemSummary({
        id: '',
        workItemId,
        bidAmount: 0,
        complete: false,
      });
    }
    router.back();
  }, [selectedWorkItemIds, addWorkItemSummary]);

  const filteredSectionData = useMemo(() => {
    const searchLower = searchText.toLowerCase();
    return sectionData
      .map((section) => ({
        ...section,
        data: section.data.filter((item) => item.title.toLowerCase().includes(searchLower)),
      }))
      .filter((section) => section.data.length > 0);
  }, [sectionData, searchText]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainerWithList
        onSave={addSelectedWorkItems}
        onCancel={() => router.back()}
        canSave={selectedWorkItemIds.length > 0}
        saveButtonTitle="Add Selected"
      >
        <Text style={styles.modalTitle}>Add Work Items</Text>
        <View style={[styles.searchContainer, { borderColor: colors.border }]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for work items"
            placeholderTextColor={colors.textPlaceholder}
            value={searchText}
            onChangeText={setSearchText}
          />
          <Pressable onPress={() => setSearchText('')} style={styles.clearButton}>
            <MaterialIcons name="clear" size={24} color={colors.iconColor} />
          </Pressable>
        </View>
        <SectionList
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          sections={filteredSectionData}
          renderItem={({ item, section }) =>
            section.isExpanded
              ? renderItem(item, section.id, section.code, toggleItemSelectedState, colors)
              : null
          }
          renderSectionHeader={({ section }) =>
            renderSectionHeader(section, toggleSection, colors, toggleAllItemsSelectedState)
          }
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text>No categories available</Text>}
        />
      </ModalScreenContainerWithList>
    </View>
  );
};

const renderSectionHeader = (
  section: SectionData,
  toggleSection: (id: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
  toggleAllItemsActiveState: (sectionId: string) => void,
) => {
  const selectedCount = section.data.filter((item) => item.isSelected).length;
  const totalCount = section.data.length;

  return (
    <View
      style={[
        styles.header,
        {
          borderColor: colors.border,
          backgroundColor: colors.listBackground,
          borderBottomWidth: 1,
          alignItems: 'center',
          height: 50,
        },
      ]}
    >
      {section.isExpanded && (
        <Pressable style={{ marginRight: 20 }} onPress={() => toggleAllItemsActiveState(section.id)}>
          <View
            style={[
              styles.roundButton,
              {
                borderColor: colors.iconColor,
                borderWidth: 1,
                backgroundColor: 'transparent',
              },
            ]}
          />
        </Pressable>
      )}
      <Pressable style={{ flex: 1 }} onPress={() => toggleSection(section.id)} hitSlop={10}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.listBackground,
          }}
        >
          <Text txtSize="section-header" text={`${section.title} (${selectedCount}/${totalCount})`} />
          <Ionicons
            name={section.isExpanded ? 'chevron-up-sharp' : 'chevron-down-sharp'}
            size={24}
            color={colors.iconColor}
          />
        </View>
      </Pressable>
    </View>
  );
};

const renderItem = (
  item: ItemData,
  sectionId: string,
  sectionCode: string,
  toggleItemSelectedState: (sectionId: string, itemId: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
) => {
  const isSelected = item.isSelected;
  return (
    <Pressable
      style={[styles.item, { borderColor: colors.border }]}
      onPress={() => toggleItemSelectedState(sectionId, item.id)}
    >
      <View
        style={[
          styles.roundButton,
          {
            borderColor: colors.iconColor,
            borderWidth: 1,
            backgroundColor: isSelected ? colors.iconColor : 'transparent',
          },
        ]}
      />
      <View style={{ marginLeft: 50 }}>
        <Text style={styles.itemText}>
          {sectionCode}.{item.code} - {item.title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 10,
    paddingRight: 5,
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 5,
    borderTopWidth: 1,
    height: 45,
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
  roundButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddCostCategoryWorkItemsScreen;
