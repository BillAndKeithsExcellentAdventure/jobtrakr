import React, { useCallback, useState } from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parseWorkItemsCsvText } from '@/src/utils/csvUtils';
import {
  useAddRowCallback,
  useCreateTemplateWithAllWorkItemsCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { WorkCategoryDefinition } from '@/src/models/types';
import { useRouter, Stack } from 'expo-router';
import { Text, View } from '@/src/components/Themed';

export default function ImportFromCsvScreen() {
  const [workCategories, setWorkCategories] = useState<WorkCategoryDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const addWorkCategory = useAddRowCallback('categories');
  const addWorkItem = useAddRowCallback('workItems');
  const router = useRouter();
  const createTemplateWithAllWorkItems = useCreateTemplateWithAllWorkItemsCallback();

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
      for (const category of workCategories) {
        const workCategory = {
          name: category.name,
          code: category.code.toString(),
          status: 'active',
          id: '',
        };

        const result = addWorkCategory(workCategory);
        if (result && result.id) {
          const workItems = category.workItems.map((item) => ({
            name: item.name,
            code: item.code.toString(),
            status: 'active',
            id: '',
            categoryId: result.id,
          }));
          for (const workItem of workItems) {
            const itemResult = addWorkItem(workItem);
            if (itemResult.status !== 'Success') {
              console.error(`Failed to add cost item: ${workItem.name} ${itemResult.msg}`);
            }
          }
        }
      }

      createTemplateWithAllWorkItems();
      Alert.alert('Success', 'Cost items imported successfully');
      setWorkCategories([]);
    } catch {
      Alert.alert('Error', 'Failed to save cost items');
    } finally {
      setLoading(false);
      router.back();
    }
  }, [workCategories, addWorkCategory, addWorkItem, createTemplateWithAllWorkItems, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Import Cost Categories from CSV' }} />

      <TouchableOpacity onPress={handleSelectFile} disabled={loading} style={styles.selectButton}>
        <Text style={styles.selectButtonText}>{loading ? 'Loading...' : 'Select CSV File'}</Text>
      </TouchableOpacity>

      {workCategories.length > 0 && (
        <>
          <Text style={styles.previewTitle}>Preview</Text>
          <ScrollView style={styles.scrollView}>
            {workCategories.map((category) => (
              <View key={category.code.toString()} style={styles.categoryContainer}>
                <TouchableOpacity
                  onPress={() => toggleCategory(category.code.toString())}
                  style={styles.categoryHeader}
                >
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}
                  >
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
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save</Text>}
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
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
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
