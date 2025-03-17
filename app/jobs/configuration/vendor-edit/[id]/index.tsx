import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { VendorData } from 'jobdb';

const EditVendor = () => {
  const { id } = useLocalSearchParams();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      // Simulate fetching vendor details based on the `id`
      const fetchedVendor: VendorData = {
        _id: id,
        VendorName: 'Vendor 1',
        Address: '123 Main St',
        City: 'City 1',
        State: 'State 1',
        Zip: '12345',
        MobilePhone: '123-456-7890',
        BusinessPhone: '098-765-4321',
        Notes: 'Some notes here',
      };
      setVendor(fetchedVendor);
    }
  }, [id]);

  const handleInputChange = (name: keyof VendorData, value: string) => {
    if (vendor) {
      setVendor({
        ...vendor,
        [name]: value,
      });
    }
  };

  const handleSave = () => {
    if (vendor) {
      // Simulate saving the updated vendor (e.g., API call or database update)
      console.log('Updated vendor:', vendor);

      // For now, we'll just alert the user and navigate back
      Alert.alert('Vendor Updated', 'The vendor details have been successfully updated!');

      // Go back to the vendor list screen after saving
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
    <View style={styles.container}>
      <Text style={styles.header}>Edit Vendor</Text>

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

export default EditVendor;
