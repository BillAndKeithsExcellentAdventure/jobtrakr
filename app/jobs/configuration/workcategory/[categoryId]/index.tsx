import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
  FlatList,
  Pressable,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Text, TextInput, View } from '@/components/Themed';
import { WorkCategoryData, WorkCategoryItemData } from '@/models/types';
import { useWorkCategoryDataStore } from '@/stores/categoryDataStore';
import { useWorkCategoryItemDataStore } from '@/stores/categoryItemDataStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ActionButton } from '@/components/ActionButton';
import SwipeableCategoryItem from './SwipeableCategoryItem';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

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
  const [showAdd, setShowAdd] = useState(false);
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
            neutral200: Colors.dark.neutral200,
          }
        : {
            background: Colors.light.background,
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
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
      console.log('Saving item:', newItem);

      setWorkCategoryItems(
        [...allWorkCategoryItems, newItem].sort(
          (a, b) => Number.parseInt(a.Code ?? '0') - Number.parseInt(b.Code ?? '0'),
        ),
      );

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

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Work Category',
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        <View style={{ backgroundColor: colors.listBackground, padding: 10 }}>
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
        <View style={[styles.categoryItems, { backgroundColor: colors.listBackground }]}>
          <View style={styles.categoryListHeader}>
            <View style={{ alignItems: 'center', marginHorizontal: 5, flex: 1 }}>
              <Text text="Work Items" txtSize="title" />
            </View>
            <TouchableOpacity style={{ padding: 4, paddingRight: 20 }} onPress={() => setShowAdd(!showAdd)}>
              <Ionicons name={showAdd ? 'chevron-up-sharp' : 'add'} size={24} color={colors.iconColor} />
            </TouchableOpacity>
          </View>
          {showAdd && (
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={{ borderRadius: 10, margin: 10, marginHorizontal: 15, padding: 10 }}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 120 }}>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.neutral200 }]}
                      placeholder="Code"
                      value={item.Code}
                      onChangeText={(text) => handleInputChange('Code', text)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 5 }}>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.neutral200 }]}
                      placeholder="Name"
                      value={item.Name}
                      onChangeText={(text) => handleInputChange('Name', text)}
                    />
                  </View>
                </View>
                <ActionButton
                  style={{ paddingHorizontal: 10 }}
                  onPress={handleAddItem}
                  type={item.Code && item.Name ? 'action' : 'disabled'}
                  title="Add Work Item"
                />
              </View>
            </TouchableWithoutFeedback>
          )}
          <View style={{ flex: 1, paddingHorizontal: 10 }}>
            {categorySpecificItems.length > 0 ? (
              <FlatList
                style={{ borderTopWidth: 1, borderColor: colors.borderColor }}
                data={categorySpecificItems}
                keyExtractor={(item) => item._id!}
                renderItem={({ item }) => <SwipeableCategoryItem item={item} category={category} />}
              />
            ) : (
              <View style={{ alignItems: 'center', margin: 20 }}>
                {!showAdd && (
                  <>
                    <Text
                      txtSize="title"
                      text="No items found for this category."
                      style={{ textAlign: 'center', marginBottom: 10 }}
                    />
                    <Text text="To add an item, press '+' icon and then Add Work Item." />
                  </>
                )}
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
    padding: 0,
    flex: 1,
  },
  categoryItems: {
    flex: 1,
  },
  categoryListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
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
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
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
