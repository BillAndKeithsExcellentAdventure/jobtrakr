import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { VendorData } from 'jobdb';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { useVendorDataStore } from '@/stores/vendorDataStore';

const EditVendor = () => {
  const { id } = useLocalSearchParams();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const router = useRouter();
  const { allVendors, updateVendor } = useVendorDataStore();

  useEffect(() => {
    if (id && allVendors) {
      // Simulate fetching vendor details based on the `id`
      const fetchedVendor: VendorData | undefined = allVendors.find((v) => v._id === id);
      if (!fetchedVendor) {
        Alert.alert('Vendor Not Found', 'The vendor you are trying to edit does not exist.');
        router.back();
        return; // Exit early if the vendor is not found
      }

      setVendor(fetchedVendor);
    }
  }, [id, allVendors]);

  const handleInputChange = (name: keyof VendorData, value: string) => {
    if (vendor) {
      setVendor({
        ...vendor,
        [name]: value,
      });
    }
  };

  const handleSave = () => {
    if (vendor && vendor._id) {
      if (!vendor.VendorName) {
        Alert.alert('Vendor Name Required', 'Please enter a name for the vendor.');
        return;
      }
      updateVendor(vendor._id, vendor);
      router.back();
    }
  };

  if (!vendor) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

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
          style={styles.input}
          placeholder="Vendor Name"
          value={vendor.VendorName}
          onChangeText={(text) => handleInputChange('VendorName', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={vendor.Address}
          onChangeText={(text) => handleInputChange('Address', text)}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="City"
            value={vendor.City}
            onChangeText={(text) => handleInputChange('City', text)}
          />
          <TextInput
            style={[styles.input, { width: 75, marginRight: 8 }]}
            placeholder="State"
            value={vendor.State}
            onChangeText={(text) => handleInputChange('State', text)}
          />
          <TextInput
            style={[styles.input, { width: 80 }]}
            placeholder="Zip"
            value={vendor.Zip}
            keyboardType="number-pad"
            onChangeText={(text) => handleInputChange('Zip', text)}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Mobile Phone"
            keyboardType="phone-pad"
            value={vendor.MobilePhone}
            onChangeText={(text) => handleInputChange('MobilePhone', text)}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Business Phone"
            value={vendor.BusinessPhone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleInputChange('BusinessPhone', text)}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Notes"
          value={vendor.Notes}
          onChangeText={(text) => handleInputChange('Notes', text)}
        />

        <View style={styles.saveButtonRow}>
          <ActionButton
            style={styles.saveButton}
            onPress={handleSave}
            type={vendor.VendorName ? 'ok' : 'disabled'}
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
