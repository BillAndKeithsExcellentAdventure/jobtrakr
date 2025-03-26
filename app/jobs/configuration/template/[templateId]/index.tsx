import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { SectionList, TouchableOpacity, StyleSheet, ListRenderItemInfo } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';
import { JobTemplateData } from '@/models/types';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ItemData {
  title: string;
  isActive: boolean; // Indicates if the item is active or collapsed
}

interface SectionData {
  title: string;
  data: ItemData[]; // Data now contains ItemData with isActive flag
}

const CollapsibleSectionList: React.FC = () => {
  const { templateId } = useLocalSearchParams(); // Assuming the route includes jobTemplateId
  const { allJobTemplates } = useJobTemplateDataStore();
  const [template, setTemplate] = useState<JobTemplateData | null>();
  const listRef = useRef<SectionList<any>>(null);

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            listBackground: Colors.dark.listBackground,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
            neutral200: Colors.dark.neutral200,
          }
        : {
            background: Colors.light.background,
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
            neutral200: Colors.light.neutral200,
          },
    [colorScheme],
  );

  // Sample data for SectionList
  const [sectionData, setSectionData] = useState<SectionData[]>([
    {
      title: 'Site Work',
      data: [
        { title: 'Silt Fence', isActive: true },
        { title: 'Grading', isActive: true },
        { title: 'Culvert', isActive: false },
        { title: 'Permits', isActive: true },
      ],
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
        { title: 'Silt Fence', isActive: true },
        { title: 'Grading', isActive: true },
        { title: 'Culvert', isActive: true },
        { title: 'Permits', isActive: true },
      ],
    },
    {
      title: 'Framing',
      data: [
        { title: 'Walls', isActive: true },
        { title: 'Roof', isActive: true },
        { title: 'Doors & Window', isActive: true },
        { title: 'Finish', isActive: true },
      ],
    },
  ]);

  // State to manage which sections are collapsed
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (templateId) {
      // Simulate fetching the existing category data by ID
      const fetchedTemplate = allJobTemplates.find((c) => c._id === templateId);
      setTemplate(fetchedTemplate || null);
    }
  }, [templateId, allJobTemplates]);

  // Toggle the collapsed state of a section
  const toggleSection = (title: string) => {
    setCollapsedSections((prevState) => ({
      ...prevState,
      [title]: !prevState[title],
    }));
  };

  // Toggle the active state of an item
  const toggleItemActiveState = (sectionTitle: string, itemTitle: string) => {
    //setTemplate((prevTemplate) => {
    //  if (!prevTemplate) return prevTemplate;

    const updatedSections = sectionData.map((section) => {
      if (section.title === sectionTitle) {
        const updatedData = section.data.map((item) =>
          item.title === itemTitle ? { ...item, isActive: !item.isActive } : item,
        );
        return { ...section, data: updatedData };
      }
      return section;
    });

    setSectionData(updatedSections);
  };

  // Render the section header with the toggle functionality
  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    const isCollapsed = collapsedSections[section.title];
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
        <View style={{ width: 50, backgroundColor: colors.listBackground }}>
          <View
            style={[
              styles.roundButton,
              { borderColor: colors.iconColor, borderWidth: 1, backgroundColor: colors.listBackground },
            ]}
          >
            <TouchableOpacity
              style={[styles.roundButton, { borderColor: colors.iconColor }]}
              onPress={() => alert('Button Pressed')}
            ></TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.listBackground }}>
          <Pressable onPress={() => toggleSection(section.title)} hitSlop={10}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: colors.listBackground,
              }}
            >
              <Text style={styles.headerText}>{section.title}</Text>
              <Ionicons
                name={isCollapsed ? 'chevron-down-sharp' : 'chevron-up-sharp'}
                size={24}
                color={colors.iconColor}
              />
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  // Render the section content (items) only if the section is not collapsed
  const renderItem = ({ item, section }: ListRenderItemInfo<ItemData>) => {
    const isActive = item.isActive;
    return (
      <View style={[styles.item, { borderColor: colors.borderColor }]}>
        <View
          style={[
            styles.roundButton,
            {
              borderColor: colors.iconColor,
              borderWidth: 1,
              backgroundColor: isActive ? colors.iconColor : 'transparent', // Conditionally set backgroundColor
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.roundButton, { borderColor: colors.iconColor }]}
            onPress={() => toggleItemActiveState(section.title, item.title)}
          ></TouchableOpacity>
        </View>
        <View style={{ marginLeft: 60 }}>
          <Text style={styles.itemText}>{item.title}</Text>
        </View>
      </View>
    );
  };

  // Memoize the data with visibility based on collapsed sections
  const memoizedSections = useMemo(() => {
    return sectionData.map((section) => ({
      ...section,
      data: collapsedSections[section.title] ? [] : section.data,
    }));
  }, [collapsedSections, sectionData]);

  // To avoid the scroll "jumping", remove scrollToEnd
  const handleContentSizeChange = (_contentWidth: number, contentHeight: number) => {
    if (listRef.current) {
      // Avoid forcing scroll to end or triggering a scroll if not necessary
      const offsetY = listRef.current.contentOffset?.y || 0;
      if (contentHeight > offsetY) {
        // Optionally add scroll logic if needed
      }
    }
  };

  // The main render method for SectionList
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
          ref={listRef} // Add the ref to SectionList
          sections={memoizedSections} // Use the memoized sections data
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={<Text>No data available</Text>}
          onContentSizeChange={handleContentSizeChange} // Ensure scroll position when content size changes
          initialNumToRender={10} // Limit the initial number of items to render
          maxToRenderPerBatch={15} // Adjust max renderable items per batch to avoid overloading
        />
      </View>
    </SafeAreaView>
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
    width: 25, // Width of the button
    height: 25, // Height of the button (same as width to make it circular)
    borderRadius: 12.5, // Half of width/height for the round shape
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CollapsibleSectionList;
