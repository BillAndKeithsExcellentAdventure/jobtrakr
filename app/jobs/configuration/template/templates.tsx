// screens/ListJobTemplates.tsx

import { ActionButton } from '@/components/ActionButton';
import { TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { JobTemplateData, WorkCategoryItemData } from '@/models/types';
import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';
import { Ionicons } from '@expo/vector-icons'; // Right caret icon
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableJobTemplate from './SwipeableJobTemplate';

const ListJobTemplates = () => {
  const { allJobTemplates, setJobTemplates, addJobTemplate } = useJobTemplateDataStore();
  const [showAdd, setShowAdd] = useState(false);
  const [jobTemplate, setJobTemplate] = useState<JobTemplateData>({
    Name: '',
    Description: '',
    WorkItems: [],
  });
  const [selectedWorkItems, setSelectedWorkItems] = useState<WorkCategoryItemData[]>([]);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            listBackground: Colors.dark.listBackground,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
            neutral200: Colors.dark.neutral200,
          }
        : {
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
            neutral200: Colors.light.neutral200,
          },
    [colorScheme],
  );

  useEffect(() => {
    // Fetch job templates from API or local storage (simulated here)
    const fetchJobTemplates = async () => {
      const jobTemplatesData: JobTemplateData[] = [
        {
          _id: '1',
          Name: 'Standard House',
          Description: 'Standard Residential Construction',
          WorkItems: ['1', '3'], // not currently used in demo
        },
        {
          _id: '2',
          Name: 'Private Steel Building',
          Description: 'Privately owned steel building',
          WorkItems: ['2'], // not currently used in demo
        },
        {
          _id: '3',
          Name: 'Public Steel Building',
          Description: 'State or Federally owned steel building',
          WorkItems: ['2'], // not currently used in demo
        },
      ];
      setJobTemplates(jobTemplatesData);
    };

    fetchJobTemplates();
  }, []);

  const handleInputChange = (name: keyof JobTemplateData, value: string) => {
    if (jobTemplate) {
      setJobTemplate({
        ...jobTemplate,
        [name]: value,
      });
    }
  };

  const handleEditJobTemplate = (id: string) => {
    router.push(`/jobs/configuration/template/${id}`);
  };

  const renderHeaderRight = () => (
    <Pressable onPress={() => setShowAdd(!showAdd)} hitSlop={10} style={styles.headerButton}>
      <Ionicons name={showAdd ? 'chevron-up-sharp' : 'add'} size={24} color={colors.iconColor} />
    </Pressable>
  );

  const handleAddJobTemplate = useCallback(() => {
    if (jobTemplate.Name && jobTemplate.Description && selectedWorkItems.length > 0) {
      const newJobTemplate = {
        ...jobTemplate,
        _id: (allJobTemplates.length + 1).toString(),
        WorkItems: selectedWorkItems.map((item) => item._id!),
      } as JobTemplateData;

      console.log('Saving item:', newJobTemplate);
      addJobTemplate(newJobTemplate);

      // Clear the input fields
      setJobTemplate({ Name: '', Description: '', WorkItems: [] });
      setSelectedWorkItems([]);
    }
  }, [allJobTemplates, jobTemplate, selectedWorkItems, setJobTemplates]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Job Templates',
          headerRight: renderHeaderRight,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        {showAdd && (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={{ backgroundColor: colors.listBackground }}>
              <View style={{ padding: 10, borderRadius: 10, marginVertical: 15, marginHorizontal: 15 }}>
                <View>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.neutral200 }]}
                    placeholder="Template Name"
                    value={jobTemplate.Name}
                    onChangeText={(text) => handleInputChange('Name', text)}
                  />
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.neutral200, marginLeft: 5 }]}
                    placeholder="Description"
                    value={jobTemplate.Description}
                    onChangeText={(text) => handleInputChange('Description', text)}
                  />
                </View>

                <ActionButton
                  style={{ zIndex: 1 }}
                  onPress={handleAddJobTemplate}
                  type={
                    jobTemplate.Name && jobTemplate.Description && selectedWorkItems.length > 0
                      ? 'action'
                      : 'disabled'
                  }
                  title="Add Job Template"
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
        <View>
          <FlatList
            data={allJobTemplates}
            keyExtractor={(item) => item._id!}
            renderItem={({ item }) => <SwipeableJobTemplate jobTemplate={item} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 4,
  },
  headerButton: {
    padding: 8,
    paddingRight: 0,
    zIndex: 1,
  },
});

export default ListJobTemplates;
