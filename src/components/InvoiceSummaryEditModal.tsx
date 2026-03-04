import { useColors } from '@/src/context/ColorsContext';
import { useAllRows as useAllConfigurationRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { formatDate } from '@/src/utils/formatters';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '../constants/app-constants';
import { ActionButton } from './ActionButton';
import BottomSheetContainer from './BottomSheetContainer';
import { NumericInputField } from './NumericInputField';
import OptionList, { OptionEntry } from './OptionList';
import { OptionPickerItem } from './OptionPickerItem';
import { Text, TextInput } from './Themed';
import { getVendorSearchTerm } from '../utils/vendorUtils';
import { useNetwork } from '../context/NetworkContext';

interface InvoiceSummaryEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  invoiceSummary: {
    vendor: string;
    vendorId: string;
    totalAmount: number;
    totalTax: number;
    invoiceDate: number;
    dueDate: number;
  };
  onSave: (updatedSummary: {
    vendor: string;
    vendorId: string;
    totalAmount: number;
    totalTax: number;
    invoiceDate: number;
    dueDate: number;
  }) => void;
}

export const InvoiceSummaryEditModal: React.FC<InvoiceSummaryEditModalProps> = ({
  isVisible,
  onClose,
  invoiceSummary,
  onSave,
}) => {
  const colors = useColors();
  const [editedSummary, setEditedSummary] = useState(invoiceSummary);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dueDatePickerVisible, setDueDatePickerVisible] = useState(false);
  const [isVendorListPickerVisible, setIsVendorListPickerVisible] = useState<boolean>(false);
  const [pickedVendorOption, setPickedVendorOption] = useState<OptionEntry | undefined>(undefined);
  const [vendors, setVendors] = useState<OptionEntry[]>([]);
  const { isQuickBooksAccessible } = useNetwork();
  const allVendors = useAllConfigurationRows('vendors');

  useEffect(() => {
    setEditedSummary(invoiceSummary);
    const vendorMatch = vendors.find((v) => v.label === invoiceSummary.vendor);
    setPickedVendorOption(vendorMatch);
  }, [invoiceSummary, vendors]);

  useEffect(() => {
    if (allVendors && allVendors.length > 0) {
      const vendorOptions: OptionEntry[] = allVendors.map((vendor) => ({
        label: vendor.name,
        value: vendor.id,
      }));

      setVendors(vendorOptions);
    } else {
      setVendors([]);
    }
  }, [allVendors]);

  const handleVendorChange = useCallback((vendor: string, vendorId: string) => {
    setEditedSummary((prev) => ({
      ...prev,
      vendor,
      vendorId,
    }));
  }, []);

  const handleVendorOptionChange = useCallback(
    (option: OptionEntry) => {
      setPickedVendorOption(option);
      if (option) {
        handleVendorChange(option.label, option.value);
      }
      setIsVendorListPickerVisible(false);
    },
    [handleVendorChange],
  );

  const handleSave = useCallback(() => {
    onSave(editedSummary);
    onClose();
  }, [editedSummary, onSave, onClose]);

  const handleClose = useCallback(() => {
    setEditedSummary(invoiceSummary);
    const vendorMatch = vendors.find((v) => v.label === invoiceSummary.vendor);
    setPickedVendorOption(vendorMatch);
    onClose();
  }, [invoiceSummary, vendors, onClose]);

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const showDueDatePicker = () => {
    setDueDatePickerVisible(true);
  };

  const hideDueDatePicker = () => {
    setDueDatePickerVisible(false);
  };

  const handleDateConfirm = useCallback((date: Date) => {
    setEditedSummary((prev) => ({
      ...prev,
      invoiceDate: date.getTime(),
    }));

    hideDatePicker();
  }, []);

  const handleDueDateConfirm = useCallback((date: Date) => {
    setEditedSummary((prev) => ({
      ...prev,
      dueDate: date.getTime(),
    }));

    hideDueDatePicker();
  }, []);

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.opaqueModalOverlayBackgroundColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text txtSize="title" style={styles.title}>
              Edit Bill Details
            </Text>

            <View style={styles.form}>
              <OptionPickerItem
                containerStyle={styles.inputContainer}
                optionLabel={editedSummary.vendor}
                textColor={editedSummary.vendorId ? colors.text : colors.error}
                label="Vendor/Merchant"
                placeholder="Vendor/Merchant"
                editable={false}
                onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
              />
              <NumericInputField
                containerStyle={styles.inputContainer}
                placeholder="Amount"
                label="Amount"
                maxDecimals={2}
                decimals={2}
                value={editedSummary.totalAmount}
                onChangeNumber={(value) => setEditedSummary((prev) => ({ ...prev, totalAmount: value ?? 0 }))}
              />

              <NumericInputField
                containerStyle={styles.inputContainer}
                placeholder="Tax"
                label="Tax"
                maxDecimals={2}
                decimals={2}
                value={editedSummary.totalTax}
                onChangeNumber={(value) => setEditedSummary((prev) => ({ ...prev, totalTax: value ?? 0 }))}
              />

              <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
                <Text txtSize="formLabel" text="Bill Date" style={styles.inputLabel} />
                <TextInput
                  readOnly={true}
                  style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                  placeholder="Bill Date"
                  onPressIn={showDatePicker}
                  value={formatDate(editedSummary.invoiceDate)}
                />
              </TouchableOpacity>
              <DateTimePickerModal
                style={{ alignSelf: 'stretch' }}
                date={new Date(editedSummary.invoiceDate)}
                isVisible={datePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
              />

              <TouchableOpacity activeOpacity={1} onPress={showDueDatePicker}>
                <Text txtSize="formLabel" text="Due Date" style={styles.inputLabel} />
                <TextInput
                  readOnly={true}
                  style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                  placeholder="Due Date"
                  onPressIn={showDueDatePicker}
                  value={formatDate(editedSummary.dueDate)}
                />
              </TouchableOpacity>
              <DateTimePickerModal
                style={{ alignSelf: 'stretch' }}
                date={new Date(editedSummary.dueDate)}
                isVisible={dueDatePickerVisible}
                mode="date"
                onConfirm={handleDueDateConfirm}
                onCancel={hideDueDatePicker}
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
              initialSearchText={
                isQuickBooksAccessible && !editedSummary.vendorId
                  ? getVendorSearchTerm(editedSummary.vendor)
                  : undefined
              }
              enableSearch={
                vendors.length > 15 ||
                (isQuickBooksAccessible && !editedSummary.vendorId && !!editedSummary.vendor)
              }
            />
          </BottomSheetContainer>
        )}
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
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
