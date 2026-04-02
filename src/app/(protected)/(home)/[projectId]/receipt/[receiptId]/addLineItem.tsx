import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { CostItemPicker } from '@/src/components/CostItemPicker';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumericInputField } from '@/src/components/NumericInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useAddRowCallback, WorkItemCostEntry } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useAllProjects } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';

const AddReceiptLineItemPage = () => {
  const router = useRouter();
  const allProjects = useAllProjects();
  const { projectId, receiptId } = useLocalSearchParams<{ projectId: string; receiptId: string }>();
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');

  const [isProjectPickerVisible, setIsProjectPickerVisible] = useState<boolean>(false);
  const [pickedProjectOption, setPickedProjectOption] = useState<OptionEntry | undefined>(undefined);
  const [projectOptions, setProjectOptions] = useState<OptionEntry[] | undefined>(undefined);

  useEffect(() => {
    if (allProjects && allProjects.length > 0) {
      const options: OptionEntry[] = allProjects.map((project) => ({
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

  const handleProjectOptionChange = (option: OptionEntry) => {
    if (option) {
      setPickedProjectOption(option);
    }
    setIsProjectPickerVisible(false);
  };

  const initItemizedEntry: WorkItemCostEntry = {
    id: '',
    label: '',
    amount: 0,
    workItemId: '',
    parentId: receiptId,
    documentationType: 'receipt',
  };

  const [itemizedEntry, setItemizedEntry] = useState<WorkItemCostEntry>(initItemizedEntry);
  const selectedProjectId = (pickedProjectOption?.value as string) ?? projectId;

  const handleOkPress = useCallback(async () => {
    if (!itemizedEntry.label || !itemizedEntry.amount) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    const newItemizedEntry: WorkItemCostEntry = {
      ...itemizedEntry,
      workItemId: itemizedEntry.workItemId,
      projectId: pickedProjectOption ? (pickedProjectOption.value as string) : projectId,
    };
    const result = addLineItem(newItemizedEntry);
    if (result.status !== 'Success') {
      Alert.alert('Error', 'Failed to add line item.');
      return;
    }
    router.back();
  }, [itemizedEntry, pickedProjectOption, addLineItem, router, projectId]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        onSave={handleOkPress}
        title="Add Receipt Line Item"
        onCancel={() => router.back()}
        canSave={!!itemizedEntry.label && !!itemizedEntry.amount}
      >
        <NumericInputField
          containerStyle={{ ...styles.inputContainer, marginTop: 0 }}
          label="Amount"
          maxDecimals={2}
          decimals={2}
          value={itemizedEntry.amount}
          onChangeNumber={(value: number | null): void => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              amount: value ?? 0,
            }));
          }}
        />
        <TextField
          containerStyle={styles.inputContainer}
          placeholder="Description"
          label="Description"
          value={itemizedEntry.label}
          onChangeText={(text): void => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              label: text,
            }));
          }}
        />
        {projectOptions && projectOptions?.length > 1 && (
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
          onValueChange={(workItemId) => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              workItemId,
            }));
          }}
          label="Cost Item Type"
          placeholder="Cost Item Type"
          modalTitle="Select Cost Item Type"
          modalHeight="80%"
        />
      </ModalScreenContainer>
      {isProjectPickerVisible && projectOptions && (
        <BottomSheetContainer
          modalHeight="65%"
          isVisible={isProjectPickerVisible}
          onClose={() => setIsProjectPickerVisible(false)}
        >
          <OptionList
            options={projectOptions}
            onSelect={(option) => handleProjectOptionChange(option)}
            selectedOption={pickedProjectOption}
            enableSearch={projectOptions.length > 15}
          />
        </BottomSheetContainer>
      )}
    </View>
  );
};

export default AddReceiptLineItemPage;

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 6,
  },
});
