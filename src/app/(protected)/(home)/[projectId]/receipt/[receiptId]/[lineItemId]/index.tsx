import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useAutoSaveNavigation } from '@/src/hooks/useFocusManager';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import { useAllProjects } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { WorkItemDataCodeCompareAsNumber } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  useAllRows,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditLineItemPage = () => {
  const router = useRouter();
  const allProjects = useAllProjects();
  const { projectId, lineItemId } = useLocalSearchParams<{
    projectId: string;
    receiptId: string;
    lineItemId: string;
  }>();

  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  const updateLineItem = useUpdateRowCallback(projectId, 'workItemCostEntries');
  const {
    projectWorkItems,
    availableCategoriesOptions,
    allAvailableCostItemOptions,
    allWorkItems,
    allWorkCategories,
  } = useProjectWorkItems(projectId);
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

  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickedCategoryOption, setPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);

  const [isSubCategoryPickerVisible, setIsSubCategoryPickerVisible] = useState<boolean>(false);
  const [pickedSubCategoryOption, setPickedSubCategoryOption] = useState<OptionEntry | undefined>(undefined);
  const [subCategories, setSubCategories] = useState<OptionEntry[]>([]);

  // tracks whether any field has been changed since load/save
  const isDirtyRef = useRef<boolean>(false);

  const saveEntry = useCallback(
    async (updatedEntry?: WorkItemCostEntry) => {
      // Use the provided updated entry or fall back to current state
      const entryToSave = updatedEntry || itemizedEntry;

      // don't save if nothing changed
      if (!isDirtyRef.current) return;
      // require label and amount to be present before saving
      if (!entryToSave.label || !entryToSave.amount) return;
      // ensure we have an id to update
      if (!entryToSave.id) return;

      const updatedItemizedEntry: WorkItemCostEntry = {
        ...entryToSave,
        workItemId: pickedSubCategoryOption ? (pickedSubCategoryOption.value as string) : '',
        projectId: pickedProjectOption ? (pickedProjectOption.value as string) : projectId,
      };
      const result = updateLineItem(updatedItemizedEntry.id, updatedItemizedEntry);
      if (result.status !== 'Success') {
        Alert.alert('Error', 'Failed to save line item.');
        return;
      }
      isDirtyRef.current = false;
    },
    [itemizedEntry, pickedSubCategoryOption, pickedProjectOption, updateLineItem, projectId],
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

  useEffect(() => {
    if (itemizedEntry.workItemId) {
      const workItem = allWorkItems.find((item) => item.id === itemizedEntry.workItemId);
      if (workItem) {
        const category = allWorkCategories.find((c) => c.id === workItem.categoryId);
        setPickedCategoryOption(category ? { label: category.name, value: category.id } : undefined);
        setPickedSubCategoryOption({ label: workItem.name, value: workItem.id });
      }
    }
  }, [itemizedEntry.workItemId, allWorkItems, allWorkCategories]);

  useEffect(() => {
    if (itemizedEntry.projectId) {
      const projectOption = projectOptions?.find((option) => option.value === itemizedEntry.projectId);
      if (projectOption) {
        setPickedProjectOption(projectOption);
      }
    }
  }, [itemizedEntry.projectId, projectOptions]);

  const handleSubCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleSubCategoryChange(option);
    }
    setIsSubCategoryPickerVisible(false);
    isDirtyRef.current = true;
    void saveEntry();
  };

  const handleProjectOptionChange = (option: OptionEntry) => {
    if (option) {
      setPickedProjectOption(option);
      isDirtyRef.current = true;
    }
    setIsProjectPickerVisible(false);
  };

  const handleCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleCategoryChange(option);
    }
    setIsCategoryPickerVisible(false);
    isDirtyRef.current = true;
    void saveEntry();
  };

  const handleSubCategoryChange = useCallback((selectedSubCategory: OptionEntry) => {
    isDirtyRef.current = true;
    setPickedSubCategoryOption(selectedSubCategory);
  }, []);

  const handleCategoryChange = useCallback((selectedCategory: OptionEntry) => {
    isDirtyRef.current = true;
    setPickedCategoryOption(selectedCategory);
    setPickedSubCategoryOption(undefined);
  }, []);

  useEffect(() => {
    const selectedCategoryId = pickedCategoryOption?.value;
    if (selectedCategoryId) {
      const workItems = projectWorkItems
        .filter((item) => item.categoryId === selectedCategoryId)
        .sort(WorkItemDataCodeCompareAsNumber);
      const subCategories = workItems.map((item) => {
        return allAvailableCostItemOptions.find((o) => o.value === item.id) ?? { label: '', value: '' };
      });

      setSubCategories(subCategories);
    } else {
      setSubCategories(allAvailableCostItemOptions);
    }
  }, [pickedCategoryOption, projectWorkItems, allAvailableCostItemOptions]);

  const handleBackPress = useAutoSaveNavigation(() => {
    router.back();
  });

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
        <NumberInputField
          style={{ ...styles.inputContainer, paddingLeft: 10, marginTop: 0 }}
          labelStyle={{ marginBottom: 2 }}
          label="Amount"
          value={itemizedEntry.amount}
          onChange={(value: number): void => {
            isDirtyRef.current = true;
            const updatedEntry = {
              ...itemizedEntry,
              amount: value,
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
          onChangeText={(text): void => {
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
        {projectOptions && projectOptions.length > 1 && (
          <OptionPickerItem
            containerStyle={styles.inputContainer}
            optionLabel={pickedProjectOption?.label}
            label="Project"
            placeholder="Project"
            editable={false}
            onPickerButtonPress={() => setIsProjectPickerVisible(true)}
          />
        )}
        <OptionPickerItem
          containerStyle={styles.inputContainer}
          optionLabel={pickedCategoryOption?.label}
          label="Category"
          placeholder="Category"
          editable={false}
          onPickerButtonPress={() => setIsCategoryPickerVisible(true)}
        />
        <OptionPickerItem
          containerStyle={styles.inputContainer}
          optionLabel={pickedSubCategoryOption?.label}
          label="Cost Item Type"
          placeholder="Cost Item Type"
          editable={false}
          onPickerButtonPress={() => setIsSubCategoryPickerVisible(true)}
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
      {isCategoryPickerVisible && (
        <BottomSheetContainer
          isVisible={isCategoryPickerVisible}
          onClose={() => setIsCategoryPickerVisible(false)}
          modalHeight="65%"
          showKeyboardToolbar={false}
        >
          <OptionList
            options={availableCategoriesOptions}
            onSelect={(option) => handleCategoryOptionChange(option)}
            selectedOption={pickedCategoryOption}
            enableSearch={availableCategoriesOptions.length > 15}
          />
        </BottomSheetContainer>
      )}
      {isSubCategoryPickerVisible && (
        <BottomSheetContainer
          isVisible={isSubCategoryPickerVisible}
          onClose={() => setIsSubCategoryPickerVisible(false)}
          modalHeight="80%"
        >
          <OptionList
            centerOptions={false}
            boldSelectedOption={false}
            options={subCategories}
            onSelect={(option) => handleSubCategoryOptionChange(option)}
            selectedOption={pickedSubCategoryOption}
            enableSearch={subCategories.length > 15}
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
