// screens/ListVendors.tsx

import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAddRowCallback,
  useAllRows,
  VendorData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableVendor from '../../../../../components/SwipeableVendor';

const VendorsScreen = () => {
  const router = useRouter();
  const addVendorToStore = useAddRowCallback('vendors');
  const allVendors = useAllRows('vendors');
  const [showAdd, setShowAdd] = useState(false);
  const [vendor, setVendor] = useState<VendorData>({
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

  const handleEditVendor = (id: string) => {
    router.push({
      pathname: '/configuration/vendor/[id]',
      params: { id },
    });
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

  return (
    <>
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
          )}

          <FlatList
            style={{ borderTopColor: colors.border }}
            data={allVendors}
            keyExtractor={(item) => item.id}
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
      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </>
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
