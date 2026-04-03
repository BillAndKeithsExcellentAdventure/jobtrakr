import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { CostItemPicker } from '@/src/components/CostItemPicker';
import { NumericInputField } from '@/src/components/NumericInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { useAllProjects } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import {
  useAllRows,
  useUpdateRowCallback,
  useTypedRow,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditLineItemPage = () => {
  const router = useRouter();
  const allProjects = useAllProjects();
  const { projectId, receiptId, lineItemId } = useLocalSearchParams<{
    projectId: string;
    receiptId: string;
    lineItemId: string;
  }>();

  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  const updateLineItem = useUpdateRowCallback(projectId, 'workItemCostEntries');
  const receipt = useTypedRow(projectId, 'receipts', receiptId);

  const [itemizedEntry, setItemizedEntry] = useState<WorkItemCostEntry>({
    id: '',
    label: '',
    amount: 0,
    workItemId: '',
    parentId: '',
    documentationType: 'receipt',
  });

  const [isProjectPickerVisible, setIsProjectPickerVisible] = useState<boolean>(false);
  const [pickedProjectOption, setPickedProjectOption] = useState<OptionEntry | undefined>(undefined);
  const [projectOptions, setProjectOptions] = useState<OptionEntry[] | undefined>(undefined);

  // tracks whether any field has been changed since load/save
  const isDirtyRef = useRef<boolean>(false);

  // Determine if this line item should be read-only (cross-project item with purchaseId)
  const isReadOnly = receipt?.purchaseId && itemizedEntry.projectId && itemizedEntry.projectId !== projectId;

  const saveEntry = useCallback(
    async (updatedEntry?: WorkItemCostEntry) => {
      // Use the provided updated entry or fall back to current state
      const entryToSave = updatedEntry || itemizedEntry;

      // don't save if nothing changed or item is read-only
      if (!isDirtyRef.current || isReadOnly) return;
      // require label and amount to be present before saving
      if (!entryToSave.label || !entryToSave.amount) return;
      // ensure we have an id to update
      if (!entryToSave.id) return;

      const updatedItemizedEntry: WorkItemCostEntry = {
        ...entryToSave,
        workItemId: entryToSave.workItemId,
        projectId: pickedProjectOption ? (pickedProjectOption.value as string) : projectId,
      };
      const result = updateLineItem(updatedItemizedEntry.id, updatedItemizedEntry);
      if (result.status !== 'Success') {
        Alert.alert('Error', 'Failed to save line item.');
        return;
      }
      isDirtyRef.current = false;
    },
    [itemizedEntry, pickedProjectOption, updateLineItem, projectId, isReadOnly],
  );

  useEffect(() => {
    if (lineItemId) {
      const existingItem = allCostItems.find((item) => item.id === lineItemId);
      if (existingItem) {
        setItemizedEntry(existingItem);
      }
    }
  }, [allCostItems, lineItemId]);

  useEffect(() => {
    if (allProjects && allProjects.length > 0) {
      const activeProjects = allProjects.filter((project) => project.status === 'active');
      const options: OptionEntry[] = activeProjects.map((project) => ({
        label: project.name,
        value: project.id,
      }));
      setProjectOptions(options);

      // Set the picked project option to the current project
      if (projectId) {
        const currentProjectOption = options.find((option) => option.value === projectId);
        if (currentProjectOption) {
          setPickedProjectOption(currentProjectOption);
        }
      }
    }
  }, [allProjects, projectId]);

  useEffect(() => {
    if (itemizedEntry.projectId) {
      const projectOption = projectOptions?.find((option) => option.value === itemizedEntry.projectId);
      if (projectOption) {
        setPickedProjectOption(projectOption);
      }
    }
  }, [itemizedEntry.projectId, projectOptions]);

  const handleProjectOptionChange = (option: OptionEntry) => {
    if (option) {
      setPickedProjectOption(option);
      isDirtyRef.current = true;
    }
    setIsProjectPickerVisible(false);
  };

  const handleSubCategoryChange = useCallback(
    (workItemId: string) => {
      isDirtyRef.current = true;
      const updatedEntry = {
        ...itemizedEntry,
        workItemId,
      };
      setItemizedEntry(updatedEntry);
      void saveEntry(updatedEntry);
    },
    [itemizedEntry, saveEntry],
  );

  const handleBackPress = () => {
    router.back();
  };

  const selectedProjectId = (pickedProjectOption?.value as string) ?? projectId;

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Edit Receipt Line Item',
          headerShown: true,
          gestureEnabled: false,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
        }}
      />
      <View style={styles.container}>
        {isReadOnly && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              This line item belongs to a different project and has been synced to QuickBooks. Edit it in the{' '}
              {pickedProjectOption?.label} project instead.
            </Text>
          </View>
        )}
        <NumericInputField
          containerStyle={{ marginTop: 0 }}
          inputStyle={{ paddingHorizontal: 10 }}
          labelStyle={{ marginBottom: 2 }}
          label="Amount"
          maxDecimals={2}
          decimals={2}
          value={itemizedEntry.amount}
          editable={!isReadOnly}
          onChangeNumber={(value: number | null): void => {
            if (isReadOnly) return;
            isDirtyRef.current = true;
            const updatedEntry = {
              ...itemizedEntry,
              amount: value ?? 0,
            };
            setItemizedEntry(updatedEntry);
            // autosave when change occurs with the updated entry
            void saveEntry(updatedEntry);
          }}
        />
        <TextField
          containerStyle={styles.inputContainer}
          placeholder="Description"
          label="Description"
          value={itemizedEntry.label}
          editable={!isReadOnly}
          onChangeText={(text): void => {
            if (isReadOnly) return;
            isDirtyRef.current = true;
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              label: text,
            }));
          }}
          onBlur={() => {
            void saveEntry();
          }}
        />
        {projectOptions && projectOptions.length > 1 && !receipt?.purchaseId && (
          <OptionPickerItem
            containerStyle={styles.inputContainer}
            optionLabel={pickedProjectOption?.label}
            label="Project"
            placeholder="Project"
            editable={false}
            onPickerButtonPress={() => setIsProjectPickerVisible(true)}
          />
        )}
        <CostItemPicker
          style={styles.inputContainer}
          projectId={selectedProjectId}
          value={itemizedEntry.workItemId}
          onValueChange={(workItemId: string) => {
            if (isReadOnly) return;
            handleSubCategoryChange(workItemId);
          }}
          label="Cost Item Type"
          placeholder="Cost Item Type"
          modalTitle="Select Cost Item Type"
          modalHeight="80%"
        />
      </View>
      {isProjectPickerVisible && projectOptions && (
        <BottomSheetContainer
          modalHeight="65%"
          isVisible={isProjectPickerVisible}
          onClose={() => setIsProjectPickerVisible(false)}
          showKeyboardToolbar={false}
        >
          <OptionList
            options={projectOptions}
            onSelect={(option) => handleProjectOptionChange(option)}
            selectedOption={pickedProjectOption}
            enableSearch={projectOptions.length > 15}
          />
        </BottomSheetContainer>
      )}
    </SafeAreaView>
  );
};

export default EditLineItemPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    width: '100%',
  },
  inputContainer: {
    marginTop: 6,
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  saveButtonRow: {
    marginVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});
