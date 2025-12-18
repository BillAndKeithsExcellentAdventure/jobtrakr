import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import Base64Image from '@/src/components/Base64Image';
import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import {
  ClassifiedReceiptData,
  useAllRows,
  useDeleteRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useDeleteMediaCallback } from '../utils/images';
import { useAllFailedToUpload } from '@/src/tbStores/UploadSyncStore';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { STORE_ID_PREFIX, TABLES_SCHEMA } from '@/src/tbStores/UploadSyncStore';
import { NoValuesSchema } from 'tinybase/with-schemas';

const { useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

const useStoreId = () => {
  const { userId } = useAuth();
  return `${STORE_ID_PREFIX}_${userId}`;
};

export const ITEM_HEIGHT = 100;
const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(({ onDelete }: { onDelete: () => void }) => (
  <Pressable onPress={onDelete} style={styles.rightAction}>
    <MaterialIcons name="delete" size={32} color="white" />
  </Pressable>
));

const SwipeableReceiptItem = React.memo(
  ({
    orgId,
    projectId,
    item,
  }: {
    orgId: string;
    projectId: string;
    item: ClassifiedReceiptData;
  }) => {
    const router = useRouter();
    const colors = useColors();
    const auth = useAuth();
    const deleteReceipt = useDeleteRowCallback(projectId, 'receipts');
    const deleteReceiptLineItem = useDeleteRowCallback(projectId, 'workItemCostEntries');
    const allReceiptLineItems = useAllRows(projectId, 'workItemCostEntries');
    const deleteMediaCallback = useDeleteMediaCallback();
    const failedUploads = useAllFailedToUpload();
    const store = useStore(useStoreId());
    const textColor = item.fullyClassified ? colors.text : colors.errorText;
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

          if (item.imageId) {
            // Check if this image is in the failedToUpload queue
            const uploadInQueue = failedUploads.find((upload) => upload.itemId === item.imageId);
            if (uploadInQueue && store) {
              // Remove from failedToUpload table since it never made it to the server
              console.log(`Removing receipt image ${item.imageId} from failedToUpload queue`);
              store.delRow('failedToUpload', uploadInQueue.id);
            } else {
              // Use the new hook to delete media (will queue if offline)
              (async () => {
                const result = await deleteMediaCallback(projectId, [item.imageId], 'receipt');
                if (!result.success) {
                  console.error('Failed to delete receipt media:', result.msg);
                }
              })();
            }
          }
        }
      },
      [
        deleteReceipt,
        deleteReceiptLineItem,
        allReceiptItems,
        item.imageId,
        projectId,
        deleteMediaCallback,
        failedUploads,
        store,
      ],
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
    const photoDate = formatDate(item.pictureDate, undefined, true);
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
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Base64Image base64String={item.thumbnail} height={ITEM_HEIGHT - 20} width={150} />
                    <View style={{ width: 150 }}>
                      <Text style={styles.dateOverlay}>{photoDate}</Text>
                    </View>
                  </View>
                  <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
                    <Feather name="chevrons-right" size={24} color={colors.iconColor} />
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 10 }}>
                    <Text style={{ color: textColor }}>
                      Amount: {formatCurrency(item.amount, true, true)}
                    </Text>
                    <Text style={{ color: textColor }}>Vendor: {item.vendor}</Text>
                    <Text style={{ color: textColor }}>
                      # Items: {allReceiptItems.length} / ({totalOfAllReceiptItemsFormatted})
                    </Text>
                    <Text style={{ color: textColor }}>Date: {formatDate(item.receiptDate)}</Text>
                  </View>
                  <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
                    <Feather name="chevrons-right" size={24} color={colors.iconColor} />
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
  dateOverlay: {
    position: 'absolute',
    bottom: -25, // Adjust as needed
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
});

export default SwipeableReceiptItem;
