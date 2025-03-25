// screens/ListVendors.tsx

import { ActionButton } from '@/components/ActionButton';
import { TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useVendorDataStore } from '@/stores/vendorDataStore';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { VendorData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, StyleSheet } from 'react-native';
import { Pressable, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableVendor from './SwipeableVendor';

const VendorsScreen = () => {
  const { allVendors, setVendorData, addVendor } = useVendorDataStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [showAdd, setShowAdd] = useState(false);
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

  useEffect(() => {
    // Fetch vendors from API or local storage (simulated here)
    const fetchVendors = async () => {
      const vendorsData: VendorData[] = [
        {
          _id: '1',
          VendorName: 'Vendor 1',
          City: 'City 1',
          Address: '101 West Hwy 22',
          BusinessPhone: '123-456-7890',
        },
        {
          _id: '2',
          VendorName: 'Vendor 2',
          Address: '2044 Bardstown Rd',
          BusinessPhone: '123-456-0780',
        },
      ];
      setVendorData(vendorsData);
    };

    fetchVendors();
  }, []);

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
    if (vendor.VendorName) {
      const newVendor = {
        ...vendor,
        _id: (allVendors.length + 1).toString(),
      } as VendorData;

      console.log('Saving item:', newVendor);
      addVendor(newVendor);

      // Clear the input fields
      setVendor({
        VendorName: '',
        Address: '',
        City: '',
        State: '',
        Zip: '',
        MobilePhone: '',
        BusinessPhone: '',
        Notes: '',
      });
    }
  }, [allVendors, vendor]);

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
            <View style={{ padding: 10, borderRadius: 10, marginVertical: 10, marginHorizontal: 15 }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.neutral200 }]}
                placeholder="Vendor Name"
                value={vendor.VendorName}
                onChangeText={(text) => handleInputChange('VendorName', text)}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.neutral200 }]}
                placeholder="Address"
                value={vendor.Address}
                onChangeText={(text) => handleInputChange('Address', text)}
              />
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
                  placeholder="City"
                  value={vendor.City}
                  onChangeText={(text) => handleInputChange('City', text)}
                />
                <TextInput
                  style={[styles.input, { width: 75, marginRight: 8, backgroundColor: colors.neutral200 }]}
                  placeholder="State"
                  value={vendor.State}
                  onChangeText={(text) => handleInputChange('State', text)}
                />
                <TextInput
                  style={[styles.input, { width: 80, backgroundColor: colors.neutral200 }]}
                  placeholder="Zip"
                  value={vendor.Zip}
                  keyboardType="number-pad"
                  onChangeText={(text) => handleInputChange('Zip', text)}
                />
              </View>
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.neutral200 }]}
                  placeholder="Mobile Phone"
                  keyboardType="phone-pad"
                  value={vendor.MobilePhone}
                  onChangeText={(text) => handleInputChange('MobilePhone', text)}
                />
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.neutral200 }]}
                  placeholder="Business Phone"
                  value={vendor.BusinessPhone}
                  keyboardType="phone-pad"
                  onChangeText={(text) => handleInputChange('BusinessPhone', text)}
                />
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.neutral200 }]}
                placeholder="Notes"
                value={vendor.Notes}
                onChangeText={(text) => handleInputChange('Notes', text)}
              />

              <ActionButton
                onPress={handleSave}
                type={vendor.VendorName ? 'action' : 'disabled'}
                title="Add Vendor"
              />
            </View>
          </TouchableWithoutFeedback>
        )}

        <FlatList
          style={{ borderTopColor: colors.borderColor }}
          data={allVendors}
          keyExtractor={(item) => item._id!}
          renderItem={({ item }) => <SwipeableVendor vendor={item} />}
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
