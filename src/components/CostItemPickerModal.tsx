import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import React, { useCallback, useState } from 'react';
import { Modal, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CostItemPickerModal = ({
  projectId,
  isVisible,
  subtitle = '',
  onClose,
  handleCostItemOptionSelected,
  showProjectPicker = false,
  handleProjectChange,
  selectedProjectPickerOption,
  allProjectPickerOptions = [],
}: {
  projectId: string;
  isVisible: boolean;
  subtitle?: string;
  onClose: () => void;
  handleCostItemOptionSelected: (entry: OptionEntry | undefined) => void;
  showProjectPicker?: boolean;
  handleProjectChange?: (entry: OptionEntry) => void;
  selectedProjectPickerOption?: OptionEntry;
  allProjectPickerOptions?: OptionEntry[];
}) => {
  const colors = useColors();
  const { allAvailableCostItemOptions } = useProjectWorkItems(projectId);

  const [isProjectPickerVisible, setIsProjectPickerVisible] = useState<boolean>(false);
  const [isCostItemPickerVisible, setIsCostItemPickerVisible] = useState<boolean>(false);
  const [pickedCostItemOption, setPickedCostItemOption] = useState<OptionEntry | undefined>(undefined);
  const handleCostItemChange = useCallback((selectedCostItem: OptionEntry) => {
    setPickedCostItemOption(selectedCostItem);
  }, []);

  const handleSubCategoryOptionChange = useCallback(
    (option: OptionEntry) => {
      if (option) {
        handleCostItemChange(option);
      }
      setIsCostItemPickerVisible(false);
    },
    [handleCostItemChange],
  );

  const handleProjectOptionChange = useCallback(
    (option: OptionEntry) => {
      if (option && handleProjectChange) {
        handleProjectChange(option);
      }
      setIsProjectPickerVisible(false);
    },
    [handleProjectChange],
  );

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={[styles.container, styles.modalBackground, { backgroundColor: colors.listBackground }]}>
          <View style={[styles.modalContainer]}>
            <Text txtSize="title" style={styles.modalTitle} text="Select Cost Item" />
            {subtitle.length > 0 && <Text txtSize="sub-title" style={styles.modalTitle} text={subtitle} />}
            <View style={{ flex: 1, paddingBottom: 10 }}>
              {showProjectPicker && allProjectPickerOptions && allProjectPickerOptions.length > 0 && (
                <OptionPickerItem
                  containerStyle={styles.inputContainer}
                  optionLabel={selectedProjectPickerOption?.label}
                  label="Project"
                  placeholder="Project"
                  editable={false}
                  onPickerButtonPress={() => {
                    setIsProjectPickerVisible(true);
                  }}
                />
              )}
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
          {isProjectPickerVisible && (
            <BottomSheetContainer
              modalHeight="65%"
              isVisible={isProjectPickerVisible}
              onClose={() => setIsProjectPickerVisible(false)}
            >
              <OptionList
                options={allProjectPickerOptions}
                enableSearch={allProjectPickerOptions.length > 15}
                onSelect={(option) => handleProjectOptionChange(option)}
                selectedOption={selectedProjectPickerOption}
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
                options={allAvailableCostItemOptions}
                onSelect={(option) => {
                  handleSubCategoryOptionChange(option);
                }}
                selectedOption={pickedCostItemOption}
                enableSearch={allAvailableCostItemOptions.length > 15}
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
