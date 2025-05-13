import { Text, View } from '@/components/Themed';
import { deleteBg } from '@/constants/Colors';
import { useColors } from '@/context/ColorsContext';
import {
  WorkCategoryData,
  WorkItemData,
  useDeleteRowCallback,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const RightAction = React.memo(
  ({
    onDelete,
    prog,
    drag,
  }: {
    onDelete: () => void;
    prog: SharedValue<number>;
    drag: SharedValue<number>;
  }) => {
    const styleAnimation = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: drag.value + 100 }],
      };
    });

    return (
      <Pressable onPress={onDelete}>
        <Reanimated.View style={[styleAnimation, styles.rightAction]}>
          <MaterialIcons name="delete" size={24} color="white" />
        </Reanimated.View>
      </Pressable>
    );
  },
);

const SwipeableCategoryItem = ({ item, category }: { item: WorkItemData; category: WorkCategoryData }) => {
  const router = useRouter();
  const processDelete = useDeleteRowCallback('workItems');
  const colors = useColors();

  const handleDelete = useCallback(
    (itemId: string) => {
      Alert.alert(
        'Delete Work Item',
        'Are you sure you want to delete this item?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId) }],
        { cancelable: true },
      );
    },
    [processDelete],
  );

  const renderRightActions = useCallback(
    (prog: SharedValue<number>, drag: SharedValue<number>) => {
      return <RightAction onDelete={() => handleDelete(item.id)} prog={prog} drag={drag} />;
    },
    [handleDelete, item.id],
  );

  return (
    <ReanimatedSwipeable
      key={item.id}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      renderRightActions={renderRightActions}
      overshootRight={false}
      enableContextMenu
    >
      <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/projects/configuration/workcategory/[categoryId]/item/[itemId]',
              params: { categoryId: category.id, itemId: item.id },
            });
          }}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemCode} text={`${category.code}.${item.code}`} />
            <Text numberOfLines={1} style={styles.itemName}>
              {item.name}
            </Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
          </View>
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
};

const styles = StyleSheet.create({
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 40,
  },
  itemName: {
    flex: 1,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    marginRight: 10,
  },
  itemEntry: {
    width: '100%',
  },
  itemCode: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    width: 100,
  },
  rightAction: {
    width: 100,
    height: 40,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableCategoryItem;
