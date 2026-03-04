import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from './ActionButton';
import { Text, TextInput } from './Themed';
import { useColors } from '@/src/context/ColorsContext';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { formatDate } from '@/src/utils/formatters';
import { NumericInputField } from './NumericInputField';
import { useAllRows as useAllConfigurationRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import OptionList, { OptionEntry } from './OptionList';
import { OptionPickerItem } from './OptionPickerItem';
import BottomSheetContainer from './BottomSheetContainer';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '../constants/app-constants';
import { useNetwork } from '../context/NetworkContext';
import { getVendorSearchTerm } from '../utils/vendorUtils';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { TextField } from './TextField';

interface ReceiptSummaryEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  receiptSummary: {
    vendor: string;
    vendorId: string;
    totalAmount: number;
    totalTax: number;
    receiptDate: number;
    paymentAccountId?: string;
    notes?: string;
  };
  onSave: (updatedSummary: {
    vendor: string;
    vendorId: string;
    totalAmount: number;
    totalTax: number;
    receiptDate: number;
    paymentAccountId?: string;
    notes?: string;
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
  const [isPaymentAccountPickerVisible, setIsPaymentAccountPickerVisible] = useState<boolean>(false);
  const [pickedPaymentAccountOption, setPickedPaymentAccountOption] = useState<OptionEntry | undefined>(
    undefined,
  );
  const [paymentAccounts, setPaymentAccounts] = useState<OptionEntry[]>([]);
  const { isConnectedToQuickBooks } = useNetwork();
  const allVendors = useAllConfigurationRows('vendors');
  const allAccounts = useAllConfigurationRows('accounts');
  const appSettings = useAppSettings();

  useEffect(() => {
    setEditedSummary(receiptSummary);
    const vendorMatch = vendors.find((v) => v.label === receiptSummary.vendor);
    setPickedVendorOption(vendorMatch);
  }, [receiptSummary, vendors]);

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

  useEffect(() => {
    if (!paymentAccounts.length) {
      setPickedPaymentAccountOption(undefined);
      return;
    }
    const match = paymentAccounts.find((o) => o.value === editedSummary.paymentAccountId);
    setPickedPaymentAccountOption(match);
  }, [editedSummary.paymentAccountId, paymentAccounts]);

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

  const handlePaymentAccountOptionChange = useCallback((option: OptionEntry) => {
    if (option) {
      setEditedSummary((prev) => ({ ...prev, paymentAccountId: option.value }));
      setPickedPaymentAccountOption(option);
    }
    setIsPaymentAccountPickerVisible(false);
  }, []);

  const handleSave = useCallback(async () => {
    onSave(editedSummary);
    onClose();
  }, [editedSummary, onSave, onClose]);

  const handleClose = useCallback(() => {
    setEditedSummary(receiptSummary);
    const vendorMatch = vendors.find((v) => v.value === receiptSummary.vendorId);
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
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, paddingTop: 10 }}>
        <View style={[styles.container, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text txtSize="title" style={styles.title}>
              Edit Receipt Details
            </Text>

            <View style={styles.form}>
              <OptionPickerItem
                containerStyle={styles.inputContainer}
                optionLabel={editedSummary.vendor}
                editable={false}
                label="Vendor/Merchant"
                placeholder="Vendor/Merchant"
                textColor={editedSummary.vendorId ? colors.text : colors.error}
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

              {isConnectedToQuickBooks && paymentAccounts.length > 0 && (
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
                      value={editedSummary.notes ?? ''}
                      onChangeText={(text) => setEditedSummary((prev) => ({ ...prev, notes: text }))}
                    />
                  )}
                </>
              )}

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
                isConnectedToQuickBooks && !editedSummary.vendorId
                  ? getVendorSearchTerm(editedSummary.vendor)
                  : undefined
              }
              enableSearch={
                vendors.length > 15 ||
                (isConnectedToQuickBooks && !editedSummary.vendorId && !!editedSummary.vendor)
              }
            />
          </BottomSheetContainer>
        )}
        {isConnectedToQuickBooks && paymentAccounts.length > 0 && isPaymentAccountPickerVisible && (
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
    marginBottom: 10,
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
