import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import { useDeleteRowCallback, SupplierData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';

const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const SwipeableSupplier = ({ supplier }: { supplier: SupplierData }) => {
  const router = useRouter();

  const processDelete = useDeleteRowCallback('suppliers');

  const colors = useColors();
  const handleDelete = (itemId: string) => {
    Alert.alert(
      'Delete Supplier',
      'Are you sure you want to delete this supplier?',
      [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId) }],
      { cancelable: true },
    );
  };

  const RightAction = () => {
    return (
      <Pressable
        style={styles.rightAction}
        onPress={() => {
          handleDelete(supplier.id);
        }}
      >
        <Reanimated.View>
          <MaterialIcons name="delete" size={32} color="white" />
        </Reanimated.View>
      </Pressable>
    );
  };

  return (
    <SwipeableComponent
      key={supplier.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
      renderRightActions={RightAction}
    >
      <View style={styles.itemEntry}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/configuration/supplier/[id]',
              params: { id: supplier.id },
            });
          }}
        >
          <View style={[styles.supplierInfo, { borderColor: colors.border, borderTopWidth: 1 }]}>
            <View style={styles.supplierSummary}>
              <Text style={styles.supplierName}>{`${
                supplier.name.length > 0 ? supplier.name : 'Not Specified'
              }`}</Text>
              {(supplier.city || supplier.address) && (
                <View style={{ flexDirection: 'row' }}>
                  <Text>{supplier.address}</Text>
                  {supplier.city && supplier.address && <Text>{', '}</Text>}
                  <Text>{supplier.city}</Text>
                </View>
              )}
              {supplier.businessPhone && <Text text={supplier.businessPhone} />}
            </View>
            <View>
              <Feather name="chevrons-right" size={24} color={colors.iconColor} />
            </View>
          </View>
        </Pressable>
      </View>
    </SwipeableComponent>
  );
};

const styles = StyleSheet.create({
  supplierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    width: '100%',
    borderBottomWidth: 1,
  },
  supplierSummary: {
    flex: 1,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemEntry: {
    width: '100%',
    paddingHorizontal: 10,
  },
  rightAction: {
    width: RIGHT_ACTION_WIDTH,
    height: 90,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableSupplier;
