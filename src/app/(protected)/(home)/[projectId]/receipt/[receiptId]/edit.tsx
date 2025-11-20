import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumberInputField, NumberInputFieldHandle } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem, OptionPickerItemHandle } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useAutoSaveNavigation } from '@/src/hooks/useFocusManager';
import { useAllRows as useAllConfigurationRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  ReceiptData,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatDate } from '@/src/utils/formatters';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { HeaderBackButton } from '@react-navigation/elements';

const EditReceiptDetailsPage = () => {
  const defaultDate = new Date();
  const numberInputFieldRef = useRef<NumberInputFieldHandle>(null);
  const optionPickerItemRef = useRef<OptionPickerItemHandle>(null);

  const router = useRouter();
  const { projectId, receiptId } = useLocalSearchParams<{ projectId: string; receiptId: string }>();
  const [isVendorListPickerVisible, setIsVendorListPickerVisible] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);
  const allProjectReceipts = useAllRows(projectId, 'receipts');
  const updateReceipt = useUpdateRowCallback(projectId, 'receipts');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const allVendors = useAllConfigurationRows('vendors');
  const [vendors, setVendors] = useState<OptionEntry[]>([]);

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

  const [receipt, setReceipt] = useState<ReceiptData>({
    id: '',
    vendor: '',
    description: '',
    amount: 0,
    numLineItems: 0,
    receiptDate: defaultDate.getTime(),
    thumbnail: '',
    pictureDate: 0,
    imageId: '',
    notes: '',
    markedComplete: false,
  });

  useEffect(() => {
    const match = allProjectReceipts.find((r) => r.id === receiptId);
    if (match) {
      setReceipt({ ...match });
    }
  }, [receiptId, allProjectReceipts]);

  useEffect(() => {
    const match = vendors.find((o) => o.label === receipt.vendor);
    setPickedOption(match);
  }, [receipt, vendors]);

  const colors = useColors();

  const handleDateConfirm = useCallback(
    (date: Date) => {
      const newReceipt = { ...receipt, date: date.getTime() };
      updateReceipt(receiptId, newReceipt);

      hideDatePicker();
    },
    [receipt, receiptId, updateReceipt],
  );

  const handleAmountChange = useCallback(
    (amount: number) => {
      const newReceipt = { ...receipt, amount };
      updateReceipt(receiptId, newReceipt);
    },
    [receipt, receiptId, updateReceipt],
  );

  const handleVendorChange = useCallback(() => {
    updateReceipt(receiptId, receipt);
  }, [receipt, receiptId, updateReceipt]);

  const handleDescriptionChange = useCallback(() => {
    const newReceipt = { ...receipt };
    updateReceipt(receiptId, newReceipt);
  }, [receipt, receiptId, updateReceipt]);

  const handleVendorLabelChange = useCallback(
    (vendor: string) => {
      const newReceipt = { ...receipt, vendor };
      updateReceipt(receiptId, newReceipt);
    },
    [receipt, receiptId, updateReceipt],
  );

  const handleVendorOptionChange = useCallback(
    (option: OptionEntry) => {
      if (option) {
        const newReceipt = { ...receipt, vendor: option.label };
        updateReceipt(receiptId, newReceipt);
      }
      setIsVendorListPickerVisible(false);
    },
    [receipt, receiptId, updateReceipt],
  );

  const receiptAmount = receipt.amount ?? 0;

  const handleBackPress = useAutoSaveNavigation(() => {
    updateReceipt(receiptId, receipt);
    router.back();
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Receipt Summary',
          headerShown: true,
          gestureEnabled: false,
          headerLeft: () => <HeaderBackButton onPress={handleBackPress} />,
        }}
      />
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
          <View style={styles.editContainer}>
            <View style={{ paddingBottom: 10, borderBottomWidth: 1, borderColor: colors.border }}>
              <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
                <Text txtSize="formLabel" text="Date" style={styles.inputLabel} />
                <TextInput
                  readOnly={true}
                  style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                  placeholder="Date"
                  onPressIn={showDatePicker}
                  value={formatDate(receipt.receiptDate)}
                />
              </TouchableOpacity>
              <DateTimePickerModal
                style={{ alignSelf: 'stretch' }}
                date={receipt.receiptDate ? new Date(receipt.receiptDate) : defaultDate}
                isVisible={datePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
              />
            </View>

            <NumberInputField
              ref={numberInputFieldRef}
              style={styles.inputContainer}
              label="Amount"
              value={receiptAmount}
              onChange={handleAmountChange}
            />
            {vendors && vendors.length ? (
              <OptionPickerItem
                ref={optionPickerItemRef}
                containerStyle={styles.inputContainer}
                optionLabel={receipt.vendor}
                placeholder="Vendor"
                label="Vendor"
                onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
                onOptionLabelChange={handleVendorLabelChange}
              />
            ) : (
              <TextField
                containerStyle={styles.inputContainer}
                placeholder="Vendor"
                label="Vendor"
                value={receipt.vendor}
                onBlur={handleVendorChange}
                onChangeText={(text): void => {
                  setReceipt((prevReceipt) => ({
                    ...prevReceipt,
                    vendor: text,
                  }));
                }}
              />
            )}
            <TextField
              containerStyle={styles.inputContainer}
              placeholder="Description"
              label="Description"
              value={receipt.description}
              onChangeText={(text): void => {
                setReceipt((prevReceipt) => ({
                  ...prevReceipt,
                  description: text,
                }));
              }}
              onBlur={handleDescriptionChange}
            />
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
              />
            </BottomSheetContainer>
          )}
        </View>
      </SafeAreaView>
    </>
  );
};

export default EditReceiptDetailsPage;

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
