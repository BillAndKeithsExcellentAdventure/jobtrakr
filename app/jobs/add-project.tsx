import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { JobData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobDataStore } from '@/stores/jobDataStore';
import { Stack, useRouter } from 'expo-router';
import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';
import OptionList, { OptionEntry } from '@/components/OptionList';
import { OptionPickerItem } from '@/components/OptionPickerItem';
import BottomSheetContainer from '@/components/BottomSheetContainer';
import { JobTemplateData, useAllRows } from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import { useAddProjectCallback } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import { ProjectData } from '@/models/types';

const AddJobScreen = () => {
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
    seedJobWorkItems: '', // comma separated list of workItemIds
    startDate: defaultStart.getTime(),
    plannedFinish: defaultFinish.getTime(),
  });

  const addProject = useAddProjectCallback();

  const colorScheme = useColorScheme();

  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.opaqueModalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            neutral200: Colors.dark.neutral200,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.opaqueModalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            neutral200: Colors.light.neutral200,
          },
    [colorScheme],
  );

  const router = useRouter();
  const allJobTemplates = useAllRows('templates');
  const allJobTemplateWorkItems = useAllRows('templateWorkItems');
  const [isTemplateListPickerVisible, setIsTemplateListPickerVisible] = useState<boolean>(false);
  const [pickedTemplate, setPickedTemplate] = useState<OptionEntry | undefined>(undefined);
  const [templateOptions, setTemplateOptions] = useState<OptionEntry[]>([]);
  const [canAddJob, setCanAddJob] = useState(false);
  const { addActiveProjectIds } = useActiveProjectIds();
  const handleTemplateOptionChange = (option: OptionEntry) => {
    setPickedTemplate(option);
    setIsTemplateListPickerVisible(false);
  };

  useEffect(() => {
    const availableOptions = allJobTemplates.map((t) => {
      return { label: t.name, value: t.id };
    });
    if (availableOptions.length === 0) {
      availableOptions.push({ label: 'No templates available', value: '' });
      setTemplateOptions(availableOptions);
    } else {
      availableOptions.sort((a, b) => a.label.localeCompare(b.label));
      setTemplateOptions([{ label: 'None', value: '' }, ...availableOptions]);
    }
  }, [allJobTemplates]);

  useEffect(() => {
    setCanAddJob(project.name.length > 0 && undefined !== pickedTemplate);
  }, [project, pickedTemplate]);

  const handleSubmit = useCallback(async () => {
    if (!canAddJob) {
      console.log('Cannot add job, missing required fields.');
      return;
    }

    if (pickedTemplate?.value) {
      const template = allJobTemplates.find((t) => t.id === pickedTemplate?.value);
      if (template) {
        const templateWorkItems = allJobTemplateWorkItems.find((t) => t.templateId === template.id);
        if (templateWorkItems) {
          project.seedJobWorkItems = templateWorkItems.workItemIds;
        }
      }
    }

    const result = addProject(project);
    if (result.status !== 'Success') {
      Alert.alert(`Job creation failed for project ${project.name}: ${result.msg}`);
    } else {
      addActiveProjectIds(result.id);
    }
    router.back();
  }, [project, canAddJob, pickedTemplate, allJobTemplates, allJobTemplateWorkItems, addProject, router]);

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
            type={canAddJob ? 'ok' : 'disabled'}
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
    height: 36,
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

export default AddJobScreen;
