import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumericInputField } from '@/src/components/NumericInputField';
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
  const [isVendorListPickerVisible, setIsVendorListPickerVisible] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);
  const allProjectInvoices = useAllRows(projectId, 'invoices');
  const updateInvoice = useUpdateRowCallback(projectId, 'invoices');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleVendorOptionChange = (option: OptionEntry) => {
    if (option) {
      setInvoice((prevInvoice) => ({
        ...prevInvoice,
        vendor: option.label,
        vendorId: option.value,
      }));
    }
    setIsVendorListPickerVisible(false);
  };

  const allVendors = useAllConfigurationRows('vendors');
  const [vendors, setVendors] = useState<OptionEntry[]>([]);

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

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = useCallback((date: Date) => {
    setInvoice((prevInvoice) => ({
      ...prevInvoice,
      dueDate: date.getTime(),
    }));

    hideDatePicker();
  }, []);

  const [invoice, setInvoice] = useState<InvoiceData>({
    id: '',
    invoiceNumber: '',
    vendor: '',
    vendorId: '',
    description: '',
    amount: 0,
    invoiceDate: defaultDate.getTime(),
    dueDate: defaultDate.getTime(),
    paymentStatus: 'pending',
    thumbnail: '',
    pictureDate: 0,
    imageId: '',
    notes: '',
    markedComplete: false,
    accountingId: '',
    paymentAccountId: '',
    billId: '',
    qbSyncHash: '',
  });

  useEffect(() => {
    const match = allProjectInvoices.find((r) => r.id === invoiceId);
    if (match) {
      setInvoice({ ...match });
    }
  }, [invoiceId, allProjectInvoices]);

  useEffect(() => {
    const match = vendors.find((o) => o.value === invoice.vendorId);
    setPickedOption(match);
  }, [invoice, vendors]);

  const colors = useColors();

  const handleSubmit = useCallback(async () => {
    updateInvoice(invoiceId, invoice);
    router.back();
  }, [invoice, invoiceId, router, updateInvoice]);

  const invoiceAmount = invoice.amount ?? 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Edit Bill Details',
          headerShown: false,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
        <View style={styles.editContainer}>
          <View style={{ alignItems: 'center' }}>
            <Text txtSize="title" text="Edit Bill Summary" />
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
          <View style={{ paddingBottom: 10 }}>
            <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
              <Text txtSize="formLabel" text="Bill Date" style={styles.inputLabel} />
              <TextInput
                readOnly={true}
                style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                placeholder="Bill Date"
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
          <View style={{ paddingBottom: 10 }}>
            <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
              <Text txtSize="formLabel" text="Due Date" style={styles.inputLabel} />
              <TextInput
                readOnly={true}
                style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                placeholder="Date"
                onPressIn={showDatePicker}
                value={formatDate(invoice.dueDate)}
              />
            </TouchableOpacity>
            <DateTimePickerModal
              style={{ alignSelf: 'stretch' }}
              date={invoice.dueDate ? new Date(invoice.dueDate) : defaultDate}
              isVisible={datePickerVisible}
              mode="date"
              onConfirm={handleDateConfirm}
              onCancel={hideDatePicker}
            />
          </View>

          <NumericInputField
            containerStyle={styles.inputContainer}
            inputStyle={{ paddingHorizontal: 10 }}
            label="Amount"
            value={invoiceAmount}
            onChangeNumber={(value: number | null): void => {
              setInvoice((prevInvoice) => ({
                ...prevInvoice,
                amount: value ?? 0,
              }));
            }}
          />
          <OptionPickerItem
            containerStyle={styles.inputContainer}
            textColor={invoice.vendorId ? colors.text : colors.error}
            optionLabel={invoice.vendor}
            editable={false}
            placeholder="Vendor/Merchant"
            label="Vendor/Merchant"
            onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
          />

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
        {vendors && isVendorListPickerVisible && (
          <BottomSheetContainer
            isVisible={isVendorListPickerVisible}
            onClose={() => setIsVendorListPickerVisible(false)}
          >
            <OptionList
              options={vendors}
              onSelect={(option) => handleVendorOptionChange(option)}
              selectedOption={pickedOption}
              enableSearch={vendors.length > 15}
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
