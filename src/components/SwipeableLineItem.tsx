import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import { useAllRows as useAllRowsConfiguration } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  useAllRows,
  useDeleteRowCallback,
  useTableValue,
  useTypedRow,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

const RIGHT_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD_WIDTH = 50;

const SwipeableLineItem = ({ lineItem, projectId }: { lineItem: WorkItemCostEntry; projectId: string }) => {
  const processDelete = useDeleteRowCallback(projectId, 'workItemCostEntries');
  const allLineItems = useAllRows(projectId, 'workItemCostEntries');
  const parentReceipt = useTypedRow(projectId, 'receipts', lineItem.parentId);
  const allWorkItems = useAllRowsConfiguration('workItems');

  const router = useRouter();
  const colors = useColors();
  const handleDelete = useCallback(
    (itemId: string) => {
      const isReceiptLine = lineItem.documentationType === 'receipt';
      const isQbSyncedReceipt = !!parentReceipt?.purchaseId;
      const isCrossProjectLineItem = !!lineItem.projectId && lineItem.projectId !== projectId;

      if (isReceiptLine && isQbSyncedReceipt && isCrossProjectLineItem) {
        Alert.alert(
          'Delete Not Allowed',
          'This line item belongs to another project and is synced to QuickBooks. Open that project to edit or delete it.',
        );
        return;
      }

      if (isReceiptLine && isQbSyncedReceipt) {
        const currentProjectLineItemCount = allLineItems.filter(
          (item) =>
            item.parentId === lineItem.parentId &&
            item.documentationType === 'receipt' &&
            (!item.projectId || item.projectId === projectId),
        ).length;

        const isCurrentProjectLineItem = !lineItem.projectId || lineItem.projectId === projectId;
        if (isCurrentProjectLineItem && currentProjectLineItemCount <= 1) {
          Alert.alert(
            'Delete Not Allowed',
            'At least one line item for this project must remain on a QuickBooks-synced receipt.',
          );
          return;
        }
      }

      Alert.alert(
        'Delete Cost Line Item',
        'Are you sure you want to delete this line item?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId) }],
        { cancelable: true },
      );
    },
    [allLineItems, lineItem, parentReceipt?.purchaseId, processDelete, projectId],
  );

  const RightAction = () => {
    return (
      <Pressable
        style={styles.rightAction}
        onPress={() => {
          handleDelete(lineItem.id);
        }}
      >
        <MaterialIcons name="delete" size={24} color="white" />
      </Pressable>
    );
  };

  const label = useTableValue(projectId, 'workItemCostEntries', lineItem.id, 'label');
  const amount = useTableValue(projectId, 'workItemCostEntries', lineItem.id, 'amount');
  const isValidWorkItemId = allWorkItems.find((item) => item.id === lineItem.workItemId) !== undefined;
  const textColor = !lineItem.projectId || lineItem.projectId === projectId ? colors.text : colors.textMuted;
  const iconColor =
    !lineItem.projectId || lineItem.projectId === projectId ? colors.iconColor : colors.textMuted;
  const isInvoice = lineItem.documentationType === 'invoice';
  return (
    <SwipeableComponent
      key={lineItem.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
      renderRightActions={RightAction}
    >
      <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() =>
            isInvoice
              ? router.push({
                  pathname: '/[projectId]/invoice/[invoiceId]/[lineItemId]',
                  params: { projectId, invoiceId: lineItem.parentId, lineItemId: lineItem.id },
                })
              : router.push({
                  pathname: '/[projectId]/receipt/[receiptId]/[lineItemId]',
                  params: { projectId, receiptId: lineItem.parentId, lineItemId: lineItem.id },
                })
          }
        >
          <View style={styles.itemInfo}>
            <Text
              style={[styles.itemAmount, { color: textColor }]}
              text={formatCurrency(amount, true, true)}
            />
            <Text style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
              {label}
            </Text>
            {lineItem.workItemId && isValidWorkItemId ? (
              <View
                style={{
                  width: 40,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                }}
              >
                <AntDesign style={{ marginRight: -12 }} name="check-circle" size={24} color={iconColor} />
              </View>
            ) : (
              <Feather name="chevrons-right" size={24} color={iconColor} />
            )}
          </View>
        </Pressable>
      </View>
    </SwipeableComponent>
  );
};

const styles = StyleSheet.create({
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 40,
  },
  itemEntry: {
    width: '100%',
    paddingHorizontal: 10,
  },
  itemName: {
    flex: 1,
    overflow: 'hidden',
    marginRight: 10,
  },
  itemAmount: {
    textAlign: 'right',
    width: 100,
    marginRight: 30,
  },
  rightAction: {
    width: 100,
    height: 40,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableLineItem;
