import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAddRowCallback,
  useAllRows,
  useDeleteRowCallback,
  WorkCategoryCodeCompareAsNumber,
  WorkCategoryData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Right caret icon
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableCategory from '../../../../../components/SwipeableCategory';

const ListWorkCategories = () => {
  const addWorkCategory = useAddRowCallback('categories');
  const allCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const allWorkItems = useAllRows('workItems');
  const removeWorkItemCallback = useDeleteRowCallback('workItems');

  const orphanedWorkItemIds = useMemo(
    () => allWorkItems.filter((w) => undefined === w.categoryId || null === w.categoryId).map((i) => i.id),
    [allWorkItems],
  );

  const [showAdd, setShowAdd] = useState(false);
  const [category, setCategory] = useState<WorkCategoryData>({
    id: '',
    name: '',
    code: '',
    status: '',
  });

  const router = useRouter();
  const colors = useColors();

  const handleInputChange = (name: keyof WorkCategoryData, value: string) => {
    if (category) {
      setCategory({
        ...category,
        [name]: value,
      });
    }
  };

  const handleEditCategory = (id: string) => {
    router.push({
      pathname: '/configuration/workcategory/[categoryId]',
      params: { categoryId: category.id },
    });
  };

  const handleCleanup = useCallback(() => {
    Alert.alert(
      'Configuration Clean-up',
      'Proceed with processing to find and clean up orphaned work items that are not associated with a work category?',
      [
        { text: 'Cancel' },
        {
          text: 'Proceed',
          onPress: () => {
            console.log(`removing ${orphanedWorkItemIds.length} orphaned ids`);
            for (const id of orphanedWorkItemIds) {
              const result = removeWorkItemCallback(id);
              if (result.status !== 'Success')
                console.log(`error removing workItem with id= ${id} - ${result.msg} `);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [orphanedWorkItemIds, removeWorkItemCallback]);

  const renderHeaderRight = useMemo(
    () => () =>
      (
        <View
          style={{ flexDirection: 'row', gap: 10, alignContent: 'flex-end', backgroundColor: 'transparent' }}
        >
          {orphanedWorkItemIds.length > 0 && (
            <Pressable onPress={handleCleanup} hitSlop={10} style={styles.headerButton}>
              <MaterialCommunityIcons name="broom" size={24} color={colors.iconColor} />
            </Pressable>
          )}
          <Pressable onPress={() => setShowAdd(!showAdd)} hitSlop={10} style={styles.headerButton}>
            <Ionicons name={showAdd ? 'chevron-up-sharp' : 'add'} size={24} color={colors.iconColor} />
          </Pressable>
        </View>
      ),
    [orphanedWorkItemIds.length, showAdd, colors.iconColor, handleCleanup],
  );

  const handleAddCategory = useCallback(() => {
    if (category.name && category.code) {
      const status = addWorkCategory(category);
      if (status && status.status === 'Success') {
        // Clear the input fields
        setCategory({ name: '', code: '', id: '', status: '' });
      } else {
        console.log('Error adding category:', status.msg);
      }
    }
  }, [category]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Work Categories',
          headerRight: renderHeaderRight,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
          <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
            {showAdd && (
              <View style={{ backgroundColor: colors.listBackground }}>
                <View style={{ padding: 10, borderRadius: 10, marginVertical: 15, marginHorizontal: 15 }}>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ width: 120 }}>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.neutral200 }]}
                        placeholder="Code"
                        keyboardType="number-pad"
                        value={category.code}
                        onChangeText={(text) => handleInputChange('code', text)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.neutral200, marginLeft: 5 }]}
                        placeholder="Name"
                        value={category.name}
                        onChangeText={(text) => handleInputChange('name', text)}
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
            )}
            <View style={{ flex: 1 }}>
              <FlatList
                data={allCategories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <SwipeableCategory category={item} />}
                ListEmptyComponent={() => (
                  <View
                    style={{
                      padding: 20,
                      alignItems: 'center',
                    }}
                  >
                    <Text txtSize="title" text="No work categories found." />
                    <Text text="Use the '+' in the upper right to add one." />
                    <ActionButton
                      style={{ zIndex: 1, marginTop: 10 }}
                      onPress={() => router.push(`/configuration/workcategory/seedCategoriesSelection/`)}
                      type="action"
                      title="Or, use one of our sets of Work Categories..."
                    />
                  </View>
                )}
              />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </>
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
    backgroundColor: 'transparent',
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
