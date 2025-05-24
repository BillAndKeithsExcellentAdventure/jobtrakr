import { ActionButton } from '@/components/ActionButton';
import { ReceiptSummary } from '@/components/ReceiptSummary';
import { Text, View } from '@/components/Themed';
import { useColors } from '@/context/ColorsContext';
import {
  ReceiptData,
  useAllRows,
  useCostUpdater,
  WorkItemCostEntry,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/utils/formatters';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, LayoutChangeEvent, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableLineItem from './SwipeableLineItem';
import { useAuth } from '@clerk/clerk-expo';

const ReceiptDetailsPage = () => {
  const defaultDate = new Date();
  const { projectId, receiptId } = useLocalSearchParams<{ projectId: string; receiptId: string }>();
  const allProjectReceipts = useAllRows(projectId, 'receipts');
  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  useCostUpdater(projectId);
  const auth = useAuth();
  const { orgId } = auth;

  const [allReceiptLineItems, setAllReceiptLineItems] = useState<WorkItemCostEntry[]>([]);

  useEffect(() => {
    const receipts = allCostItems.filter((item) => item.parentId === receiptId);
    setAllReceiptLineItems(receipts);
  }, [allCostItems, receiptId]);

  const [receipt, setReceipt] = useState<ReceiptData>({
    id: '',
    vendor: '',
    description: '',
    amount: 0,
    numLineItems: 0,
    thumbnail: '',
    receiptDate: defaultDate.getTime(),
    pictureDate: defaultDate.getTime(),
    imageId: '',
    notes: '',
    markedComplete: false,
  });

  useEffect(() => {
    const match = allProjectReceipts.find((r) => r.id === receiptId);
    if (match) {
      console.log('ReceiptDetailsPage - match:', match);
      setReceipt({ ...match });
    }
  }, [receiptId, allProjectReceipts]);

  const [itemsTotalCost, setItemsTotalCost] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setItemsTotalCost(allReceiptLineItems.reduce((acc, item) => acc + item.amount, 0));
  }, [allReceiptLineItems]);

  const showPicture = useCallback(
    (uri: string) => {
      router.push({
        pathname: '/projects/[projectId]/receipt/[receiptId]/showImage',
        params: {
          projectId,
          receiptId,
          uri,
        },
      });
    },
    [projectId, receiptId],
  );

  const editDetails = useCallback(
    (item: ReceiptData) => {
      router.push({
        pathname: '/projects/[projectId]/receipt/[receiptId]/edit',
        params: {
          projectId,
          receiptId,
        },
      });
    },
    [projectId, receiptId],
  );

  const colors = useColors();
  const addLineItem = useCallback(() => {
    router.push({
      pathname: '/projects/[projectId]/receipt/[receiptId]/addLineItem',
      params: {
        projectId,
        receiptId,
      },
    });
  }, [projectId, receiptId]);

  const requestAIProcessing = useCallback(() => {
    console.log(
      `requestAIProcessing - route = /projects/${projectId}/receipt/${receiptId}/requestAIProcessing?imageId=${receipt.imageId}`,
    );
    router.push({
      pathname: '/projects/[projectId]/receipt/[receiptId]/requestAIProcessing',
      params: {
        projectId,
        receiptId,
        imageId: receipt.imageId,
      },
    });
  }, [projectId, receiptId, receipt.imageId]);

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
          <View style={[styles.itemContainer, { borderColor: colors.border }]}>
            {orgId && (
              <ReceiptSummary
                orgId={orgId}
                projectId={projectId}
                item={receipt}
                onShowDetails={editDetails}
                onShowPicture={showPicture}
              />
            )}
          </View>

          <View style={styles.container}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}
            >
              <ActionButton
                style={styles.leftButton}
                onPress={addLineItem}
                type={'action'}
                title="Add Line Item"
              />
              {allReceiptLineItems.length === 0 && (
                <ActionButton
                  style={styles.rightButton}
                  onPress={requestAIProcessing}
                  type={'action'}
                  title="Load from Photo"
                />
              )}
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
                data={allReceiptLineItems}
                renderItem={({ item }) => <SwipeableLineItem lineItem={item} projectId={projectId} />}
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
                text={`Total for ${allReceiptLineItems.length} line ${
                  allReceiptLineItems.length?.toString() === '1' ? 'item' : 'items'
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
    flex: 1,
  },
  rightButton: {
    flex: 1,
  },
});
