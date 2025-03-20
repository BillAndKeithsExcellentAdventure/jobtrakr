// screens/EditWorkCategory.tsx

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Text, TextInput, View } from '@/components/Themed';
import { WorkCategoryData } from '@/app/models/types';
import { useWorkCategoryDataStore } from '@/stores/categoryDataStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import OkayCancelButtons from '@/components/OkayCancelButtons';

const EditWorkCategory = () => {
  const { categoryId } = useLocalSearchParams();
  const { allWorkCategories, updateWorkCategory } = useWorkCategoryDataStore();
  const [category, setCategory] = useState<WorkCategoryData | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (categoryId) {
      // Simulate fetching the existing category data by ID
      const fetchedCategory = allWorkCategories.find((c) => c._id === categoryId);
      setCategory(fetchedCategory || null);
    }
  }, [categoryId]);

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
      updateWorkCategory(categoryId as string, category);

      // Go back to the categories list screen
      router.back();
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
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Work Category',
        }}
      />

      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={category.Name}
          onChangeText={(text) => handleInputChange('Name', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Code"
          value={category.Code}
          onChangeText={(text) => handleInputChange('Code', text)}
        />
        <OkayCancelButtons
          okTitle="Save"
          isOkEnabled={!!category.Name && !!category.Code}
          onOkPress={handleSave}
        />
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
