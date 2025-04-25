import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors, deleteBg } from '@/constants/Colors';
import {
  WorkItemCostEntry,
  useDeleteRowCallback,
  useTableValue,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/utils/formatters';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const SwipeableLineItem = ({ lineItem, projectId }: { lineItem: WorkItemCostEntry; projectId: string }) => {
  const processDelete = useDeleteRowCallback(projectId, 'workItemCostEntries');
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
        'Delete Cost Line Item',
        'Are you sure you want to delete this line item?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId) }],
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
          handleDelete(lineItem.id);
        }}
      >
        <Reanimated.View style={[styleAnimation, styles.rightAction]}>
          <MaterialIcons name="delete" size={24} color="white" />
        </Reanimated.View>
      </Pressable>
    );
  };

  const label = useTableValue(projectId, 'workItemCostEntries', lineItem.id, 'label');
  const amount = useTableValue(projectId, 'workItemCostEntries', lineItem.id, 'amount');

  return (
    <ReanimatedSwipeable
      key={lineItem.id}
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
