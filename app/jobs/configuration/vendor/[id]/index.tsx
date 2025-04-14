import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { VendorData } from '@/models/types';
import { useUpdateRowCallback, useTypedRow } from '@/tbStores/configurationStore/hooks';

const EditVendor = () => {
  const { id } = useLocalSearchParams();
  const applyVendorUpdates = useUpdateRowCallback('vendors');

  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            listBackground: Colors.dark.listBackground,
            neutral200: Colors.dark.neutral200,
          }
        : {
            listBackground: Colors.light.listBackground,
            neutral200: Colors.light.neutral200,
          },
    [colorScheme],
  );

  const [updatedVendor, setUpdatedVendor] = useState<VendorData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    mobilePhone: '',
    businessPhone: '',
    notes: '',
  });

  const vendorFromStore = useTypedRow('vendors', id as string);

  useEffect(() => {
    if (vendorFromStore) {
      setUpdatedVendor({
        ...vendorFromStore,
      });
    }
  }, [vendorFromStore]);

  const handleInputChange = (name: keyof VendorData, value: string) => {
    setUpdatedVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!!updatedVendor.name) {
      applyVendorUpdates(id as string, updatedVendor);
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
