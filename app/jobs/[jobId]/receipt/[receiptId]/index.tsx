import { ReceiptSummary } from '@/components/ReceiptSummary';
import { TextField } from '@/components/TextField';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { useReceiptDataStore } from '@/stores/receiptDataStore';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { ReceiptBucketData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, LayoutChangeEvent, Platform, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';
import { ActionButton } from '@/components/ActionButton';
import { useItemizedReceiptDataStore } from '@/stores/itemizedReceiptDataStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';

const ReceiptDetailsPage = () => {
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const { allJobReceipts } = useReceiptDataStore();
  const { allReceiptItems, setReceiptItems } = useItemizedReceiptDataStore();
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
  const [itemsTotalCost, setItemsTotalCost] = useState(0);
  const router = useRouter();
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
  }, [fetchReceipt]);

  const fetchItemizedReceipts = useCallback(async () => {
    try {
      const receiptItems = [
        {
          label: 'Nails',
          amount: 103.85,
          _id: '1',
          receiptId: '1',
          category: 'Hardware',
          subCategory: 'Nails',
        },
        {
          label: "3 - 500' rolls of silt fencing",
          amount: 223.0,
          _id: '3',
          receiptId: '1',
        },
        {
          label: "5 - 20' 20in PVC pipe",
          amount: 223.0,
          _id: '4',
          receiptId: '1',
        },
        {
          label: "5 - 100' Roofing Felt",
          amount: 185.0,
          _id: '5',
          receiptId: '1',
        },
        {
          label: "5 - 100' Roofing Felt",
          amount: 185.0,
          _id: '6',
          receiptId: '1',
        },
        {
          label: '10# 2.5in Deck Screws',
          amount: 48.75,
          _id: '7',
          receiptId: '1',
          category: 'Hardware',
          subCategory: 'Screws',
        },
      ];

      setReceiptItems(receiptItems);
    } catch (err) {
      alert(`An error occurred while fetching the receipt with _id=${receiptId}`);
      console.log('An error occurred while fetching the receipt', err);
    }
  }, [receiptId, jobDbHost, allJobReceipts]);

  useEffect(() => {
    fetchItemizedReceipts();
  }, [fetchItemizedReceipts]);

  useEffect(() => {
    setItemsTotalCost(allReceiptItems.reduce((acc, item) => acc + item.amount, 0));
  }, [allReceiptItems]);

  const showPicture = useCallback(
    (uri: string) => {
      router.push(`/jobs/${receipt.JobId}/receipt/${receiptId}/showImage/?uri=${uri}`);
    },
    [receipt, receiptId],
  );

  const editDetails = useCallback(
    (item: ReceiptBucketData) => {
      router.push(`/jobs/${receipt.JobId}/receipt/${receiptId}/edit`);
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
    console.log(`addLineItem - route = /jobs/${receipt.JobId}/receipt/${receiptId}/addLineItem`);
    router.push(`/jobs/${receipt.JobId}/receipt/${receiptId}/addLineItem`);
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
                    {item.category && item.subCategory ? (
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
