// screens/AddVendor.tsx

import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { VendorData } from 'jobdb';

const AddVendor = () => {
  const [vendor, setVendor] = useState<VendorData>({
    VendorName: '',
    Address: '',
    City: '',
    State: '',
    Zip: '',
    MobilePhone: '',
    BusinessPhone: '',
    Notes: '',
  });

  const router = useRouter();

  const handleInputChange = (name: keyof VendorData, value: string) => {
    setVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // Handle saving the vendor (e.g., API call or local storage)
    console.log('Saving vendor:', vendor);
    router.push('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Vendor</Text>
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
      <TextInput
        style={styles.input}
        placeholder="City"
        value={vendor.City}
        onChangeText={(text) => handleInputChange('City', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="State"
        value={vendor.State}
        onChangeText={(text) => handleInputChange('State', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Zip Code"
        value={vendor.Zip}
        onChangeText={(text) => handleInputChange('Zip', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile Phone"
        value={vendor.MobilePhone}
        onChangeText={(text) => handleInputChange('MobilePhone', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Business Phone"
        value={vendor.BusinessPhone}
        onChangeText={(text) => handleInputChange('BusinessPhone', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Notes"
        value={vendor.Notes}
        onChangeText={(text) => handleInputChange('Notes', text)}
      />
      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Vendor</Text>
      </TouchableOpacity>
    </View>
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
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default AddVendor;
