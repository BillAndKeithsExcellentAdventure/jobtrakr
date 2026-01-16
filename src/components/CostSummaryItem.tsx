import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';

import { useDeleteRowCallback } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import { MaterialIcons, Feather, Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { CostItemData } from '../models/types';

const ITEM_HEIGHT = 65;
const RIGHT_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(({ onDelete }: { onDelete: () => void }) => {
  return (
    <Pressable onPress={onDelete} style={styles.rightAction}>
      <MaterialIcons name="delete" size={24} color="white" />
    </Pressable>
  );
});
RightAction.displayName = 'RightAction';

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
    prevProps.item.complete === nextProps.item.complete &&
    prevProps.item.bidAmount === nextProps.item.bidAmount &&
    prevProps.item.spentAmount === nextProps.item.spentAmount &&
    prevProps.item.balance === nextProps.item.balance
  );
};

const CostSummaryItem = React.memo<Props>(({ item, sectionCode, projectId }) => {
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
    const RenderRightActionsComponent = () => <RightAction onDelete={handleDelete} />;
    RenderRightActionsComponent.displayName = 'RenderRightActionsComponent';
    return RenderRightActionsComponent;
  }, [handleDelete, item.bidAmount, item.spentAmount]);

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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                width: '100%',
              }}
            >
              {item.complete && <FontAwesome name="check" size={20} color="#4CAF50" />}
              <Text
                style={{ fontWeight: '700', marginLeft: 10, textOverflow: 'ellipsis', overflow: 'hidden' }}
                text={`${sectionCode}.${item.code} ${item.title}`}
                numberOfLines={1}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 5,
                width: '100%',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                <Text
                  style={{ flex: 1, textAlign: 'right', overflow: 'hidden' }}
                  text={formatCurrency(item.bidAmount, false, true)}
                />
                <Text
                  style={{ flex: 1, textAlign: 'right', overflow: 'hidden' }}
                  text={formatCurrency(item.spentAmount, false, true)}
                />
                <Text
                  style={{ flex: 1, textAlign: 'right', overflow: 'hidden' }}
                  text={formatCurrency(item.balance, false, true)}
                />
              </View>
              <View style={{ paddingLeft: 5, alignItems: 'center', width: 32 }}>
                {item.bidAmount > 0 || item.spentAmount > 0 ? (
                  <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
                ) : (
                  <Feather name="chevrons-right" size={24} color={colors.iconColor} />
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    </SwipeableComponent>
  );
}, areEqual);
CostSummaryItem.displayName = 'CostSummaryItem';

const styles = StyleSheet.create({
  itemEntry: {
    width: '100%',
    justifyContent: 'center',
    height: ITEM_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemInfo: {
    width: '100%',
  },
  rightAction: {
    width: RIGHT_ACTION_WIDTH,
    height: ITEM_HEIGHT,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CostSummaryItem;
