import OkayCancelButtons from '@/src/components/OkayCancelButtons'; // Assuming you have this component
import { TextInput, View } from '@/src/components/Themed';
import {
  useTableValue,
  useUpdateRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditProjectTemplate = () => {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const applyTemplateUpdates = useUpdateRowCallback('templates');
  const router = useRouter();
  const name = useTableValue('templates', templateId, 'name');
  const [newName, setNewName] = useState(name);
  const description = useTableValue('templates', templateId, 'description');
  const [newDescription, setNewDescription] = useState(description);

  useEffect(() => {
    setNewName(name);
  }, [name]);

  useEffect(() => {
    setNewDescription(description);
  }, [description]);

  const handleSave = () => {
    if (newName && newDescription) {
      applyTemplateUpdates(templateId, {
        id: templateId,
        description: newDescription,
        name: newName,
      });

      // Go back to the categories list screen
      router.back();
    }
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Project Template',
        }}
      />

      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Template Name"
          value={newName}
          onChangeText={setNewName}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={newDescription}
          onChangeText={setNewDescription}
        />

        <OkayCancelButtons
          okTitle="Save"
          isOkEnabled={!!newName && !!newDescription}
          onOkPress={handleSave}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 4,
  },
});

export default EditProjectTemplate;
