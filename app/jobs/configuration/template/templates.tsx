// screens/ListJobTemplates.tsx

import { ActionButton } from '@/components/ActionButton';
import { TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { JobTemplateData, WorkItemData } from '@/models/types';
// import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';

import {
  useAllTemplates,
  useAddTemplateCallback,
  useUpdateTemplateCallback,
} from '@/tbStores/ConfigurationStore';
import { Ionicons } from '@expo/vector-icons'; // Right caret icon
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableJobTemplate from './SwipeableJobTemplate';

const ListJobTemplates = () => {
  const allJobTemplates = useAllTemplates();
  const addJobTemplate = useAddTemplateCallback();
  const updateJobTemplate = useUpdateTemplateCallback();
  const [showAdd, setShowAdd] = useState(false);
  const [jobTemplate, setJobTemplate] = useState<JobTemplateData>({
    name: '',
    description: '',
    workItems: [],
  });
  const [selectedWorkItems, setSelectedWorkItems] = useState<WorkItemData[]>([]);

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
      // const jobTemplatesData: JobTemplateData[] = [
      //   {
      //     _id: '1',
      //     name: 'Standard House',
      //     description: 'Standard Residential Construction',
      //     workItems: ['1', '3'], // not currently used in demo
      //   },
      //   {
      //     _id: '2',
      //     name: 'Private Steel Building',
      //     description: 'Privately owned steel building',
      //     workItems: ['2'], // not currently used in demo
      //   },
      //   {
      //     _id: '3',
      //     name: 'Public Steel Building',
      //     description: 'State or Federally owned steel building',
      //     workItems: ['2'], // not currently used in demo
      //   },
      // ];
      //updateJobTemplates(jobTemplatesData);
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
    if (jobTemplate.name && jobTemplate.description) {
      const newJobTemplate = {
        ...jobTemplate,
        _id: '0',
        WorkItems: selectedWorkItems.map((item) => item._id!),
      } as JobTemplateData;

      console.log('Saving item:', newJobTemplate);
      addJobTemplate(newJobTemplate);

      // Clear the input fields
      setJobTemplate({ name: '', description: '', workItems: [] });
      setSelectedWorkItems([]);
    }
  }, [allJobTemplates, jobTemplate, selectedWorkItems]);

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
                    value={jobTemplate.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                  />
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.neutral200, marginLeft: 5 }]}
                    placeholder="Description"
                    value={jobTemplate.description}
                    onChangeText={(text) => handleInputChange('description', text)}
                  />
                </View>

                <ActionButton
                  style={{ zIndex: 1 }}
                  onPress={handleAddJobTemplate}
                  type={jobTemplate.name && jobTemplate.description ? 'action' : 'disabled'}
                  title="Add Job Template"
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
        <View>
          <FlatList
            data={allJobTemplates()}
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
function useAllJobTemplatesCallback() {
  throw new Error('Function not implemented.');
}
