import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useAddRowCallback, VendorData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

const AddVendorModal = () => {
  const router = useRouter();
  const colors = useColors();
  const addVendorToStore = useAddRowCallback('vendors');
  const [vendor, setVendor] = useState<VendorData>({
    id: '',
    accountingId: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    mobilePhone: '',
    businessPhone: '',
    notes: '',
  });

  const handleInputChange = useCallback((name: keyof VendorData, value: string) => {
    setVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
    }));
  }, []);

  const handleSave = useCallback(() => {
    const result = addVendorToStore(vendor);

    if (result && result.status !== 'Success') {
      console.error('Failed to add vendor:', result ? result.msg : 'Unknown error');
      return;
    }

    router.back();
  }, [addVendorToStore, vendor, router]);

  const canSave = vendor.name.length > 0;

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        title="Add Vendor/Merchant"
        onSave={handleSave}
        onCancel={() => router.back()}
        canSave={canSave}
      >
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Vendor/Merchant Name"
          value={vendor.name}
          onChangeText={(text) => handleInputChange('name', text)}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Address"
          value={vendor.address}
          onChangeText={(text) => handleInputChange('address', text)}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="City"
            value={vendor.city}
            onChangeText={(text) => handleInputChange('city', text)}
          />
          <TextInput
            style={[styles.input, { width: 75, backgroundColor: colors.neutral200 }]}
            placeholder="State"
            value={vendor.state}
            onChangeText={(text) => handleInputChange('state', text)}
          />
          <TextInput
            style={[styles.input, { width: 80, backgroundColor: colors.neutral200 }]}
            placeholder="Zip"
            value={vendor.zip}
            keyboardType="number-pad"
            onChangeText={(text) => handleInputChange('zip', text)}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="Mobile Phone"
            keyboardType="phone-pad"
            value={vendor.mobilePhone}
            onChangeText={(text) => handleInputChange('mobilePhone', text)}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
            placeholder="Business Phone"
            value={vendor.businessPhone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('businessPhone', text)}
          />
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Notes"
          value={vendor.notes}
          multiline
          onChangeText={(text) => handleInputChange('notes', text)}
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

export default AddVendorModal;
