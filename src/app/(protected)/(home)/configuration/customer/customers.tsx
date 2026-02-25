import { ActionButton } from '@/src/components/ActionButton';
import SwipeableCustomer from '@/src/components/SwipeableCustomer';
import { Switch } from '@/src/components/Switch';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  CustomerData,
  useAddRowCallback,
  useAllRows,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { addCustomer } from '@/src/utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';
import { useNetwork } from '@/src/context/NetworkContext';

const CustomersScreen = () => {
  const auth = useAuth();
  const { orgId, userId, getToken } = auth;
  const { isConnectedToQuickBooks } = useNetwork();
  const addCustomerToStore = useAddRowCallback('customers');
  const allCustomers = useAllRows('customers');
  const [showAdd, setShowAdd] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [customer, setCustomer] = useState<CustomerData>({
    id: '',
    accountingId: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    active: true,
  });

  const colors = useColors();

  const filteredCustomers = showActiveOnly ? allCustomers.filter((c) => c.active) : allCustomers;

  const handleInputChange = useCallback((name: keyof CustomerData, value: string) => {
    setCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    let accountingId = '';

    if (isConnectedToQuickBooks) {
      if (!orgId || !userId) {
        console.error('Missing orgId or userId');
        return;
      }

      const names = customer.name.split(' ');
      const firstName = customer.contactName || names[0] || '';
      const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
      const addQbCustomerResult = await addCustomer(
        orgId,
        userId,
        {
          displayName: customer.name,
          firstName: firstName,
          lastName: lastName,
          email: customer.email,
          phone: customer.phone,
          address: '',
          address2: '',
          city: '',
          state: '',
          zip: '',
        },
        getToken,
      );

      if (!addQbCustomerResult || !addQbCustomerResult.success) {
        console.error(
          'Failed to add customer to QuickBooks:',
          addQbCustomerResult ? addQbCustomerResult.message : 'Unknown error',
        );
        return;
      } else {
        accountingId = addQbCustomerResult.newQBId ?? '';
      }
    }
    const result = addCustomerToStore({ ...customer, accountingId });

    if (result && result.status !== 'Success') {
      console.error('Failed to add customer to local store:', result ? result.msg : 'Unknown error');
    }

    setCustomer({
      id: '',
      accountingId: '',
      name: '',
      contactName: '',
      email: '',
      phone: '',
      active: true,
    });
    setShowAdd(false);
  }, [addCustomerToStore, customer, getToken, orgId, userId]);

  const renderHeaderRight = () => (
    <Pressable onPress={() => setShowAdd(!showAdd)} hitSlop={10} style={styles.headerButton}>
      <Ionicons name={showAdd ? 'chevron-up-sharp' : 'add'} size={24} color={colors.iconColor} />
    </Pressable>
  );

  return (
    <>
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Customers',
            headerRight: renderHeaderRight,
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          {showAdd && (
            <View
              style={{
                backgroundColor: colors.listBackground,
              }}
            >
              <View style={{ padding: 10, borderRadius: 10, marginVertical: 10, marginHorizontal: 15 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral200 }]}
                  placeholder="Customer Name"
                  value={customer.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral200 }]}
                  placeholder="Contact Name"
                  value={customer.contactName}
                  onChangeText={(text) => handleInputChange('contactName', text)}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral200 }]}
                  placeholder="Email"
                  value={customer.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(text) => handleInputChange('email', text)}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral200 }]}
                  placeholder="Phone"
                  value={customer.phone}
                  keyboardType="phone-pad"
                  onChangeText={(text) => handleInputChange('phone', text)}
                />
                <ActionButton
                  onPress={handleSave}
                  type={customer.name ? 'action' : 'disabled'}
                  title="Add Customer"
                />
              </View>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderRadius: 8,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text text="All" style={{ fontWeight: 'bold' }} />
            <Switch
              value={showActiveOnly}
              onValueChange={setShowActiveOnly}
              switchContainerOffBackgroundColor={colors.profitFg}
              size="medium"
            />
            <Text numberOfLines={1} text="Show Only Active Customers" style={{ fontWeight: 'bold' }} />
          </View>

          <FlatList
            style={{ borderTopColor: colors.border }}
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SwipeableCustomer customer={item} />}
            ListEmptyComponent={() => (
              <View
                style={{
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Text txtSize="title" text="No customers found." />
                <Text text="Use the '+' in the upper right to add one." />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
    paddingRight: 0,
    zIndex: 1,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});

export default CustomersScreen;
