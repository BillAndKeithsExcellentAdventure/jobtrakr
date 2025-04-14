import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors, deleteBg } from '@/constants/Colors';
import { VendorData } from '@/models/types';
import { useDeleteRowCallback } from '@/tbStores/configurationStore/hooks';

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const SwipeableVendor = ({ vendor }: { vendor: VendorData }) => {
  const router = useRouter();

  const processDelete = useDeleteRowCallback('vendors');

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
      'Delete Vendor',
      'Are you sure you want to delete this vendor?',
      [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId) }],
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
          handleDelete(vendor._id!);
        }}
      >
        <Reanimated.View style={[styleAnimation, styles.rightAction]}>
          <MaterialIcons name="delete" size={32} color="white" />
        </Reanimated.View>
      </Pressable>
    );
  };

  return (
    <ReanimatedSwipeable
      key={vendor._id}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      renderRightActions={RightAction}
      overshootRight={false}
      enableContextMenu
    >
      <View style={styles.itemEntry}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/jobs/configuration/vendor/[id]',
              params: { id: vendor._id! },
            });
          }}
        >
          <View style={[styles.vendorInfo, { borderColor: colors.borderColor, borderTopWidth: 1 }]}>
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
    </ReanimatedSwipeable>
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
    width: 100,
    height: 90,
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableVendor;
