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

interface InvoiceSummaryEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  invoiceSummary: {
    supplier: string;
    totalAmount: number;
    totalTax: number;
    receiptDate: number;
  };
  onSave: (updatedSummary: {
    supplier: string;
    totalAmount: number;
    totalTax: number;
    receiptDate: number;
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
  const [isSupplierListPickerVisible, setIsSupplierListPickerVisible] = useState<boolean>(false);
  const [pickedSupplierOption, setPickedSupplierOption] = useState<OptionEntry | undefined>(undefined);
  const [suppliers, setSuppliers] = useState<OptionEntry[]>([]);

  const allSuppliers = useAllConfigurationRows('suppliers');

  useEffect(() => {
    setEditedSummary(invoiceSummary);
    const supplierMatch = suppliers.find((v) => v.label === invoiceSummary.supplier);
    setPickedSupplierOption(supplierMatch);
  }, [invoiceSummary, suppliers]);

  useEffect(() => {
    if (allSuppliers && allSuppliers.length > 0) {
      const supplierOptions: OptionEntry[] = allSuppliers.map((supplier) => ({
        label: `${supplier.name} ${
          supplier.address ? ` - ${supplier.address}` : supplier.city ? ` - ${supplier.city}` : ''
        }`,
        value: supplier.id,
      }));

      setSuppliers(supplierOptions);
    } else {
      setSuppliers([]);
    }
  }, [allSuppliers]);

  const handleSupplierChange = useCallback((supplier: string) => {
    setEditedSummary((prev) => ({
      ...prev,
      supplier,
    }));
  }, []);

  const handleSupplierOptionChange = useCallback((option: OptionEntry) => {
    setPickedSupplierOption(option);
    if (option) {
      handleSupplierChange(option.label);
    }
    setIsSupplierListPickerVisible(false);
  }, [handleSupplierChange]);

  const handleSave = useCallback(() => {
    onSave(editedSummary);
    onClose();
  }, [editedSummary, onSave, onClose]);

  const handleClose = useCallback(() => {
    setEditedSummary(invoiceSummary);
    const supplierMatch = suppliers.find((v) => v.label === invoiceSummary.supplier);
    setPickedSupplierOption(supplierMatch);
    onClose();
  }, [invoiceSummary, suppliers, onClose]);

  const handleDateConfirm = useCallback((date: Date) => {
    setEditedSummary((prev) => ({
      ...prev,
      receiptDate: date.getTime(),
    }));

    setDatePickerVisible(false);
  }, []);

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.opaqueModalOverlayBackgroundColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text txtSize="title" style={styles.title}>
              Edit Invoice Details
            </Text>

            <View style={styles.form}>
              {suppliers && suppliers.length ? (
                <OptionPickerItem
                  containerStyle={styles.inputContainer}
                  optionLabel={editedSummary.supplier}
                  label="Supplier/Contractor"
                  placeholder="Supplier/Contractor"
                  onOptionLabelChange={(supplier: string) =>
                    setEditedSummary((prev) => ({
                      ...prev,
                      supplier,
                    }))
                  }
                  onPickerButtonPress={() => setIsSupplierListPickerVisible(true)}
                />
              ) : (
                <TextField
                  containerStyle={styles.inputContainer}
                  style={[styles.input, { borderColor: colors.transparent }]}
                  placeholder="Supplier/Contractor"
                  label="Supplier/Contractor"
                  value={editedSummary.supplier}
                  onChangeText={(supplier: string) =>
                    setEditedSummary((prev) => ({
                      ...prev,
                      supplier,
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
        {suppliers && isSupplierListPickerVisible && (
          <BottomSheetContainer
            isVisible={isSupplierListPickerVisible}
            onClose={() => setIsSupplierListPickerVisible(false)}
          >
            <OptionList
              options={suppliers}
              onSelect={(option) => handleSupplierOptionChange(option)}
              selectedOption={pickedSupplierOption}
              enableSearch={suppliers.length > 15}
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
