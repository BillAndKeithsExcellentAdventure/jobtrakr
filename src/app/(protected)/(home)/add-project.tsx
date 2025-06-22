import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { ProjectData } from '@/src/models/types';
import { useAllRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAddProjectCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddProjectScreen = () => {
  const defaultStart = new Date();
  const defaultFinish = new Date();
  defaultFinish.setMonth(defaultFinish.getMonth() + 9);

  const [project, setProject] = useState<ProjectData>({
    id: '',
    name: '',
    location: '',
    ownerName: '',
    bidPrice: 0,
    amountSpent: 0,
    longitude: 0,
    latitude: 0,
    radius: 50,
    favorite: 0,
    thumbnail: '',
    status: 'active', // 'active', 'on-hold'  or 'completed'
    seedWorkItems: '', // comma separated list of workItemIds
    startDate: defaultStart.getTime(),
    plannedFinish: defaultFinish.getTime(),
  });

  const addProject = useAddProjectCallback();
  const colors = useColors();
  const router = useRouter();
  const allProjectTemplates = useAllRows('templates');
  const allTemplateWorkItems = useAllRows('templateWorkItems');
  const [isTemplateListPickerVisible, setIsTemplateListPickerVisible] = useState<boolean>(false);
  const [pickedTemplate, setPickedTemplate] = useState<OptionEntry | undefined>(undefined);
  const [templateOptions, setTemplateOptions] = useState<OptionEntry[]>([]);
  const [canAddProject, setCanAddProject] = useState(false);
  const { addActiveProjectIds } = useActiveProjectIds();
  const handleTemplateOptionChange = (option: OptionEntry) => {
    setPickedTemplate(option);
    setIsTemplateListPickerVisible(false);
  };

  useEffect(() => {
    const availableOptions = allProjectTemplates.map((t) => {
      return { label: t.name, value: t.id };
    });
    if (availableOptions.length === 0) {
      availableOptions.push({ label: 'No templates available', value: '' });
      setTemplateOptions(availableOptions);
    } else {
      availableOptions.sort((a, b) => a.label.localeCompare(b.label));
      setTemplateOptions([{ label: 'None', value: '' }, ...availableOptions]);
    }
  }, [allProjectTemplates]);

  useEffect(() => {
    setCanAddProject(project.name.length > 0 && undefined !== pickedTemplate);
  }, [project, pickedTemplate]);

  const handleSubmit = useCallback(async () => {
    if (!canAddProject) {
      console.log('Cannot add project, missing required fields.');
      return;
    }

    if (pickedTemplate?.value) {
      const template = allProjectTemplates.find((t) => t.id === pickedTemplate?.value);
      if (template) {
        const templateWorkItems = allTemplateWorkItems.find((t) => t.templateId === template.id);
        if (templateWorkItems) {
          project.seedWorkItems = templateWorkItems.workItemIds;
        }
      }
    }

    const result = addProject(project);
    if (result.status !== 'Success') {
      Alert.alert(`Project creation failed for project ${project.name}: ${result.msg}`);
    } else {
      addActiveProjectIds(result.id);
    }
    router.back();
  }, [project, canAddProject, pickedTemplate, allProjectTemplates, allTemplateWorkItems, addProject, router]);

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={[styles.modalBackground, { backgroundColor: colors.modalOverlayBackgroundColor }]}
    >
      <Stack.Screen options={{ title: 'Add Project' }} />

      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Create New Project</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Project Name"
          value={project.name}
          onChangeText={(text) => setProject({ ...project, name: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Location"
          value={project.location}
          onChangeText={(text) => setProject({ ...project, location: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Owner"
          value={project.ownerName}
          onChangeText={(text) => setProject({ ...project, ownerName: text })}
        />
        <OptionPickerItem
          containerStyle={{ backgroundColor: colors.neutral200, height: 36 }}
          optionLabel={pickedTemplate?.label}
          placeholder="Work Template"
          onPickerButtonPress={() => setIsTemplateListPickerVisible(true)}
        />

        <View style={styles.saveButtonRow}>
          <ActionButton
            style={styles.saveButton}
            onPress={handleSubmit}
            type={canAddProject ? 'ok' : 'disabled'}
            title="Save"
          />
          <ActionButton
            style={styles.cancelButton}
            onPress={() => {
              router.back();
            }}
            type={'cancel'}
            title="Cancel"
          />
        </View>
        {templateOptions && isTemplateListPickerVisible && (
          <BottomSheetContainer
            isVisible={isTemplateListPickerVisible}
            onClose={() => setIsTemplateListPickerVisible(false)}
          >
            <OptionList
              options={templateOptions}
              onSelect={(option) => handleTemplateOptionChange(option)}
              selectedOption={pickedTemplate}
            />
          </BottomSheetContainer>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});

export default AddProjectScreen;
