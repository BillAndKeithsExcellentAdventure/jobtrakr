import { ActionButton } from '@/components/ActionButton';
import BottomSheetContainer from '@/components/BottomSheetContainer';
import { NumberInputField } from '@/components/NumberInputField';
import OptionList, { OptionEntry } from '@/components/OptionList';
import { OptionPickerItem } from '@/components/OptionPickerItem';
import { TextField } from '@/components/TextField';
import { View } from '@/components/Themed';
import { useColors } from '@/context/ColorsContext';
import { useAllRows as useAllRowsConfiguration } from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  useAddRowCallback,
  useAllRows,
  useDeleteRowCallback,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddReceiptLineItemPage = () => {
  const router = useRouter();
  const { projectId, receiptId } = useLocalSearchParams<{ projectId: string; receiptId: string }>();
  const allReceipts = useAllRows(projectId, 'receipts');
  const allWorkItemCostSummaries = useAllRows(projectId, 'workItemSummaries');
  const allLineItemCostEntries = useAllRows(projectId, 'workItemCostEntries');
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const updateLineItem = useUpdateRowCallback(projectId, 'workItemCostEntries');
  const deleteLineItem = useDeleteRowCallback(projectId, 'workItemCostEntries');
  const allWorkItems = useAllRowsConfiguration('workItems');
  const allWorkCategories = useAllRowsConfiguration('categories');

  const availableCategoriesOptions: OptionEntry[] = useMemo(() => {
    // get a list of all unique workitemids from allWorkItemCostSummaries available in the project
    const uniqueWorkItemIds = allWorkItemCostSummaries.map((item) => item.workItemId);

    // now get list of all unique categoryIds from allWorkItems given list of uniqueWorkItemIds
    const uniqueCategoryIds = allWorkItems
      .filter((item) => uniqueWorkItemIds.includes(item.id))
      .map((item) => item.categoryId);

    // now get an array of OptionEntry for each entry in uniqueCategoryIds using allWorkCategories
    const uniqueCategories = allWorkCategories
      .filter((item) => uniqueCategoryIds.includes(item.id))
      .map((item) => ({
        label: item.name,
        value: item.id,
      }));
    return uniqueCategories;
  }, [allWorkItemCostSummaries, allWorkItems, allWorkCategories]);

  const allAvailableCostItemOptions: OptionEntry[] = useMemo(() => {
    const uniqueWorkItemIds = allWorkItemCostSummaries.map((item) => item.workItemId);
    const uniqueWorkItems = allWorkItems.filter((item) => uniqueWorkItemIds.includes(item.id));
    const uniqueCostItems = uniqueWorkItems.map((item) => {
      const category = allWorkCategories.find((o) => o.id === item.categoryId);
      const categoryCode = category ? `${category.code}.` : '';
      return {
        label: `${categoryCode}${item.code} - ${item.name}`,
        value: item.id,
      };
    });
    return uniqueCostItems;
  }, [allWorkItemCostSummaries, allWorkItems]);

  const colors = useColors();
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
        const workItems = allWorkItems.filter((item) => item.categoryId === selectedCategory.value);
        const subCategories = workItems.map((item) => {
          return allAvailableCostItemOptions.find((o) => o.value === item.id) ?? { label: '', value: '' };
        });

        setSubCategories(subCategories);
        setPickedSubCategoryOption(undefined);
      }
    },
    [availableCategoriesOptions, allWorkItems],
  );

  const handleOkPress = useCallback(async () => {
    if (!itemizedEntry.label || !itemizedEntry.amount || !pickedSubCategoryOption) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    const newItemizedEntry: WorkItemCostEntry = {
      ...itemizedEntry,
      workItemId: pickedSubCategoryOption.value,
    };
    const result = addLineItem(newItemizedEntry);
    if (result.status !== 'Success') {
      Alert.alert('Error', 'Failed to add line item.');
      return;
    }
    router.back();
  }, [itemizedEntry, pickedSubCategoryOption]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1, overflowY: 'hidden' }}>
      <Stack.Screen options={{ title: 'Add Receipt Line Item', headerShown: true }} />
      <View style={[styles.container, { borderColor: colors.border }]}>
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

        <View style={styles.saveButtonRow}>
          <ActionButton
            style={styles.saveButton}
            onPress={handleOkPress}
            type={
              !itemizedEntry.label || !itemizedEntry.amount || !pickedSubCategoryOption ? 'disabled' : 'ok'
            }
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
        {isCategoryPickerVisible && (
          <BottomSheetContainer
            isVisible={isCategoryPickerVisible}
            onClose={() => setIsCategoryPickerVisible(false)}
          >
            <OptionList
              options={availableCategoriesOptions}
              onSelect={(option) => handleCategoryOptionChange(option)}
              selectedOption={pickedCategoryOption}
            />
          </BottomSheetContainer>
        )}
        {isSubCategoryPickerVisible && (
          <BottomSheetContainer
            isVisible={isSubCategoryPickerVisible}
            onClose={() => setIsSubCategoryPickerVisible(false)}
          >
            <OptionList
              centerOptions={false}
              boldSelectedOption={false}
              options={subCategories}
              onSelect={(option) => handleSubCategoryOptionChange(option)}
              selectedOption={pickedSubCategoryOption}
            />
          </BottomSheetContainer>
        )}
      </View>
    </SafeAreaView>
  );
};

export default AddReceiptLineItemPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    width: '100%',
  },
  inputContainer: {
    marginTop: 6,
  },
  itemContainer: {
    flexDirection: 'row',
    margin: 10,
    borderRadius: 15,
    padding: 10,
    height: 100,
  },
  saveButtonRow: {
    marginVertical: 20,
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
