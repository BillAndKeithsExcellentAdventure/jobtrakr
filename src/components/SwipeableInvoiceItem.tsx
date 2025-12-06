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

export const ITEM_HEIGHT = 100;
const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(({ onDelete }: { onDelete: () => void }) => (
  <Pressable onPress={onDelete} style={styles.rightAction}>
    <MaterialIcons name="delete" size={32} color="white" />
  </Pressable>
));

const SwipeableInvoiceItem = React.memo(
  ({ orgId, projectId, item }: { orgId: string; projectId: string; item: ClassifiedInvoiceData }) => {
    const router = useRouter();
    const colors = useColors();
    const deleteInvoice = useDeleteRowCallback(projectId, 'invoices');
    const deleteInvoiceLineItem = useDeleteRowCallback(projectId, 'workItemCostEntries');
    const allInvoiceLineItems = useAllRows(projectId, 'workItemCostEntries');
    const textColor = item.fullyClassified ? colors.text : colors.errorText;

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
        if (id !== undefined) {
          // before deleting invoice, we should delete all line items associated with it
          allInvoiceItems.forEach((lineItem) => {
            console.log('Deleting invoice line item with id:', lineItem.id);
            deleteInvoiceLineItem(lineItem.id);
          });
          // now delete the invoice itself
          console.log('Deleting invoice with id:', id);
          deleteInvoice(id);
        }
      },
      [deleteInvoice, deleteInvoiceLineItem, allInvoiceItems],
    );

    const handleDelete = useCallback(() => {
      Alert.alert(
        'Delete Invoice',
        'Are you sure you want to delete this invoice and any of its association line items?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => removeInvoice(item.id) }],
        { cancelable: true },
      );
    }, [item.id, removeInvoice]);

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
                    <Text style={{ color: textColor }}>
                      Amount: {formatCurrency(item.amount, true, true)}
                    </Text>
                    <Text style={{ color: textColor }}>Vendor: {item.vendor}</Text>
                    <Text style={{ color: textColor }}>
                      # Items: {allInvoiceItems.length} / ({totalOfAllInvoiceItemsFormatted})
                    </Text>
                    <Text style={{ color: textColor }}>Date: {formatDate(item.invoiceDate)}</Text>
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

export default SwipeableInvoiceItem;
