// screens/ListWorkCategories.tsx

import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons'; // Right caret icon
import { Text, View } from '@/components/Themed';
import { WorkCategoryData } from '@/app/models/types';

const ListWorkCategories = () => {
  const [categories, setCategories] = useState<WorkCategoryData[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch categories from API or local storage (simulated here)
    const fetchCategories = async () => {
      const categoriesData: WorkCategoryData[] = [
        { _id: '1', CategoryName: 'Electrical', CategoryStatus: 'Active' },
        { _id: '2', CategoryName: 'Plumbing', CategoryStatus: 'Inactive' },
      ];
      setCategories(categoriesData);
    };

    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    router.push('/jobs/configuration/workcategory/add');
  };

  const handleEditCategory = (id: string) => {
    router.push(`/jobs/configuration/workcategory/${id}`);
  };

  const renderCategory = ({ item }: { item: WorkCategoryData }) => (
    <TouchableOpacity
      onPress={() => handleEditCategory(item._id!)} // Edit on item press
      style={styles.categoryItem}
    >
      <View style={styles.categoryContent}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.CategoryName}</Text>
          <Text>{item.CategoryStatus}</Text>
        </View>
        <FontAwesome name="chevron-right" size={24} color="gray" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Work Categories</Text>
      <TouchableOpacity onPress={handleAddCategory} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Category</Text>
      </TouchableOpacity>
      <FlatList data={categories} keyExtractor={(item) => item._id!} renderItem={renderCategory} />
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
  categoryItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    marginBottom: 16,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default ListWorkCategories;
