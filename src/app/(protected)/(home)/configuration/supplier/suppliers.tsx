// screens/suppliers.tsx

import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAddRowCallback,
  useAllRows,
  SupplierData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableSupplier from '@/src/components/SwipeableSupplier';

const SuppliersScreen = () => {
  const router = useRouter();
  const addSupplierToStore = useAddRowCallback('suppliers');
  const allSuppliers = useAllRows('suppliers');
  const [showAdd, setShowAdd] = useState(false);
  const [supplier, setSupplier] = useState<SupplierData>({
    id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    mobilePhone: '',
    businessPhone: '',
    notes: '',
  });

  const colors = useColors();

  const handleInputChange = (name: keyof SupplierData, value: string) => {
    setSupplier((prevSupplier) => ({
      ...prevSupplier,
      [name]: value,
    }));
  };

  const handleSave = useCallback(() => {
    const result = addSupplierToStore(supplier);

    if (result && result.status !== 'Success') {
      console.error('Failed to add supplier:', result ? result.msg : 'Unknown error');
    }

    // Clear the input fields
    setSupplier({
      id: '',
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      mobilePhone: '',
      businessPhone: '',
      notes: '',
    });
  }, [addSupplierToStore, supplier]);

  const renderHeaderRight = () => (
    <Pressable
      // work around for https://github.com/software-mansion/react-native-screens/issues/2219
      // use Pressable from react-native-gesture-handler
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
            title: 'Suppliers/Contractors',
            headerRight: renderHeaderRight,
          }}
        />
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          {showAdd && (
            <View style={{ backgroundColor: colors.listBackground }}>
              <View style={{ padding: 10, borderRadius: 10, marginVertical: 10, marginHorizontal: 15 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral200 }]}
                  placeholder="Supplier/Contractor Name"
                  value={supplier.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral200 }]}
                  placeholder="Address"
                  value={supplier.address}
                  onChangeText={(text) => handleInputChange('address', text)}
                />
                <View style={{ flexDirection: 'row' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
                    placeholder="City"
                    value={supplier.city}
                    onChangeText={(text) => handleInputChange('city', text)}
                  />
                  <TextInput
                    style={[styles.input, { width: 75, marginRight: 8, backgroundColor: colors.neutral200 }]}
                    placeholder="State"
                    value={supplier.state}
                    onChangeText={(text) => handleInputChange('state', text)}
                  />
                  <TextInput
                    style={[styles.input, { width: 80, backgroundColor: colors.neutral200 }]}
                    placeholder="Zip"
                    value={supplier.zip}
                    keyboardType="number-pad"
                    onChangeText={(text) => handleInputChange('zip', text)}
                  />
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
                    placeholder="Mobile Phone"
                    keyboardType="phone-pad"
                    value={supplier.mobilePhone}
                    onChangeText={(text) => handleInputChange('mobilePhone', text)}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
                    placeholder="Business Phone"
                    value={supplier.businessPhone}
                    keyboardType="phone-pad"
                    onChangeText={(text) => handleInputChange('businessPhone', text)}
                  />
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral200 }]}
                  placeholder="Notes"
                  value={supplier.notes}
                  onChangeText={(text) => handleInputChange('notes', text)}
                />

                <ActionButton
                  onPress={handleSave}
                  type={supplier.name ? 'action' : 'disabled'}
                  title="Add Supplier"
                />
              </View>
            </View>
          )}

          <FlatList
            style={{ borderTopColor: colors.border }}
            data={allSuppliers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SwipeableSupplier supplier={item} />}
            ListEmptyComponent={() => (
              <View
                style={{
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Text txtSize="title" text="No suppliers found." />
                <Text text="Use the '+' in the upper right to add one." />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  supplierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  supplierInfo: {
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

export default SuppliersScreen;
