import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import { WorkItemDataCodeCompareAsNumber } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import React, { useCallback, useEffect, useState } from 'react';
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
  const { availableCategoriesOptions, allAvailableCostItemOptions, projectWorkItems } =
    useProjectWorkItems(projectId);

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
        const workItems = projectWorkItems
          .filter((item) => item.categoryId === selectedCategory.value)
          .sort(WorkItemDataCodeCompareAsNumber);
        const subCategories = workItems.map((item) => {
          return allAvailableCostItemOptions.find((o) => o.value === item.id) ?? { label: '', value: '' };
        });

        setCostItemEntries(subCategories);
        setPickedCostItemOption(undefined);
      }
    },
    [projectWorkItems, allAvailableCostItemOptions],
  );

  useEffect(() => {
    if (pickedCategoryOption === undefined || pickedCategoryOption.value === '') {
      setCostItemEntries(allAvailableCostItemOptions);
    }
  }, [pickedCategoryOption, allAvailableCostItemOptions]);

  const handleSubCategoryOptionChange = useCallback((option: OptionEntry) => {
    if (option) {
      handleCostItemChange(option);
    }
    setIsCostItemPickerVisible(false);
  }, [handleCostItemChange]);

  const handleCategoryOptionChange = useCallback((option: OptionEntry) => {
    if (option) {
      handleCategoryChange(option);
    }
    setIsCategoryPickerVisible(false);
  }, [handleCategoryChange]);

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
                enableSearch={availableCategoriesOptions.length > 15}
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
                enableSearch={costItemEntries.length > 15}
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
