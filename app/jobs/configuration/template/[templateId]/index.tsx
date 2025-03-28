import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, SectionList, Pressable } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';
import { JobTemplateData } from '@/models/types';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ItemData {
  id: string;
  title: string;
  isActive: boolean;
}

interface SectionData {
  id: string;
  title: string;
  data: ItemData[];
  isExpanded: boolean;
}

const CollapsibleSectionList: React.FC = () => {
  const { templateId } = useLocalSearchParams();
  const { allJobTemplates } = useJobTemplateDataStore();
  const [template, setTemplate] = useState<JobTemplateData | null>();

  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (templateId) {
      const fetchedTemplate = allJobTemplates.find((c) => c._id === templateId);
      setTemplate(fetchedTemplate || null);
    }
  }, [templateId, allJobTemplates]);

  const [sectionData, setSectionData] = useState<SectionData[]>([
    {
      id: 'section1',
      title: '100 - Site Work',
      data: [
        { id: 'item1', title: '100.1 - Silt Fence', isActive: true },
        { id: 'item2', title: '100.2 - Grading', isActive: true },
        { id: 'item3', title: '100.3 - Culvert', isActive: false },
        { id: 'item4', title: '100.4 - Permits', isActive: true },
      ],
      isExpanded: false,
    },
    {
      id: 'section2',
      title: '200 - Concrete',
      data: [
        { id: 'item5', title: '200.1 - Footer', isActive: true },
        { id: 'item6', title: '200.2 - Basement Walls', isActive: true },
        { id: 'item7', title: '200.3 - Porch', isActive: false },
        { id: 'item8', title: '200.4 - Patio', isActive: false },
        { id: 'item9', title: '200.5 - Driveway', isActive: true },
        { id: 'item10', title: '200.6 - Misc Slab', isActive: false },
        { id: 'item11', title: '200.7 - Garage Pad', isActive: true },
        { id: 'item12', title: '200.8 - Carport', isActive: true },
        { id: 'item35', title: '200.11 - Alt Footer', isActive: true },
        { id: 'item36', title: '200.12 - Alt Basement Walls', isActive: true },
        { id: 'item37', title: '200.13 - Alt Porch', isActive: false },
        { id: 'item38', title: '200.14 - Alt Patio', isActive: false },
        { id: 'item39', title: '200.15 - Alt Driveway', isActive: true },
        { id: 'item40', title: '200.16 - Alt Misc Slab', isActive: false },
        { id: 'item41', title: '200.17 - Alt Garage Pad', isActive: true },
        { id: 'item42', title: '200.18 - Alt Carport', isActive: true },
      ],
      isExpanded: false,
    },
    {
      id: 'section3',
      title: '300 - Framing',
      data: [
        { id: 'item13', title: '300.1 - Walls', isActive: true },
        { id: 'item14', title: '300.2 - Roof', isActive: true },
        { id: 'item15', title: '300.3 - Doors & Window', isActive: true },
        { id: 'item16', title: '300.4 - Finish', isActive: true },
      ],
      isExpanded: false,
    },
  ]);

  const toggleSection = (id: string) => {
    setSectionData((prevData) =>
      prevData.map((section) =>
        section.id === id
          ? { ...section, isExpanded: !section.isExpanded }
          : { ...section, isExpanded: false },
      ),
    );
  };

  const toggleAllItemsActiveState = (sectionId: string) => {
    setSectionData((prevData) =>
      prevData.map((section) => {
        if (section.id === sectionId) {
          const allActive = section.data.every((item) => item.isActive);
          const updatedData = section.data.map((item) => ({
            ...item,
            isActive: !allActive,
          }));
          return { ...section, data: updatedData };
        }
        return section;
      }),
    );
  };

  const toggleItemActiveState = (sectionId: string, itemId: string) => {
    setSectionData((prevData) =>
      prevData.map((section) => {
        if (section.id === sectionId) {
          const updatedData = section.data.map((item) =>
            item.id === itemId ? { ...item, isActive: !item.isActive } : item,
          );
          return { ...section, data: updatedData };
        }
        return section;
      }),
    );
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Define Template Work Items',
        }}
      />
      <View style={styles.container}>
        <View style={{ alignItems: 'center', paddingVertical: 5 }}>
          <Text txtSize="title" text={template?.Name} />
        </View>
        <SectionList
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          sections={sectionData}
          renderItem={({ item, section }) =>
            // Only render items if the section is expanded
            section.isExpanded ? renderItem(item, section.id, toggleItemActiveState, colors) : null
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
          borderColor: colors.borderColor,
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
  toggleItemActiveState: (sectionId: string, itemId: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
) => {
  const isActive = item.isActive;
  return (
    <Pressable
      style={[styles.item, { borderColor: colors.borderColor }]}
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
        <Text style={styles.itemText}>{item.title}</Text>
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
    padding: 10,
    borderTopWidth: 1,
  },
  item: {
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

export default CollapsibleSectionList;
