// screens/ListVendors.tsx

import { ActionButton } from '@/components/ActionButton';
import { TextInput, Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableVendor from './SwipeableVendor';
import { VendorData } from '@/models/types';
import { useAllVendors, useAddVendorCallback } from '@/tbStores/configurationStore/ConfigurationStore';

const VendorsScreen = () => {
  const router = useRouter();
  const allVendors = useAllVendors();
  const addVendorToStore = useAddVendorCallback();
  const [showAdd, setShowAdd] = useState(false);
  const [vendor, setVendor] = useState<VendorData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    mobilePhone: '',
    businessPhone: '',
    notes: '',
  });

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
            listBackground: Colors.dark.listBackground,
            neutral200: Colors.dark.neutral200,
          }
        : {
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
            listBackground: Colors.light.listBackground,
            neutral200: Colors.light.neutral200,
          },
    [colorScheme],
  );

  const handleEditVendor = (id: string) => {
    router.push(`/jobs/configuration/vendor/${id}`);
  };

  const handleInputChange = (name: keyof VendorData, value: string) => {
    setVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
    }));
  };

  const handleSave = useCallback(() => {
    const result = addVendorToStore(vendor);

    if (result && result.status !== 'Success') {
      console.error('Failed to add vendor:', result ? result.msg : 'Unknown error');
    }

    // Clear the input fields
    setVendor({
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      mobilePhone: '',
      businessPhone: '',
      notes: '',
    });
  }, [addVendorToStore, vendor]);

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

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Vendors',
          headerRight: renderHeaderRight,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        {showAdd && (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={{ backgroundColor: colors.listBackground }}>
              <View style={{ padding: 10, borderRadius: 10, marginVertical: 10, marginHorizontal: 15 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral200 }]}
                  placeholder="Vendor Name"
                  value={vendor.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral200 }]}
                  placeholder="Address"
                  value={vendor.address}
                  onChangeText={(text) => handleInputChange('address', text)}
                />
                <View style={{ flexDirection: 'row' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
                    placeholder="City"
                    value={vendor.city}
                    onChangeText={(text) => handleInputChange('city', text)}
                  />
                  <TextInput
                    style={[styles.input, { width: 75, marginRight: 8, backgroundColor: colors.neutral200 }]}
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
                <View style={{ flexDirection: 'row' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
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
                  onChangeText={(text) => handleInputChange('notes', text)}
                />

                <ActionButton
                  onPress={handleSave}
                  type={vendor.name ? 'action' : 'disabled'}
                  title="Add Vendor"
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        <FlatList
          style={{ borderTopColor: colors.borderColor }}
          data={allVendors}
          keyExtractor={(item) => item._id!}
          renderItem={({ item }) => <SwipeableVendor vendor={item} />}
          ListEmptyComponent={() => (
            <View
              style={{
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Text txtSize="title" text="No vendors found." />
              <Text text="Use the '+' in the upper right to add one." />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  vendorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  vendorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 8,
    borderRadius: 8,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
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

export default VendorsScreen;
