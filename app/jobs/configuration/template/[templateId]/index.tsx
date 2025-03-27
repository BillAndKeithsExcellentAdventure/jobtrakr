import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
  title: string;
  isActive: boolean;
}

interface SectionData {
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

  const [sectionData, setSectionData] = useState<SectionData[]>([
    {
      title: 'Site Work',
      data: [
        { title: 'Silt Fence', isActive: true },
        { title: 'Grading', isActive: true },
        { title: 'Culvert', isActive: false },
        { title: 'Permits', isActive: true },
      ],
      isExpanded: false, // Initially collapsed
    },
    {
      title: 'Concrete',
      data: [
        { title: 'Footer', isActive: true },
        { title: 'Basement Walls', isActive: true },
        { title: 'Porch', isActive: false },
        { title: 'Patio', isActive: false },
        { title: 'Driveway', isActive: true },
        { title: 'Misc Slab', isActive: false },
        { title: 'Garage Pad', isActive: true },
        { title: 'Carport', isActive: true },
      ],
      isExpanded: false, // Initially collapsed
    },
    {
      title: 'Framing',
      data: [
        { title: 'Walls', isActive: true },
        { title: 'Roof', isActive: true },
        { title: 'Doors & Window', isActive: true },
        { title: 'Finish', isActive: true },
      ],
      isExpanded: false, // Initially collapsed
    },
  ]);

  // Toggle the expanded state of a section
  const toggleSection = (title: string) => {
    setSectionData((prevData) =>
      prevData.map((section) =>
        section.title === title ? { ...section, isExpanded: !section.isExpanded } : section,
      ),
    );
  };

  // Toggle the active state of an item
  const toggleItemActiveState = (sectionTitle: string, itemTitle: string) => {
    setSectionData((prevData) =>
      prevData.map((section) => {
        if (section.title === sectionTitle) {
          const updatedData = section.data.map((item) =>
            item.title === itemTitle ? { ...item, isActive: !item.isActive } : item,
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
              {renderSectionHeader(item, toggleSection, colors)}

              {/* Render items only if the section is expanded */}
              {item.isExpanded &&
                item.data.map((dataItem, index) => (
                  <View key={index}>{renderItem(dataItem, item.title, toggleItemActiveState, colors)}</View>
                ))}
            </>
          )}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={<Text>No data available</Text>}
          estimatedItemSize={100} // Adjust for better performance
        />
      </View>
    </SafeAreaView>
  );
};

// Extracted renderSectionHeader function with active count
const renderSectionHeader = (
  section: SectionData,
  toggleSection: (title: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
) => {
  // Count the number of active items in the section
  const activeCount = section.data.filter((item) => item.isActive).length;

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
      <Pressable onPress={() => toggleSection(section.title)} hitSlop={10}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.listBackground,
          }}
        >
          <Text style={styles.headerText}>
            {section.title} ({activeCount}) {/* Display active item count */}
          </Text>
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
  sectionTitle: string,
  toggleItemActiveState: (sectionTitle: string, itemTitle: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
) => {
  const isActive = item.isActive;
  return (
    <TouchableOpacity
      style={[styles.item, { borderColor: colors.borderColor }]}
      onPress={() => toggleItemActiveState(sectionTitle, item.title)} // Toggle active state on press anywhere in the item
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
      <View style={{ marginLeft: 60 }}>
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
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
  },
  roundButton: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CollapsibleFlashList;
