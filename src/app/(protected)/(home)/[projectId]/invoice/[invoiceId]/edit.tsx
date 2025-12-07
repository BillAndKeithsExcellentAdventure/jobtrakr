import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useAllRows as useAllConfigurationRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  InvoiceData,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatDate } from '@/src/utils/formatters';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const EditInvoiceDetailsPage = () => {
  const defaultDate = new Date();

  const router = useRouter();
  const { projectId, invoiceId } = useLocalSearchParams<{ projectId: string; invoiceId: string }>();
  const [isSupplierListPickerVisible, setIsSupplierListPickerVisible] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);
  const allProjectInvoices = useAllRows(projectId, 'invoices');
  const updateInvoice = useUpdateRowCallback(projectId, 'invoices');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleSupplierOptionChange = (option: OptionEntry) => {
    if (option) {
      handleSupplierChange(option.label);
    }
    setIsSupplierListPickerVisible(false);
  };

  const allSuppliers = useAllConfigurationRows('suppliers');
  const [suppliers, setSuppliers] = useState<OptionEntry[]>([]);

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

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = useCallback((date: Date) => {
    setInvoice((prevInvoice) => ({
      ...prevInvoice,
      date,
    }));

    hideDatePicker();
  }, []);

  const [invoice, setInvoice] = useState<InvoiceData>({
    id: '',
    invoiceNumber: '',
    supplier: '',
    description: '',
    amount: 0,
    numLineItems: 0,
    invoiceDate: defaultDate.getTime(),
    thumbnail: '',
    pictureDate: 0,
    imageId: '',
    notes: '',
    markedComplete: false,
  });

  useEffect(() => {
    const match = allProjectInvoices.find((r) => r.id === invoiceId);
    if (match) {
      setInvoice({ ...match });
    }
  }, [invoiceId, allProjectInvoices]);

  useEffect(() => {
    const match = suppliers.find((o) => o.label === invoice.supplier);
    setPickedOption(match);
  }, [invoice, suppliers]);

  const colors = useColors();
  const handleSupplierChange = useCallback((supplier: string) => {
    setInvoice((prevInvoice) => ({
      ...prevInvoice,
      supplier,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    updateInvoice(invoiceId, invoice);
    router.back();
  }, [invoice, invoiceId, router, updateInvoice]);

  const invoiceAmount = invoice.amount ?? 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Edit Invoice Summary', headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
        <View style={styles.editContainer}>
          <View style={{ alignItems: 'center' }}>
            <Text txtSize="title" text="Edit Invoice Summary" />
          </View>
          <TextField
            containerStyle={styles.inputContainer}
            placeholder="Invoice Number"
            label="Invoice Number"
            value={invoice.invoiceNumber}
            onChangeText={(invoiceNumber): void => {
              setInvoice((prevInvoice) => ({
                ...prevInvoice,
                invoiceNumber,
              }));
            }}
          />
          <View style={{ paddingBottom: 10, borderBottomWidth: 1, borderColor: colors.border }}>
            <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
              <Text txtSize="formLabel" text="Date" style={styles.inputLabel} />
              <TextInput
                readOnly={true}
                style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                placeholder="Date"
                onPressIn={showDatePicker}
                value={formatDate(invoice.invoiceDate)}
              />
            </TouchableOpacity>
            <DateTimePickerModal
              style={{ alignSelf: 'stretch' }}
              date={invoice.invoiceDate ? new Date(invoice.invoiceDate) : defaultDate}
              isVisible={datePickerVisible}
              mode="date"
              onConfirm={handleDateConfirm}
              onCancel={hideDatePicker}
            />
          </View>

          <NumberInputField
            style={styles.inputContainer}
            label="Amount"
            value={invoiceAmount}
            onChange={(value: number): void => {
              setInvoice((prevInvoice) => ({
                ...prevInvoice,
                amount: value,
              }));
            }}
          />
          {suppliers && suppliers.length ? (
            <OptionPickerItem
              containerStyle={styles.inputContainer}
              optionLabel={invoice.supplier}
              placeholder="Supplier"
              label="Supplier"
              onOptionLabelChange={handleSupplierChange}
              onPickerButtonPress={() => setIsSupplierListPickerVisible(true)}
            />
          ) : (
            <TextField
              containerStyle={styles.inputContainer}
              placeholder="Supplier"
              label="Supplier"
              value={invoice.supplier}
              onChangeText={handleSupplierChange}
            />
          )}

          <TextField
            containerStyle={styles.inputContainer}
            placeholder="Description"
            label="Description"
            value={invoice.description}
            onChangeText={(text): void => {
              setInvoice((prevInvoice) => ({
                ...prevInvoice,
                description: text,
              }));
            }}
          />
          <View style={styles.saveButtonRow}>
            <ActionButton style={styles.saveButton} onPress={handleSubmit} type={'ok'} title="Save" />

            <ActionButton
              style={styles.cancelButton}
              onPress={() => {
                router.back();
              }}
              type={'cancel'}
              title="Cancel"
            />
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
              selectedOption={pickedOption}
              enableSearch={suppliers.length > 15}
            />
          </BottomSheetContainer>
        )}
      </View>
    </SafeAreaView>
  );
};

export default EditInvoiceDetailsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  editContainer: {
    padding: 20,
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
