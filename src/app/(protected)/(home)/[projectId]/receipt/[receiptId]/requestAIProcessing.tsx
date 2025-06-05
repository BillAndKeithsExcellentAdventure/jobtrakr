import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/src/components/Themed';
import { useAuth } from '@clerk/clerk-expo';
import { formatCurrency, formatDate, replaceNonPrintable } from '@/src/utils/formatters';

const processAIProcessing = async (
  token: string,
  imageId: string,
  projectId: string,
  userId: string,
  organizationId: string,
) => {
  try {
    const receiptImageData = {
      imageId: imageId,
      projectId: projectId,
      userId: userId,
      organizationId: organizationId,
    };
    console.log(' token:', token);
    console.log(' receiptImageData:', receiptImageData);
    const response = await fetch(
      'https://projecthoundbackend.keith-m-bertram.workers.dev/getReceiptIntelligence',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptImageData),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}. Response: ${errorBody}`);
    }

    const data = await response.json();
    console.log(' response.ok?:', response.ok);
    console.log(' response:', JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw error;
  }
};

const requestAIProcessingPage = () => {
  const { projectId, imageId } = useLocalSearchParams<{ projectId: string; imageId: string }>();
  const auth = useAuth();
  const { userId, orgId } = auth;
  const [resultJson, setResultJson] = useState<any>(null);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    async function fetchAIResult() {
      const token = await auth.getToken();
      if (!token) {
        console.error('No token available');
        return;
      }

      const result = await processAIProcessing(token, imageId, projectId, userId!, orgId!);
      if (result.status === 'Success') {
        const receiptItems = result.response.Items.map((i: any) => ({
          description: i.Description.value,
          amount: i.TotalPrice.value,
        }));

        const resultJson = {
          status: result.status,
          vendor: replaceNonPrintable(result.response.MerchantName.value),
          receiptDate: Date.parse(result.response.TransactionDate.value),
          totalAmount: Number.parseFloat(result.response.Total.value),
          totalTax: Number.parseFloat(result.response.TotalTax.value),
          items: receiptItems,
        };
        setResultJson(resultJson);
      }

      setFetchingData(false);
    }

    fetchAIResult();
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'AI Receipt Processing', headerShown: true }} />
      <View style={styles.container}>
        {fetchingData ? (
          <View style={{ width: '100%', gap: 20 }}>
            <ActivityIndicator size="large" />
            <Text txtSize="title">Waiting for AI to extract data from receipt image.</Text>
          </View>
        ) : (
          <View style={{ width: '100%', gap: 20 }}>
            {resultJson ? (
              <>
                <Text>Vendor:{resultJson.vendor}</Text>
                <Text>Amount:{formatCurrency(resultJson.totalAmount, false, true)}</Text>
                <Text>Tax:{formatCurrency(resultJson.totalTax, false, true)}</Text>
                <Text>Date:{formatDate(resultJson.receiptDate)}</Text>
                {resultJson.items && (
                  <FlatList
                    data={resultJson.items}
                    keyExtractor={(item, index) => `${item.description}-${index}`}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          padding: 16,
                          flexDirection: 'row',
                          width: '100%',
                        }}
                      >
                        <Text style={{ flex: 1 }}>{item.description}</Text>
                        <Text style={{ width: 100 }}>{formatCurrency(item.amount, false, true)}</Text>
                      </View>
                    )}
                  />
                )}
              </>
            ) : (
              <>
                <Text>SORRY, AI could not process the receipt!</Text>
              </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default requestAIProcessingPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    width: '100%',
  },
});
