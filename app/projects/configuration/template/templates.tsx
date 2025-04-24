import { ActionButton } from '@/components/ActionButton';
import { TextInput, Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons'; // Right caret icon
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableProjectTemplate from './SwipeableProjectTemplate';
import {
  ProjectTemplateData,
  useAddRowCallback,
  useAllRows,
  WorkItemData,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';

const ListProjectTemplates = () => {
  const allProjectTemplates = useAllRows('templates');
  const addProjectTemplate = useAddRowCallback('templates');
  const [showAdd, setShowAdd] = useState(false);
  const [projectTemplate, setProjectTemplate] = useState<ProjectTemplateData>({
    id: '',
    name: '',
    description: '',
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

  const handleInputChange = (name: keyof ProjectTemplateData, value: string) => {
    if (projectTemplate) {
      setProjectTemplate({
        ...projectTemplate,
        [name]: value,
      });
    }
  };

  const handleEditProjectTemplate = (id: string) => {
    router.push(`/projects/configuration/template/${id}`);
  };

  const renderHeaderRight = () => (
    <Pressable onPress={() => setShowAdd(!showAdd)} hitSlop={10} style={styles.headerButton}>
      <Ionicons name={showAdd ? 'chevron-up-sharp' : 'add'} size={24} color={colors.iconColor} />
    </Pressable>
  );

  const handleAddProjectTemplate = useCallback(() => {
    if (projectTemplate.name && projectTemplate.description) {
      const newTemplate = {
        ...projectTemplate,
        id: '0',
      } as ProjectTemplateData;

      addProjectTemplate(newTemplate);

      // Clear the input fields
      setProjectTemplate({ id: '', name: '', description: '' });
    }
  }, [allProjectTemplates, projectTemplate]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Project Templates',
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
                    value={projectTemplate.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                  />
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.neutral200, marginLeft: 5 }]}
                    placeholder="Description"
                    value={projectTemplate.description}
                    onChangeText={(text) => handleInputChange('description', text)}
                  />
                </View>

                <ActionButton
                  style={{ zIndex: 1 }}
                  onPress={handleAddProjectTemplate}
                  type={projectTemplate.name && projectTemplate.description ? 'action' : 'disabled'}
                  title="Add Project Template"
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
        <View>
          <FlatList
            data={allProjectTemplates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SwipeableProjectTemplate projectTemplate={item} />}
            ListEmptyComponent={() => (
              <View
                style={{
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Text txtSize="title" text="No job templates found." />
                <Text text="Use the '+' in the upper right to add one." />
              </View>
            )}
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

export default ListProjectTemplates;
