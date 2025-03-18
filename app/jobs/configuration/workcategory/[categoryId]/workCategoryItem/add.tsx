// screens/AddWorkCategoryItem.tsx

import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WorkCategoryItemData } from '@/app/models/types';

const AddWorkCategoryItem = () => {
  const { categoryId } = useLocalSearchParams(); // Get categoryId from URL params
  const [item, setItem] = useState<WorkCategoryItemData>({
    ItemName: '',
    ItemStatus: 'Active', // Default to Active
  });

  const router = useRouter();

  const handleInputChange = (name: keyof WorkCategoryItemData, value: string) => {
    setItem((prevItem) => ({
      ...prevItem,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (categoryId) {
      // Simulate saving the new work category item (e.g., API call or database insertion)
      console.log('Saving new item:', item);

      // Show success message
      Alert.alert('Item Added', 'The work category item has been successfully added!');

      // Go back to the list of category items
      router.push(`/work-category-items/${categoryId}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Work Category Item</Text>

      <TextInput
        style={styles.input}
        placeholder="Item Name"
        value={item.ItemName}
        onChangeText={(text) => handleInputChange('ItemName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Item Status"
        value={item.ItemStatus}
        onChangeText={(text) => handleInputChange('ItemStatus', text)}
      />

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Item</Text>
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

export default AddWorkCategoryItem;
