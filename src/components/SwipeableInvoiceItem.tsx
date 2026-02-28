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
  ClassifiedInvoiceData,
  useAllRows,
  useDeleteRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { useRouter } from 'expo-router';
import { useDeleteMediaCallback, deleteLocalMediaFile } from '../utils/images';
import { useAllMediaToUpload, useUploadSyncStore } from '@/src/tbStores/UploadSyncStore';
import { SvgImage } from './SvgImage';
import { useNetwork } from '../context/NetworkContext';
import { deleteBillFromQuickBooks } from '../utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';

export const ITEM_HEIGHT = 100;
const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(({ onDelete }: { onDelete: () => void }) => (
  <Pressable onPress={onDelete} style={styles.rightAction}>
    <MaterialIcons name="delete" size={32} color="white" />
  </Pressable>
));
RightAction.displayName = 'RightAction';

const SwipeableInvoiceItem = React.memo<{
  projectId: string;
  item: ClassifiedInvoiceData;
}>(({ projectId, item }) => {
  const router = useRouter();
  const colors = useColors();
  const { userId, orgId, getToken } = useAuth();
  const deleteInvoice = useDeleteRowCallback(projectId, 'invoices');
  const deleteInvoiceLineItem = useDeleteRowCallback(projectId, 'workItemCostEntries');
  const allInvoiceLineItems = useAllRows(projectId, 'workItemCostEntries');
  const deleteMediaCallback = useDeleteMediaCallback();
  const mediaToUpload = useAllMediaToUpload();
  const store = useUploadSyncStore();
  const { isConnectedToQuickBooks } = useNetwork();
  const textColor = item.fullyClassified ? colors.text : colors.errorText;
  const isPaid = item.paymentStatus === 'paid';
  const allInvoiceItems = useMemo(
    () => allInvoiceLineItems.filter((lineItem) => lineItem.parentId === item.id),
    [allInvoiceLineItems, item.id],
  );

  const totalOfAllInvoiceItems = useMemo(
    () => allInvoiceItems.reduce((acc, lineItem) => acc + lineItem.amount, 0),
    [allInvoiceItems],
  );

  const totalOfAllInvoiceItemsFormatted = useMemo(
    () => formatCurrency(totalOfAllInvoiceItems, true, true),
    [totalOfAllInvoiceItems],
  );

  const removeInvoice = useCallback(
    (id: string | undefined) => {
      if (!id) return;
      // before deleting invoice, we should delete all line items associated with it
      allInvoiceItems.forEach((lineItem) => {
        console.log('Deleting invoice line item with id:', lineItem.id);
        deleteInvoiceLineItem(lineItem.id);
      });
      // now delete the invoice itself
      console.log('Deleting invoice with id:', id);
      deleteInvoice(id);

      if (item.imageId && orgId) {
        // Check if this image is in the mediaToUpload queue
        const uploadInQueue = mediaToUpload.find((upload) => upload.itemId === item.imageId);
        if (uploadInQueue && store) {
          // Remove from mediaToUpload table since it never made it to the server
          console.log(`Removing invoice image ${item.imageId} from mediaToUpload queue`);
          store.delRow('mediaToUpload', uploadInQueue.id);
        } else {
          // Use the new hook to delete media (will queue if offline)
          (async () => {
            const result = await deleteMediaCallback(projectId, [item.imageId], 'invoice');
            if (!result.success) {
              console.error('Failed to delete invoice media:', result.msg);
            }
          })();
        }

        // Delete the local media file (invoices are always photos)
        (async () => {
          await deleteLocalMediaFile(orgId, projectId, item.imageId, 'photo', 'invoice');
        })();
      }

      if (item.billId && orgId && userId && isConnectedToQuickBooks) {
        deleteBillFromQuickBooks(orgId, userId, projectId, item.billId, getToken);
      }
    },
    [
      allInvoiceItems,
      deleteInvoice,
      deleteInvoiceLineItem,
      item.imageId,
      item.billId,
      projectId,
      orgId,
      userId,
      getToken,
      deleteMediaCallback,
      store,
      mediaToUpload,
      isConnectedToQuickBooks,
    ],
  );

  const handleDelete = useCallback(() => {
    const message =
      isConnectedToQuickBooks && item.billId
        ? 'This invoice is connected to QuickBooks. Are you sure you want to delete it and its association line items?'
        : 'Are you sure you want to delete this invoice and its association line items?';

    Alert.alert(
      'Delete Invoice',
      message,
      [{ text: 'Cancel' }, { text: 'Delete', onPress: () => removeInvoice(item.id) }],
      { cancelable: true },
    );
  }, [item.id, item.billId, isConnectedToQuickBooks, removeInvoice]);

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
              pathname: '/[projectId]/invoice/[invoiceId]',
              params: { projectId, invoiceId: item.id },
            })
          }
        >
          <View style={styles.itemInfo}>
            {item.amount === 0 && totalOfAllInvoiceItems === 0 && item.imageId ? (
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
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    {item.billId?.length > 0 && <SvgImage fileName="qb-logo" width={20} height={20} />}
                    {isPaid && <MaterialIcons name="paid" size={24} color={colors.buttonBlue} />}

                    {item.accountingId?.length > 0 && (
                      <Text style={{ color: textColor }}>{`${item.accountingId}`}</Text>
                    )}
                  </View>
                  <Text style={{ color: textColor }}>{formatCurrency(item.amount, true, true)}</Text>
                  <Text style={{ color: textColor }}>{item.vendor}</Text>
                  <Text style={{ color: textColor }}>Due: {formatDate(item.invoiceDate)}</Text>
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

SwipeableInvoiceItem.displayName = 'SwipeableInvoiceItem';

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

export default SwipeableInvoiceItem;
