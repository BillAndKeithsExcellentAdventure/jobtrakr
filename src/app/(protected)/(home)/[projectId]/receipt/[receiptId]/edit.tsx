import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
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
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditReceiptDetailsPage = () => {
  const defaultDate = new Date();

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
    accountingId: '',
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
      const newReceipt = { ...receipt, receiptDate: date.getTime() };
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

  const handleVendorChange = useCallback(
    (vendor: string) => {
      const newReceipt = { ...receipt, vendor };
      updateReceipt(receiptId, newReceipt);
    },
    [receipt, receiptId, updateReceipt],
  );

  const handleDescriptionChange = useCallback(
    (description: string) => {
      const newReceipt = { ...receipt, description };
      updateReceipt(receiptId, newReceipt);
    },
    [receipt, receiptId, updateReceipt],
  );

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
    router.back();
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Receipt Summary',
          headerShown: true,
          gestureEnabled: false,
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
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
              style={styles.inputContainer}
              label="Amount"
              value={receiptAmount}
              onChange={handleAmountChange}
            />
            {vendors && vendors.length ? (
              <OptionPickerItem
                containerStyle={styles.inputContainer}
                optionLabel={receipt.vendor}
                placeholder="Vendor/Merchant"
                label="Vendor/Merchant"
                onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
                onOptionLabelChange={handleVendorLabelChange}
              />
            ) : (
              <TextField
                containerStyle={styles.inputContainer}
                placeholder="Vendor/Merchant"
                label="Vendor/Merchant"
                value={receipt.vendor}
                onChangeText={(text): void => {
                  setReceipt((prevReceipt) => ({
                    ...prevReceipt,
                    vendor: text,
                  }));
                }}
                onBlur={() => handleVendorChange(receipt.vendor)}
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
              onBlur={() => handleDescriptionChange(receipt.description)}
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
                enableSearch={vendors.length > 15}
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
  saveButton: {
    flex: 1,
    marginRight: 5,
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
