import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import Base64Image from '@/src/components/Base64Image';
import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import {
  ReceiptData,
  useAllRows,
  useDeleteRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { useRouter } from 'expo-router';

export const ITEM_HEIGHT = 100;
const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(({ onDelete }: { onDelete: () => void }) => (
  <Pressable onPress={onDelete} style={styles.rightAction}>
    <MaterialIcons name="delete" size={32} color="white" />
  </Pressable>
));

const SwipeableReceiptItem = React.memo(
  ({ orgId, projectId, item }: { orgId: string; projectId: string; item: ReceiptData }) => {
    const router = useRouter();
    const colors = useColors();
    const deleteReceipt = useDeleteRowCallback(projectId, 'receipts');
    const deleteReceiptLineItem = useDeleteRowCallback(projectId, 'workItemCostEntries');
    const allReceiptLineItems = useAllRows(projectId, 'workItemCostEntries');

    const allReceiptItems = useMemo(
      () => allReceiptLineItems.filter((lineItem) => lineItem.parentId === item.id),
      [allReceiptLineItems, item.id],
    );

    const totalOfAllReceiptItems = useMemo(
      () => allReceiptItems.reduce((acc, lineItem) => acc + lineItem.amount, 0),
      [allReceiptItems],
    );

    const totalOfAllReceiptItemsFormatted = useMemo(
      () => formatCurrency(totalOfAllReceiptItems, true, true),
      [totalOfAllReceiptItems],
    );

    const removeReceipt = useCallback(
      (id: string | undefined) => {
        if (id !== undefined) {
          // before deleting receipt, we should delete all line items associated with it
          allReceiptItems.forEach((lineItem) => {
            console.log('Deleting receipt line item with id:', lineItem.id);
            deleteReceiptLineItem(lineItem.id);
          });
          // now delete the receipt itself
          console.log('Deleting receipt with id:', id);
          deleteReceipt(id);
        }
      },
      [deleteReceipt, deleteReceiptLineItem, allReceiptItems],
    );

    const handleDelete = useCallback(() => {
      Alert.alert(
        'Delete Receipt',
        'Are you sure you want to delete this receipt and any of its association line items?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => removeReceipt(item.id) }],
        { cancelable: true },
      );
    }, [item.id, removeReceipt]);

    const renderRightActions = useCallback(() => <RightAction onDelete={handleDelete} />, [handleDelete]);

    return (
      <SwipeableComponent
        key={item.id}
        threshold={SWIPE_THRESHOLD_WIDTH}
        actionWidth={RIGHT_ACTION_WIDTH}
        renderRightActions={renderRightActions}
      >
        <View style={[styles.itemEntry, { borderColor: colors.border }]}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/[projectId]/receipt/[receiptId]',
                params: { projectId, receiptId: item.id },
              })
            }
          >
            <View style={styles.itemInfo}>
              {item.amount === 0 && totalOfAllReceiptItems === 0 && item.imageId ? (
                <>
                  <Base64Image base64String={item.thumbnail} height={ITEM_HEIGHT - 20} width={120} />
                  <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
                    <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 10 }}>
                    <Text>Amount: {formatCurrency(item.amount, true, true)}</Text>
                    <Text>Vendor: {item.vendor}</Text>
                    <Text>
                      # Items: {allReceiptItems.length} / ({totalOfAllReceiptItemsFormatted})
                    </Text>
                    <Text>Date: {formatDate(item.receiptDate)}</Text>
                  </View>
                  <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
                    <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
                  </View>
                </>
              )}
            </View>
          </Pressable>
        </View>
      </SwipeableComponent>
    );
  },
);

const styles = StyleSheet.create({
  itemEntry: {
    width: '100%',
    height: ITEM_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  rightAction: {
    width: RIGHT_ACTION_WIDTH,
    height: ITEM_HEIGHT,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableReceiptItem;
