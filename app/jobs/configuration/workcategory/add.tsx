// screens/AddWorkCategory.tsx

import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, TextInput, View } from '@/components/Themed';
import { WorkCategoryData } from '@/app/models/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/ActionButton';
import { useWorkCategoryDataStore } from '@/stores/categoryDataStore';
import OkayCancelButtons from '@/components/OkayCancelButtons';

const AddWorkCategory = () => {
  const { allWorkCategories, addWorkCategory } = useWorkCategoryDataStore();
  const [category, setCategory] = useState<WorkCategoryData>({
    Name: '',
    Code: '',
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
    const newCategory = { ...category, _id: String(allWorkCategories.length + 1) };
    console.log('Saving category:', newCategory);
    addWorkCategory(newCategory);

    // Go back to the categories list screen
    router.back();
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Work Category',
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
});

export default AddWorkCategory;
