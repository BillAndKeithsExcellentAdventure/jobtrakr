import { ActionButton } from '@/src/components/ActionButton';
import SwipeableCustomer from '@/src/components/SwipeableCustomer';
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

const CustomersScreen = () => {
  const addCustomerToStore = useAddRowCallback('customers');
  const allCustomers = useAllRows('customers');
  const [showAdd, setShowAdd] = useState(false);
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

  const handleInputChange = useCallback((name: keyof CustomerData, value: string) => {
    setCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSave = useCallback(() => {
    const result = addCustomerToStore(customer);

    if (result && result.status !== 'Success') {
      console.error('Failed to add customer:', result ? result.msg : 'Unknown error');
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
  }, [addCustomerToStore, customer]);

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => setShowAdd(!showAdd)}
      hitSlop={10}
      style={styles.headerButton}
    >
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
            <View style={{ backgroundColor: colors.listBackground }}>
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

          <FlatList
            style={{ borderTopColor: colors.border }}
            data={allCustomers}
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
});

export default CustomersScreen;
