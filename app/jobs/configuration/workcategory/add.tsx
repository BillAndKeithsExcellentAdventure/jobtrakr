// screens/AddWorkCategory.tsx

import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WorkCategoryData } from 'jobdb';
import { Text, TextInput, View } from '@/components/Themed';

const AddWorkCategory = () => {
  const [category, setCategory] = useState<WorkCategoryData>({
    CategoryName: '',
    CategoryStatus: 'Active', // Default to Active
  });

  const router = useRouter();

  const handleInputChange = (name: keyof WorkCategoryData, value: string) => {
    setCategory((prevCategory) => ({
      ...prevCategory,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // Simulate saving the new category (e.g., API call or database insertion)
    console.log('Saving category:', category);

    // Show success message
    Alert.alert('Category Added', 'The work category has been successfully added!');

    // Go back to the categories list screen
    router.push('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Work Category</Text>

      <TextInput
        style={styles.input}
        placeholder="Category Name"
        value={category.CategoryName}
        onChangeText={(text) => handleInputChange('CategoryName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Category Status"
        value={category.CategoryStatus}
        onChangeText={(text) => handleInputChange('CategoryStatus', text)}
      />

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Category</Text>
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

export default AddWorkCategory;
