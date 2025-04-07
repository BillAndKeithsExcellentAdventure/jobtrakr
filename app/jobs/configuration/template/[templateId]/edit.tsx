import OkayCancelButtons from '@/components/OkayCancelButtons'; // Assuming you have this component
import { TextInput, View } from '@/components/Themed';
import { useTemplateValue, useUpdateTemplateCallback } from '@/tbStores/ConfigurationStore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditJobTemplate = () => {
  const { templateId } = useLocalSearchParams(); // Assuming the route includes jobTemplateId
  const applyTemplateUpdates = useUpdateTemplateCallback();
  const jobTemplateId = templateId as string; // Ensure this is a string for the store hooks
  const router = useRouter();
  const [name] = useTemplateValue(jobTemplateId, 'name');
  const [newName, setNewName] = useState(name);
  const [description] = useTemplateValue(jobTemplateId, 'description');
  const [newDescription, setNewDescription] = useState(description);

  useEffect(() => {
    setNewName(name);
  }, [name]);

  useEffect(() => {
    setNewDescription(description);
  }, [description]);

  const handleSave = () => {
    if (newName && newDescription) {
      applyTemplateUpdates(jobTemplateId, {
        _id: jobTemplateId,
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
          title: 'Edit Job Template',
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

export default EditJobTemplate;
