import { CustomerPicker } from '@/src/components/CustomerPicker';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { OptionEntry } from '@/src/components/OptionList';
import { OptionPicker } from '@/src/components/OptionPicker';
import { Switch } from '@/src/components/Switch';
import { TextField } from '@/src/components/TextField';
import { View, Text } from '@/src/components/Themed';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { ProjectData } from '@/src/models/types';
import {
  useAllRows,
  CustomerData,
  CustomerDataCompareName,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  useAddProjectCallback,
  useAllProjects,
  useHasActiveCompanyExpenseProject,
} from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useEffectiveSubscriptionTier } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    isCompanyExpenseProject: false,
  });

  const addProject = useAddProjectCallback();
  const colors = useColors();
  const router = useRouter();
  const allProjectTemplates = useAllRows('templates');
  const allTemplateWorkItems = useAllRows('templateWorkItems');
  const allCustomers = useAllRows('customers', CustomerDataCompareName);
  const [pickedTemplate, setPickedTemplate] = useState<OptionEntry | undefined>(undefined);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | undefined>(undefined);
  const [isCompanyExpenseProject, setIsCompanyExpenseProject] = useState<boolean>(false);
  const allProjects = useAllProjects();
  const effectiveSubscriptionTier = useEffectiveSubscriptionTier();
  const hasActiveCompanyExpenseProject = useHasActiveCompanyExpenseProject();
  const [templateOptions, setTemplateOptions] = useState<OptionEntry[]>([]);
  const [canAddProject, setCanAddProject] = useState(false);
  const { addActiveProjectIds } = useActiveProjectIds();

  const projectCreationBlockReason = useMemo(() => {
    if (effectiveSubscriptionTier !== 'free') {
      return '';
    }

    if (allProjects.length >= 2) {
      return 'No more projects can be added. Free tier supports up to 2 projects total.';
    }

    const hasExistingCompanyExpenseProject = allProjects.some((existingProject) =>
      Boolean(existingProject.isCompanyExpenseProject),
    );

    if (allProjects.length === 1 && !hasExistingCompanyExpenseProject && !isCompanyExpenseProject) {
      return 'Free tier requires one company expense project within your first two projects.';
    }

    return '';
  }, [allProjects, effectiveSubscriptionTier, isCompanyExpenseProject]);

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
        (isCompanyExpenseProject || undefined !== selectedCustomer) &&
        projectCreationBlockReason.length === 0,
    );
  }, [project, pickedTemplate, selectedCustomer, isCompanyExpenseProject, projectCreationBlockReason]);

  const handleSubmit = useCallback(async () => {
    if (!canAddProject) {
      console.log('Cannot add project, missing required fields.');
      return;
    }

    if (projectCreationBlockReason.length > 0) {
      Alert.alert('Project Limit Reached', projectCreationBlockReason);
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

    project.isCompanyExpenseProject = isCompanyExpenseProject;

    const result = addProject(project);
    if (result.status !== 'Success') {
      Alert.alert(`Project creation failed for project ${project.name}: ${result.msg}`);
      router.back();
    } else {
      addActiveProjectIds(result.id);
      // go to the Project Overview screen for the newly created project.
      // This will ensures the project is registered with QuickBooks
      router.replace({ pathname: '/[projectId]', params: { projectId: result.id } });
    }
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
    projectCreationBlockReason,
  ]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer onSave={handleSubmit} onCancel={() => router.back()} canSave={canAddProject}>
        <Text style={styles.modalTitle}>Create New Project</Text>
        {projectCreationBlockReason.length > 0 && (
          <Text style={[styles.blockReasonText, { color: colors.lossFg }]}>{projectCreationBlockReason}</Text>
        )}

        <TextField
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Project Name"
          value={project.name}
          onChangeText={(text) => setProject({ ...project, name: text })}
        />
        {/* Abbreviation is optional but if entered should be max 10 characters */}
        <TextField
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Abbreviation for Receipts and Bills"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          value={project.abbreviation}
          onChangeText={(text) => setProject({ ...project, abbreviation: text })}
        />
        {!hasActiveCompanyExpenseProject && (
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Office Expense Project</Text>
            <Switch size="large" value={isCompanyExpenseProject} onValueChange={setIsCompanyExpenseProject} />
          </View>
        )}
        {!isCompanyExpenseProject && projectCreationBlockReason.length === 0 && (
          <>
            <TextField
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
          </>
        )}

        <OptionPicker
          options={templateOptions}
          selectedOption={pickedTemplate}
          onOptionSelected={setPickedTemplate}
          placeholder="Project Costs Template"
          modalTitle="Select Template"
        />
      </ModalScreenContainer>
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  blockReasonText: {
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default AddProjectScreen;
