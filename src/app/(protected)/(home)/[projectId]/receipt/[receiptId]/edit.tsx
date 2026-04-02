import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { NumericInputField } from '@/src/components/NumericInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { VendorPicker } from '@/src/components/VendorPicker';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import {
  VendorData,
  useAllRows as useAllConfigurationRows,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  ReceiptData,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatDate } from '@/src/utils/formatters';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';

const EditReceiptDetailsPage = () => {
  const defaultDate = new Date();
  const router = useRouter();
  const { projectId, receiptId } = useLocalSearchParams<{ projectId: string; receiptId: string }>();
  const [isPaymentAccountPickerVisible, setIsPaymentAccountPickerVisible] = useState<boolean>(false);
  const [pickedPaymentAccountOption, setPickedPaymentAccountOption] = useState<OptionEntry | undefined>(
    undefined,
  );
  const allProjectReceipts = useAllRows(projectId, 'receipts');
  const updateReceipt = useUpdateRowCallback(projectId, 'receipts');
  const appSettings = useAppSettings();
  const { isQuickBooksConnected } = useNetwork();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const allVendors = useAllConfigurationRows('vendors');
  const allAccounts = useAllConfigurationRows('accounts');
  const [paymentAccounts, setPaymentAccounts] = useState<OptionEntry[]>([]);

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

  const handleDescriptionChange = useCallback(
    (description: string) => {
      const newReceipt = { ...receipt, description };
      updateReceipt(receiptId, newReceipt);
    },
    [receipt, receiptId, updateReceipt],
  );

  const handleVendorSelected = useCallback(
    (vendor: VendorData) => {
      const newReceipt = {
        ...receipt,
        vendor: vendor.name,
        vendorId: vendor.id,
      };
      updateReceipt(receiptId, newReceipt);
    },
    [receipt, receiptId, updateReceipt],
  );

  const selectedVendor = useMemo(
    () => allVendors.find((v) => v.id === receipt.vendorId),
    [allVendors, receipt.vendorId],
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

  const handleBackPress = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Receipt Summary',
          headerShown: true,
          gestureEnabled: false,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={62}
        keyboardShouldPersistTaps="handled"
        style={[styles.container, { backgroundColor: colors.listBackground }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'ios' ? 90 : 20 }]}
      >
        <View style={styles.editContainer}>
          <View style={{ paddingBottom: 8 }}>
            <TouchableOpacity activeOpacity={1} onPress={showDatePicker}>
              <Text txtSize="formLabel" text="Date" style={styles.inputLabel} />
              <TextField
                editable={false}
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

          <NumericInputField
            containerStyle={{ marginTop: 0 }}
            inputStyle={{ paddingHorizontal: 10 }}
            labelStyle={{ marginBottom: 2 }}
            label="Amount"
            maxDecimals={2}
            decimals={2}
            value={receiptAmount}
            onChangeNumber={(value) => handleAmountChange(value ?? 0)}
          />
          <VendorPicker
            selectedVendor={selectedVendor}
            onVendorSelected={handleVendorSelected}
            vendors={allVendors}
            label="Vendor/Merchant"
            placeholder="Vendor/Merchant"
          />

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
          {isQuickBooksConnected && paymentAccounts && paymentAccounts.length > 0 && (
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
                  keyboardType="numbers-and-punctuation"
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
      </KeyboardAwareScrollView>
      {isQuickBooksConnected && paymentAccounts && isPaymentAccountPickerVisible && (
        <BottomSheetContainer
          modalHeight={'60%'}
          isVisible={isPaymentAccountPickerVisible}
          onClose={() => setIsPaymentAccountPickerVisible(false)}
          showKeyboardToolbar={false}
        >
          <OptionList
            options={paymentAccounts}
            onSelect={(option) => handlePaymentAccountOptionChange(option)}
            selectedOption={pickedPaymentAccountOption}
            enableSearch={false}
          />
        </BottomSheetContainer>
      )}
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
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
  scrollContent: {
    flexGrow: 1,
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
