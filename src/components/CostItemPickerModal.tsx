import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAllRows as useAllConfigurationRows,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAllRows } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CostItemPickerModal = ({
  projectId,
  isVisible,
  onClose,
  handleCostItemOptionSelected,
}: {
  projectId: string;
  isVisible: boolean;
  onClose: () => void;
  handleCostItemOptionSelected: (entry: OptionEntry | undefined) => void;
}) => {
  const colors = useColors();
  const allWorkItemCostSummaries = useAllRows(projectId, 'workItemSummaries');
  const allWorkItems = useAllConfigurationRows('workItems', WorkItemDataCodeCompareAsNumber);
  const allWorkCategories = useAllConfigurationRows('categories', WorkCategoryCodeCompareAsNumber);

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
  }, [allWorkItemCostSummaries, allWorkItems, allWorkCategories]);

  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickedCategoryOption, setPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);

  const [isCostItemPickerVisible, setIsCostItemPickerVisible] = useState<boolean>(false);
  const [pickedCostItemOption, setPickedCostItemOption] = useState<OptionEntry | undefined>(undefined);
  const [costItemEntries, setCostItemEntries] = useState<OptionEntry[]>([]);
  const handleCostItemChange = useCallback((selectedCostItem: OptionEntry) => {
    setPickedCostItemOption(selectedCostItem);
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

        setCostItemEntries(subCategories);
        setPickedCostItemOption(undefined);
      }
    },
    [availableCategoriesOptions, allWorkItems, allAvailableCostItemOptions],
  );

  useEffect(() => {
    if (pickedCategoryOption === undefined || pickedCategoryOption.value === '') {
      setCostItemEntries(allAvailableCostItemOptions);
    }
  }, [pickedCategoryOption, allAvailableCostItemOptions]);

  const handleSubCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleCostItemChange(option);
    }
    setIsCostItemPickerVisible(false);
  };

  const handleCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleCategoryChange(option);
    }
    setIsCategoryPickerVisible(false);
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView edges={['top']} style={[{ flex: 1 }, Platform.OS === 'ios' && { marginTop: 60 }]}>
        <View style={[styles.container, styles.modalBackground, { backgroundColor: colors.listBackground }]}>
          <View style={[styles.modalContainer]}>
            <Text txtSize="title" style={styles.modalTitle} text="Select Cost Item" />

            <View style={{ flex: 1, paddingBottom: 10 }}>
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
                optionLabel={pickedCostItemOption?.label}
                label="Cost Item Type"
                placeholder="Cost Item Type"
                editable={false}
                onPickerButtonPress={() => {
                  setIsCostItemPickerVisible(true);
                }}
              />
            </View>

            <View style={styles.saveButtonRow}>
              <ActionButton
                style={styles.saveButton}
                onPress={() => handleCostItemOptionSelected(pickedCostItemOption)}
                type={pickedCostItemOption ? 'ok' : 'disabled'}
                title="OK"
              />

              <ActionButton
                style={styles.cancelButton}
                onPress={() => {
                  onClose();
                }}
                type={'cancel'}
                title="Cancel"
              />
            </View>
          </View>
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
              />
            </BottomSheetContainer>
          )}
          {isCostItemPickerVisible && (
            <BottomSheetContainer
              modalHeight="80%"
              isVisible={isCostItemPickerVisible}
              onClose={() => setIsCostItemPickerVisible(false)}
            >
              <OptionList
                centerOptions={false}
                boldSelectedOption={false}
                options={costItemEntries}
                onSelect={(option) => {
                  handleSubCategoryOptionChange(option);
                }}
                selectedOption={pickedCostItemOption}
              />
            </BottomSheetContainer>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  modalContainer: {
    maxWidth: 550,
    minHeight: 300,
    height: '35%',
    width: '100%',
    padding: 10,
  },
  modalTitle: {
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 6,
  },
  saveButtonRow: {
    marginTop: 10,
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

export default CostItemPickerModal;
