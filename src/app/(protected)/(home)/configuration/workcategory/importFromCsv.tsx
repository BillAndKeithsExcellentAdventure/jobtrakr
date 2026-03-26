import React, { useCallback, useState } from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parseWorkItemsCsvText } from '@/src/utils/csvUtils';
import {
  useAddRowCallback,
  useAllRows,
  useCreateTemplateWithAllWorkItemsCallback,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { WorkCategoryDefinition } from '@/src/models/types';
import { useRouter, Stack } from 'expo-router';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';

export default function ImportFromCsvScreen() {
  const colors = useColors();
  const [workCategories, setWorkCategories] = useState<WorkCategoryDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const addWorkCategory = useAddRowCallback('categories');
  const addWorkItem = useAddRowCallback('workItems');
  const router = useRouter();
  const createTemplateWithAllWorkItems = useCreateTemplateWithAllWorkItemsCallback();
  const existingCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const existingWorkItems = useAllRows('workItems', WorkItemDataCodeCompareAsNumber);

  const handleSelectFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const fileUri = result.assets[0].uri;
        const fileContent = await fetch(fileUri).then((r) => r.text());
        const parsed = parseWorkItemsCsvText(fileContent);
        setWorkCategories(parsed);
      }
    } catch {
      Alert.alert('Error', 'Failed to read CSV file');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setLoading(true);
      let categoriesAdded = 0;
      let categoriesSkipped = 0;
      let workItemsAdded = 0;
      let workItemsSkipped = 0;

      for (const category of workCategories) {
        // Check if a category with the same code and name already exists
        const existingCategory = existingCategories.find(
          (c) => c.code === category.code.toString() && c.name === category.name && !c.hidden,
        );

        let categoryId: string;

        if (existingCategory) {
          // Use existing category's id for adding new work items
          categoryId = existingCategory.id;
          categoriesSkipped++;
        } else {
          const workCategory = {
            name: category.name,
            code: category.code.toString(),
            status: 'active',
            id: '',
          };
          const result = addWorkCategory(workCategory);
          if (!result || result.status !== 'Success') {
            console.error(`Failed to add category: ${category.name}`);
            continue;
          }
          categoryId = result.id;
          categoriesAdded++;
        }

        // Get existing work items for this category to check for duplicates
        const existingItemsForCategory = existingWorkItems.filter(
          (w) => w.categoryId === categoryId && !w.hidden,
        );

        for (const item of category.workItems) {
          // Check if a work item with the same code and name already exists in this category
          const existingItem = existingItemsForCategory.find(
            (w) => w.code === item.code.toString() && w.name === item.name,
          );

          if (existingItem) {
            workItemsSkipped++;
            continue;
          }

          const workItem = {
            name: item.name,
            code: item.code.toString(),
            status: 'active',
            id: '',
            categoryId,
          };
          const itemResult = addWorkItem(workItem);
          if (itemResult.status !== 'Success') {
            console.error(`Failed to add cost item: ${workItem.name} ${itemResult.msg}`);
          } else {
            workItemsAdded++;
          }
        }
      }

      createTemplateWithAllWorkItems();

      const summaryLines: string[] = [];
      if (categoriesAdded > 0)
        summaryLines.push(`${categoriesAdded} categor${categoriesAdded === 1 ? 'y' : 'ies'} added`);
      if (categoriesSkipped > 0)
        summaryLines.push(
          `${categoriesSkipped} categor${categoriesSkipped === 1 ? 'y' : 'ies'} already existed`,
        );
      if (workItemsAdded > 0)
        summaryLines.push(`${workItemsAdded} cost item${workItemsAdded === 1 ? '' : 's'} added`);
      if (workItemsSkipped > 0)
        summaryLines.push(
          `${workItemsSkipped} cost item${workItemsSkipped === 1 ? '' : 's'} already existed`,
        );

      const summary = summaryLines.length > 0 ? summaryLines.join('\n') : 'No new items to import.';
      Alert.alert('Import Complete', summary);
      setWorkCategories([]);
    } catch {
      Alert.alert('Error', 'Failed to save cost items');
    } finally {
      setLoading(false);
      router.back();
    }
  }, [
    workCategories,
    addWorkCategory,
    addWorkItem,
    createTemplateWithAllWorkItems,
    router,
    existingCategories,
    existingWorkItems,
  ]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Import Cost Categories from CSV',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <TouchableOpacity onPress={handleSelectFile} disabled={loading} style={styles.selectButton}>
        <Text style={styles.selectButtonText}>{loading ? 'Loading...' : 'Select CSV File'}</Text>
      </TouchableOpacity>

      {workCategories.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.previewTitle}>Preview</Text>
            <Text txtSize="xs">Tap category to expand/collapse</Text>
          </View>
          <ScrollView style={{ ...styles.scrollView, borderColor: colors.border }}>
            {workCategories.map((category) => (
              <View
                key={category.code.toString()}
                style={{ ...styles.categoryContainer, borderBottomColor: colors.border }}
              >
                <TouchableOpacity
                  onPress={() => toggleCategory(category.code.toString())}
                  style={styles.categoryHeader}
                >
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.categoryName}>
                    {category.name}
                  </Text>
                  <View style={styles.categoryMeta}>
                    <Text style={styles.categoryCount}> ({category.workItems?.length || 0})</Text>

                    <Text style={styles.categoryExpandToggle}>
                      {expandedCategories.has(category.code.toString()) ? '▼' : '▶'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {expandedCategories.has(category.code.toString()) && (
                  <View style={styles.workItemsContainer}>
                    {category.workItems?.map((item) => (
                      <Text
                        key={`${category.code.toString()}.${item.code.toString()}`}
                        style={styles.workItemText}
                      >
                        • {item.name}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
            {loading ? (
              <ActivityIndicator color={colors.tint} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  selectButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
    borderWidth: 1,
    padding: 8,
  },
  categoryContainer: {
    marginBottom: 12,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  categoryCount: {
    fontSize: 14,
    width: 60,
    textAlign: 'right',
  },
  categoryExpandToggle: {
    fontSize: 18,
    fontWeight: '600',
    width: 20,
  },

  workItemsContainer: {
    marginLeft: 16,
    marginTop: 8,
  },
  workItemText: {
    fontSize: 14,
    paddingVertical: 4,
    opacity: 0.8,
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
