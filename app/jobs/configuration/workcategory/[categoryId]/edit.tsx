import OkayCancelButtons from '@/components/OkayCancelButtons';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { WorkCategoryData } from '@/models/types';
import { useWorkCategoryDataStore } from '@/stores/categoryDataStore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditWorkCategory = () => {
  const { categoryId } = useLocalSearchParams();
  const { allWorkCategories, updateWorkCategory } = useWorkCategoryDataStore();
  const [category, setCategory] = useState<WorkCategoryData | null>(null);
  const router = useRouter();

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            neutral200: Colors.dark.neutral200,
          }
        : {
            neutral200: Colors.light.neutral200,
          },
    [colorScheme],
  );

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
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Name"
          value={category.Name}
          onChangeText={(text) => handleInputChange('Name', text)}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
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
