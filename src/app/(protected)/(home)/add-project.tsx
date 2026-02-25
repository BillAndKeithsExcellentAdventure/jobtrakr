import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { CustomerPicker } from '@/src/components/CustomerPicker';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextInput, View, Text } from '@/src/components/Themed';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { ProjectData } from '@/src/models/types';
import { useAllRows, CustomerData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAddProjectCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

const AddProjectScreen = () => {
  const defaultStart = new Date();
  const defaultFinish = new Date();
  defaultFinish.setMonth(defaultFinish.getMonth() + 9);

  const [project, setProject] = useState<ProjectData>({
    id: '',
    name: '',
    abbreviation: '',
    location: '',
    customerId: '',
    bidPrice: 0,
    quotedPrice: 0,
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
  const allCustomers = useAllRows('customers');
  const [isTemplateListPickerVisible, setIsTemplateListPickerVisible] = useState<boolean>(false);
  const [pickedTemplate, setPickedTemplate] = useState<OptionEntry | undefined>(undefined);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | undefined>(undefined);
  const [templateOptions, setTemplateOptions] = useState<OptionEntry[]>([]);
  const [canAddProject, setCanAddProject] = useState(false);
  const { addActiveProjectIds } = useActiveProjectIds();
  const handleTemplateOptionChange = useCallback((option: OptionEntry) => {
    setPickedTemplate(option);
    setIsTemplateListPickerVisible(false);
  }, []);

  useEffect(() => {
    // Build template options from available templates that have work items
    const availableOptions = allProjectTemplates
      .map((t) => {
        return { label: t.name, value: t.id };
      })
      .filter((option) => allTemplateWorkItems.some((tw) => tw.templateId === option.value));

    if (availableOptions.length === 0) {
      availableOptions.push({ label: 'No templates available', value: '' });
      setTemplateOptions(availableOptions);
    } else {
      availableOptions.sort((a, b) => a.label.localeCompare(b.label));
      setTemplateOptions([{ label: 'None', value: '' }, ...availableOptions]);
    }
  }, [allProjectTemplates, allTemplateWorkItems]);

  useEffect(() => {
    setCanAddProject(
      project.name.length > 0 &&
        undefined !== pickedTemplate &&
        project.abbreviation.length > 0 &&
        undefined !== selectedCustomer,
    );
  }, [project, pickedTemplate, selectedCustomer]);

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

    if (selectedCustomer) {
      project.customerId = selectedCustomer.id;
    }

    const result = addProject(project);
    if (result.status !== 'Success') {
      Alert.alert(`Project creation failed for project ${project.name}: ${result.msg}`);
    } else {
      addActiveProjectIds(result.id);
    }
    router.back();
  }, [
    project,
    canAddProject,
    pickedTemplate,
    selectedCustomer,
    allProjectTemplates,
    allTemplateWorkItems,
    addProject,
    router,
    addActiveProjectIds,
  ]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer onSave={handleSubmit} onCancel={() => router.back()} canSave={canAddProject}>
        <Text style={styles.modalTitle}>Create New Project</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Project Name"
          value={project.name}
          onChangeText={(text) => setProject({ ...project, name: text })}
        />
        {/* Abbreviation is optional but if entered should be max 10 characters */}
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Abbreviation for Receipts and Bills"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          value={project.abbreviation}
          onChangeText={(text) => setProject({ ...project, abbreviation: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Location"
          value={project.location}
          onChangeText={(text) => setProject({ ...project, location: text })}
        />
        <CustomerPicker
          style={{ marginBottom: 8 }}
          selectedCustomer={selectedCustomer}
          onCustomerSelected={setSelectedCustomer}
          customers={allCustomers}
          placeholder="Select a customer"
        />

        <OptionPickerItem
          containerStyle={{ backgroundColor: colors.neutral200, height: 36 }}
          optionLabel={pickedTemplate?.label}
          placeholder="Project Costs Template"
          editable={false}
          onPickerButtonPress={() => setIsTemplateListPickerVisible(true)}
        />
      </ModalScreenContainer>
      {templateOptions && isTemplateListPickerVisible && (
        <BottomSheetContainer
          isVisible={isTemplateListPickerVisible}
          onClose={() => setIsTemplateListPickerVisible(false)}
        >
          <OptionList
            options={templateOptions}
            onSelect={(option) => handleTemplateOptionChange(option)}
            selectedOption={pickedTemplate}
            enableSearch={templateOptions.length > 15}
          />
        </BottomSheetContainer>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 4,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default AddProjectScreen;
