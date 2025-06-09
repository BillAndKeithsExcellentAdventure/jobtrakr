import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useAuth } from '@clerk/clerk-expo';
import { formatCurrency, formatDate, replaceNonPrintable } from '@/src/utils/formatters';
import { ActionButton } from '@/src/components/ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import { AiLineItem } from '@/src/components/AiLineItem';
import { ReceiptItem, ReceiptItemFromAI, ReceiptSummary } from '@/src/models/types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import CostItemPickerModal from '@/src/components/CostItemPickerModal';
import { OptionEntry } from '@/src/components/OptionList';

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
  const [showCostItemPicker, setShowCostItemPicker] = useState(false);
  const [receiptSummary, setReceiptSummary] = useState<ReceiptSummary>();
  const [aiItems, setAiItems] = useState<ReceiptItemFromAI[]>([]);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const colors = useColors();

  // Simulated AI result for testing
  async function fetchSimulatedAIResult(returnSingleItem = false) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockResult = {
      status: 'Success',
      response: {
        MerchantName: { value: 'Home Depot' },
        TransactionDate: { value: '2025-06-06T10:30:00Z' },
        Total: { value: '156.47' },
        TotalTax: { value: '12.47' },
        Items: [
          {
            Description: { value: '2x4x8 Premium Lumber' },
            TotalPrice: { value: '45.98' },
          },
          {
            Description: { value: 'Paint Brush Set' },
            TotalPrice: { value: '24.99' },
          },
          {
            Description: { value: 'Drywall Screws 5lb Box' },
            TotalPrice: { value: '18.47' },
          },
          {
            Description: { value: 'LED Light Fixture' },
            TotalPrice: { value: '34.99' },
          },
          {
            Description: { value: 'Plumbing Tape' },
            TotalPrice: { value: '19.57' },
          },
        ],
      },
    };

    const summary = {
      vendor: replaceNonPrintable(mockResult.response.MerchantName.value),
      receiptDate: Date.parse(mockResult.response.TransactionDate.value),
      totalAmount: Number.parseFloat(mockResult.response.Total.value),
      totalTax: Number.parseFloat(mockResult.response.TotalTax.value),
    };

    if (mockResult.response.Items.length > 0) {
      const receiptItems = mockResult.response.Items.map((i: any) => ({
        description: i.Description.value,
        amount: Number.parseFloat(i.TotalPrice.value),
      }));
      if (returnSingleItem) setAiItems([receiptItems[0]]);
      else setAiItems(receiptItems);
    }

    setReceiptSummary(summary);
    setFetchingData(false);
  }

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
        const receiptItems = result.response.Items.map((i: any) => ({
          description: i.Description.value,
          amount: i.TotalPrice.value,
        }));
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

  useEffect(() => {
    fetchSimulatedAIResult();
    //fetchAIResult();
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

  const toggleSelection = (index: number) => {
    const updatedItems = receiptItems.map((item, i) => ({
      ...item,
      isSelected: i === index ? !item.isSelected : item.isSelected,
    }));
    setReceiptItems(updatedItems);
  };

  const onSelectAll = useCallback(() => {
    const hasSelectedItems = receiptItems.every((item) => item.isSelected);
    setReceiptItems((prev) =>
      prev.map((item) => ({
        ...item,
        isSelected: !hasSelectedItems,
      })),
    );
  }, [receiptItems]);

  const numSelected = useMemo(
    () => receiptItems.reduce((sum, item) => sum + (item.isSelected ? 1 : 0), 0),
    [receiptItems],
  );

  const allSelected = useMemo(
    () => numSelected === receiptItems.length && receiptItems.length > 0,
    [receiptItems, numSelected],
  );

  const allCostItemsSpecified = useMemo(
    () => receiptItems.every((item) => item.costWorkItem),
    [receiptItems],
  );

  const handleSelectCostItem = useCallback(() => {
    setShowCostItemPicker(true);
  }, []);

  const onCostItemOptionSelected = useCallback((costItemEntry: OptionEntry | undefined) => {
    setShowCostItemPicker(false);
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'AI Receipt Processing', headerShown: true }} />
      <View style={[styles.container, { marginBottom: 20, backgroundColor: colors.listBackground }]}>
        {fetchingData ? (
          <View style={{ width: '100%', gap: 20 }}>
            <ActivityIndicator size="large" />
            <Text txtSize="title">Waiting for AI to extract data from receipt image.</Text>
          </View>
        ) : (
          <View style={{ width: '100%', gap: 10, flex: 1, backgroundColor: colors.listBackground }}>
            {receiptSummary ? (
              <>
                <Pressable
                  onPress={() => {
                    console.log('pressed');
                  }}
                >
                  <View
                    style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.border, padding: 5 }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.label}>Vendor:</Text>
                        <Text>{receiptSummary.vendor}</Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.label}>Amount:</Text>
                        <Text>{receiptSummary.totalAmount}</Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.label}>Tax:</Text>
                        <Text>{formatCurrency(receiptSummary.totalTax, false, true)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.label}>Date:</Text>
                        <Text>{formatDate(receiptSummary.receiptDate)}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
                    </View>
                  </View>
                </Pressable>

                {receiptItems && (
                  <>
                    <View style={[styles.selectRow, { backgroundColor: colors.listBackground }]}>
                      <TouchableOpacity onPress={onSelectAll} style={styles.selectAllButton}>
                        <Ionicons
                          name={allSelected ? 'ellipse-sharp' : 'ellipse-outline'}
                          size={24}
                          color="#007AFF"
                        />
                        <Text style={{ marginLeft: 10 }}>
                          {allSelected ? 'Clear Selection' : 'Select All'}
                        </Text>
                      </TouchableOpacity>
                      <Text>{`${numSelected} selected`}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: colors.listBackground }}>
                      <FlatList
                        style={{ flex: 1, paddingHorizontal: 5 }}
                        data={receiptItems}
                        keyExtractor={(_, index) => `${index}`}
                        renderItem={({ item, index }) => (
                          <AiLineItem
                            item={item}
                            index={index}
                            showTaxToggle={receiptItems.length > 1}
                            onTaxableChange={toggleTaxable}
                            onSelectItem={toggleSelection}
                          />
                        )}
                      />
                    </View>
                  </>
                )}
                <ActionButton
                  title="Set Cost Item for Selection"
                  type={numSelected > 0 ? 'ok' : 'disabled'}
                  onPress={handleSelectCostItem}
                />
                {allCostItemsSpecified ? (
                  <ActionButton title={'Save'} type={'ok'} onPress={() => {}} />
                ) : (
                  <ActionButton
                    title={'Cost Items must be specified'}
                    type={'disabled'}
                    textStyle={styles.unspecifiedFg}
                    style={styles.unspecifiedBg}
                    onPress={() => {}}
                  />
                )}
              </>
            ) : (
              <>
                <Text>SORRY, AI could not process the receipt! You can always manually add line items.</Text>
              </>
            )}
          </View>
        )}
      </View>
      {showCostItemPicker && (
        <CostItemPickerModal
          isVisible={showCostItemPicker}
          onClose={() => setShowCostItemPicker(false)}
          projectId={projectId}
          handleCostItemOptionSelected={onCostItemOptionSelected}
        />
      )}
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
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unspecifiedBg: {
    backgroundColor: '#F44336',
  },
  unspecifiedFg: {
    color: '#FFF',
  },
  label: {
    textAlign: 'right',
    width: 70,
    marginRight: 5,
  },
});
