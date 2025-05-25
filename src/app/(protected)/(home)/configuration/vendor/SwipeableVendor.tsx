import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import { useDeleteRowCallback, VendorData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';

const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const SwipeableVendor = ({ vendor }: { vendor: VendorData }) => {
  const router = useRouter();

  const processDelete = useDeleteRowCallback('vendors');

  const colors = useColors();
  const handleDelete = (itemId: string) => {
    Alert.alert(
      'Delete Vendor',
      'Are you sure you want to delete this vendor?',
      [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId) }],
      { cancelable: true },
    );
  };

  const RightAction = () => {
    return (
      <Pressable
        style={styles.rightAction}
        onPress={() => {
          handleDelete(vendor.id);
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
      key={vendor.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
      renderRightActions={RightAction}
    >
      <View style={styles.itemEntry}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/configuration/vendor/[id]',
              params: { id: vendor.id },
            });
          }}
        >
          <View style={[styles.vendorInfo, { borderColor: colors.border, borderTopWidth: 1 }]}>
            <View style={styles.vendorSummary}>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              {(vendor.city || vendor.address) && (
                <View style={{ flexDirection: 'row' }}>
                  <Text>{vendor.address}</Text>
                  {vendor.city && vendor.address && <Text>{', '}</Text>}
                  <Text>{vendor.city}</Text>
                </View>
              )}
              {vendor.businessPhone && <Text text={vendor.businessPhone} />}
            </View>
            <View>
              <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
            </View>
          </View>
        </Pressable>
      </View>
    </SwipeableComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    width: '100%',
    borderBottomWidth: 1,
  },
  vendorSummary: {
    flex: 1,
  },

  vendorName: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemEntry: {
    width: '100%',
    paddingHorizontal: 10,
  },
  itemCode: {
    flex: 1,
  },
  rightAction: {
    width: RIGHT_ACTION_WIDTH,
    height: 90,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableVendor;
