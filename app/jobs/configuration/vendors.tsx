// screens/ListVendors.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons'; // Use FontAwesome for the ">" icon
import { VendorData } from 'jobdb';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ActionButton } from '@/components/ActionButton';
import { Text, View } from '@/components/Themed';

const VendorsScreen = () => {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  useEffect(() => {
    // Fetch vendors from API or local storage (simulated here)
    const fetchVendors = async () => {
      const vendorsData: VendorData[] = [
        { _id: '1', VendorName: 'Vendor 1', City: 'City 1', BusinessPhone: '123-456-7890' },
        { _id: '2', VendorName: 'Vendor 2', City: 'City 2', BusinessPhone: '123-456-0780' },
      ];
      setVendors(vendorsData);
    };

    fetchVendors();
  }, []);

  const handleAddVendor = () => {
    router.push('/jobs/configuration/vendor-add');
  };

  const handleEditVendor = (id: string) => {
    router.push(`/jobs/configuration/vendor-edit/${id}`);
  };

  const renderVendor = ({ item }: { item: VendorData }) => (
    <TouchableOpacity
      onPress={() => handleEditVendor(item._id!)} // Edit on item press
      style={styles.vendorItem}
    >
      <View style={[styles.vendorContent, { borderColor: colors.borderColor, borderWidth: 1 }]}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{item.VendorName}</Text>
          <Text>{item.City}</Text>
          <Text>{item.BusinessPhone}</Text>
        </View>
        <View>
          <FontAwesome name="chevron-right" size={24} color={colors.iconColor} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Vendors',
        }}
      />
      <ActionButton onPress={handleAddVendor} style={styles.addButton} type="action" title="Add Vendor" />

      <FlatList data={vendors} keyExtractor={(item) => item._id!} renderItem={renderVendor} />
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
  addButton: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default VendorsScreen;
