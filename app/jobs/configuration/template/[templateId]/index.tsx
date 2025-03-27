import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list'; // Import FlashList
import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';
import { JobTemplateData } from '@/models/types';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ItemData {
  id: string; // Added the id property
  title: string;
  isActive: boolean;
}

interface SectionData {
  id: string; // Added the id property
  title: string;
  data: ItemData[];
  isExpanded: boolean; // This determines if the section is expanded
}

const CollapsibleFlashList: React.FC = () => {
  const { templateId } = useLocalSearchParams();
  const { allJobTemplates } = useJobTemplateDataStore();
  const [template, setTemplate] = useState<JobTemplateData | null>();

  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (templateId) {
      // Simulate fetching the existing category data by ID
      const fetchedTemplate = allJobTemplates.find((c) => c._id === templateId);
      setTemplate(fetchedTemplate || null);
    }
  }, [templateId, allJobTemplates]);

  const [sectionData, setSectionData] = useState<SectionData[]>([
    {
      id: 'section1', // Dummy ID, replace with real ID from your DB
      title: '100 - Site Work',
      data: [
        { id: 'item1', title: '100.1 - Silt Fence', isActive: true },
        { id: 'item2', title: '100.2 - Grading', isActive: true },
        { id: 'item3', title: '100.3 - Culvert', isActive: false },
        { id: 'item4', title: '100.4 - Permits', isActive: true },
      ],
      isExpanded: false, // Initially collapsed
    },
    {
      id: 'section2', // Dummy ID, replace with real ID from your DB
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
      isExpanded: false, // Initially collapsed
    },
    {
      id: 'section3', // Dummy ID, replace with real ID from your DB
      title: '300 - Framing',
      data: [
        { id: 'item13', title: '300.1 - Walls', isActive: true },
        { id: 'item14', title: '300.2 - Roof', isActive: true },
        { id: 'item15', title: '300.3 - Doors & Window', isActive: true },
        { id: 'item16', title: '300.4 - Finish', isActive: true },
      ],
      isExpanded: false, // Initially collapsed
    },
  ]);

  // Toggle the expanded state of a section
  const toggleSection = (id: string) => {
    setSectionData((prevData) =>
      prevData.map((section) =>
        section.id === id
          ? { ...section, isExpanded: !section.isExpanded }
          : { ...section, isExpanded: false },
      ),
    );
  };

  // Toggle all items' active state in a section
  const toggleAllItemsActiveState = (sectionId: string) => {
    setSectionData((prevData) =>
      prevData.map((section) => {
        if (section.id === sectionId) {
          const allActive = section.data.every((item) => item.isActive);
          const updatedData = section.data.map((item) => ({
            ...item,
            isActive: !allActive, // Set all items to active if all were inactive, or vice versa
          }));
          return { ...section, data: updatedData };
        }
        return section;
      }),
    );
  };

  // Toggle the active state of an item
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
        <FlashList
          data={sectionData}
          renderItem={({ item }) => (
            <>
              {/* Render the section header */}
              {renderSectionHeader(item, toggleSection, colors, toggleAllItemsActiveState)}

              {/* Render items only if the section is expanded */}
              {item.isExpanded &&
                item.data.map((dataItem) => (
                  <View key={dataItem.id}>
                    {renderItem(dataItem, item.id, toggleItemActiveState, colors)}
                  </View>
                ))}
            </>
          )}
          keyExtractor={(item) => item.id} // Use id as the key extractor
          ListEmptyComponent={<Text>No data available</Text>}
          estimatedItemSize={50}
        />
      </View>
    </SafeAreaView>
  );
};

// Extracted renderSectionHeader function with active count
const renderSectionHeader = (
  section: SectionData,
  toggleSection: (id: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
  toggleAllItemsActiveState: (sectionId: string) => void,
) => {
  // Count the number of active items in the section
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
        <TouchableOpacity
          style={{ marginRight: 20 }}
          onPress={() => toggleAllItemsActiveState(section.id)} // Toggle active state on press anywhere in the item
        >
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
        </TouchableOpacity>
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

// Extracted renderItem function with toggleItemActiveState passed as argument
const renderItem = (
  item: ItemData,
  sectionId: string,
  toggleItemActiveState: (sectionId: string, itemId: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
) => {
  const isActive = item.isActive;
  return (
    <TouchableOpacity
      style={[styles.item, { borderColor: colors.borderColor }]}
      onPress={() => toggleItemActiveState(sectionId, item.id)} // Toggle active state on press anywhere in the item
    >
      <View
        style={[
          styles.roundButton,
          {
            borderColor: colors.iconColor,
            borderWidth: 1,
            backgroundColor: isActive ? colors.iconColor : 'transparent', // Conditionally set backgroundColor
          },
        ]}
      />
      <View style={{ marginLeft: 50 }}>
        <Text style={styles.itemText}>{item.title}</Text>
      </View>
    </TouchableOpacity>
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
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
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

export default CollapsibleFlashList;
