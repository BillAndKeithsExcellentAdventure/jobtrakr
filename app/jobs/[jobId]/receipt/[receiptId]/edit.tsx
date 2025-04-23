import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text } from '@/components/Themed';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NumberInputField } from '@/components/NumberInputField';
import { TextField } from '@/components/TextField';
import { StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ActionButton } from '@/components/ActionButton';
import OptionList, { OptionEntry } from '@/components/OptionList';
import { OptionPickerItem } from '@/components/OptionPickerItem';
import BottomSheetContainer from '@/components/BottomSheetContainer';
import { useAllRows as useAllConfigurationRows } from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  ReceiptData,
  useAllRows,
  useUpdateRowCallback,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';

const EditReceiptDetailsPage = () => {
  const defaultDate = new Date();

  const router = useRouter();
  const { jobId, receiptId } = useLocalSearchParams<{ jobId: string; receiptId: string }>();
  const [isVendorListPickerVisible, setIsVendorListPickerVisible] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);
  const allJobReceipts = useAllRows(jobId, 'receipts');
  const updateReceipt = useUpdateRowCallback(jobId, 'receipts');

  const handleVendorOptionChange = (option: OptionEntry) => {
    if (option) {
      handleVendorChange(option.label);
    }
    setIsVendorListPickerVisible(false);
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
    pictureUri: '',
    notes: '',
    markedComplete: false,
  });

  useEffect(() => {
    const match = allJobReceipts.find((r) => r.id === receiptId);
    if (match) {
      setReceipt({ ...match });
    }
  }, [receiptId, allJobReceipts]);

  useEffect(() => {
    const match = vendors.find((o) => o.label === receipt.vendor);
    setPickedOption(match);
  }, [receipt, vendors]);

  const colorScheme = useColorScheme();

  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.opaqueModalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            neutral200: Colors.dark.neutral200,
            buttonBlue: Colors.dark.buttonBlue,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.opaqueModalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            neutral200: Colors.light.neutral200,
            buttonBlue: Colors.light.buttonBlue,
          },
    [colorScheme],
  );

  const handleVendorChange = useCallback((vendor: string) => {
    setReceipt((prevReceipt) => ({
      ...prevReceipt,
      Vendor: vendor,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    updateReceipt(receiptId, receipt);
    router.back();
  }, [receipt]);

  const receiptAmount = receipt.amount ?? 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Edit Receipt Summary', headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
        <View style={styles.editContainer}>
          <View style={{ alignItems: 'center' }}>
            <Text txtSize="title" text="Edit Receipt Summary" />
          </View>
          <NumberInputField
            style={styles.inputContainer}
            label="Amount"
            value={receiptAmount}
            onChange={(value: number): void => {
              setReceipt((prevReceipt) => ({
                ...prevReceipt,
                Amount: value,
              }));
            }}
          />
          {vendors && vendors.length ? (
            <OptionPickerItem
              containerStyle={styles.inputContainer}
              optionLabel={receipt.vendor}
              label="Vendor"
              placeholder="Vendor"
              onOptionLabelChange={handleVendorChange}
              onPickerButtonPress={() => setIsVendorListPickerVisible(true)}
            />
          ) : (
            <TextField
              containerStyle={styles.inputContainer}
              placeholder="Vendor"
              label="Vendor"
              value={receipt.vendor}
              onChangeText={handleVendorChange}
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
                Description: text,
              }));
            }}
          />
          <TextField
            containerStyle={styles.inputContainer}
            placeholder="Notes"
            label="Notes"
            value={receipt.notes}
            onChangeText={(text): void => {
              setReceipt((prevReceipt) => ({
                ...prevReceipt,
                Notes: text,
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
            />
          </BottomSheetContainer>
        )}
      </View>
    </SafeAreaView>
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
});
