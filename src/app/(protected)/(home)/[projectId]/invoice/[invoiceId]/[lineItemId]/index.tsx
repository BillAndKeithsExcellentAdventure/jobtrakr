import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import { WorkItemDataCodeCompareAsNumber } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  useAllRows,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditLineItemPage = () => {
  const { projectId, lineItemId } = useLocalSearchParams<{
    projectId: string;
    invoiceId: string;
    lineItemId: string;
  }>();

  const colors = useColors();
  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  const updateLineItem = useUpdateRowCallback(projectId, 'workItemCostEntries');
  const { projectWorkItems, availableCategoriesOptions, allAvailableCostItemOptions, allWorkItems, allWorkCategories } =
    useProjectWorkItems(projectId);
  const [itemizedEntry, setItemizedEntry] = useState<WorkItemCostEntry>({
    id: '',
    label: '',
    amount: 0,
    workItemId: '',
    parentId: '',
    documentationType: 'invoice',
  });

  useEffect(() => {
    if (lineItemId) {
      const existingItem = allCostItems.find((item) => item.id === lineItemId);
      if (existingItem) {
        setItemizedEntry(existingItem);
      }
    }
  }, [allCostItems, lineItemId]);

  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickedCategoryOption, setPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);

  const [isSubCategoryPickerVisible, setIsSubCategoryPickerVisible] = useState<boolean>(false);
  const [pickedSubCategoryOption, setPickedSubCategoryOption] = useState<OptionEntry | undefined>(undefined);
  const [subCategories, setSubCategories] = useState<OptionEntry[]>([]);

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
    if (!itemizedEntry.label || !itemizedEntry.amount || !pickedSubCategoryOption) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    const updatedItemizedEntry: WorkItemCostEntry = {
      ...itemizedEntry,
      workItemId: pickedSubCategoryOption.value,
    };
    const result = updateLineItem(updatedItemizedEntry.id, updatedItemizedEntry);
    if (result.status !== 'Success') {
      Alert.alert('Error', 'Failed to add line item.');
      return;
    }
    router.back();
  }, [itemizedEntry, pickedSubCategoryOption]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
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
    </SafeAreaView>
  );
};

export default EditLineItemPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
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
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});
