import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';

import { ChangeOrder, useDeleteRowCallback } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { ProposedChangeOrderItem } from '@/src/models/types';

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
  item: ProposedChangeOrderItem;
  removeItem: (item: ProposedChangeOrderItem) => void;
}

const SwipeableChangeOrderItem = React.memo(({ item, removeItem }: Props) => {
  const colors = useColors();

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Change Order Item',
      'Are you sure you want to delete this cost item summary?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: () => {
            removeItem(item);
          },
        },
      ],
      { cancelable: true },
    );
  }, [removeItem, item]);

  // use useMemo instead of useCallback to avoid swipeable showing a blank area
  const renderRightActions = useMemo(() => {
    return () => <RightAction onDelete={handleDelete} />;
  }, [handleDelete]);

  return (
    <SwipeableComponent
      renderRightActions={renderRightActions}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
    >
      <View style={styles.itemEntry}>
        <View style={styles.itemInfo}>
          <Text
            style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}
            text={item.label}
            numberOfLines={1}
          />
          <View style={{ width: 130, flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{ width: 100, textAlign: 'right', overflow: 'hidden' }}
              text={formatCurrency(item.amount, false, true)}
            />
            <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
              <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
            </View>
          </View>
        </View>
      </View>
    </SwipeableComponent>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  itemName: {
    marginRight: 10,
  },
  rightAction: {
    width: RIGHT_ACTION_WIDTH,
    height: ITEM_HEIGHT,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableChangeOrderItem;
