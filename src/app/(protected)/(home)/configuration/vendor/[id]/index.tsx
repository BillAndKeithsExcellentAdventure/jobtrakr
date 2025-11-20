import { TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useTypedRow,
  useUpdateRowCallback,
  VendorData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditVendor = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const applyVendorUpdates = useUpdateRowCallback('vendors');
  const colors = useColors();
  const [updatedVendor, setUpdatedVendor] = useState<VendorData>({
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

  const vendorFromStore = useTypedRow('vendors', id);

  // Prevent infinite re-sync loops by only updating local state when the
  // store value actually changes. Many store selectors may return a new
  // object reference on each render, so compare serialized contents.
  const prevVendorJsonRef = useRef<string | null>(null);
  useEffect(() => {
    if (!vendorFromStore) return;
    const json = JSON.stringify(vendorFromStore);
    if (prevVendorJsonRef.current === json) return;
    prevVendorJsonRef.current = json;
    setUpdatedVendor({ ...vendorFromStore });
  }, [vendorFromStore]);

  const handleInputChange = (name: keyof VendorData, value: string) => {
    setUpdatedVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
    }));
  };

  const handleBlur = () => {
    if (!id) return;
    const vendorToSave: VendorData = {
      ...updatedVendor,
      name: updatedVendor.name.length === 0 ? vendorFromStore?.name || '' : updatedVendor.name,
    };
    applyVendorUpdates(id, vendorToSave);
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Vendor',
        }}
      />
      <View style={styles.container}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Name"
          value={updatedVendor.name}
          onChangeText={(text) => handleInputChange('name', text)}
          onBlur={handleBlur}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Address"
          value={updatedVendor.address}
          onChangeText={(text) => handleInputChange('address', text)}
          onBlur={handleBlur}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="City"
            value={updatedVendor.city}
            onChangeText={(text) => handleInputChange('city', text)}
            onBlur={handleBlur}
          />
          <TextInput
            style={[styles.input, { width: 75, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="State"
            value={updatedVendor.state}
            onChangeText={(text) => handleInputChange('state', text)}
            onBlur={handleBlur}
          />
          <TextInput
            style={[styles.input, { width: 80, backgroundColor: colors.neutral200 }]}
            placeholder="Zip"
            value={updatedVendor.zip}
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
            value={updatedVendor.mobilePhone}
            onChangeText={(text) => handleInputChange('mobilePhone', text)}
            onBlur={handleBlur}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="Business Phone"
            value={updatedVendor.businessPhone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('businessPhone', text)}
            onBlur={handleBlur}
          />
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Notes"
          value={updatedVendor.notes}
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 4,
  },
  saveButtonRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});

export default EditVendor;
