// screens/ListWorkCategories.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // Right caret icon
import { Text, TextInput, View } from '@/components/Themed';
import { WorkCategoryData } from '@/models/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/ActionButton';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useWorkCategoryDataStore } from '@/stores/categoryDataStore';
import { Pressable } from 'react-native-gesture-handler';
import SwipeableCategory from './SwipeableCategory';

const ListWorkCategories = () => {
  const { allWorkCategories, setWorkCategories, addWorkCategory } = useWorkCategoryDataStore();
  const [showAdd, setShowAdd] = useState(false);
  const [category, setCategory] = useState<WorkCategoryData>({
    Name: '',
    Code: '',
  });

  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            listBackground: Colors.dark.listBackground,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  useEffect(() => {
    // Fetch categories from API or local storage (simulated here)
    const fetchCategories = async () => {
      const categoriesData: WorkCategoryData[] = [
        { _id: '1', Name: 'Electrical', Code: '100' },
        { _id: '2', Name: 'Plumbing', Code: '200' },
      ];
      setWorkCategories(categoriesData);
    };

    fetchCategories();
  }, []);

  const handleInputChange = (name: keyof WorkCategoryData, value: string) => {
    if (category) {
      setCategory({
        ...category,
        [name]: value,
      });
    }
  };

  const handleEditCategory = (id: string) => {
    router.push(`/jobs/configuration/workcategory/${id}`);
  };

  const renderHeaderRight = () => (
    <Pressable
      // work around for https://github.com/software-mansion/react-native-screens/issues/2219
      // use Pressable from react-native-gesture-handler
      onPress={() => setShowAdd(!showAdd)}
      hitSlop={10}
      style={styles.headerButton}
    >
      <Ionicons name={showAdd ? 'chevron-up-sharp' : 'add'} size={24} color={colors.iconColor} />
    </Pressable>
  );

  const handleAddCategory = useCallback(() => {
    if (category.Name && category.Code) {
      const newCategory = {
        ...category,
        _id: (allWorkCategories.length + 1).toString(),
      } as WorkCategoryData;

      console.log('Saving item:', newCategory);
      addWorkCategory(newCategory);

      // Clear the input fields
      setCategory({ Name: '', Code: '', _id: '' });
    }
  }, [allWorkCategories, category, setWorkCategories]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Work Categories',
          headerRight: renderHeaderRight,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        {showAdd && (
          <View style={{ padding: 10, borderRadius: 10, marginVertical: 10, marginHorizontal: 15 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 120 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Code"
                  value={category.Code}
                  onChangeText={(text) => handleInputChange('Code', text)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  value={category.Name}
                  onChangeText={(text) => handleInputChange('Name', text)}
                />
              </View>
            </View>
            <ActionButton
              onPress={handleAddCategory}
              type={category.Code && category.Name ? 'action' : 'disabled'}
              title="Add Work  Category"
            />
          </View>
        )}
        <View>
          <FlatList
            data={allWorkCategories}
            keyExtractor={(item) => item._id!}
            renderItem={({ item }) => <SwipeableCategory category={item} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerButton: {
    padding: 8,
    paddingRight: 0,
    zIndex: 1,
  },
});

export default ListWorkCategories;
