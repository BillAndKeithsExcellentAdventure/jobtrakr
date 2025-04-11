import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors, deleteBg } from '@/constants/Colors';
import { WorkCategoryData, WorkItemData } from '@/models/types';
import { useWorkCategoryItemDataStore } from '@/stores/categoryItemDataStore';
import { useDelWorkItemCallback } from '@/tbStores/configurationStore/ConfigurationStore';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const SwipeableCategoryItem = ({ item, category }: { item: WorkItemData; category: WorkCategoryData }) => {
  const router = useRouter();
  const processDelete = useDelWorkItemCallback(item._id!);
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            listBackground: Colors.dark.listBackground,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            background: Colors.light.background,
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  const handleDelete = (itemId: string) => {
    Alert.alert(
      'Delete Work Item',
      'Are you sure you want to delete this item?',
      [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete() }],
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
          prog.value = 0;
          handleDelete(item._id!);
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
      key={item._id}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      renderRightActions={RightAction}
      overshootRight={false}
      enableContextMenu
    >
      <View style={[styles.itemEntry, { borderColor: colors.borderColor, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/jobs/configuration/workcategory/[categoryId]/item/[itemId]',
              params: { categoryId: category._id!, itemId: item._id! },
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
