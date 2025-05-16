import { Text, View } from '@/components/Themed';
import { deleteBg } from '@/constants/Colors';
import { useColors } from '@/context/ColorsContext';
import {
  useDeleteRowCallback,
  useTableValue,
  WorkCategoryData,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

const SwipeableCategory = ({ category }: { category: WorkCategoryData }) => {
  const processDelete = useDeleteRowCallback('categories');
  const router = useRouter();
  const colors = useColors();

  const handleDelete = useCallback(
    (itemId: string) => {
      Alert.alert(
        'Delete Work Category',
        'Are you sure you want to delete this category?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId) }],
        { cancelable: true },
      );
    },
    [processDelete],
  );

  const RightAction = () => {
    return (
      <Pressable
        style={styles.rightAction}
        onPress={() => {
          handleDelete(category.id);
        }}
      >
        {' '}
        <MaterialIcons name="delete" size={24} color="white" />
      </Pressable>
    );
  };

  const name = useTableValue('categories', category.id, 'name');
  const code = useTableValue('categories', category.id, 'code');

  return (
    <ReanimatedSwipeable
      key={category.id}
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
              pathname: '/projects/configuration/workcategory/[categoryId]',
              params: { categoryId: category.id },
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
