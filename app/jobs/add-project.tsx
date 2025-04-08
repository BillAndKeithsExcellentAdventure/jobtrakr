import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { JobData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobDataStore } from '@/stores/jobDataStore';
import { Stack, useRouter } from 'expo-router';
import { JobTemplateData, ProjectData } from '@/models/types';
import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';
import OptionList, { OptionEntry } from '@/components/OptionList';
import { OptionPickerItem } from '@/components/OptionPickerItem';
import BottomSheetContainer from '@/components/BottomSheetContainer';
import { useAddProjectCallback } from '@/tbStores/ListOfProjectsStore';

type Job = {
  name: string;
  location: string;
  owner: string;
};

const AddJobScreen = () => {
  const [project, setProject] = useState<ProjectData>({
    name: '',
    location: '',
    ownerName: '',
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
  const { allJobTemplates, setJobTemplates, addJobTemplate } = useJobTemplateDataStore();
  const [isTemplateListPickerVisible, setIsTemplateListPickerVisible] = useState<boolean>(false);
  const [pickedTemplate, setPickedTemplate] = useState<OptionEntry | undefined>(undefined);
  const [templateOptions, setTemplateOptions] = useState<OptionEntry[]>([]);
  const [canAddJob, setCanAddJob] = useState(false);

  const handleTemplateOptionChange = (option: OptionEntry) => {
    setPickedTemplate(option);
    setIsTemplateListPickerVisible(false);
  };

  useEffect(() => {
    // Fetch job templates from API or local storage (simulated here)
    const fetchJobTemplates = async () => {
      const jobTemplatesData: JobTemplateData[] = [
        {
          _id: '1',
          name: 'Standard House',
          description: 'Standard Residential Construction',
        },
        {
          _id: '2',
          name: 'Private Steel Building',
          description: 'Privately owned steel building',
        },
        {
          _id: '3',
          name: 'Public Steel Building',
          description: 'State or Federally owned steel building',
        },
      ];
      setJobTemplates(jobTemplatesData);
    };

    fetchJobTemplates();
  }, []);

  useEffect(() => {
    const options = allJobTemplates.map((t) => {
      return { label: t.name, value: t._id };
    });
    setTemplateOptions(options);
  }, [allJobTemplates]);

  useEffect(() => {
    setCanAddJob((project ? (project.name ? project.name.length : 0) : 0) > 0 && !!pickedTemplate);
  }, [project, pickedTemplate]);

  const handleSubmit = useCallback(async () => {
    console.log('Job submitted:', project);

    console.log('Adding project to database:', addProject);

    const projData: ProjectData = {
      name: project.name,
      location: project.location,
      ownerName: project.ownerName,
    };

    const result = addProject(projData);
    console.log('Job creation result:', result);
    if (result?.status === 'Success') {
      console.log('Job created:', project);
    } else {
      console.log('Job creation failed:', project);
    }
    router.back();
  }, [project]);

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
