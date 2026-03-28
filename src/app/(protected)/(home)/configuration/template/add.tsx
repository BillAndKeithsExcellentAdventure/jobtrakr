import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import {
  ProjectTemplateData,
  useAddRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

const AddTemplateModal = () => {
  const router = useRouter();
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
        <View style={{ flex: 1, gap: 10 }}>
          <TextField
            placeholder="Template Name"
            value={projectTemplate.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
          <TextField
            style={{ minHeight: 80 }}
            placeholder="Description"
            value={projectTemplate.description}
            multiline
            onChangeText={(text) => handleInputChange('description', text)}
          />
        </View>
      </ModalScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default AddTemplateModal;
