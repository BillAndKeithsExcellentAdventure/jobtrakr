import { SwipeableComponent, SwipeableHandles } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useUpdateRowCallback, VendorData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { SvgImage } from '@/src/components/SvgImage';

import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useNetwork } from '@/src/context/NetworkContext';

const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const SwipeableVendor = ({ vendor }: { vendor: VendorData }) => {
  const router = useRouter();
  const { verifiedEmailAddresses, isConnected } = useNetwork();
  const updateVendor = useUpdateRowCallback('vendors');
  const swipeableRef = useRef<SwipeableHandles>(null);

  const colors = useColors();
  const handleToggleActive = useCallback(() => {
    updateVendor(vendor.id, { inactive: !vendor.inactive });
    swipeableRef.current?.close();
  }, [updateVendor, vendor.id, vendor.inactive]);

  const isEmailVerified = useMemo(
    () => (vendor.email && isConnected ? verifiedEmailAddresses.includes(vendor.email) : true),
    [vendor.email, isConnected, verifiedEmailAddresses],
  );

  const RightAction = useCallback(() => {
    return (
      <Pressable
        style={[styles.rightAction, { backgroundColor: colors.slideMenuBackground }]}
        onPress={handleToggleActive}
      >
        <Reanimated.View>
          <MaterialIcons
            name={vendor.inactive ? 'visibility' : 'visibility-off'}
            size={32}
            color={colors.slideMenuForeground}
          />
        </Reanimated.View>
      </Pressable>
    );
  }, [colors.slideMenuBackground, colors.slideMenuForeground, handleToggleActive, vendor.inactive]);

  return (
    <SwipeableComponent
      ref={swipeableRef}
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
              <View style={styles.nameRow}>
                {vendor.accountingId && <SvgImage fileName="qb-logo" width={20} height={20} />}
                <Text style={vendor.inactive ? { color: colors.textMuted } : {}} numberOfLines={1}>{`${
                  vendor.name.length > 0 ? vendor.name : 'Not Specified'
                }`}</Text>
              </View>
              {(vendor.city || vendor.address) && (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={vendor.inactive ? { color: colors.textMuted } : {}}>{vendor.address}</Text>
                  {vendor.city && vendor.address && <Text>{', '}</Text>}
                  <Text style={vendor.inactive ? { color: colors.textMuted } : {}}>{vendor.city}</Text>
                </View>
              )}
              {vendor.email && (
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={vendor.inactive ? { color: colors.textMuted } : {}} text={vendor.email} />
                  {isEmailVerified && (
                    <MaterialIcons name="verified-user" size={28} color={colors.profitFg} />
                  )}
                </View>
              )}
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vendorName: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableVendor;
