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
import { JobTemplateData } from '@/models/types';
import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';
import OptionList, { OptionEntry } from '@/components/OptionList';
import { OptionPickerItem } from '@/components/OptionPickerItem';
import BottomSheetContainer from '@/components/BottomSheetContainer';

type Job = {
  name: string;
  location: string;
  owner: string;
};

const AddJobScreen = () => {
  const { addJob } = useJobDataStore();

  const [job, setJob] = useState<Job>({
    name: '',
    location: '',
    owner: '',
  });

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

  const { jobDbHost } = useJobDb();
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
          Name: 'Standard House',
          Description: 'Standard Residential Construction',
          WorkItems: ['1', '3'], // not currently used in demo
        },
        {
          _id: '2',
          Name: 'Private Steel Building',
          Description: 'Privately owned steel building',
          WorkItems: ['2'], // not currently used in demo
        },
        {
          _id: '3',
          Name: 'Public Steel Building',
          Description: 'State or Federally owned steel building',
          WorkItems: ['2'], // not currently used in demo
        },
      ];
      setJobTemplates(jobTemplatesData);
    };

    fetchJobTemplates();
  }, []);

  useEffect(() => {
    const options = allJobTemplates.map((t) => {
      return { label: t.Name, value: t._id };
    });
    setTemplateOptions(options);
  }, [allJobTemplates]);

  useEffect(() => {
    setCanAddJob(job.name?.length > 4 && !!pickedTemplate);
  }, [job, pickedTemplate]);

  const handleSubmit = useCallback(async () => {
    const id = { value: 0n };

    const jobData: JobData = {
      Name: job.name,
      Location: job.location,
      OwnerName: job.owner,
    };

    const result = await jobDbHost?.GetJobDB().CreateJob(jobData);
    if (result?.status === 'Success') {
      jobData._id = result.id.toString();
      addJob(jobData);
      console.log('Job created:', job);
    } else {
      console.log('Job creation failed:', job);
    }
    router.back();
  }, [job]);

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={[styles.modalBackground, { backgroundColor: colors.modalOverlayBackgroundColor }]}
    >
      <Stack.Screen options={{ title: 'Add Job' }} />

      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Create New Job</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Job Name"
          value={job.name}
          onChangeText={(text) => setJob({ ...job, name: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Location"
          value={job.location}
          onChangeText={(text) => setJob({ ...job, location: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Owner"
          value={job.owner}
          onChangeText={(text) => setJob({ ...job, owner: text })}
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
