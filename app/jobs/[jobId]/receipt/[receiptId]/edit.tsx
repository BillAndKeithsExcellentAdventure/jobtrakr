import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text } from '@/components/Themed';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useJobDb } from '@/context/DatabaseContext';
import { ReceiptBucketData, VendorData } from 'jobdb';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NumberInputField } from '@/components/NumberInputField';
import { TextField } from '@/components/TextField';
import { StyleSheet } from 'react-native';
import { useReceiptDataStore } from '@/stores/receiptDataStore';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ActionButton } from '@/components/ActionButton';
import OptionList, { OptionEntry } from '@/components/OptionList';
import { OptionPickerItem } from '@/components/OptionPickerItem';
import BottomSheetContainer from '@/components/BottomSheetContainer';
import { useAllRows } from '@/tbStores/configurationStore/hooks';

const EditReceiptDetailsPage = () => {
  const router = useRouter();
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const { allJobReceipts, updateReceiptData } = useReceiptDataStore();
  const [isVendorListPickerVisible, setIsVendorListPickerVisible] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<OptionEntry | undefined>(undefined);
  const [vendors, setVendors] = useState<OptionEntry[]>([]);

  const handleVendorOptionChange = (option: OptionEntry) => {
    if (option) {
      handleVendorChange(option.label);
    }
    setIsVendorListPickerVisible(false);
  };

  const { jobDbHost } = useJobDb();
  const allVendors = useAllRows<VendorData>('vendors');

  useEffect(() => {
    if (allVendors && allVendors.length > 0) {
      const vendorOptions: OptionEntry[] = allVendors.map((vendor) => ({
        label: `${vendor.name} ${
          vendor.address ? ` - ${vendor.address}` : vendor.city ? ` - ${vendor.city}` : ''
        }`,
        value: vendor._id,
      }));

      setVendors(vendorOptions);
    } else {
      setVendors([]);
    }
  }, [allVendors]);

  const [receipt, setReceipt] = useState<ReceiptBucketData>({
    _id: '',
    UserId: '',
    JobId: '',
    DeviceId: '',
    Amount: 0,
    Vendor: '',
    Description: '',
    Notes: '',
    CategoryId: '',
    ItemId: '',
    AssetId: '',
    AlbumId: '',
    PictureUri: '',
  });

  const fetchReceipt = useCallback(async () => {
    try {
      const match = allJobReceipts.find((r) => r._id === receiptId);
      if (!match) return;

      if (match) {
        setReceipt((prevReceipt) => ({
          ...prevReceipt,
          ...match,
        }));
        pickedOption;
      }
    } catch (err) {
      alert(`An error occurred while fetching the receipt with _id=${receiptId}`);
      console.log('An error occurred while fetching the receipt', err);
    }
  }, [receiptId, jobDbHost, allJobReceipts]);

  // Fetch receipts for the given job and user
  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  useEffect(() => {
    const match = vendors.find((o) => o.label === receipt.Vendor);
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
    if (receipt._id) {
      const status = await jobDbHost?.GetReceiptBucketDB().UpdateReceipt(receipt);
      if (status === 'Success') {
        updateReceiptData(receipt._id, receipt);
      } else {
        console.log('Receipt update failed:', receipt);
      }
    }
    router.back();
  }, [receipt]);

  const receiptAmount = receipt.Amount ?? 0;

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
              optionLabel={receipt.Vendor}
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
              value={receipt.Vendor}
              onChangeText={handleVendorChange}
            />
          )}

          <TextField
            containerStyle={styles.inputContainer}
            placeholder="Description"
            label="Description"
            value={receipt.Description}
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
            value={receipt.Notes}
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
