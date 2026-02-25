import { ActionButton } from '@/src/components/ActionButton';
import { AiLineItem } from '@/src/components/AiLineItem';
import CostItemPickerModal from '@/src/components/CostItemPickerModal';
import { OptionEntry } from '@/src/components/OptionList';
import { ReceiptSummaryEditModal } from '@/src/components/ReceiptSummaryEditModal';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { Text, View } from '@/src/components/Themed';
import { API_BASE_URL } from '@/src/constants/app-constants';
import { useColors } from '@/src/context/ColorsContext';
import { ReceiptItem, ReceiptItemFromAI, ReceiptSummary } from '@/src/models/types';
import {
  useAddRowCallback,
  useTypedRow,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency, formatDate, replaceNonPrintable } from '@/src/utils/formatters';
import { createApiWithToken } from '@/src/utils/apiWithToken';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAllProjects } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';

const processAIProcessing = async (
  imageId: string,
  projectId: string,
  userId: string,
  organizationId: string,
  getToken: () => Promise<string | null>,
) => {
  try {
    const receiptImageData = {
      imageId: imageId,
      projectId: projectId,
      userId: userId,
      organizationId: organizationId,
    };
    //console.log(' receiptImageData:', receiptImageData);

    const apiFetch = createApiWithToken(getToken);
    const response = await apiFetch(`${API_BASE_URL}/getReceiptIntelligence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(receiptImageData),
    });

    const responseText = await response.text();
    try {
      const data = responseText ? JSON.parse(responseText) : null;
      return data;
    } catch (parseError) {
      console.error('Error parsing AI processing response:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw error;
  }
};

const RequestAIProcessingPage = () => {
  const { projectId, imageId, receiptId } = useLocalSearchParams<{
    projectId: string;
    imageId: string;
    receiptId: string;
  }>();
  const auth = useAuth();
  const { userId, orgId } = auth;
  const hasFetched = useRef(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [showCostItemPicker, setShowCostItemPicker] = useState(false);
  const [receiptSummary, setReceiptSummary] = useState<ReceiptSummary>();
  const [aiItems, setAiItems] = useState<ReceiptItemFromAI[]>([]);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const colors = useColors();
  const receipt = useTypedRow(projectId, 'receipts', receiptId);
  const updateReceipt = useUpdateRowCallback(projectId, 'receipts');
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const allProjects = useAllProjects();
  const projectPickerOptions = useMemo(
    () => allProjects.map((p) => ({ label: p.name, value: p.id })),
    [allProjects],
  );
  const defaultProjectOption = projectPickerOptions.find((option) => option.value === projectId);
  const [lineItemProjectOption, setLineItemProjectOption] = useState<OptionEntry | undefined>(
    defaultProjectOption,
  );

  useEffect(() => {
    if (defaultProjectOption) {
      setLineItemProjectOption(defaultProjectOption);
    }
  }, [defaultProjectOption]);

  const handleLineItemProjectChange = useCallback(
    (option: OptionEntry) => {
      const selectedProject = allProjects.find((p) => p.id === option.value);
      if (selectedProject) {
        setLineItemProjectOption(option);
      }
    },
    [allProjects, receiptId],
  );

  const fetchAIResult = useCallback(async () => {
    try {
      const result = await processAIProcessing(imageId, projectId, userId!, orgId!, auth.getToken);

      if (!result || result.status !== 'Success' || !result.response) {
        Alert.alert(
          'Processing Failed',
          `We could not extract data from this receipt. You can still add line items manually. Error message: ${result?.message || 'Unknown error'}`,
        );
        setReceiptSummary(undefined);
        setAiItems([]);
        return;
      }

      const summary = {
        vendor: replaceNonPrintable(result.response.MerchantName.value),
        receiptDate: Date.parse(result.response.TransactionDate.value),
        totalAmount: Number.parseFloat(result.response.Total.value),
        totalTax: Number.parseFloat(result.response.TotalTax.value),
      };

      if (Array.isArray(result.response.Items) && result.response.Items.length > 0) {
        const receiptItems = result.response.Items.map((i: any) => ({
          description: i.Description.value,
          amount: Number.parseFloat(i.TotalPrice.value),
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
    } catch (error) {
      console.error('Error fetching AI result:', error);
      Alert.alert(
        'Processing Failed',
        'We ran into a problem processing this receipt. You can still add line items manually.',
      );
      setReceiptSummary(undefined);
      setAiItems([]);
    } finally {
      setFetchingData(false);
    }
  }, [imageId, projectId, userId, orgId, auth.getToken]);

  useEffect(() => {
    // reset fetch flag when navigating to a different receipt image
    hasFetched.current = false;
    setFetchingData(true);
  }, [imageId, projectId]);

  useEffect(() => {
    if (hasFetched.current) return;
    if (!imageId || !projectId || !userId || !orgId) return;
    hasFetched.current = true;
    //fetchSimulatedAIResult(); // Uncomment for testing with simulated data
    fetchAIResult();
  }, [fetchAIResult, imageId, projectId, userId, orgId]);

  // Recalculate proratedTax values
  const recalculateProratedTax = useCallback((items: ReceiptItem[], totalTax: number): ReceiptItem[] => {
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
  }, []);

  // Initial setup with all items taxable
  useEffect(() => {
    const initialized = aiItems.map((item) => ({ ...item, taxable: true, proratedTax: 0, isSelected: true }));
    if (receiptSummary) {
      const withTax = recalculateProratedTax(initialized, receiptSummary.totalTax);
      setReceiptItems(withTax);
    }
  }, [aiItems, receiptSummary, recalculateProratedTax]);

  const toggleTaxable = useCallback(
    (index: number) => {
      setReceiptItems((prev) => {
        const updatedItems = prev.map((item, i) =>
          i === index ? { ...item, taxable: !item.taxable } : item,
        );
        if (!receiptSummary) return updatedItems;
        return recalculateProratedTax(updatedItems, receiptSummary.totalTax);
      });
    },
    [receiptSummary, recalculateProratedTax],
  );

  const toggleSelection = useCallback((index: number) => {
    setReceiptItems((prev) =>
      prev.map((item, i) => ({
        ...item,
        isSelected: i === index ? !item.isSelected : item.isSelected,
      })),
    );
  }, []);

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

  const someCostItemsSpecified = useMemo(
    () =>
      receiptItems.some((item) =>
        item.costWorkItem && item.costWorkItem.projectId ? item.costWorkItem.projectId === projectId : true,
      ),
    [receiptItems],
  );

  const handleSelectCostItem = useCallback(() => {
    setShowCostItemPicker(true);
  }, []);

  const onCostItemOptionSelected = useCallback(
    (costItemEntry: OptionEntry | undefined) => {
      if (costItemEntry) {
        const label = costItemEntry.label;
        const workItemId = costItemEntry.value ?? '';
        const projId = lineItemProjectOption ? lineItemProjectOption.value : projectId;

        const updatedItems = receiptItems.map((item) => {
          if (item.isSelected) {
            return {
              ...item,
              costWorkItem: { label, workItemId, projectId: projId },
              isSelected: false, // Deselect after assigning cost item
            };
          }
          return item;
        });

        // sort receipt items so all items with a null or undefined costWorkItem are at the top
        updatedItems.sort((a, b) => {
          if (a.costWorkItem && b.costWorkItem) return 0;
          if (a.costWorkItem) return 1;
          if (b.costWorkItem) return -1;
          return 0;
        });

        // select items that still need there Cost Item specified
        const selectedUpdatedItems = updatedItems.map((item) => {
          if (!item.costWorkItem) {
            return {
              ...item,
              isSelected: true,
            };
          }
          return item;
        });
        setReceiptItems(selectedUpdatedItems);
      }
      setShowCostItemPicker(false);
      setLineItemProjectOption(defaultProjectOption);
    },
    [receiptItems, lineItemProjectOption, projectId],
  );

  // Handler for saving edited summary
  const handleSaveReceiptSummary = (updatedSummary: {
    vendor: string;
    totalAmount: number;
    totalTax: number;
    receiptDate: number;
  }) => {
    setReceiptSummary(updatedSummary);
  };

  // Verify that receipt summary total matches line items total
  const verifyReceiptTotal = useCallback((): boolean => {
    if (!receiptSummary) return false;

    const lineItemsTotal = receiptItems.reduce((sum, item) => sum + item.amount + item.proratedTax, 0);
    const roundedLineItemsTotal = parseFloat(lineItemsTotal.toFixed(2));
    const roundedSummaryTotal = parseFloat(receiptSummary.totalAmount.toFixed(2));

    const isValid = roundedLineItemsTotal === roundedSummaryTotal;

    if (!isValid) {
      console.warn(
        `Receipt total mismatch: Summary total = ${roundedSummaryTotal}, Line items total = ${roundedLineItemsTotal}`,
      );
    }

    return isValid;
  }, [receiptSummary, receiptItems]);

  const saveReceiptProcessing = useCallback(() => {
    if (!receiptSummary) return;

    // Verify receipt total before saving
    if (!verifyReceiptTotal()) {
      Alert.alert(
        'Receipt Total Mismatch',
        'The sum of line items does not match the receipt total. Please review the amounts and tax allocation.',
      );
      return;
    }

    // save receipt processing
    const updatedReceipt = {
      ...receipt,
      amount: receiptSummary.totalAmount,
      receiptDate: receiptSummary.receiptDate,
      vendor: receiptSummary.vendor,
    };

    // Proceed with saving cost items
    const receiptResult = updateReceipt(receiptId, updatedReceipt);
    if (receiptResult.status !== 'Success') {
      alert('Error updating Receipt with summary info.');
      return;
    }

    receiptItems.forEach((item) => {
      const newItemizedEntry: WorkItemCostEntry = {
        id: '',
        label: item.description,
        amount: item.amount + item.proratedTax,
        parentId: receiptId,
        documentationType: 'receipt',
        workItemId: item.costWorkItem?.workItemId ?? '',
        projectId: item.costWorkItem?.projectId ?? projectId,
      };
      addLineItem(newItemizedEntry);
    });

    router.back();
  }, [receiptSummary, receipt, receiptId, updateReceipt, receiptItems, addLineItem, verifyReceiptTotal]);

  const handleSaveReceiptCostItems = useCallback(() => {
    if (!someCostItemsSpecified) {
      Alert.alert(
        'Cost Item Required',
        "At least one line item must have a Cost Item specified for the current project. Use the 'Set Cost Item for Selection' button to specify a cost item.",
      );
      return;
    }

    if (!allCostItemsSpecified) {
      Alert.alert(
        'Save Receipt?',
        'Line items that are not for the current project are on this receipt. Please confirm if this is what you really want to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Save Receipt',
            onPress: saveReceiptProcessing,
          },
        ],
      );
    } else {
      saveReceiptProcessing();
    }
  }, [someCostItemsSpecified, allCostItemsSpecified, saveReceiptProcessing]);

  const handleBackPress = useCallback(() => {
    if (fetchingData) return;
    if (!receiptSummary && aiItems.length === 0) {
      router.back();
      return;
    }

    Alert.alert(
      'Leave Without Saving?',
      'Are you sure you want to leave this page without saving your changes?',
      [
        { text: 'No, Stay', style: 'cancel' },
        {
          text: 'Yes, Leave',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    );
  }, [fetchingData]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Process Receipt Image',
          headerShown: true,
          gestureEnabled: false,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        {fetchingData ? (
          <View style={{ width: '100%', gap: 20, padding: 10, alignItems: 'center' }}>
            <ActivityIndicator size="large" />
            <Text txtSize="sub-title">
              Working on extracting data from receipt image, this should not take long.
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%', gap: 10, flex: 1, backgroundColor: colors.listBackground }}>
            {receiptSummary ? (
              <>
                <Pressable onPress={() => setIsEditModalVisible(true)}>
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
                            currentProjectId={projectId}
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
                <ActionButton title={'Save'} type={'ok'} onPress={handleSaveReceiptCostItems} />
              </>
            ) : (
              <>
                <Text>
                  SORRY, The receipt could not be processed automatically! You can always manually add line
                  items. Use the back button to return to the receipt details page and add line items
                  manually.
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
          showProjectPicker={true}
          handleProjectChange={handleLineItemProjectChange}
          selectedProjectPickerOption={lineItemProjectOption}
          allProjectPickerOptions={projectPickerOptions}
        />
      )}
      {receiptSummary && (
        <ReceiptSummaryEditModal
          isVisible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          receiptSummary={receiptSummary}
          onSave={handleSaveReceiptSummary}
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
