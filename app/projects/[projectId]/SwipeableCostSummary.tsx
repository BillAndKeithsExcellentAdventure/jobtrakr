import { Text, View } from '@/components/Themed';
import { deleteBg } from '@/constants/Colors';
import { useColors } from '@/context/ColorsContext';

import { useDeleteRowCallback } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/utils/formatters';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { CostItemData } from './index';

const ITEM_HEIGHT = 45;

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
  allowSwipeDelete?: boolean;
  item: CostItemData;
}

const areEqual = (prevProps: Props, nextProps: Props) => {
  return (
    prevProps.sectionCode === nextProps.sectionCode &&
    prevProps.projectId === nextProps.projectId &&
    prevProps.allowSwipeDelete === nextProps.allowSwipeDelete &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.code === nextProps.item.code &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.bidAmount === nextProps.item.bidAmount &&
    prevProps.item.spentAmount === nextProps.item.spentAmount
  );
};

const SwipeableCostSummary = React.memo(
  ({ item, sectionCode, projectId, allowSwipeDelete = true }: Props) => {
    const router = useRouter();
    const removeCostItemSummary = useDeleteRowCallback(projectId, 'workItemSummaries');
    const colors = useColors();

    const handleDelete = useCallback(
      (itemId: string) => {
        Alert.alert(
          'Delete Cost Summary',
          'Are you sure you want to delete this cost item summary?',
          [{ text: 'Cancel' }, { text: 'Delete', onPress: () => removeCostItemSummary(itemId) }],
          { cancelable: true },
        );
      },
      [removeCostItemSummary],
    );

    const renderRightActions = useCallback(() => {
      if (item.bidAmount > 0 || item.spentAmount > 0) return null;
      return <RightAction onDelete={() => handleDelete(item.id)} />;
    }, [handleDelete, item.id, item.bidAmount, item.spentAmount]);

    if (allowSwipeDelete)
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
            <Pressable
              onPress={() => {
                router.push({
                  pathname: '/projects/[projectId]/[costSummaryItemId]',
                  params: {
                    projectId,
                    costSummaryItemId: item.id,
                    sectionCode,
                    itemCode: item.code,
                    itemTitle: item.title,
                    itemSpent: item.spentAmount,
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
        </ReanimatedSwipeable>
      );

    return (
      <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/projects/[projectId]/[costSummaryItemId]',
              params: {
                projectId,
                costSummaryItemId: item.id,
                sectionCode,
                itemCode: item.code,
                itemTitle: item.title,
                itemSpent: 0, // TODO item.spentAmount,
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
    );
  },
  areEqual,
);

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
    width: 100,
    height: ITEM_HEIGHT,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableCostSummary;
