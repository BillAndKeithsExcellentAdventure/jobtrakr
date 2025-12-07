import { TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useTypedRow,
  useUpdateRowCallback,
  SupplierData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditSupplier = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const applySupplierUpdates = useUpdateRowCallback('suppliers');
  const colors = useColors();
  const [updatedSupplier, setUpdatedSupplier] = useState<SupplierData>({
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

  const supplierFromStore = useTypedRow('suppliers', id);

  // Prevent infinite re-sync loops by only updating local state when the
  // store value actually changes. Many store selectors may return a new
  // object reference on each render, so compare serialized contents.
  const prevSupplierJsonRef = useRef<string | null>(null);
  useEffect(() => {
    if (!supplierFromStore) return;
    const json = JSON.stringify(supplierFromStore);
    if (prevSupplierJsonRef.current === json) return;
    prevSupplierJsonRef.current = json;
    setUpdatedSupplier({ ...supplierFromStore });
  }, [supplierFromStore]);

  const handleInputChange = (name: keyof SupplierData, value: string) => {
    setUpdatedSupplier((prevSupplier) => ({
      ...prevSupplier,
      [name]: value,
    }));
  };

  const handleBlur = () => {
    if (!id) return;
    const supplierToSave: SupplierData = {
      ...updatedSupplier,
      name: updatedSupplier.name.length === 0 ? supplierFromStore?.name || '' : updatedSupplier.name,
    };
    applySupplierUpdates(id, supplierToSave);
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Supplier',
        }}
      />
      <View style={styles.container}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Name"
          value={updatedSupplier.name}
          onChangeText={(text) => handleInputChange('name', text)}
          onBlur={handleBlur}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Address"
          value={updatedSupplier.address}
          onChangeText={(text) => handleInputChange('address', text)}
          onBlur={handleBlur}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="City"
            value={updatedSupplier.city}
            onChangeText={(text) => handleInputChange('city', text)}
            onBlur={handleBlur}
          />
          <TextInput
            style={[styles.input, { width: 75, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="State"
            value={updatedSupplier.state}
            onChangeText={(text) => handleInputChange('state', text)}
            onBlur={handleBlur}
          />
          <TextInput
            style={[styles.input, { width: 80, backgroundColor: colors.neutral200 }]}
            placeholder="Zip"
            value={updatedSupplier.zip}
            keyboardType="number-pad"
            onChangeText={(text) => handleInputChange('zip', text)}
            onBlur={handleBlur}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="Mobile Phone"
            keyboardType="phone-pad"
            value={updatedSupplier.mobilePhone}
            onChangeText={(text) => handleInputChange('mobilePhone', text)}
            onBlur={handleBlur}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="Business Phone"
            value={updatedSupplier.businessPhone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('businessPhone', text)}
            onBlur={handleBlur}
          />
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Notes"
          value={updatedSupplier.notes}
          onChangeText={(text) => handleInputChange('notes', text)}
          onBlur={handleBlur}
        />
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
  saveButton: {
    flex: 1,
    marginRight: 5,
  },

});

export default EditSupplier;
