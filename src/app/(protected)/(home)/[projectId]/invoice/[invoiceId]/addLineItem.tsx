import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAllRows as useAllRowsConfiguration,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  useAddRowCallback,
  useAllRows,
  useDeleteRowCallback,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddInvoiceLineItemPage = () => {
  const router = useRouter();
  const { projectId, invoiceId } = useLocalSearchParams<{ projectId: string; invoiceId: string }>();
  const allInvoices = useAllRows(projectId, 'invoices');
  const allWorkItemCostSummaries = useAllRows(projectId, 'workItemSummaries');
  const allLineItemCostEntries = useAllRows(projectId, 'workItemCostEntries');
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const updateLineItem = useUpdateRowCallback(projectId, 'workItemCostEntries');
  const deleteLineItem = useDeleteRowCallback(projectId, 'workItemCostEntries');
  const allWorkItems = useAllRowsConfiguration('workItems');
  const allWorkCategories = useAllRowsConfiguration('categories', WorkCategoryCodeCompareAsNumber);

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
        const workItems = allWorkItems
          .filter((item) => item.categoryId === selectedCategory.value)
          .sort(WorkItemDataCodeCompareAsNumber);
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
      <Stack.Screen options={{ title: 'Add Invoice Line Item', headerShown: true }} />
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
            modalHeight={'55%'}
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
            modalHeight={'55%'}
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

export default AddInvoiceLineItemPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    width: '100%',
    minHeight: 350,
    height: '55%',
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
