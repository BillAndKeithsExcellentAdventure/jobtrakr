import { SwipeableComponent, SwipeableHandles } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  CustomerData,
  useUpdateRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';

const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const SwipeableCustomer = ({ customer }: { customer: CustomerData }) => {
  const router = useRouter();
  const updateCustomer = useUpdateRowCallback('customers');
  const colors = useColors();
  const swipeableRef = useRef<SwipeableHandles>(null);

  const handleToggleActive = useCallback(() => {
    updateCustomer(customer.id, { active: !customer.active });
    swipeableRef.current?.close();
  }, [customer.id, customer.active, updateCustomer]);

  const RightAction = useCallback(() => {
    return (
      <Pressable
        style={[styles.rightAction, { backgroundColor: colors.slideMenuBackground }]}
        onPress={handleToggleActive}
      >
        <Reanimated.View>
          <MaterialIcons
            name={customer.active ? 'visibility-off' : 'visibility'}
            size={32}
            color={colors.slideMenuForeground}
          />
        </Reanimated.View>
      </Pressable>
    );
  }, [customer.active, handleToggleActive, colors.slideMenuBackground, colors.slideMenuForeground]);

  return (
    <SwipeableComponent
      ref={swipeableRef}
      key={customer.id}
      threshold={SWIPE_THRESHOLD_WIDTH}
      actionWidth={RIGHT_ACTION_WIDTH}
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
              <Text
                numberOfLines={1}
                style={[styles.customerName, !customer.active && { color: colors.textMuted }]}
              >
                {customer.name.length > 0 ? customer.name : 'Not Specified'}
              </Text>
              {customer.contactName ? (
                <Text style={!customer.active && { color: colors.textMuted }}>{customer.contactName}</Text>
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
    minHeight: 70,
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
    fontSize: 18,
    fontWeight: '600',
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
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableCustomer;
