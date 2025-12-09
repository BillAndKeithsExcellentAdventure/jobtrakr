import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  ProjectTemplateData,
  useAddRowCallback,
  useAllRows,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Ionicons } from '@expo/vector-icons'; // Right caret icon
import { Stack } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Platform, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableProjectTemplate from '@/src/components/SwipeableProjectTemplate';

const ListProjectTemplates = () => {
  const allProjectTemplates = useAllRows('templates');
  const addProjectTemplate = useAddRowCallback('templates');
  const [showAdd, setShowAdd] = useState(false);
  const [projectTemplate, setProjectTemplate] = useState<ProjectTemplateData>({
    id: '',
    name: '',
    description: '',
  });

  const colors = useColors();

  const handleInputChange = (name: keyof ProjectTemplateData, value: string) => {
    if (projectTemplate) {
      setProjectTemplate({
        ...projectTemplate,
        [name]: value,
      });
    }
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Project Templates',
          headerRight: renderHeaderRight,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
          <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
            {showAdd && (
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
                      style={[styles.input, { backgroundColor: colors.neutral200 }]}
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
            )}
            <View style={{ flex: 1 }}>
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
                    <Text txtSize="title" text="No project templates found." />
                    <Text text="Use the '+' in the upper right to add one." />
                  </View>
                )}
              />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </>
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
