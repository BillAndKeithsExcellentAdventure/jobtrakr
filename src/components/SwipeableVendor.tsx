import { SwipeableComponent, SwipeableHandles } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useUpdateRowCallback, VendorData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { SvgImage } from '@/src/components/SvgImage';

import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef } from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useNetwork } from '@/src/context/NetworkContext';
import { VendorGrantedAccess } from '../utils/quickbooksAPI';

const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const SwipeableVendor = ({ vendor }: { vendor: VendorData }) => {
  const router = useRouter();
  const { verifiedEmailAddresses, vendorsGrantedAccess, isConnected } = useNetwork();
  const updateVendor = useUpdateRowCallback('vendors');
  const swipeableRef = useRef<SwipeableHandles>(null);
  const hasMobilePhone = !!vendor.mobilePhone?.trim();
  const rightActionWidth = hasMobilePhone ? RIGHT_ACTION_WIDTH * 2 : RIGHT_ACTION_WIDTH;

  const colors = useColors();
  const handleToggleActive = useCallback(() => {
    updateVendor(vendor.id, { inactive: !vendor.inactive });
    swipeableRef.current?.close();
  }, [updateVendor, vendor.id, vendor.inactive]);

  const handleCall = useCallback(async () => {
    if (!vendor.mobilePhone?.trim()) return;
    const sanitized = vendor.mobilePhone.replace(/[^0-9+]/g, '');
    const phoneNumber = sanitized || vendor.mobilePhone.trim();
    const telUrl = `tel:${phoneNumber}`;

    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (!canOpen) return;
      await Linking.openURL(telUrl);
    } catch (error) {
      console.warn('Failed to open phone dialer for vendor', error);
    } finally {
      swipeableRef.current?.close();
    }
  }, [vendor.mobilePhone]);

  const isEmailVerified = useMemo(
    () => (vendor.email && isConnected ? verifiedEmailAddresses.includes(vendor.email) : true),
    [vendor.email, isConnected, verifiedEmailAddresses],
  );

  const vendorAccess: VendorGrantedAccess | undefined = useMemo(() => {
    if (vendor.email && isConnected) {
      return vendorsGrantedAccess.find((v) => v.vendor_email === vendor.email);
    }
    return undefined;
  }, [vendor.email, isConnected, vendorsGrantedAccess]);

  const RightAction = useCallback(() => {
    return (
      <Reanimated.View style={styles.rightActionsContainer}>
        <Pressable
          style={[styles.rightAction, { backgroundColor: colors.altSlideMenuBackground }]}
          onPress={handleToggleActive}
        >
          <MaterialIcons
            name={vendor.inactive ? 'visibility' : 'visibility-off'}
            size={32}
            color={colors.slideMenuForeground}
          />
        </Pressable>

        {hasMobilePhone && (
          <Pressable
            style={[styles.rightAction, { backgroundColor: colors.slideMenuBackground }]}
            onPress={handleCall}
          >
            <Reanimated.View>
              <MaterialIcons name="phone" size={32} color={colors.slideMenuForeground} />
            </Reanimated.View>
          </Pressable>
        )}
      </Reanimated.View>
    );
  }, [
    colors.slideMenuBackground,
    colors.slideMenuForeground,
    handleCall,
    handleToggleActive,
    hasMobilePhone,
    vendor.inactive,
  ]);

  return (
    <SwipeableComponent
      ref={swipeableRef}
      key={vendor.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={rightActionWidth}
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
                <Text
                  style={[styles.vendorName, vendor.inactive && { color: colors.textMuted }]}
                  numberOfLines={1}
                >{`${vendor.name.length > 0 ? vendor.name : 'Not Specified'}`}</Text>
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
                  <Text
                    numberOfLines={1}
                    style={vendor.inactive ? { color: colors.textMuted } : {}}
                    text={vendor.email}
                  />
                  {isEmailVerified && (
                    <MaterialIcons name="verified-user" size={21} color={colors.profitFg} />
                  )}
                  {vendorAccess && (
                    <MaterialCommunityIcons
                      name="shield-key"
                      size={22}
                      color={vendorAccess.isRegistered ? colors.profitFg : colors.textMuted}
                    />
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
    fontSize: 16,
    fontWeight: '500',
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
  rightActionsContainer: {
    flexDirection: 'row',
    height: 90,
  },
});

export default SwipeableVendor;
