import { ReceiptSummary } from '@/components/ReceiptSummary';
import { TextField } from '@/components/TextField';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, LayoutChangeEvent, Platform, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';
import { ActionButton } from '@/components/ActionButton';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  ReceiptData,
  useAllRows,
  WorkItemCostEntry,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';

const ReceiptDetailsPage = () => {
  const defaultDate = new Date();
  const { jobId, receiptId } = useLocalSearchParams<{ jobId: string; receiptId: string }>();
  const allJobReceipts = useAllRows(jobId, 'receipts');
  const allCostItems = useAllRows(jobId, 'workItemCostEntries');

  const [allReceiptItems, setReceiptItems] = useState<WorkItemCostEntry[]>([]);

  const [receipt, setReceipt] = useState<ReceiptData>({
    id: '',
    vendor: '',
    description: '',
    amount: 0,
    numLineItems: 0,
    thumbnail: '',
    receiptDate: defaultDate.getTime(),
    pictureDate: defaultDate.getTime(),
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

  const [itemsTotalCost, setItemsTotalCost] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setReceiptItems(allCostItems.filter((item) => item.parentId === receiptId));
  }, [allCostItems, receiptId]);

  useEffect(() => {
    setItemsTotalCost(allReceiptItems.reduce((acc, item) => acc + item.amount, 0));
  }, [allReceiptItems]);

  const showPicture = useCallback(
    (uri: string) => {
      router.push(`/jobs/${jobId}/receipt/${receiptId}/showImage/?uri=${uri}`);
    },
    [receipt, receiptId],
  );

  const editDetails = useCallback(
    (item: ReceiptData) => {
      router.push(`/jobs/${jobId}/receipt/${receiptId}/edit`);
    },
    [receipt, receiptId],
  );

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            separatorColor: Colors.dark.separatorColor,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            separatorColor: Colors.light.separatorColor,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  const addLineItem = useCallback(() => {
    console.log(`addLineItem - route = /jobs/${jobId}/receipt/${receiptId}/addLineItem`);
    router.push(`/jobs/${jobId}/receipt/${receiptId}/addLineItem`);
  }, [receipt, receiptId]);

  const requestAIProcessing = useCallback(() => {}, []);
  const [containerHeight, setContainerHeight] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  return (
    <SafeAreaView
      onLayout={onLayout}
      edges={['right', 'bottom', 'left']}
      style={{ flex: 1, overflowY: 'hidden' }}
    >
      <Stack.Screen options={{ title: 'Receipt Details', headerShown: true }} />
      {containerHeight > 0 && (
        <>
          <View style={[styles.itemContainer, { borderColor: colors.borderColor }]}>
            <ReceiptSummary item={receipt} onShowDetails={editDetails} onShowPicture={showPicture} />
          </View>

          <View style={styles.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <ActionButton
                style={styles.leftButton}
                onPress={addLineItem}
                type={'action'}
                title="Add Line Item"
              />
              <ActionButton
                style={styles.rightButton}
                onPress={requestAIProcessing}
                type={'action'}
                title="Load from Photo"
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                height: 40,
                alignItems: 'center',
                borderBottomColor: colors.separatorColor,
                borderBottomWidth: 2,
              }}
            >
              <Text
                style={{ width: 90, textAlign: 'center', fontWeight: '600' }}
                txtSize="standard"
                text="Amount"
              />
              <Text
                style={{ flex: 1, marginHorizontal: 20, textAlign: 'center', fontWeight: '600' }}
                txtSize="standard"
                text="Description"
              />
              <Text style={{ width: 40, fontWeight: '600' }} txtSize="standard" text="" />
            </View>

            <View style={{ maxHeight: containerHeight - 290 }}>
              <FlatList
                showsVerticalScrollIndicator={Platform.OS === 'web'}
                data={allReceiptItems}
                renderItem={({ item, index }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      width: '100%',
                      borderTopColor: colors.separatorColor,
                      borderTopWidth: 1,

                      minHeight: 40,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{ width: 90, textAlign: 'right' }}
                      txtSize="standard"
                      text={formatNumber(item.amount)}
                    />
                    <Text
                      style={{ flex: 1, marginHorizontal: 20, textAlign: 'left' }}
                      txtSize="xs"
                      text={item.label}
                    />
                    {item.workItemId ? (
                      <View
                        style={{
                          width: 40,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: 'transparent',
                        }}
                      >
                        <AntDesign name="checkcircleo" size={24} color={colors.iconColor} />
                      </View>
                    ) : (
                      <View
                        style={{
                          width: 40,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: 'transparent',
                        }}
                      >
                        <AntDesign name="questioncircleo" size={24} color={colors.iconColor} />
                      </View>
                    )}
                  </View>
                )}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                height: 40,
                alignItems: 'center',
                borderTopColor: colors.separatorColor,
                borderTopWidth: 2,
              }}
            >
              <Text
                style={{ width: 90, textAlign: 'right', fontWeight: '600' }}
                txtSize="standard"
                text={itemsTotalCost ? formatCurrency(itemsTotalCost, true, true) : '$0.00'}
              />
              <Text
                style={{ flex: 1, marginHorizontal: 10, textAlign: 'center', fontWeight: '600' }}
                txtSize="standard"
                text={`Total for ${allReceiptItems.length} line ${
                  allReceiptItems.length?.toString() === '1' ? 'item' : 'items'
                }`}
              />
            </View>
          </View>
        </>
      )}
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
  itemContainer: {
    flexDirection: 'row',
    margin: 10,
    borderRadius: 15,
    padding: 10,
    height: 100,
  },

  amountColumn: {
    width: 90,
  },

  leftButton: {
    marginRight: 5,
    flex: 1,
  },
  rightButton: {
    flex: 1,
    marginLeft: 5,
  },
});
