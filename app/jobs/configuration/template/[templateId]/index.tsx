import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { SectionList, TouchableOpacity, StyleSheet, ListRenderItemInfo } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';
import { JobTemplateData } from '@/models/types';
import { View, Text } from '@/components/Themed';

interface SectionData {
  title: string;
  data: string[];
}

const CollapsibleSectionList: React.FC = () => {
  const { templateId } = useLocalSearchParams(); // Assuming the route includes jobTemplateId
  const { allJobTemplates, updateJobTemplate } = useJobTemplateDataStore();
  const [template, setTemplate] = useState<JobTemplateData | null>();

  // Sample data for SectionList
  const originalData: SectionData[] = [
    {
      title: 'Fruits',
      data: ['Apple', 'Banana', 'Orange', 'Grapes'],
    },
    {
      title: 'Vegetables',
      data: ['Carrot', 'Lettuce', 'Tomato', 'Cucumber'],
    },
    {
      title: 'Animals',
      data: ['Dog', 'Cat', 'Horse', 'Elephant'],
    },
  ];

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

  // Render the section header with the toggle functionality
  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    const isCollapsed = collapsedSections[section.title];
    return (
      <View style={styles.header}>
        <Text style={styles.headerText}>{section.title}</Text>
        <Pressable onPress={() => toggleSection(section.title)} hitSlop={10} style={styles.headerButton}>
          <Ionicons name={isCollapsed ? 'chevron-down-sharp' : 'chevron-up-sharp'} size={24} color={'#000'} />
        </Pressable>
      </View>
    );
  };

  // Render the section content (items) only if the section is not collapsed
  const renderItem = ({ item }: ListRenderItemInfo<string>) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item}</Text>
    </View>
  );

  // Modify the original data based on collapse state (show/hide data)
  const getDataWithVisibility = () => {
    return originalData.map((section) => ({
      ...section,
      data: collapsedSections[section.title] ? [] : section.data,
    }));
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
          sections={getDataWithVisibility()} // Dynamically get the data based on collapse state
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={<Text>No data available</Text>}
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
    backgroundColor: '#ddd',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
  },
});

export default CollapsibleSectionList;
