import { Text, View } from '@/src/components/Themed';
import { Colors } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAllRows,
  useTableValue,
  useTemplateWorkItemData,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { createItemsArray } from '@/src/utils/array';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, SectionList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ItemData {
  id: string;
  code: string;
  title: string;
  isActive: boolean;
}

interface SectionData {
  id: string;
  code: string;
  title: string;
  data: ItemData[];
  isExpanded: boolean;
}

const ProjectTemplatesConfigurationScreen: React.FC = () => {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const templateName = useTableValue('templates', templateId, 'name');
  const templateDescription = useTableValue('templates', templateId, 'description');
  const colors = useColors();
  const router = useRouter();
  const allProjectCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const allWorkItems = useAllRows('workItems', WorkItemDataCodeCompareAsNumber);
  const { setActiveWorkItemIds, templateWorkItemIds, toggleWorkItemId } = useTemplateWorkItemData(templateId);
  const [sectionData, setSectionData] = useState<SectionData[]>([]);

  const visibleProjectCategories = useMemo(
    () => allProjectCategories.filter((c) => !c.hidden),
    [allProjectCategories],
  );
  const visibleWorkItems = useMemo(() => allWorkItems.filter((w) => !w.hidden), [allWorkItems]);

  const expandedSectionIdRef = useRef<string>(''); // Ref to keep track of the expanded section ID

  useEffect(() => {
    const fetchAllSectionsData = () => {
      const sections: SectionData[] = visibleProjectCategories.map((category) => {
        const items = visibleWorkItems.filter((item) => item.categoryId === category.id);
        const activeWorkItemIds = templateWorkItemIds ?? [];

        return {
          id: category.id,
          code: category.code,
          title: category.name,
          isExpanded: expandedSectionIdRef.current === category.id,
          data: items.map((item) => ({
            id: item.id,
            code: item.code,
            title: item.name,
            isActive: !!activeWorkItemIds.find((id) => id === item.id), // Check if the item is in the activeWorkItemIds
          })),
        };
      });

      setSectionData(sections);
    };
    fetchAllSectionsData();
  }, [templateWorkItemIds, visibleProjectCategories, visibleWorkItems]);

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

  const toggleAllItemsActiveState = useCallback(
    (sectionId: string) => {
      const section = sectionData.find((section) => section.id === sectionId);
      if (!section) return;
      const allActive = section.data.every((item) => item.isActive);
      const allSectionWorkItemIds = section.data.map((item) => item.id);

      const activeWorkItems = createItemsArray<string>(
        templateWorkItemIds,
        allSectionWorkItemIds,
        allActive ? 'exclude' : 'include',
      );
      setActiveWorkItemIds(activeWorkItems);
    },
    [templateWorkItemIds, sectionData, setActiveWorkItemIds],
  );

  const toggleItemActiveState = useCallback(
    (_: string, itemId: string) => {
      toggleWorkItemId(itemId);
    },
    [toggleWorkItemId],
  );

  const marginBottom = Platform.OS === 'android' ? 20 : 0;

  const handleEditTemplate = useCallback((id: string) => {
    router.push({
      pathname: '/configuration/template/[templateId]/edit',
      params: { templateId: id },
    });
  }, [router]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Define Template Work Items',
        }}
      />
      <View style={[styles.container, { marginBottom }]}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.listBackground, padding: 10, width: '100%' }}>
            <TouchableOpacity
              onPress={() => handleEditTemplate(templateId)} // Edit on item press
            >
              <View style={[styles.categoryContent, { borderColor: colors.border, borderWidth: 1 }]}>
                <View style={styles.categoryInfo}>
                  <Text txtSize="title" text={templateName} />
                  <Text>{templateDescription}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <SectionList
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          sections={sectionData}
          renderItem={({ item, section }) =>
            section.isExpanded
              ? renderItem(item, section.id, section.code, toggleItemActiveState, colors)
              : null
          }
          renderSectionHeader={({ section }) =>
            renderSectionHeader(section, toggleSection, colors, toggleAllItemsActiveState)
          }
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text>No data available</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

const renderSectionHeader = (
  section: SectionData,
  toggleSection: (id: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
  toggleAllItemsActiveState: (sectionId: string) => void,
) => {
  const activeCount = section.data.filter((item) => item.isActive).length;
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
          <Text txtSize="section-header" text={`${section.title} (${activeCount}/${totalCount})`} />
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
  toggleItemActiveState: (sectionId: string, itemId: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
) => {
  const isActive = item.isActive;
  return (
    <Pressable
      style={[styles.item, { borderColor: colors.border }]}
      onPress={() => toggleItemActiveState(sectionId, item.id)}
    >
      <View
        style={[
          styles.roundButton,
          {
            borderColor: colors.iconColor,
            borderWidth: 1,
            backgroundColor: isActive ? colors.iconColor : 'transparent',
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

  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 8,
    borderRadius: 10,
  },

  categoryInfo: {
    flex: 1,
  },
});

export default ProjectTemplatesConfigurationScreen;
