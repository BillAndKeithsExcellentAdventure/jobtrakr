import { SwipeableComponent } from '@/src/components/SwipeableComponent';
import { Text, View } from '@/src/components/Themed';
import { Switch } from '@/src/components/Switch';
import { deleteBg } from '@/src/constants/Colors';
import { useColors } from '@/src/context/ColorsContext';
import {
  CustomerData,
  useDeleteRowCallback,
  useUpdateRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';

const RIGHT_ACTION_WIDTH = 100;
const SWIPE_THRESHOLD_WIDTH = 50;

const SwipeableCustomer = ({ customer }: { customer: CustomerData }) => {
  const router = useRouter();
  const processDelete = useDeleteRowCallback('customers');
  const updateCustomer = useUpdateRowCallback('customers');
  const colors = useColors();

  const handleDelete = useCallback(
    (itemId: string) => {
      Alert.alert(
        'Delete Customer',
        'Are you sure you want to delete this customer?',
        [{ text: 'Cancel' }, { text: 'Delete', onPress: () => processDelete(itemId) }],
        { cancelable: true },
      );
    },
    [processDelete],
  );

  const handleToggleActive = useCallback(() => {
    updateCustomer(customer.id, { active: !customer.active });
  }, [customer.id, customer.active, updateCustomer]);

  const RightAction = useCallback(() => {
    return (
      <Pressable
        style={styles.rightAction}
        onPress={() => {
          handleDelete(customer.id);
        }}
      >
        <Reanimated.View>
          <MaterialIcons name="delete" size={32} color="white" />
        </Reanimated.View>
      </Pressable>
    );
  }, [customer.id, handleDelete]);

  return (
    <SwipeableComponent
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
              <Text numberOfLines={1} style={styles.customerName}>
                {customer.name.length > 0 ? customer.name : 'Not Specified'}
              </Text>
              {customer.contactName ? <Text>{customer.contactName}</Text> : null}
              {customer.email ? <Text>{customer.email}</Text> : null}
            </View>
          </Pressable>
          <View style={styles.customerActions}>
            <Switch value={customer.active} onValueChange={handleToggleActive} size="medium" />
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
    backgroundColor: deleteBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeableCustomer;
