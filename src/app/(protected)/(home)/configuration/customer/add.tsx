import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { CustomerData, useAddRowCallback } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useNetwork } from '@/src/context/NetworkContext';
import { addCustomer } from '@/src/utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

const AddCustomerModal = () => {
  const router = useRouter();
  const colors = useColors();
  const auth = useAuth();
  const { orgId, userId, getToken } = auth;
  const { isQuickBooksAccessible } = useNetwork();
  const addCustomerToStore = useAddRowCallback('customers');
  const [customer, setCustomer] = useState<CustomerData>({
    id: '',
    accountingId: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    active: true,
  });

  const handleInputChange = useCallback((name: keyof CustomerData, value: string) => {
    setCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    let accountingId = '';

    if (isQuickBooksAccessible) {
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
      return;
    }

    router.back();
  }, [addCustomerToStore, customer, getToken, orgId, userId, isQuickBooksAccessible, router]);

  const canSave = customer.name.length > 0;

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        title="Add Customer"
        onSave={handleSave}
        onCancel={() => router.back()}
        canSave={canSave}
      >
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
      </ModalScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 4,
  },
});

export default AddCustomerModal;
