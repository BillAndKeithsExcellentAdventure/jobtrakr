import { Text, View } from '@/components/Themed';
import { deleteBg } from '@/constants/Colors';
import { ColorSchemeColors, useColors } from '@/context/ColorsContext';

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { CostItemData } from './index';
import { useDeleteRowCallback } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/utils/formatters';

const SwipeableCostSummary = ({
  item,
  sectionId,
  sectionCode,
  projectId,
}: {
  item: CostItemData;
  sectionId: string;
  sectionCode: string;
  projectId: string;
}) => {
  const router = useRouter();
  const removeCostItemSummary = useDeleteRowCallback(projectId, 'workItemSummaries');
  const colors = useColors();

  const handleDelete = (itemId: string) => {
    Alert.alert(
      'Delete Cost Summary',
      'Are you sure you want to delete this cost item summary?',
      [{ text: 'Cancel' }, { text: 'Delete', onPress: () => removeCostItemSummary(itemId) }],
      { cancelable: true },
    );
  };

  const RightAction = (prog: SharedValue<number>, drag: SharedValue<number>) => {
    const styleAnimation = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: drag.value + 100 }],
      };
    });

    return (
      <Pressable
        onPress={() => {
          handleDelete(item.id);
        }}
      >
        <Reanimated.View style={[styleAnimation, styles.rightAction]}>
          <MaterialIcons name="delete" size={24} color="white" />
        </Reanimated.View>
      </Pressable>
    );
  };

  return (
    <ReanimatedSwipeable
      key={item.id}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      renderRightActions={RightAction}
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
              text={`${sectionCode}.${item.code} - ${item.title}`}
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
            <View style={{ width: 41, paddingLeft: 5, alignItems: 'center' }}>
              <MaterialIcons name="chevron-right" size={28} color={colors.iconColor} />
            </View>
          </View>
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 40,
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemName: {
    marginRight: 10,
  },
  itemEntry: {
    width: '100%',
    paddingHorizontal: 10,
  },
  rightAction: {
    width: 100,
    height: 40,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableCostSummary;
