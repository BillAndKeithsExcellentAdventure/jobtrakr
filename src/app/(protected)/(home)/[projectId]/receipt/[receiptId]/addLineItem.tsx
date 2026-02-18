import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import { WorkItemDataCodeCompareAsNumber } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
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
  const { projectWorkItems, availableCategoriesOptions, allAvailableCostItemOptions } =
    useProjectWorkItems(projectId);

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

  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickedCategoryOption, setPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);

  const [isSubCategoryPickerVisible, setIsSubCategoryPickerVisible] = useState<boolean>(false);
  const [pickedSubCategoryOption, setPickedSubCategoryOption] = useState<OptionEntry | undefined>(undefined);
  const [subCategories, setSubCategories] = useState<OptionEntry[]>([]);

  useEffect(() => {
    if (pickedCategoryOption === undefined || pickedCategoryOption.value === '') {
      setSubCategories(allAvailableCostItemOptions);
    }
  }, [pickedCategoryOption, allAvailableCostItemOptions]);

  const handleSubCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleSubCategoryChange(option);
    }
    setIsSubCategoryPickerVisible(false);
  };

  const handleProjectOptionChange = (option: OptionEntry) => {
    if (option) {
      setPickedProjectOption(option);
    }
    setIsProjectPickerVisible(false);
  };

  const handleCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleCategoryChange(option);
    }
    setIsCategoryPickerVisible(false);
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

  const handleSubCategoryChange = useCallback((selectedSubCategory: OptionEntry) => {
    setPickedSubCategoryOption(selectedSubCategory);
  }, []);

  const handleCategoryChange = useCallback(
    (selectedCategory: OptionEntry) => {
      setPickedCategoryOption(selectedCategory);
      if (selectedCategory) {
        const workItems = projectWorkItems
          .filter((item) => item.categoryId === selectedCategory.value)
          .sort(WorkItemDataCodeCompareAsNumber);
        const subCategories = workItems.map((item) => {
          return allAvailableCostItemOptions.find((o) => o.value === item.id) ?? { label: '', value: '' };
        });

        setSubCategories(subCategories);
        setPickedSubCategoryOption(undefined);
      }
    },
    [projectWorkItems, allAvailableCostItemOptions],
  );

  const handleOkPress = useCallback(async () => {
    if (!itemizedEntry.label || !itemizedEntry.amount) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    const newItemizedEntry: WorkItemCostEntry = {
      ...itemizedEntry,
      workItemId: pickedSubCategoryOption ? (pickedSubCategoryOption.value as string) : '',
      projectId: pickedProjectOption ? (pickedProjectOption.value as string) : projectId,
    };
    const result = addLineItem(newItemizedEntry);
    if (result.status !== 'Success') {
      Alert.alert('Error', 'Failed to add line item.');
      return;
    }
    router.back();
  }, [itemizedEntry, pickedSubCategoryOption, pickedProjectOption, addLineItem, router, projectId]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        onSave={handleOkPress}
        title="Add Receipt Line Item"
        onCancel={() => router.back()}
        canSave={!!itemizedEntry.label && !!itemizedEntry.amount}
      >
        <NumberInputField
          style={{ ...styles.inputContainer, marginTop: 0 }}
          label="Amount"
          value={itemizedEntry.amount}
          onChange={(value: number): void => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              amount: value,
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
      </ModalScreenContainer>
      {isCategoryPickerVisible && (
        <BottomSheetContainer
          modalHeight="65%"
          isVisible={isCategoryPickerVisible}
          onClose={() => setIsCategoryPickerVisible(false)}
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
          modalHeight="80%"
          isVisible={isSubCategoryPickerVisible}
          onClose={() => setIsSubCategoryPickerVisible(false)}
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
