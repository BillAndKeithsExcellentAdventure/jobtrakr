// screens/ListWorkCategories.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
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
    name: '',
    code: '',
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
            neutral200: Colors.dark.neutral200,
          }
        : {
            listBackground: Colors.light.listBackground,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
            neutral200: Colors.light.neutral200,
          },
    [colorScheme],
  );

  useEffect(() => {
    // Fetch categories from API or local storage (simulated here)
    const fetchCategories = async () => {
      const categoriesData: WorkCategoryData[] = [
        { _id: '1', name: 'Electrical', code: '100' },
        { _id: '2', name: 'Plumbing', code: '200' },
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
    if (category.name && category.code) {
      const newCategory = {
        ...category,
        _id: (allWorkCategories.length + 1).toString(),
      } as WorkCategoryData;

      console.log('Saving item:', newCategory);
      addWorkCategory(newCategory);

      // Clear the input fields
      setCategory({ name: '', code: '', _id: '' });
    }
  }, [allWorkCategories, category, setWorkCategories]);

  const dismissKeyboard = useCallback(() => {
    console.log('Dismiss Keyboard');
    Keyboard.dismiss();
  }, []);

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
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={{ backgroundColor: colors.listBackground }}>
              <View style={{ padding: 10, borderRadius: 10, marginVertical: 15, marginHorizontal: 15 }}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 120 }}>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.neutral200 }]}
                      placeholder="Code"
                      value={category.code}
                      onChangeText={(text) => handleInputChange('Code', text)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.neutral200, marginLeft: 5 }]}
                      placeholder="Name"
                      value={category.name}
                      onChangeText={(text) => handleInputChange('Name', text)}
                    />
                  </View>
                </View>
                <ActionButton
                  style={{ zIndex: 1 }}
                  onPress={handleAddCategory}
                  type={category.code && category.name ? 'action' : 'disabled'}
                  title="Add Work Category"
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
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
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
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
