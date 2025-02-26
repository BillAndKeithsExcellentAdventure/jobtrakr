import { SafeAreaView } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useJobDb } from '@/context/DatabaseContext';
import { ReceiptBucketData } from 'jobdb';
import { formatCurrency } from '@/utils/formatters';

const ReceiptDetailsPage = () => {
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const { jobDbHost } = useJobDb();
  const [receipt, setReceipt] = useState<ReceiptBucketData | null>(null);

  const fetchReceipt = useCallback(async () => {
    try {
      const response = await jobDbHost?.GetReceiptBucketDB().FetchJobReceipt(receiptId);

      if (!response) return;

      if (response.status === 'Success' && response.data) {
        setReceipt(response.data);
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
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Receipt Details', headerShown: true }} />

      <View>
        {receipt ? (
          <>
            <Text>Amount: {formatCurrency(receipt.Amount)}</Text>
            <Text>Vendor: {receipt.Vendor}</Text>
            <Text>Description: {receipt.Description}</Text>
            <Text>Notes: {receipt.Notes}</Text>
          </>
        ) : (
          <Text>No Receipt</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ReceiptDetailsPage;
