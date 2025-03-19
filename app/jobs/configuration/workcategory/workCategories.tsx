// screens/ListWorkCategories.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // Right caret icon
import { Text, View } from '@/components/Themed';
import { WorkCategoryData } from '@/app/models/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/ActionButton';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

const ListWorkCategories = () => {
  const [categories, setCategories] = useState<WorkCategoryData[]>([]);
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
      <View style={[styles.categoryContent, { borderColor: colors.borderColor, borderWidth: 1 }]}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.CategoryName}</Text>
          <Text>{item.CategoryStatus}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Work Categories',
        }}
      />

      <View style={styles.container}>
        <ActionButton onPress={handleAddCategory} type="action" title="Add Category" />
        <FlatList data={categories} keyExtractor={(item) => item._id!} renderItem={renderCategory} />
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 8,
    borderRadius: 8,
  },

  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ListWorkCategories;
