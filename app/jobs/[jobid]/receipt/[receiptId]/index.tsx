import React, { useCallback, useEffect, useState } from 'react';
import { Text, TextInput, View } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useJobDb } from '@/context/DatabaseContext';
import { ReceiptBucketData } from 'jobdb';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NumberInputField } from '@/components/NumberInputField';
import { TextField } from '@/components/TextField';
import { StyleSheet } from 'react-native';

const ReceiptDetailsPage = () => {
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
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
      const response = await jobDbHost?.GetReceiptBucketDB().FetchJobReceipt(receiptId);

      if (!response) return;

      if (response.status === 'Success' && response.data) {
        setReceipt((prevReceipt) => ({
          ...prevReceipt,
          ...response.data,
        }));
      }
    } catch (err) {
      alert(`An error occurred while fetching the receipt with _id=${receiptId}`);
      console.log('An error occurred while fetching the receipt', err);
    }
  }, [receiptId, jobDbHost]);

  // Fetch receipts for the given job and user
  useEffect(() => {
    fetchReceipt();
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Receipt Details', headerShown: true }} />

      <View style={styles.container}>
        <NumberInputField
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
        <TextField
          containerStyle={styles.inputContainer}
          placeholder="Category"
          label="Category"
          value={receipt.Notes}
          onChangeText={(text): void => {
            setReceipt((prevReceipt) => ({
              ...prevReceipt,
              Category: text,
            }));
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default ReceiptDetailsPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    flex: 1,
    width: '100%',
  },
  inputContainer: {
    marginTop: 6,
  },
});
