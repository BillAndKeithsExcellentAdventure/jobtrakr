import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/src/components/Themed';
import { useAuth } from '@clerk/clerk-expo';
import { formatCurrency, formatDate, replaceNonPrintable } from '@/src/utils/formatters';

interface ReceiptItemFromAI {
  description: string;
  amount: number;
}

interface ReceiptItem {
  description: string;
  amount: number;
  taxable: boolean;
  proratedTax: number;
}

interface ReceiptSummary {
  vendor: string;
  receiptDate: number;
  totalAmount: number;
  totalTax: number;
}

function prorateTotalTax(
  totalTax: number,
  nonTaxableItemIndices: number[],
  items: ReceiptItem[],
): ReceiptItem[] {
  // Get total amount of taxable items
  const taxableItems = items.filter((item, index) => !nonTaxableItemIndices.includes(index));
  const totalTaxableAmount = taxableItems.reduce((sum, item) => sum + item.amount, 0);

  if (totalTaxableAmount === 0 || taxableItems.length === 0) {
    return items;
  }

  // Create new array to avoid mutating input
  const updatedItems = [...items];
  let remainingTax = totalTax;
  let processedItems = 0;

  updatedItems.forEach((item, index) => {
    if (nonTaxableItemIndices.includes(index)) {
      item.proratedTax = 0;
      return;
    }

    processedItems++;
    if (processedItems === taxableItems.length) {
      // Last taxable item - assign remaining tax to avoid rounding errors
      item.proratedTax = Number(remainingTax.toFixed(2));
    } else {
      // Calculate proportional tax for this item
      const proportion = item.amount / totalTaxableAmount;
      const itemTax = Number((totalTax * proportion).toFixed(2));
      item.proratedTax = itemTax;
      remainingTax -= itemTax;
    }
  });

  return updatedItems;
}

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
  const [fetchingData, setFetchingData] = useState(true);
  const [receiptSummary, setReceiptSummary] = useState<ReceiptSummary>();
  const [aiItems, setAiItems] = useState<ReceiptItemFromAI[]>([]);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    async function fetchAIResult() {
      const token = await auth.getToken();
      if (!token) {
        console.error('No token available');
        return;
      }

      const result = await processAIProcessing(token, imageId, projectId, userId!, orgId!);
      if (result.status === 'Success') {
        const summary = {
          vendor: replaceNonPrintable(result.response.MerchantName.value),
          receiptDate: Date.parse(result.response.TransactionDate.value),
          totalAmount: Number.parseFloat(result.response.Total.value),
          totalTax: Number.parseFloat(result.response.TotalTax.value),
        };

        if (result.response.Items.length > 0) {
          const receiptItems = prorateTotalTax(
            summary.totalTax,
            [],
            result.response.Items.map((i: any) => ({
              description: i.Description.value,
              amount: i.TotalPrice.value,
            })),
          );

          setAiItems(receiptItems);
        } else {
          setAiItems([
            {
              description: 'Not Specified',
              amount: summary.totalAmount - summary.totalTax,
            },
          ]);
        }

        setReceiptSummary(summary);
      }

      setFetchingData(false);
    }

    fetchAIResult();
  }, []);

  // Initial setup with all items taxable
  useEffect(() => {
    const initialized = aiItems.map((item) => ({ ...item, taxable: true, proratedTax: 0 }));
    if (receiptSummary) {
      const withTax = recalculateProratedTax(initialized, receiptSummary.totalTax);
      setReceiptItems(withTax);
    }
  }, [aiItems, receiptSummary]);

  // Recalculate proratedTax values
  const recalculateProratedTax = (items: ReceiptItem[], totalTax: number): ReceiptItem[] => {
    const taxableItems = items.filter((i) => i.taxable);
    const totalAmount = taxableItems.reduce((sum, i) => sum + i.amount, 0);

    // If nothing is taxable, all proratedTax is zero
    if (totalAmount === 0) {
      return items.map((i) => ({ ...i, proratedTax: 0 }));
    }

    return items.map((i) => {
      if (!i.taxable) return { ...i, proratedTax: 0 };
      const proportion = i.amount / totalAmount;
      const proratedTax = parseFloat((proportion * totalTax).toFixed(2));
      return { ...i, proratedTax };
    });
  };

  const toggleTaxable = (index: number) => {
    const updatedItems = [...receiptItems];
    updatedItems[index].taxable = !updatedItems[index].taxable;
    if (receiptSummary) {
      const recalculated = recalculateProratedTax(updatedItems, receiptSummary.totalTax);
      setReceiptItems(recalculated);
    }
  };

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
          <View style={{ width: '100%', gap: 5 }}>
            {receiptSummary ? (
              <>
                <Text>Vendor:{receiptSummary.vendor}</Text>
                <Text>Amount:{formatCurrency(receiptSummary.totalAmount, false, true)}</Text>
                <Text>Tax:{formatCurrency(receiptSummary.totalTax, false, true)}</Text>
                <Text>Date:{formatDate(receiptSummary.receiptDate)}</Text>
                {receiptItems && (
                  <FlatList
                    data={receiptItems}
                    keyExtractor={(_, index) => `${index}`}
                    renderItem={({ item, index }) => (
                      <View
                        style={{
                          padding: 16,
                          width: '100%',
                        }}
                      >
                        <Text style={{ flex: 1 }}>{item.description}</Text>

                        <View
                          style={{
                            flexDirection: 'row',
                            width: '100%',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ width: 100, alignItems: 'flex-end' }}>
                            Amount: {formatCurrency(item.amount, false, true)}
                          </Text>
                          <Switch value={item.taxable} onValueChange={() => toggleTaxable(index)} />

                          <Text style={{ width: 100 }}>
                            Tax: {formatCurrency(item.proratedTax, false, true)}
                          </Text>
                          <Text style={{ width: 100, alignItems: 'flex-end' }}>
                            Total: {formatCurrency(item.amount + item.proratedTax, false, true)}
                          </Text>
                        </View>
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
