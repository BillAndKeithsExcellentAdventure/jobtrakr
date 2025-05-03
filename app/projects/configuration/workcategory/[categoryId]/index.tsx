import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableCategoryItem from './SwipeableCategoryItem';

import { useColors } from '@/context/ColorsContext';
import {
  useAddRowCallback,
  useAllRows,
  useTableValue,
  useTypedRow,
  WorkItemData,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';

const ShowWorkCategory = () => {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const category = useTypedRow('categories', categoryId); // Fetch the category by ID
  const allWorkItems = useAllRows('workItems');
  const addWorkItem = useAddRowCallback('workItems');
  const name = useTableValue('categories', categoryId, 'name');
  const code = useTableValue('categories', categoryId, 'code');
  const [categorySpecificItems, setCategorySpecificItems] = useState<WorkItemData[]>([]);
  const [item, setItem] = useState<WorkItemData>({
    id: '',
    name: '',
    code: '',
    categoryId: '',
    status: '',
  });
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    // Simulate fetching the existing category data by ID
    const fetchedWorkItems = allWorkItems.filter((c) => c.categoryId === categoryId);
    setCategorySpecificItems(fetchedWorkItems);
  }, [categoryId, allWorkItems]);

  const handleInputChange = (name: keyof WorkItemData, value: string) => {
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
        categoryId: categoryId,
      } as WorkItemData;
      console.log('Saving item:', newItem);

      const status = addWorkItem(newItem);

      if (status && status.status === 'Success') {
        // Clear the input fields
        setItem({ id: '', name: '', code: '', categoryId: '', status: '' });
      } else if (status) {
        console.log('Error adding item:', status.msg);
      }
    }
  }, [categoryId, item, addWorkItem]);

  const handleEditCategory = (id: string) => {
    router.push(`/projects/configuration/workcategory/${id}/edit`);
  };

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

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
        <View style={{ backgroundColor: colors.listBackground, padding: 10 }}>
          <TouchableOpacity
            onPress={() => handleEditCategory(category.id)} // Edit on item press
          >
            <View style={[styles.categoryContent, { borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{name}</Text>
                <Text>{code}</Text>
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
              <View style={{ backgroundColor: colors.listBackground }}>
                <View style={{ borderRadius: 10, margin: 10, marginHorizontal: 15, padding: 10 }}>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ width: 120 }}>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.neutral200 }]}
                        placeholder="Code"
                        value={item.code}
                        keyboardType="number-pad"
                        onChangeText={(text) => handleInputChange('code', text)}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 5 }}>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.neutral200 }]}
                        placeholder="Name"
                        value={item.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                      />
                    </View>
                  </View>
                  <ActionButton
                    style={{ paddingHorizontal: 10, zIndex: 1 }}
                    onPress={handleAddItem}
                    type={item.code && item.name ? 'action' : 'disabled'}
                    title="Add Work Item"
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
          <View style={{ flex: 1, paddingHorizontal: 10 }}>
            {categorySpecificItems.length > 0 ? (
              <FlatList
                style={{ borderTopWidth: 1, borderColor: colors.border }}
                data={categorySpecificItems}
                keyExtractor={(item) => item.id}
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
