import { useColors } from '@/src/context/ColorsContext';
import {
  VendorData,
  VendorDataCompareName,
  useAllRows as useAllConfigurationRows,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { formatDate } from '@/src/utils/formatters';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '../constants/app-constants';
import { ActionButton } from './ActionButton';
import { NumericInputField } from './NumericInputField';
import { Text, TextInput } from './Themed';
import { VendorPicker } from './VendorPicker';
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
  const allVendors = useAllConfigurationRows('vendors', VendorDataCompareName);
  const { isQuickBooksConnected } = useNetwork();

  const availableVendors = useMemo(() => {
    // include the currently selected vendor in the list even if it's inactive, so that it can be re-selected if needed
    const currentVendor = allVendors.find((v) => v.id === editedSummary.vendorId);
    return currentVendor
      ? [
          currentVendor,
          ...allVendors.filter(
            (v) =>
              v.id !== editedSummary.vendorId &&
              !v.inactive &&
              (isQuickBooksConnected ? !!v.accountingId : true),
          ),
        ]
      : allVendors.filter((v) => !v.inactive);
  }, [allVendors, editedSummary.vendorId, isQuickBooksConnected]);

  useEffect(() => {
    setEditedSummary(invoiceSummary);
  }, [invoiceSummary]);

  const handleSave = useCallback(() => {
    onSave(editedSummary);
    onClose();
  }, [editedSummary, onSave, onClose]);

  const handleClose = useCallback(() => {
    setEditedSummary(invoiceSummary);
    onClose();
  }, [invoiceSummary, onClose]);

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const handleVendorSelected = useCallback((vendor: VendorData) => {
    setEditedSummary((prev) => ({
      ...prev,
      vendor: vendor.name,
      vendorId: vendor.id,
    }));
  }, []);

  const selectedVendor = useMemo(
    () => allVendors.find((v) => v.id === editedSummary.vendorId),
    [allVendors, editedSummary.vendorId],
  );

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
              <VendorPicker
                selectedVendor={selectedVendor}
                onVendorSelected={handleVendorSelected}
                vendors={availableVendors}
                label="Vendor"
                placeholder="Vendor"
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
