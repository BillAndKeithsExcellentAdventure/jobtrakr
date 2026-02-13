import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { useAutoSaveNavigation } from '@/src/hooks/useFocusManager';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
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
  const [isPaymentAccountPickerVisible, setIsPaymentAccountPickerVisible] = useState<boolean>(false);
  const [pickedPaymentAccountOption, setPickedPaymentAccountOption] = useState<OptionEntry | undefined>(
    undefined,
  );
  const allProjectReceipts = useAllRows(projectId, 'receipts');
  const updateReceipt = useUpdateRowCallback(projectId, 'receipts');
  const appSettings = useAppSettings();
  const { isConnectedToQuickBooks } = useNetwork();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const allVendors = useAllConfigurationRows('vendors');
  const allAccounts = useAllConfigurationRows('accounts');
  const [vendors, setVendors] = useState<OptionEntry[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<OptionEntry[]>([]);

  useEffect(() => {
    if (allVendors && allVendors.length > 0) {
      const vendorOptions: OptionEntry[] = allVendors.map((vendor) => ({
        label: `${vendor.name} ${
          vendor.address ? ` - ${vendor.address}` : vendor.city ? ` - ${vendor.city}` : ''
        }`,
        value: vendor.accountingId,
      }));

      setVendors(vendorOptions);
    } else {
      setVendors([]);
    }
  }, [allVendors]);

  useEffect(() => {
    if (allAccounts && allAccounts.length > 0) {
      const configuredAccountIds = appSettings.quickBooksPaymentAccounts
        ? appSettings.quickBooksPaymentAccounts.split(',').filter((id) => id.trim() !== '')
        : [];

      const paymentList = allAccounts
        .filter((account) => configuredAccountIds.includes(account.accountingId))
        .map((account) => ({
          label: account.name,
          value: account.accountingId,
        }));

      setPaymentAccounts(paymentList);
    } else {
      setPaymentAccounts([]);
    }
  }, [allAccounts, appSettings.quickBooksPaymentAccounts]);

  const [receipt, setReceipt] = useState<ReceiptData>({
    id: '',
    vendor: '',
    vendorId: '',
    paymentAccountId: '',
    description: '',
    amount: 0,
    receiptDate: defaultDate.getTime(),
    thumbnail: '',
    pictureDate: 0,
    imageId: '',
    notes: '',
    markedComplete: false,
    accountingId: '',
    purchaseId: '',
    qbSyncHash: '',
  });

  useEffect(() => {
    const match = allProjectReceipts.find((r) => r.id === receiptId);
    if (match) {
      setReceipt({ ...match });
    }
  }, [receiptId, allProjectReceipts]);

  useEffect(() => {
    const match = isConnectedToQuickBooks
      ? vendors.find((o) => o.value === receipt.vendorId)
      : vendors.find((o) => o.label === receipt.vendor);
    setPickedOption(match);
  }, [receipt, vendors, isConnectedToQuickBooks]);

  useEffect(() => {
    if (!paymentAccounts.length) {
      setPickedPaymentAccountOption(undefined);
      return;
    }
    const match = paymentAccounts.find((o) => o.value === receipt.paymentAccountId);
    setPickedPaymentAccountOption(match);
  }, [receipt.paymentAccountId, paymentAccounts]);

  useEffect(() => {
    if (!receipt.id || receipt.id !== receiptId) {
      return;
    }
    if (!receipt.paymentAccountId && appSettings.quickBooksDefaultPaymentAccountId) {
      const newReceipt = {
        ...receipt,
        paymentAccountId: appSettings.quickBooksDefaultPaymentAccountId,
      };
      updateReceipt(receiptId, newReceipt);
    }
  }, [
    receipt,
    receipt.id,
    receipt.paymentAccountId,
    appSettings.quickBooksDefaultPaymentAccountId,
    receiptId,
    updateReceipt,
  ]);

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

  const handleNotesChange = useCallback(
    (notes: string) => {
      const newReceipt = { ...receipt, notes };
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
        const newReceipt = {
          ...receipt,
          vendor: option.label,
          vendorId: option.value ?? '',
        };
        updateReceipt(receiptId, newReceipt);
      }
      setIsVendorListPickerVisible(false);
    },
    [receipt, receiptId, updateReceipt],
  );

  const handlePaymentAccountOptionChange = useCallback(
    (option: OptionEntry) => {
      if (option) {
        const newReceipt = { ...receipt, paymentAccountId: option.value };
        updateReceipt(receiptId, newReceipt);
        setPickedPaymentAccountOption(option);
      }
      setIsPaymentAccountPickerVisible(false);
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
            <View style={{ paddingBottom: 8 }}>
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
              style={{ ...styles.inputContainer, paddingLeft: 10, marginTop: 0 }}
              labelStyle={{ marginBottom: 0 }}
              label="Amount"
              value={receiptAmount}
              onChange={handleAmountChange}
            />
            {vendors && vendors.length ? (
              <OptionPickerItem
                containerStyle={styles.inputContainer}
                optionLabel={isConnectedToQuickBooks && !receipt.vendorId ? '' : receipt.vendor}
                placeholder="Vendor/Merchant"
                label="Vendor/Merchant"
                editable={!isConnectedToQuickBooks}
                onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
                onOptionLabelChange={!isConnectedToQuickBooks ? handleVendorLabelChange : undefined}
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
            {isConnectedToQuickBooks && paymentAccounts && paymentAccounts.length > 0 && (
              <>
                <OptionPickerItem
                  containerStyle={styles.inputContainer}
                  optionLabel={pickedPaymentAccountOption?.label}
                  label="Payment Account"
                  placeholder="Payment Account"
                  editable={false}
                  onPickerButtonPress={() => setIsPaymentAccountPickerVisible(true)}
                />
                {pickedPaymentAccountOption?.label?.toLowerCase().includes('checking') && (
                  <TextField
                    label="Check #"
                    containerStyle={styles.inputContainer}
                    placeholder="Check #"
                    value={receipt.notes}
                    onChangeText={(text): void => {
                      setReceipt((prevReceipt) => ({
                        ...prevReceipt,
                        notes: text,
                      }));
                    }}
                    onBlur={() => handleNotesChange(receipt.notes)}
                  />
                )}
              </>
            )}
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
                initialSearchText={isConnectedToQuickBooks && !receipt.vendorId ? receipt.vendor : undefined}
                enableSearch={
                  vendors.length > 15 || (isConnectedToQuickBooks && !receipt.vendorId && !!receipt.vendor)
                }
              />
            </BottomSheetContainer>
          )}
          {isConnectedToQuickBooks && paymentAccounts && isPaymentAccountPickerVisible && (
            <BottomSheetContainer
              modalHeight={'60%'}
              isVisible={isPaymentAccountPickerVisible}
              onClose={() => setIsPaymentAccountPickerVisible(false)}
            >
              <OptionList
                options={paymentAccounts}
                onSelect={(option) => handlePaymentAccountOptionChange(option)}
                selectedOption={pickedPaymentAccountOption}
                enableSearch={paymentAccounts.length > 15}
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
