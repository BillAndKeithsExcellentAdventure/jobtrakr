// screens/EditWorkCategory.tsx

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WorkCategoryData } from 'jobdb';
import { Text, TextInput, View } from '@/components/Themed';

const EditWorkCategory = () => {
  const { id } = useLocalSearchParams();
  const [category, setCategory] = useState<WorkCategoryData | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      // Simulate fetching the existing category data by ID
      const fetchedCategory: WorkCategoryData = {
        _id: id,
        CategoryName: 'Electrical',
        CategoryStatus: 'Active',
      };
      setCategory(fetchedCategory);
    }
  }, [id]);

  const handleInputChange = (name: keyof WorkCategoryData, value: string) => {
    if (category) {
      setCategory({
        ...category,
        [name]: value,
      });
    }
  };

  const handleSave = () => {
    if (category) {
      // Simulate saving the edited category (e.g., API call or database update)
      console.log('Updated category:', category);

      // Show success message
      Alert.alert('Category Updated', 'The work category has been successfully updated!');

      // Go back to the categories list screen
      router.push('/');
    }
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Work Category</Text>

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

export default EditWorkCategory;
