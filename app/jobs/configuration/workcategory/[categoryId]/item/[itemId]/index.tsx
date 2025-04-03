import OkayCancelButtons from '@/components/OkayCancelButtons';
import { Text, TextInput, View } from '@/components/Themed';
import { WorkCategoryItemData } from '@/models/types';
// import { useWorkCategoryItemDataStore } from '@/stores/categoryItemDataStore';
import {
  useAddWorkItemCallback,
  useAllWorkItemsCallback,
  useUpdateWorkItemCallback,
} from '@/tbStores/CategoriesStore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditWorkItem = () => {
  const { categoryId, itemId } = useLocalSearchParams();
  const fetchAllWorkCategoryItems = useAllWorkItemsCallback();
  const addWorkItemCategory = useAddWorkItemCallback();
  const updateWorkCategoryItem = useUpdateWorkItemCallback();
  const [item, setItem] = useState<WorkCategoryItemData | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (categoryId) {
      // Simulate fetching the existing category data by ID
      const fetchedItem = fetchAllWorkCategoryItems().find((i) => i._id === itemId);
      setItem(fetchedItem || null);
    }
  }, [categoryId]);

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
      console.log('Updated work item:', item);
      updateWorkCategoryItem(itemId as string, item);
      router.back();
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
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Work Item',
        }}
      />

      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={item.name}
          onChangeText={(text) => handleInputChange('name', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Code"
          value={item.code}
          onChangeText={(text) => handleInputChange('code', text)}
        />
        <OkayCancelButtons okTitle="Save" isOkEnabled={!!item.name && !!item.code} onOkPress={handleSave} />
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

export default EditWorkItem;
