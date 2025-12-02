import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from './ActionButton';
import { Text, TextInput } from './Themed';
import { useColors } from '@/src/context/ColorsContext';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { formatDate } from '@/src/utils/formatters';
import { NumberInputField } from './NumberInputField';
import { TextField } from '@/src/components/TextField';
import { useAllRows as useAllConfigurationRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import OptionList, { OptionEntry } from './OptionList';
import { OptionPickerItem } from './OptionPickerItem';
import BottomSheetContainer from './BottomSheetContainer';
import { KeyboardToolbar } from 'react-native-keyboard-controller';

interface ReceiptSummaryEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  receiptSummary: {
    vendor: string;
    totalAmount: number;
    totalTax: number;
    receiptDate: number;
  };
  onSave: (updatedSummary: {
    vendor: string;
    totalAmount: number;
    totalTax: number;
    receiptDate: number;
  }) => void;
}

export const ReceiptSummaryEditModal: React.FC<ReceiptSummaryEditModalProps> = ({
  isVisible,
  onClose,
  receiptSummary,
  onSave,
}) => {
  const colors = useColors();
  const [editedSummary, setEditedSummary] = useState(receiptSummary);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [isVendorListPickerVisible, setIsVendorListPickerVisible] = useState<boolean>(false);
  const [pickedVendorOption, setPickedVendorOption] = useState<OptionEntry | undefined>(undefined);
  const [vendors, setVendors] = useState<OptionEntry[]>([]);

  const allVendors = useAllConfigurationRows('vendors');

  useEffect(() => {
    setEditedSummary(receiptSummary);
    const vendorMatch = vendors.find((v) => v.label === receiptSummary.vendor);
    setPickedVendorOption(vendorMatch);
  }, [receiptSummary, vendors]);

  useEffect(() => {
    if (allVendors && allVendors.length > 0) {
      const vendorOptions: OptionEntry[] = allVendors.map((vendor) => ({
        label: `${vendor.name} ${
          vendor.address ? ` - ${vendor.address}` : vendor.city ? ` - ${vendor.city}` : ''
        }`,
        value: vendor.id,
      }));

      setVendors(vendorOptions);
    } else {
      setVendors([]);
    }
  }, [allVendors]);

  const handleVendorChange = useCallback((vendor: string) => {
    setEditedSummary((prev) => ({
      ...prev,
      vendor,
    }));
  }, []);

  const handleVendorOptionChange = (option: OptionEntry) => {
    setPickedVendorOption(option);
    if (option) {
      handleVendorChange(option.label);
    }
    setIsVendorListPickerVisible(false);
  };

  const handleSave = useCallback(() => {
    onSave(editedSummary);
    onClose();
  }, [editedSummary, onSave, onClose]);

  const handleClose = useCallback(() => {
    setEditedSummary(receiptSummary);
    const vendorMatch = vendors.find((v) => v.label === receiptSummary.vendor);
    setPickedVendorOption(vendorMatch);
    onClose();
  }, [receiptSummary, vendors, onClose]);

  const handleDateConfirm = useCallback((date: Date) => {
    setEditedSummary((prev) => ({
      ...prev,
      receiptDate: date.getTime(),
    }));

    setDatePickerVisible(false);
  }, []);

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.opaqueModalOverlayBackgroundColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text txtSize="title" style={styles.title}>
              Edit Receipt Details
            </Text>

            <View style={styles.form}>
              {vendors && vendors.length ? (
                <OptionPickerItem
                  containerStyle={styles.inputContainer}
                  optionLabel={editedSummary.vendor}
                  label="Vendor"
                  placeholder="Vendor"
                  onOptionLabelChange={(vendor: string) =>
                    setEditedSummary((prev) => ({
                      ...prev,
                      vendor,
                    }))
                  }
                  onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
                />
              ) : (
                <TextField
                  containerStyle={styles.inputContainer}
                  style={[styles.input, { borderColor: colors.transparent }]}
                  placeholder="Vendor"
                  label="Vendor"
                  value={editedSummary.vendor}
                  onChangeText={(vendor: string) =>
                    setEditedSummary((prev) => ({
                      ...prev,
                      vendor,
                    }))
                  }
                />
              )}

              <NumberInputField
                style={styles.inputContainer}
                placeholder="Amount"
                label="Amount"
                value={editedSummary.totalAmount}
                onChange={(value) => setEditedSummary((prev) => ({ ...prev, totalAmount: value }))}
              />

              <NumberInputField
                style={styles.inputContainer}
                placeholder="Tax"
                label="Tax"
                value={editedSummary.totalTax}
                onChange={(value) => setEditedSummary((prev) => ({ ...prev, totalTax: value }))}
              />

              <TouchableOpacity activeOpacity={1} onPress={() => setDatePickerVisible(true)}>
                <Text txtSize="formLabel" text="Date" style={styles.inputLabel} />
                <TextInput
                  readOnly={true}
                  style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                  placeholder="Date"
                  onPressIn={() => setDatePickerVisible(true)}
                  value={formatDate(editedSummary.receiptDate)}
                />
              </TouchableOpacity>
              <DateTimePickerModal
                style={{ alignSelf: 'stretch' }}
                date={new Date(editedSummary.receiptDate)}
                isVisible={datePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={() => setDatePickerVisible(false)}
              />

              <View style={styles.buttonContainer}>
                <ActionButton style={styles.button} type="ok" title="Save" onPress={handleSave} />
                <ActionButton style={styles.button} type="cancel" title="Cancel" onPress={handleClose} />
              </View>
            </View>
          </View>
        </View>
        {vendors && isVendorListPickerVisible && (
          <BottomSheetContainer
            isVisible={isVendorListPickerVisible}
            onClose={() => setIsVendorListPickerVisible(false)}
          >
            <OptionList
              options={vendors}
              onSelect={(option) => handleVendorOptionChange(option)}
              selectedOption={pickedVendorOption}
              enableSearch={vendors.length > 15}
            />
          </BottomSheetContainer>
        )}
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 10,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    gap: 5,
  },
  input: {
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  button: {
    flex: 1,
  },
  inputContainer: {
    marginTop: 6,
  },
  inputLabel: {
    marginTop: 6,
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    alignContent: 'stretch',
    justifyContent: 'center',
    borderRadius: 5,
    paddingHorizontal: 8,
    height: 40,
    paddingVertical: 0,
  },
});
