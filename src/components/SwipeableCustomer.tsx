import { SwipeableComponent, SwipeableHandles } from '@/src/components/SwipeableComponent';
import { SvgImage } from '@/src/components/SvgImage';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  CustomerData,
  useUpdateRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef } from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useNetwork } from '@/src/context/NetworkContext';

const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const SwipeableCustomer = ({ customer }: { customer: CustomerData }) => {
  const router = useRouter();
  const { verifiedEmailAddresses, isConnected } = useNetwork();
  const updateCustomer = useUpdateRowCallback('customers');
  const colors = useColors();
  const swipeableRef = useRef<SwipeableHandles>(null);
  const hasPhone = !!customer.phone?.trim();
  const rightActionWidth = hasPhone ? RIGHT_ACTION_WIDTH * 2 : RIGHT_ACTION_WIDTH;

  const handleToggleActive = useCallback(() => {
    updateCustomer(customer.id, { inactive: !customer.inactive });
    swipeableRef.current?.close();
  }, [customer.id, customer.inactive, updateCustomer]);

  const handleCall = useCallback(async () => {
    if (!customer.phone?.trim()) return;
    const sanitized = customer.phone.replace(/[^0-9+]/g, '');
    const phoneNumber = sanitized || customer.phone.trim();
    const telUrl = `tel:${phoneNumber}`;

    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (!canOpen) return;
      await Linking.openURL(telUrl);
    } catch (error) {
      console.warn('Failed to open phone dialer for customer', error);
    } finally {
      swipeableRef.current?.close();
    }
  }, [customer.phone]);

  const isEmailVerified = useMemo(
    () => (customer.email && isConnected ? verifiedEmailAddresses.includes(customer.email) : true),
    [customer.email, isConnected, verifiedEmailAddresses],
  );

  const RightAction = useCallback(() => {
    return (
      <Reanimated.View style={styles.rightActionsContainer}>
        <Pressable
          style={[styles.rightAction, { backgroundColor: colors.altSlideMenuBackground }]}
          onPress={handleToggleActive}
        >
          <Reanimated.View>
            <MaterialIcons
              name={customer.inactive ? 'visibility' : 'visibility-off'}
              size={32}
              color={colors.slideMenuForeground}
            />
          </Reanimated.View>
        </Pressable>

        {hasPhone && (
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
    customer.inactive,
    handleCall,
    handleToggleActive,
    hasPhone,
    colors.slideMenuBackground,
    colors.slideMenuForeground,
  ]);

  return (
    <SwipeableComponent
      ref={swipeableRef}
      key={customer.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={rightActionWidth}
      renderRightActions={RightAction}
    >
      <View style={styles.itemEntry}>
        <View style={[styles.customerInfo, { borderColor: colors.border, borderTopWidth: 1 }]}>
          <Pressable
            style={styles.customerSummaryPressable}
            onPress={() => {
              router.push({
                pathname: '/configuration/customer/[id]',
                params: { id: customer.id },
              });
            }}
          >
            <View style={styles.customerSummary}>
              <View style={styles.nameRow}>
                {customer.accountingId && <SvgImage fileName="qb-logo" width={20} height={20} />}
                <Text
                  numberOfLines={1}
                  style={[styles.customerName, customer.inactive && { color: colors.textMuted }]}
                >
                  {customer.name.length > 0 ? customer.name : 'Not Specified'}
                </Text>
              </View>
              {customer.contactName ? (
                <Text style={customer.inactive && { color: colors.textMuted }}>{customer.contactName}</Text>
              ) : null}
              {customer.email ? (
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={customer.inactive && { color: colors.textMuted }}>{customer.email}</Text>
                  {isEmailVerified && (
                    <MaterialIcons name="verified-user" size={18} color={colors.profitFg} />
                  )}
                </View>
              ) : null}
            </View>
          </Pressable>
          <View style={styles.customerActions}>
            <Pressable
              onPress={() => {
                router.push({
                  pathname: '/configuration/customer/[id]',
                  params: { id: customer.id },
                });
              }}
            >
              <Feather name="chevrons-right" size={24} color={colors.iconColor} />
            </Pressable>
          </View>
        </View>
      </View>
    </SwipeableComponent>
  );
};

const styles = StyleSheet.create({
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 90,
    width: '100%',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  customerSummaryPressable: {
    flex: 1,
  },
  customerSummary: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  itemEntry: {
    width: '100%',
    paddingHorizontal: 10,
  },
  rightAction: {
    width: RIGHT_ACTION_WIDTH,
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActionsContainer: {
    flexDirection: 'row',
    minHeight: 90,
  },
});

export default SwipeableCustomer;
