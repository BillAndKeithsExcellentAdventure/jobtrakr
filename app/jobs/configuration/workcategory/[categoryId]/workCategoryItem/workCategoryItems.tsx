// screens/ListWorkCategoryItems.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // Right caret icon
import { WorkCategoryItemData } from '@/app/models/types';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

const ListWorkCategoryItems = () => {
  const { categoryId } = useLocalSearchParams(); // Get categoryId from URL params
  const [items, setItems] = useState<WorkCategoryItemData[]>([]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  useEffect(() => {
    if (categoryId) {
      // Simulate fetching items based on the categoryId
      const categoryItems: WorkCategoryItemData[] = [
        { _id: '1', CategoryId: categoryId, Name: 'Circuit Breaker', ItemStatus: 'Active' },
        { _id: '2', CategoryId: categoryId, Name: 'Wire', ItemStatus: 'Inactive' },
      ];
      setItems(categoryItems);
    }
  }, [categoryId]);

  const handleAddItem = () => {
    router.push(`/add-work-category-item/${categoryId}`);
  };

  const handleEditItem = (id: string) => {
    router.push(`/edit-work-category-item/${id}`);
  };

  const renderItem = ({ item }: { item: WorkCategoryItemData }) => (
    <TouchableOpacity
      onPress={() => handleEditItem(item._id!)} // Edit on item press
      style={styles.item}
    >
      <View style={[styles.itemContent, { borderColor: colors.borderColor, borderWidth: 1 }]}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.Name}</Text>
          <Text>{item.ItemStatus}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Work Category Items</Text>
      <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Item</Text>
      </TouchableOpacity>
      <FlatList data={items} keyExtractor={(item) => item._id!} renderItem={renderItem} />
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

  item: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
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

export default ListWorkCategoryItems;
