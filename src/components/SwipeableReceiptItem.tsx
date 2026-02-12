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
import { useAllRows as useAllConfigurationRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { useRouter } from 'expo-router';
import { useDeleteMediaCallback, deleteLocalMediaFile } from '../utils/images';
import { useAllMediaToUpload, useUploadSyncStore } from '@/src/tbStores/UploadSyncStore';
import { SvgImage } from './SvgImage';
//import { deletePurchaseFromQuickBooks } from '../utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';
import { deleteReceiptFromQuickBooks } from '../utils/quickbooksAPI';

export const ITEM_HEIGHT = 128;
const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(({ onDelete }: { onDelete: () => void }) => (
  <Pressable onPress={onDelete} style={styles.rightAction}>
    <MaterialIcons name="delete" size={32} color="white" />
  </Pressable>
));
RightAction.displayName = 'RightAction';

const SwipeableReceiptItem = React.memo<{
  orgId: string;
  projectId: string;
  item: ClassifiedReceiptData;
}>(({ orgId, projectId, item }) => {
  const router = useRouter();
  const colors = useColors();
  const deleteReceipt = useDeleteRowCallback(projectId, 'receipts');
  const deleteReceiptLineItem = useDeleteRowCallback(projectId, 'workItemCostEntries');
  const allReceiptLineItems = useAllRows(projectId, 'workItemCostEntries');
  const allAccounts = useAllConfigurationRows('accounts');
  const deleteMediaCallback = useDeleteMediaCallback();
  const mediaToUpload = useAllMediaToUpload();
  const store = useUploadSyncStore();
  const textColor = item.fullyClassified ? colors.text : colors.errorText;
  const allReceiptItems = useMemo(
    () => allReceiptLineItems.filter((lineItem) => lineItem.parentId === item.id),
    [allReceiptLineItems, item.id],
  );
  const { userId, getToken } = useAuth();
  const totalOfAllReceiptItems = useMemo(
    () => allReceiptItems.reduce((acc, lineItem) => acc + lineItem.amount, 0),
    [allReceiptItems],
  );

  const totalOfAllReceiptItemsFormatted = useMemo(
    () => formatCurrency(totalOfAllReceiptItems, true, true),
    [totalOfAllReceiptItems],
  );

  const paymentAccountName = useMemo(() => {
    if (!item.paymentAccountId) return '';
    return allAccounts.find((account) => account.accountingId === item.paymentAccountId)?.name ?? '';
  }, [allAccounts, item.paymentAccountId]);

  const paymentAccountLabel = useMemo(() => {
    if (item.notes) return `Check# ${item.notes}`;
    return paymentAccountName;
  }, [item.notes, paymentAccountName]);

  const removeReceipt = useCallback(
    async (id: string | undefined) => {
      if (id == undefined) return;
      try {
        // before deleting receipt, we should delete all line items associated with it
        allReceiptItems.forEach((lineItem) => {
          console.log('Deleting receipt line item with id:', lineItem.id);
          deleteReceiptLineItem(lineItem.id);
        });
      } catch (error) {
        console.error('Error deleting receipt line items:', error);
      }

      // now delete the receipt itself
      try {
        console.log('Deleting receipt with id:', id);
        deleteReceipt(id);
      } catch (error) {
        console.error('Error deleting receipt:', error);
      }

      // if receipt has purchaseId, we should also delete the purchase in QuickBooks using deletePurchaseFromQuickBooks
      if (item.purchaseId && userId) {
        try {
          console.log('Receipt has associated purchaseId:', item.purchaseId);
          const result = await deleteReceiptFromQuickBooks(
            orgId,
            userId,
            projectId,
            item.purchaseId,
            getToken,
          );
          if (!result.success) {
            console.error('Failed to delete associated purchase in QuickBooks:', result.message);
          } else {
            console.log('Successfully deleted associated purchase in QuickBooks');
          }
        } catch (error) {
          console.error('Error deleting associated purchase in QuickBooks:', error);
        }
      }

      if (item.imageId) {
        try {
          // Check if this image is in the mediaToUpload queue
          const uploadInQueue = mediaToUpload.find((upload) => upload.itemId === item.imageId);
          if (uploadInQueue && store) {
            // Remove from mediaToUpload table since it never made it to the server
            console.log(`Removing receipt image ${item.imageId} from mediaToUpload queue`);
            store.delRow('mediaToUpload', uploadInQueue.id);
          } else {
            // Use the new hook to delete media (will queue if offline)
            const result = await deleteMediaCallback(projectId, [item.imageId], 'receipt');
            if (!result.success) {
              console.error('Failed to delete receipt media:', result.msg);
            }
          }

          // Delete the local media file (receipts are always photos)
          await deleteLocalMediaFile(orgId, projectId, item.imageId, 'photo', 'receipt');
        } catch (error) {
          console.error('Error deleting receipt image:', error);
        }
      }
    },
    [
      deleteReceipt,
      deleteReceiptLineItem,
      allReceiptItems,
      item.imageId,
      projectId,
      orgId,
      deleteMediaCallback,
      store,
      mediaToUpload,
    ],
  );

  const handleDelete = useCallback(() => {
    // if there is a purchaseId associated with the receipt, we should inform user that the receipt
    // will be deleted from QuickBooks as well.

    const alertMessage = item.purchaseId
      ? 'Are you sure you want to delete this receipt? This will also delete the associated purchase in QuickBooks.'
      : 'Are you sure you want to delete this receipt and any of its association line items?';

    Alert.alert(
      'Delete Receipt',
      alertMessage,
      [{ text: 'Cancel' }, { text: 'Delete', onPress: () => removeReceipt(item.id) }],
      { cancelable: true },
    );
  }, [item.id, removeReceipt, item.purchaseId]);

  const renderRightActions = useCallback(() => <RightAction onDelete={handleDelete} />, [handleDelete]);
  const photoDate = formatDate(item.pictureDate, undefined, true);
  return (
    <SwipeableComponent
      key={item.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
      renderRightActions={renderRightActions}
    >
      <View style={[styles.itemEntry, { borderColor: colors.separatorColor }]}>
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
                <View
                  style={{
                    flex: 1,
                    alignItems: item.description ? 'flex-start' : 'center',
                    paddingLeft: item.description ? 10 : 0,
                  }}
                >
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ alignItems: 'center' }}>
                      <Base64Image base64String={item.thumbnail} height={ITEM_HEIGHT - 20} width={150} />
                      <View style={{ width: 150 }}>
                        <Text style={styles.dateOverlay}>{photoDate}</Text>
                      </View>
                    </View>
                    <View style={{ paddingLeft: 10, justifyContent: 'center' }}>
                      {item.description && <Text text={`${item.description}`} />}
                    </View>
                  </View>
                </View>
                <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
                  <Feather name="chevrons-right" size={24} color={colors.iconColor} />
                </View>
              </>
            ) : (
              <>
                <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 20 }}>
                    {item.purchaseId?.length > 0 && <SvgImage fileName="qb-logo" width={20} height={20} />}
                    {item.accountingId?.length > 0 && (
                      <Text style={{ color: textColor }}>{`${item.accountingId}`}</Text>
                    )}
                  </View>
                  <Text numberOfLines={1} style={{ color: textColor }}>
                    {`${formatCurrency(item.amount, true, true)}${
                      paymentAccountLabel ? ` - ${paymentAccountLabel}` : ''
                    }`}
                  </Text>
                  <Text numberOfLines={1} style={{ color: textColor }}>
                    {item.vendor}
                  </Text>
                  <Text style={{ color: textColor }}>{item.description}</Text>
                  <Text style={{ color: textColor }}>{formatDate(item.receiptDate)}</Text>
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
});
SwipeableReceiptItem.displayName = 'SwipeableReceiptItem';

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
