import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors, deleteBg } from '@/constants/Colors';
import { WorkCategoryData, WorkItemData } from '@/models/types';
import { useWorkCategoryDataStore } from '@/stores/categoryDataStore';
import { useCategoryValue, useDeleteCategoryCallback } from '@/tbStores/ConfigurationStore';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const SwipeableCategory = ({ category }: { category: WorkCategoryData }) => {
  const processDelete = useDeleteCategoryCallback(category._id!);

  const router = useRouter();
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

  const handleDelete = useCallback(
    (itemId: string) => {
      Alert.alert(
        'Delete Work Category',
        'Are you sure you want to delete this category?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete() }],
        { cancelable: true },
      );
    },
    [processDelete],
  );

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
          handleDelete(category._id!);
        }}
      >
        <Reanimated.View style={[styleAnimation, styles.rightAction]}>
          <MaterialIcons name="delete" size={24} color="white" />
        </Reanimated.View>
      </Pressable>
    );
  };

  const [name] = useCategoryValue(category._id, 'name');
  const [code] = useCategoryValue(category._id, 'code');

  return (
    <ReanimatedSwipeable
      key={category._id}
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
              pathname: '/jobs/configuration/workcategory/[categoryId]',
              params: { categoryId: category._id! },
            });
          }}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemCode} text={code} />
            <Text style={styles.itemName}>{name}</Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
          </View>
        </Pressable>
      </View>
    </ReanimatedSwipeable>
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

export default SwipeableCategory;
