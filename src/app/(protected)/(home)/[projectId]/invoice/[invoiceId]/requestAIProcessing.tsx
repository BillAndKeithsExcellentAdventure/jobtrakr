import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/src/components/Themed';
import { useAuth } from '@clerk/clerk-expo';
import { formatCurrency, formatDate, replaceNonPrintable } from '@/src/utils/formatters';
import { ActionButton } from '@/src/components/ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import { AiLineItem } from '@/src/components/AiLineItem';
import { ReceiptItem, ReceiptItemFromAI, ReceiptSummary } from '@/src/models/types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import CostItemPickerModal from '@/src/components/CostItemPickerModal';
import { OptionEntry } from '@/src/components/OptionList';
import { ReceiptSummaryEditModal } from '@/src/components/ReceiptSummaryEditModal';
import {
  useAddRowCallback,
  useAllRows,
  useDeleteRowCallback,
  useTypedRow,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { forEach } from 'jszip';

const processAIProcessing = async (
  token: string,
  imageId: string,
  projectId: string,
  userId: string,
  organizationId: string,
) => {
  try {
    const invoiceImageData = {
      imageId: imageId,
      projectId: projectId,
      userId: userId,
      organizationId: organizationId,
    };
    console.log(' token:', token);
    console.log(' invoiceImageData:', invoiceImageData);
    const response = await fetch(
      'https://projecthoundbackend.keith-m-bertram.workers.dev/getInvoiceIntelligence',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceImageData),
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
    console.error('Error processing invoice:', error);
    throw error;
  }
};

const RequestAIProcessingPage = () => {
  const { projectId, imageId, invoiceId } = useLocalSearchParams<{
    projectId: string;
    imageId: string;
    invoiceId: string;
  }>();
  const auth = useAuth();
  const { userId, orgId } = auth;
  const [fetchingData, setFetchingData] = useState(true);
  const [showCostItemPicker, setShowCostItemPicker] = useState(false);
  const [invoiceSummary, setInvoiceSummary] = useState<ReceiptSummary>();
  const [aiItems, setAiItems] = useState<ReceiptItemFromAI[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<ReceiptItem[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const colors = useColors();
  const invoice = useTypedRow(projectId, 'invoices', invoiceId);
  const updateInvoice = useUpdateRowCallback(projectId, 'invoices');
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');

  // Simulated AI result for testing
  async function fetchSimulatedAIResult(returnSingleItem = false) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockResult_original = {
      status: 'Success',
      response: {
        MerchantName: { value: 'Home Depot' },
        TransactionDate: { value: '2025-06-06T10:30:00Z' },
        Total: { value: '165.86' },
        TotalTax: { value: '9.39' },
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
            TotalPrice: { value: '30.94' },
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

    const mockResult = {
      status: 'Success',
      response: {
        MerchantName: { value: 'Home Depot' },
        TransactionDate: { value: '2025-06-06T10:30:00Z' },
        Total: { value: '137.17' },
        TotalTax: { value: '9.26' },
        Items: [
          {
            Description: { value: '2x4x8 Premium Lumber' },
            TotalPrice: { value: '57.90' },
          },
          {
            Description: { value: 'Paint Brush Set' },
            TotalPrice: { value: '25.98' },
          },
          {
            Description: { value: 'Drywall Screws 1lb Box' },
            TotalPrice: { value: '6.59' },
          },
          {
            Description: { value: 'LED Light Fixture' },
            TotalPrice: { value: '32.95' },
          },
          {
            Description: { value: 'Plumbing Tape' },
            TotalPrice: { value: '4.49' },
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
      const invoiceItems = mockResult.response.Items.map((i: any) => ({
        description: i.Description.value,
        amount: Number.parseFloat(i.TotalPrice.value),
      }));
      if (returnSingleItem) setAiItems([invoiceItems[0]]);
      else setAiItems(invoiceItems);
    }

    setInvoiceSummary(summary);
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
        const invoiceItems = result.response.Items.map((i: any) => ({
          description: i.Description.value,
          amount: i.TotalPrice.value,
        }));
        setAiItems(invoiceItems);
      } else {
        setAiItems([
          {
            description: 'Not Specified',
            amount: summary.totalAmount - summary.totalTax,
          },
        ]);
      }

      setInvoiceSummary(summary);
    }

    setFetchingData(false);
  }

  useEffect(() => {
    //fetchSimulatedAIResult(); // Uncomment for testing with simulated data
    fetchAIResult();
  }, []);

  // Initial setup with all items taxable
  useEffect(() => {
    const initialized = aiItems.map((item) => ({ ...item, taxable: true, proratedTax: 0, isSelected: true }));
    if (invoiceSummary) {
      const withTax = recalculateProratedTax(initialized, invoiceSummary.totalTax);
      setInvoiceItems(withTax);
    }
  }, [aiItems, invoiceSummary]);

  // Recalculate proratedTax values
  const recalculateProratedTax = (items: ReceiptItem[], totalTax: number): ReceiptItem[] => {
    // Create map of indices for taxable items to preserve original positions
    const taxableItemIndices = items
      .map((item, index) => ({ index, item }))
      .filter(({ item }) => item.taxable);

    // If nothing is taxable or no tax, all proratedTax is zero
    if (taxableItemIndices.length === 0 || totalTax === 0) {
      return items.map((i) => ({ ...i, proratedTax: 0 }));
    }

    // Sort taxable items by amount descending
    const sortedTaxableIndices = [...taxableItemIndices].sort((a, b) => b.item.amount - a.item.amount);

    const totalAmount = sortedTaxableIndices.reduce((sum, { item }) => sum + item.amount, 0);

    // Initialize result array with all items having zero tax
    const result = items.map((item) => ({ ...item, proratedTax: 0 }));

    let remainingTax = totalTax;

    // Calculate prorated tax for all but the smallest amount
    sortedTaxableIndices.slice(0, -1).forEach(({ index, item }) => {
      const proportion = item.amount / totalAmount;
      const proratedTax = parseFloat((proportion * totalTax).toFixed(2));
      result[index].proratedTax = proratedTax;
      remainingTax -= proratedTax;
    });

    // Assign remaining tax to smallest amount
    const smallestItemIndex = sortedTaxableIndices[sortedTaxableIndices.length - 1].index;
    result[smallestItemIndex].proratedTax = parseFloat(remainingTax.toFixed(2));

    return result;
  };

  const toggleTaxable = (index: number) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index].taxable = !updatedItems[index].taxable;
    if (invoiceSummary) {
      const recalculated = recalculateProratedTax(updatedItems, invoiceSummary.totalTax);
      setInvoiceItems(recalculated);
    }
  };

  const toggleSelection = (index: number) => {
    const updatedItems = invoiceItems.map((item, i) => ({
      ...item,
      isSelected: i === index ? !item.isSelected : item.isSelected,
    }));
    setInvoiceItems(updatedItems);
  };

  const onSelectAll = useCallback(() => {
    const hasSelectedItems = invoiceItems.every((item) => item.isSelected);
    setInvoiceItems((prev) =>
      prev.map((item) => ({
        ...item,
        isSelected: !hasSelectedItems,
      })),
    );
  }, [invoiceItems]);

  const numSelected = useMemo(
    () => invoiceItems.reduce((sum, item) => sum + (item.isSelected ? 1 : 0), 0),
    [invoiceItems],
  );

  const allSelected = useMemo(
    () => numSelected === invoiceItems.length && invoiceItems.length > 0,
    [invoiceItems, numSelected],
  );

  const allCostItemsSpecified = useMemo(
    () => invoiceItems.every((item) => item.costWorkItem),
    [invoiceItems],
  );

  const someCostItemsSpecified = useMemo(
    () => invoiceItems.some((item) => item.costWorkItem),
    [invoiceItems],
  );

  const handleSelectCostItem = useCallback(() => {
    setShowCostItemPicker(true);
  }, []);

  const onCostItemOptionSelected = useCallback(
    (costItemEntry: OptionEntry | undefined) => {
      if (costItemEntry) {
        const label = costItemEntry.label;
        const workItemId = costItemEntry.value ?? '';

        const updatedItems = invoiceItems.map((item) => {
          if (item.isSelected) {
            return {
              ...item,
              costWorkItem: { label, workItemId },
              isSelected: false, // Deselect after assigning cost item
            };
          }
          return item;
        });

        // sort invoice items so all items with a null or undefined costWorkItem are at the top
        updatedItems.sort((a, b) => {
          if (a.costWorkItem && b.costWorkItem) return 0;
          if (a.costWorkItem) return 1;
          if (b.costWorkItem) return -1;
          return 0;
        });

        setInvoiceItems(updatedItems);
      }
      setShowCostItemPicker(false);
    },
    [invoiceItems],
  );

  // Handler for saving edited summary
  const handleSaveInvoiceSummary = (updatedSummary: {
    vendor: string;
    totalAmount: number;
    totalTax: number;
    receiptDate: number;
  }) => {
    setInvoiceSummary(updatedSummary);
  };

  const saveInvoiceProcessing = useCallback(() => {
    if (!invoiceSummary) return;

    // save invoice processing
    const updatedInvoice = {
      ...invoice,
      amount: invoiceSummary.totalAmount,
      invoiceDate: invoiceSummary.receiptDate,
      vendor: invoiceSummary.vendor,
    };
    // Proceed with saving cost items
    const invoiceResult = updateInvoice(invoiceId, updatedInvoice);
    if (invoiceResult.status !== 'Success') {
      alert('Error updating Invoice with summary info.');
      return;
    }

    invoiceItems.forEach((item) => {
      if (item.costWorkItem) {
        const newItemizedEntry: WorkItemCostEntry = {
          id: '',
          label: item.description,
          amount: item.amount + item.proratedTax,
          parentId: invoiceId,
          documentationType: 'invoice',
          workItemId: item.costWorkItem?.workItemId,
        };
        addLineItem(newItemizedEntry);
      }
    });

    router.back();
  }, [invoiceSummary, invoice, invoiceId, updateInvoice, invoiceItems, addLineItem]);

  const handleSaveInvoiceCostItems = useCallback(() => {
    if (!someCostItemsSpecified) {
      Alert.alert(
        'Cost Item Required',
        "At least one line item must have a Cost Item specified. Use the 'Set Cost Item for Selection' button to specify a cost item.",
      );
      return;
    }
    if (!allCostItemsSpecified) {
      Alert.alert(
        'Save Cost Items',
        'Line items that have Cost Item set to NOT SPECIFIED will not be saved for this invoice. Is this want you really want to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Save specified Cost Items',
            onPress: saveInvoiceProcessing,
          },
        ],
      );
    } else {
      saveInvoiceProcessing();
    }
  }, [someCostItemsSpecified, allCostItemsSpecified, saveInvoiceProcessing]);

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Process Invoice Image', headerShown: false, gestureEnabled: false }} />
      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        <Text txtSize="title" style={{ marginBottom: 10 }}>
          Invoice Photo Processing
        </Text>
        {fetchingData ? (
          <View style={{ width: '100%', gap: 20 }}>
            <ActivityIndicator size="large" />
            <Text txtSize="title">
              Working on extracting data from invoice image, this shouldn't take long.
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%', gap: 10, flex: 1, backgroundColor: colors.listBackground }}>
            {invoiceSummary ? (
              <>
                <Pressable onPress={() => setIsEditModalVisible(true)}>
                  <View
                    style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.border, padding: 5 }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.label}>Vendor:</Text>
                        <Text>{invoiceSummary.vendor}</Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.label}>Amount:</Text>
                        <Text>{invoiceSummary.totalAmount}</Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.label}>Tax:</Text>
                        <Text>{formatCurrency(invoiceSummary.totalTax, false, true)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.label}>Date:</Text>
                        <Text>{formatDate(invoiceSummary.receiptDate)}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
                    </View>
                  </View>
                </Pressable>

                {invoiceItems && (
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
                        data={invoiceItems}
                        keyExtractor={(_, index) => `${index}`}
                        renderItem={({ item, index }) => (
                          <AiLineItem
                            item={item}
                            index={index}
                            showTaxToggle={invoiceItems.length > 1}
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
                <ActionButton title={'Save'} type={'ok'} onPress={handleSaveInvoiceCostItems} />
              </>
            ) : (
              <>
                <Text>
                  SORRY, The invoice could not be processed automatically! You can always manually add line
                  items.
                </Text>
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
      {invoiceSummary && (
        <ReceiptSummaryEditModal
          isVisible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          receiptSummary={invoiceSummary}
          onSave={handleSaveInvoiceSummary}
        />
      )}
    </SafeAreaView>
  );
};

export default RequestAIProcessingPage;

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
  unspecifiedFg: {
    color: '#FFF',
  },
  label: {
    textAlign: 'right',
    width: 70,
    marginRight: 5,
  },
});
