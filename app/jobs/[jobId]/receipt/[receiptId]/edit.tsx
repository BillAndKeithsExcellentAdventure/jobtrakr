import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from '@/components/Themed';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useJobDb } from '@/context/DatabaseContext';
import { ReceiptBucketData } from 'jobdb';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NumberInputField } from '@/components/NumberInputField';
import { TextField } from '@/components/TextField';
import { StyleSheet } from 'react-native';
import { ReceiptSummary } from '@/components/ReceiptSummary';
import { useReceiptDataStore } from '@/stores/receiptDataStore';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ActionButton } from '@/components/ActionButton';

const EditReceiptDetailsPage = () => {
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const { allJobReceipts, updateReceiptData } = useReceiptDataStore();
  const numberInputRef = useRef(null); // Create a ref to access the child component

  const { jobDbHost } = useJobDb();
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
      }
    } catch (err) {
      alert(`An error occurred while fetching the receipt with _id=${receiptId}`);
      console.log('An error occurred while fetching the receipt', err);
    }
  }, [receiptId, jobDbHost, allJobReceipts]);

  // Fetch receipts for the given job and user
  useEffect(() => {
    fetchReceipt();
  }, [allJobReceipts]);

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

  const handleSubmit = useCallback(async () => {
    if (numberInputRef.current) {
      numberInputRef.current.apply(); // Call the apply method on the child component
    }

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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Edit Receipt Details', headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
        <View style={styles.editContainer}>
          <NumberInputField
            ref={numberInputRef}
            style={styles.inputContainer}
            label="Amount"
            value={receipt.Amount!}
            onChange={function (value: number): void {
              setReceipt((prevReceipt) => ({
                ...prevReceipt,
                Amount: value,
              }));
            }}
          />
          <TextField
            containerStyle={styles.inputContainer}
            placeholder="Vendor"
            label="Vendor"
            value={receipt.Vendor}
            onChangeText={(text): void => {
              setReceipt((prevReceipt) => ({
                ...prevReceipt,
                Vendor: text,
              }));
            }}
          />
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
      </View>
    </SafeAreaView>
  );
};

export default EditReceiptDetailsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingTop: 20,
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
