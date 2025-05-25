import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';

import { useDeleteRowCallback } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { CostItemData } from './index';
import { SwipeableComponent } from '@/src/components/SwipeableComponent';

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
  sectionCode: string;
  projectId: string;
  item: CostItemData;
}

const areEqual = (prevProps: Props, nextProps: Props) => {
  return (
    prevProps.sectionCode === nextProps.sectionCode &&
    prevProps.projectId === nextProps.projectId &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.code === nextProps.item.code &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.bidAmount === nextProps.item.bidAmount &&
    prevProps.item.spentAmount === nextProps.item.spentAmount
  );
};

const SwipeableCostSummary = React.memo(({ item, sectionCode, projectId }: Props) => {
  const router = useRouter();
  const removeCostItemSummary = useDeleteRowCallback(projectId, 'workItemSummaries');
  const colors = useColors();

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Cost Summary',
      'Are you sure you want to delete this cost item summary?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: () => {
            const result = removeCostItemSummary(item.id);
            if (result.status !== 'Success') {
              alert(`Unable to remove item with id=${item.id}. ${result.msg}`);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [removeCostItemSummary, item.id]);

  // use useMemo instead of useCallback to avoid swipeable showing a blank area
  const renderRightActions = useMemo(() => {
    if (item.bidAmount > 0 || item.spentAmount > 0) return undefined;
    return () => <RightAction onDelete={handleDelete} />;
  }, [handleDelete, item.id, item.bidAmount, item.spentAmount]);

  return (
    <SwipeableComponent
      key={item.id}
      renderRightActions={renderRightActions}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
    >
      <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/[projectId]/[costSummaryItemId]',
              params: {
                projectId,
                costSummaryItemId: item.id,
                sectionCode,
                itemCode: item.code,
                itemTitle: item.title,
              },
            });
          }}
        >
          <View style={styles.itemInfo}>
            <Text
              style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}
              text={`${sectionCode}.${item.code} ${item.title}`}
              numberOfLines={1}
            />
            <Text
              style={{ width: 100, textAlign: 'right', overflow: 'hidden' }}
              text={formatCurrency(item.bidAmount, false, true)}
            />
            <Text
              style={{ width: 100, textAlign: 'right', overflow: 'hidden' }}
              text={formatCurrency(item.spentAmount, false, true)}
            />
            <View style={{ width: 30, paddingLeft: 5, alignItems: 'center' }}>
              <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
            </View>
          </View>
        </Pressable>
      </View>
    </SwipeableComponent>
  );
}, areEqual);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: ITEM_HEIGHT,
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemName: {
    marginRight: 10,
  },
  itemEntry: {
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

export default SwipeableCostSummary;
