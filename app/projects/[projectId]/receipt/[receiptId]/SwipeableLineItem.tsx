import { SwipeableComponent } from '@/components/SwipeableComponent';
import { Text, View } from '@/components/Themed';
import { deleteBg } from '@/constants/Colors';
import { useColors } from '@/context/ColorsContext';
import {
  WorkItemCostEntry,
  useDeleteRowCallback,
  useTableValue,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/utils/formatters';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

const RIGHT_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD_WIDTH = 50;

const SwipeableLineItem = ({ lineItem, projectId }: { lineItem: WorkItemCostEntry; projectId: string }) => {
  const processDelete = useDeleteRowCallback(projectId, 'workItemCostEntries');
  const router = useRouter();
  const colors = useColors();
  const handleDelete = useCallback(
    (itemId: string) => {
      Alert.alert(
        'Delete Cost Line Item',
        'Are you sure you want to delete this line item?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId) }],
        { cancelable: true },
      );
    },
    [processDelete],
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

  return (
    <SwipeableComponent
      key={lineItem.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
      renderRightActions={RightAction}
    >
      <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/projects/[projectId]/receipt/[receiptId]/[lineItemId]',
              params: { projectId, receiptId: lineItem.parentId, lineItemId: lineItem.id },
            });
          }}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemAmount} text={formatCurrency(amount, true, true)} />
            <Text style={styles.itemName}>{label}</Text>
            {lineItem.workItemId ? (
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
              <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
            )}
          </View>
        </Pressable>
      </View>
    </SwipeableComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
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
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    marginRight: 10,
  },

  itemAmount: {
    textAlign: 'right',
    width: 80,
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
