// screens/EditWorkCategoryItem.tsx

import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WorkCategoryItemData } from '@/app/models/types';

const EditWorkCategoryItem = () => {
  const { id } = useLocalSearchParams(); // Get id from URL params
  const [item, setItem] = useState<WorkCategoryItemData | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      // Simulate fetching the existing item data by ID
      const fetchedItem: WorkCategoryItemData = {
        _id: id,
        Name: 'Circuit Breaker',
        ItemStatus: 'Active',
      };
      setItem(fetchedItem);
    }
  }, [id]);

  const handleInputChange = (name: keyof WorkCategoryItemData, value: string) => {
    if (item) {
      setItem({
        ...item,
        [name]: value,
      });
    }
  };

  const handleSave = () => {
    if (item) {
      // Simulate saving the edited item (e.g., API call or database update)
      console.log('Updated item:', item);

      // Show success message
      Alert.alert('Item Updated', 'The work category item has been successfully updated!');

      // Go back to the category items list screen
      router.push(`/work-category-items/${item.CategoryId}`);
    }
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Work Category Item</Text>

      <TextInput
        style={styles.input}
        placeholder="Item Name"
        value={item.Name}
        onChangeText={(text) => handleInputChange('ItemName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Item Status"
        value={item.ItemStatus}
        onChangeText={(text) => handleInputChange('ItemStatus', text)}
      />

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
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

export default EditWorkCategoryItem;
