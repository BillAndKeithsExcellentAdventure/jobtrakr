import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';

import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import {
  ChangeOrder,
  useAllRows,
  useDeleteRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import { AntDesign, Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

const ITEM_HEIGHT = 45;
const RIGHT_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(({ onDelete }: { onDelete: () => void }) => {
  return (
    <Pressable onPress={onDelete} style={styles.rightAction}>
      <MaterialIcons name="delete" size={24} color="white" />
    </Pressable>
  );
});

interface Props {
  projectId: string;
  item: ChangeOrder;
}

const SwipeableChangeOrder = React.memo(({ item, projectId }: Props) => {
  const router = useRouter();
  const removeChangeOrder = useDeleteRowCallback(projectId, 'changeOrders');
  const deleteLineItem = useDeleteRowCallback(projectId, 'changeOrderItems');
  const allChangeOrderItems = useAllRows(projectId, 'changeOrderItems');
  const colors = useColors();

  const changeOrderItems = useMemo(
    () => allChangeOrderItems.filter((lineItem) => lineItem.changeOrderId === item.id),
    [allChangeOrderItems, item.id],
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Change Order',
      'Are you sure you want to delete this cost item summary?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: () => {
            if (changeOrderItems && changeOrderItems.length > 0) {
              changeOrderItems.forEach((lineItem) => {
                console.log('Deleting receipt line item with id:', lineItem.id);
                deleteLineItem(lineItem.id);
              });
            }

            const result = removeChangeOrder(item.id);
            if (result.status !== 'Success') {
              alert(`Unable to remove item with id=${item.id}. ${result.msg}`);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [removeChangeOrder, item.id, changeOrderItems, deleteLineItem]);

  // use useMemo instead of useCallback to avoid swipeable showing a blank area
  const renderRightActions = useMemo(() => {
    if (item.status !== 'draft') return undefined;
    return () => <RightAction onDelete={handleDelete} />;
  }, [handleDelete, item.status]);

  return (
    <SwipeableComponent
      key={item.id}
      renderRightActions={renderRightActions}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
    >
      <View style={styles.itemEntry}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/[projectId]/changeOrder/[changeOrderId]',
              params: {
                projectId,
                changeOrderId: item.id,
              },
            });
          }}
        >
          <View style={styles.itemInfo}>
            {item.status === 'draft' && (
              <View style={{ width: 30, paddingRight: 5, alignItems: 'center' }}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={colors.iconColor} />
              </View>
            )}
            {item.status === 'approval-pending' && (
              <View style={{ width: 30, paddingRight: 5, alignItems: 'center' }}>
                <MaterialCommunityIcons name="glasses" size={24} color={colors.iconColor} />
              </View>
            )}
            {item.status === 'approved' && (
              <View style={{ width: 30, paddingRight: 5, alignItems: 'center' }}>
                <AntDesign name="check" size={24} color={colors.iconColor} />
              </View>
            )}
            {item.status === 'cancelled' && (
              <View style={{ width: 30, paddingRight: 5, alignItems: 'center' }}>
                <MaterialCommunityIcons name="cancel" size={24} color={colors.iconColor} />
              </View>
            )}

            <Text
              style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}
              text={item.title}
              numberOfLines={1}
            />
            <Text
              style={{ width: 100, textAlign: 'right', overflow: 'hidden' }}
              text={formatCurrency(item.bidAmount, false, true)}
            />

            <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
              <Feather name="chevrons-right" size={24} color={colors.iconColor} />
            </View>
          </View>
        </Pressable>
      </View>
    </SwipeableComponent>
  );
});

const styles = StyleSheet.create({
  itemEntry: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: ITEM_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingLeft: 10,
  },
  rightAction: {
    width: RIGHT_ACTION_WIDTH,
    height: ITEM_HEIGHT,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableChangeOrder;
