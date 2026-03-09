import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  ProjectTemplateData,
  useAddRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

const AddTemplateModal = () => {
  const router = useRouter();
  const colors = useColors();
  const addProjectTemplate = useAddRowCallback('templates');
  const [projectTemplate, setProjectTemplate] = useState<ProjectTemplateData>({
    id: '',
    name: '',
    description: '',
  });

  const handleInputChange = useCallback(
    (name: keyof ProjectTemplateData, value: string) => {
      if (projectTemplate) {
        setProjectTemplate({
          ...projectTemplate,
          [name]: value,
        });
      }
    },
    [projectTemplate],
  );

  const handleSave = useCallback(() => {
    if (projectTemplate.name && projectTemplate.description) {
      const newTemplate = {
        ...projectTemplate,
        id: '0',
      } as ProjectTemplateData;

      addProjectTemplate(newTemplate);
      router.back();
    }
  }, [projectTemplate, addProjectTemplate, router]);

  const canSave = projectTemplate.name.length > 0 && projectTemplate.description.length > 0;

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        title="Add Project Template"
        onSave={handleSave}
        onCancel={() => router.back()}
        canSave={canSave}
      >
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Template Name"
          value={projectTemplate.name}
          onChangeText={(text) => handleInputChange('name', text)}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200, minHeight: 80 }]}
          placeholder="Description"
          value={projectTemplate.description}
          multiline
          onChangeText={(text) => handleInputChange('description', text)}
        />
      </ModalScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    paddingTop: 8,
    borderRadius: 4,
  },
});

export default AddTemplateModal;
