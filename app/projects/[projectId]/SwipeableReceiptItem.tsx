import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Text, View } from '@/components/Themed';
import { deleteBg } from '@/constants/Colors';
import { useColors } from '@/context/ColorsContext';
import Base64Image from '@/components/Base64Image';
import {
  ReceiptData,
  useAllRows,
  useDeleteRowCallback,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useRouter } from 'expo-router';

export const ITEM_HEIGHT = 100;

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
          deleteReceipt(id);
        }
      },
      [deleteReceipt],
    );

    const handleDelete = useCallback(() => {
      Alert.alert(
        'Delete Receipt',
        'Are you sure you want to delete this receipt?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => removeReceipt(item.id) }],
        { cancelable: true },
      );
    }, [item.id, removeReceipt]);

    const renderRightActions = useCallback(() => <RightAction onDelete={handleDelete} />, [handleDelete]);

    return (
      <ReanimatedSwipeable
        key={item.id}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={ITEM_HEIGHT}
        renderRightActions={renderRightActions}
        overshootRight={false}
        enableContextMenu
      >
        <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
          <Pressable onPress={() => router.push(`/projects/${projectId}/receipt/${item.id}`)}>
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
                  <View style={{ flex: 1, justifyContent: 'center' }}>
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
      </ReanimatedSwipeable>
    );
  },
);

const styles = StyleSheet.create({
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: ITEM_HEIGHT,
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemEntry: {
    width: '100%',
    paddingLeft: 10,
  },
  rightAction: {
    width: 100,
    height: ITEM_HEIGHT,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableReceiptItem;
