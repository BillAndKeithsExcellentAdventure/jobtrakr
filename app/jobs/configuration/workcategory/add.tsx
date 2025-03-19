// screens/AddWorkCategory.tsx

import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, TextInput, View } from '@/components/Themed';
import { WorkCategoryData } from '@/app/models/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/ActionButton';

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
        <View style={styles.saveButtonRow}>
          <ActionButton
            style={styles.saveButton}
            onPress={handleSave}
            type={category.CategoryName ? 'ok' : 'disabled'}
            title="Save"
          />
          <ActionButton
            style={styles.cancelButton}
            onPress={() => {
              router.back();
            }}
            type={'cancel'}
            title="Cancel"
          />
        </View>
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
  saveButtonRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});

export default AddWorkCategory;
