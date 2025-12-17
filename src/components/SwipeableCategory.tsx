import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import {
  useDeleteRowCallback,
  useTableValue,
  WorkCategoryData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
const RIGHT_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD_WIDTH = 50;
const SwipeableCategory = ({
  category,
  allowDelete,
}: {
  category: WorkCategoryData;
  allowDelete: boolean;
}) => {
  const processDelete = useDeleteRowCallback('categories');
  const router = useRouter();
  const colors = useColors();

  const handleDelete = useCallback(
    (itemId: string) => {
      Alert.alert(
        'Delete Cost Category',
        'Are you sure you want to delete this category?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId, allowDelete) }],
        { cancelable: true },
      );
    },
    [processDelete, allowDelete],
  );

  const RightAction = () => {
    return (
      <Pressable
        style={[styles.rightAction, { width: RIGHT_ACTION_WIDTH }]}
        onPress={() => {
          handleDelete(category.id);
        }}
      >
        <MaterialIcons name="delete" size={24} color="white" />
      </Pressable>
    );
  };

  const name = useTableValue('categories', category.id, 'name');
  const code = useTableValue('categories', category.id, 'code');

  return (
    <SwipeableComponent
      key={category.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
      renderRightActions={RightAction}
    >
      <View style={[styles.itemEntry, { borderColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/configuration/workcategory/[categoryId]',
              params: { categoryId: category.id },
            });
          }}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemCode} text={code} />
            <Text style={styles.itemName}>{name}</Text>
            <Feather name="chevrons-right" size={24} color={colors.iconColor} />
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
    height: 40,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableCategory;
