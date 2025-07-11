import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import {
  WorkCategoryData,
  WorkItemData,
  useDeleteRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
const RIGHT_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD_WIDTH = 50;

const RightAction = React.memo(({ onDelete }: { onDelete: () => void }) => {
  return (
    <Pressable onPress={onDelete} style={[styles.rightAction, { width: RIGHT_ACTION_WIDTH }]}>
      <MaterialIcons name="delete" size={24} color="white" />
    </Pressable>
  );
});

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

  const renderRightActions = useCallback(() => {
    return <RightAction onDelete={() => handleDelete(item.id)} />;
  }, [handleDelete, item.id]);

  return (
    <SwipeableComponent
      key={item.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
      renderRightActions={renderRightActions}
    >
      <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/configuration/workcategory/[categoryId]/item/[itemId]',
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
    </SwipeableComponent>
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
    height: 40,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableCategoryItem;
