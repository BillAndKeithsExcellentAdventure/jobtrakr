import { Text, TextInput, View } from '@/src/components/Themed';
import { Switch } from '@/src/components/Switch';
import { useColors } from '@/src/context/ColorsContext';
import {
  CustomerData,
  useTypedRow,
  useUpdateRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditCustomer = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const applyCustomerUpdates = useUpdateRowCallback('customers');
  const colors = useColors();
  const [updatedCustomer, setUpdatedCustomer] = useState<CustomerData>({
    id: '',
    accountingId: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    active: true,
  });

  const customerFromStore = useTypedRow('customers', id);

  const prevCustomerJsonRef = useRef<string | null>(null);
  useEffect(() => {
    if (!customerFromStore) return;
    const json = JSON.stringify(customerFromStore);
    if (prevCustomerJsonRef.current === json) return;
    prevCustomerJsonRef.current = json;
    setUpdatedCustomer({ ...customerFromStore });
  }, [customerFromStore]);

  const isFromQuickBooks = Boolean(updatedCustomer.accountingId);

  const handleInputChange = useCallback((name: keyof CustomerData, value: string) => {
    setUpdatedCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleBlur = useCallback(() => {
    if (!id) return;
    applyCustomerUpdates(id, updatedCustomer);
  }, [id, updatedCustomer, applyCustomerUpdates]);

  const handleToggleActive = useCallback(() => {
    const newActive = !updatedCustomer.active;
    setUpdatedCustomer((prev) => ({ ...prev, active: newActive }));
    if (id) {
      applyCustomerUpdates(id, { active: newActive });
    }
  }, [id, updatedCustomer.active, applyCustomerUpdates]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Customer',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <View style={styles.container}>
        {isFromQuickBooks && (
          <Text
            txtSize="xs"
            text="This customer was imported from QuickBooks. Only the Contact Name and the Active status can be edited."
            style={{ marginBottom: 12, color: colors.neutral500 }}
          />
        )}
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Customer Name"
          value={updatedCustomer.name}
          onChangeText={(text) => handleInputChange('name', text)}
          onBlur={handleBlur}
          editable={!isFromQuickBooks}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          label="Contact Name"
          placeholder="Contact Name"
          value={updatedCustomer.contactName}
          onChangeText={(text) => handleInputChange('contactName', text)}
          onBlur={handleBlur}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Email"
          value={updatedCustomer.email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(text) => handleInputChange('email', text)}
          onBlur={handleBlur}
          editable={!isFromQuickBooks}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Phone"
          value={updatedCustomer.phone}
          keyboardType="phone-pad"
          onChangeText={(text) => handleInputChange('phone', text)}
          onBlur={handleBlur}
          editable={!isFromQuickBooks}
        />
        <View style={styles.activeRow}>
          <Text txtSize="standard" text="Active" />
          <Switch value={updatedCustomer.active} onValueChange={handleToggleActive} size="medium" />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 4,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
});

export default EditCustomer;
