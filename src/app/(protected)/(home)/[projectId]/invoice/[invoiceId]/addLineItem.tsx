import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumericInputField } from '@/src/components/NumericInputField';
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

const AddInvoiceLineItemPage = () => {
  const router = useRouter();
  const { projectId, invoiceId } = useLocalSearchParams<{ projectId: string; invoiceId: string }>();
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const { projectWorkItems, availableCategoriesOptions, allAvailableCostItemOptions } =
    useProjectWorkItems(projectId);

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
  }, [itemizedEntry, pickedSubCategoryOption, addLineItem, router]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        title="Add Bill Line Item"
        onSave={handleOkPress}
        onCancel={() => router.back()}
        canSave={!!itemizedEntry.label && !!itemizedEntry.amount}
      >
        <NumericInputField
          labelStyle={{ marginBottom: 0 }}
          inputStyle={{ paddingHorizontal: 10 }}
          containerStyle={styles.inputContainer}
          label="Amount"
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
