import { Text, TextInput, View } from '@/components/Themed';
import { JobTemplateData, WorkItemData } from '@/models/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OkayCancelButtons from '@/components/OkayCancelButtons'; // Assuming you have this component

const EditJobTemplate = () => {
  const { jobTemplateId } = useLocalSearchParams(); // Assuming the route includes jobTemplateId
  const [jobTemplate, setJobTemplate] = useState<JobTemplateData | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (jobTemplateId) {
      // Find the existing job template by ID
      const fetchedJobTemplate = allJobTemplates.find((item) => item._id === jobTemplateId);
      setJobTemplate(fetchedJobTemplate || null);
    }
  }, [jobTemplateId]);

  const handleInputChange = (name: keyof JobTemplateData, value: string) => {
    if (jobTemplate) {
      setJobTemplate({
        ...jobTemplate,
        [name]: value,
      });
    }
  };

  const handleSave = () => {
    if (jobTemplate) {
      console.log('Updated job template:', jobTemplate);
      updateJobTemplate(jobTemplateId as string, jobTemplate);
      router.back(); // Navigate back after saving
    }
  };

  if (!jobTemplate) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

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
          value={jobTemplate.name}
          onChangeText={(text) => handleInputChange('name', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={jobTemplate.description}
          onChangeText={(text) => handleInputChange('description', text)}
        />

        <OkayCancelButtons
          okTitle="Save"
          isOkEnabled={!!jobTemplate.name && !!jobTemplate.description}
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
