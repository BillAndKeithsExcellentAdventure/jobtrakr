import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import {
  useAllRows as useAllRowsConfiguration,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  useAddRowCallback,
  useAllRows,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

const AddInvoiceLineItemPage = () => {
  const router = useRouter();
  const { projectId, invoiceId } = useLocalSearchParams<{ projectId: string; invoiceId: string }>();
  const allWorkItemCostSummaries = useAllRows(projectId, 'workItemSummaries');
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const allWorkItems = useAllRowsConfiguration('workItems', WorkItemDataCodeCompareAsNumber);
  const allWorkCategories = useAllRowsConfiguration('categories', WorkCategoryCodeCompareAsNumber);

  // Filter work items to only those available in this project
  const projectWorkItems = useMemo(() => {
    const uniqueWorkItemIds = allWorkItemCostSummaries.map((item) => item.workItemId);
    return allWorkItems.filter((item) => uniqueWorkItemIds.includes(item.id));
  }, [allWorkItemCostSummaries, allWorkItems]);

  const availableCategoriesOptions: OptionEntry[] = useMemo(() => {
    // get list of unique categoryIds from projectWorkItems
    const uniqueCategoryIds = projectWorkItems.map((item) => item.categoryId);

    // now get an array of OptionEntry for each entry in uniqueCategoryIds using allWorkCategories
    const uniqueCategories = allWorkCategories
      .filter((item) => uniqueCategoryIds.includes(item.id))
      .map((item) => ({
        label: item.name,
        value: item.id,
      }));
    return uniqueCategories;
  }, [projectWorkItems, allWorkCategories]);

  const allAvailableCostItemOptions: OptionEntry[] = useMemo(() => {
    const uniqueCostItems = projectWorkItems.map((item) => {
      const category = allWorkCategories.find((o) => o.id === item.categoryId);
      const categoryCode = category ? `${category.code}.` : '';
      return {
        sortValue1: Number.parseFloat(item.code),
        sortValue2: Number.parseFloat(category ? category.code : '0'),
        label: `${categoryCode}${item.code} - ${item.name}`,
        value: item.id,
      };
    });

    return uniqueCostItems
      .sort((a, b) => a.sortValue1 - b.sortValue1)
      .sort((a, b) => a.sortValue2 - b.sortValue2)
      .map((i) => ({ label: i.label, value: i.value }));
  }, [projectWorkItems, allWorkCategories]);

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
    parentId: invoiceId,
    documentationType: 'invoice',
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
    };
    const result = addLineItem(newItemizedEntry);
    if (result.status !== 'Success') {
      Alert.alert('Error', 'Failed to add line item.');
      return;
    }
    router.back();
  }, [itemizedEntry, pickedSubCategoryOption]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        onSave={handleOkPress}
        onCancel={() => router.back()}
        canSave={!!itemizedEntry.label && !!itemizedEntry.amount}
      >
        <NumberInputField
          style={styles.inputContainer}
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
    </View>
  );
};

export default AddInvoiceLineItemPage;

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 6,
  },
});
