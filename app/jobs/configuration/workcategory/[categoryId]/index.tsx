import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TouchableOpacity, StyleSheet, Alert, useColorScheme, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Text, TextInput, View } from '@/components/Themed';
import { WorkCategoryData, WorkCategoryItemData } from '@/app/models/types';
import { useWorkCategoryDataStore } from '@/stores/categoryDataStore';
import { useWorkCategoryItemDataStore } from '@/stores/categoryItemDataStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { ActionButton } from '@/components/ActionButton';

const ShowWorkCategory = () => {
  const { categoryId } = useLocalSearchParams();
  const { allWorkCategories, updateWorkCategory } = useWorkCategoryDataStore();
  const { allWorkCategoryItems, setWorkCategoryItems } = useWorkCategoryItemDataStore();
  const [categorySpecificItems, setCategorySpecificItems] = useState<WorkCategoryItemData[]>([]);
  const [item, setItem] = useState<WorkCategoryItemData>({
    Name: '',
    Code: '',
  });
  const [category, setCategory] = useState<WorkCategoryData | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            listBackground: Colors.dark.listBackground,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            background: Colors.light.background,
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  useEffect(() => {
    if (categoryId) {
      // Simulate fetching the existing category data by ID
      const fetchedCategory = allWorkCategories.find((c) => c._id === categoryId);
      setCategory(fetchedCategory || null);
    }
  }, [categoryId, allWorkCategories]);

  useEffect(() => {
    if (categoryId) {
      // Simulate fetching the existing category data by ID
      const fetchedCategoryItems = allWorkCategoryItems.filter((c) => c.CategoryId === categoryId);
      if (fetchedCategoryItems) {
        setCategorySpecificItems(fetchedCategoryItems);
      }
    }
  }, [categoryId, allWorkCategoryItems]);

  const handleInputChange = (name: keyof WorkCategoryItemData, value: string) => {
    if (item) {
      setItem({
        ...item,
        [name]: value,
      });
    }
  };

  const handleAddItem = useCallback(() => {
    if (item) {
      // Simulate saving the new item (e.g., API call or database insertion)
      const newItem = {
        ...item,
        _id: (allWorkCategoryItems.length + 1).toString(),
        CategoryId: categoryId,
      } as WorkCategoryItemData;
      setWorkCategoryItems([...allWorkCategoryItems, newItem]);
      console.log('Saving item:', newItem);

      // Clear the input fields
      setItem({ Name: '', Code: '' });
    }
  }, [allWorkCategoryItems, categoryId, item, setWorkCategoryItems]);

  const handleEditCategory = (id: string) => {
    router.push(`/jobs/configuration/workcategory/${id}/edit`);
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
          title: 'Work Category',
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        <View style={{ borderRadius: 10 }}>
          <TouchableOpacity
            onPress={() => handleEditCategory(category._id!)} // Edit on item press
          >
            <View style={[styles.categoryContent, { borderColor: colors.borderColor, borderWidth: 1 }]}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.Name}</Text>
                <Text>{category.Code}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
            </View>
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.categoryItems,
            {
              flex: 1,
              backgroundColor: colors.background,
              borderRadius: 10,
              paddingHorizontal: 10,
            },
          ]}
        >
          <View style={{ alignItems: 'center', margin: 5 }}>
            <Text text="Work Category Items" txtSize="title" />
          </View>
          <View>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 120 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Code"
                  value={item.Code}
                  onChangeText={(text) => handleInputChange('Code', text)}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  value={item.Name}
                  onChangeText={(text) => handleInputChange('Name', text)}
                />
              </View>
            </View>
            <ActionButton
              onPress={handleAddItem}
              type={item.Code && item.Name ? 'action' : 'disabled'}
              title="Add Work Item"
            />
          </View>
          <View style={{ flex: 1, marginTop: 20, backgroundColor: colors.background }}>
            {categorySpecificItems.length > 0 ? (
              <FlatList
                style={{ borderTopWidth: 1, borderColor: colors.borderColor }}
                data={categorySpecificItems}
                keyExtractor={(item) => item._id!}
                renderItem={({ item }) => (
                  <View style={[styles.itemEntry, { borderColor: colors.borderColor, borderBottomWidth: 1 }]}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemCode}>{item.Code}</Text>
                      <Text style={styles.itemName}>{item.Name}</Text>
                      <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
                    </View>
                  </View>
                )}
              />
            ) : (
              <View style={{ alignItems: 'center', margin: 20 }}>
                <Text
                  txtSize="title"
                  text="No items found for this category."
                  style={{ textAlign: 'center', marginBottom: 10 }}
                />
                <Text text="To add an item, define its Code and Name and press Add Work Item." />
              </View>
            )}
          </View>
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
  categoryItems: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
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
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 8,
    borderRadius: 10,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 40,
  },
  itemName: {
    width: 200,
    marginRight: 10,
  },
  itemEntry: {
    width: '100%',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemCode: {
    flex: 1,
  },
  categoryItem: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },

  categoryInfo: {
    flex: 1,
  },
});

export default ShowWorkCategory;
