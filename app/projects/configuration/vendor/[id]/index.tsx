import { ActionButton } from '@/components/ActionButton';
import { TextInput, View } from '@/components/Themed';
import { useColors } from '@/context/ColorsContext';
import {
  useTypedRow,
  useUpdateRowCallback,
  VendorData,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditVendor = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const applyVendorUpdates = useUpdateRowCallback('vendors');

  const router = useRouter();
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
  useEffect(() => {
    if (vendorFromStore) {
      setUpdatedVendor((prevVendor) => (prevVendor.id !== id ? vendorFromStore : prevVendor));
    }
  }, [vendorFromStore, id]);
  const handleInputChange = (name: keyof VendorData, value: string) => {
    setUpdatedVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!!updatedVendor.name) {
      applyVendorUpdates(id, updatedVendor);
    }
    // Go back to the categories list screen
    router.back();
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
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Address"
          value={updatedVendor.address}
          onChangeText={(text) => handleInputChange('address', text)}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="City"
            value={updatedVendor.city}
            onChangeText={(text) => handleInputChange('city', text)}
          />
          <TextInput
            style={[styles.input, { width: 75, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="State"
            value={updatedVendor.state}
            onChangeText={(text) => handleInputChange('state', text)}
          />
          <TextInput
            style={[styles.input, { width: 80, backgroundColor: colors.neutral200 }]}
            placeholder="Zip"
            value={updatedVendor.zip}
            keyboardType="number-pad"
            onChangeText={(text) => handleInputChange('zip', text)}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
            placeholder="Mobile Phone"
            keyboardType="phone-pad"
            value={updatedVendor.mobilePhone}
            onChangeText={(text) => handleInputChange('mobilePhone', text)}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="Business Phone"
            value={updatedVendor.businessPhone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('businessPhone', text)}
          />
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Notes"
          value={updatedVendor.notes}
          onChangeText={(text) => handleInputChange('notes', text)}
        />

        <View style={styles.saveButtonRow}>
          <ActionButton
            style={styles.saveButton}
            onPress={handleSave}
            type={updatedVendor.name ? 'ok' : 'disabled'}
            title="Save"
          />
          <ActionButton
            style={styles.cancelButton}
            onPress={() => {
              router.back();
            }}
            type={'cancel'}
            title="Cancel"
          />
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
