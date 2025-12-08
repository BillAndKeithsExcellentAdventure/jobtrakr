import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parseWorkItemsCsvText } from '@/src/utils/csvUtils';
import { useAddRowCallback } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { WorkCategoryDefinition } from '@/src/models/types';

export default function ImportFromCsvScreen() {
  const [workCategories, setWorkCategories] = useState<WorkCategoryDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const addWorkCategory = useAddRowCallback('categories');
  const addWorkItem = useAddRowCallback('workItems');

  const handleSelectFile = async () => {
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
    } catch (error) {
      Alert.alert('Error', 'Failed to read CSV file');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const handleSave = async () => {
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
              console.error(`Failed to add work item: ${workItem.name} ${itemResult.msg}`);
            }
          }
        }
      }

      Alert.alert('Success', 'Work items imported successfully');
      setWorkCategories([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save work items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import Work Items from CSV file</Text>

      <TouchableOpacity onPress={handleSelectFile} disabled={loading} style={styles.selectButton}>
        <Text style={styles.selectButtonText}>{loading ? 'Loading...' : 'Select CSV File'}</Text>
      </TouchableOpacity>

      {workCategories.length > 0 && (
        <>
          <Text style={styles.previewTitle}>Preview</Text>
          <ScrollView style={styles.scrollView}>
            {workCategories.map((category) => (
              <View key={category.id} style={styles.categoryContainer}>
                <TouchableOpacity onPress={() => toggleCategory(category.id)} style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>
                    {expandedCategories.has(category.id) ? '▼' : '▶'} ({category.workItems?.length || 0})
                  </Text>
                </TouchableOpacity>

                {expandedCategories.has(category.id) && (
                  <View style={styles.workItemsContainer}>
                    {category.workItems?.map((item) => (
                      <Text key={item.id} style={styles.workItemText}>
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
    backgroundColor: '#ffffff',
    padding: 16,
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
    color: '#ffffff',
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
    borderColor: '#d1d5db',
    borderRadius: 8,
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
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCount: {
    color: '#4b5563',
  },
  workItemsContainer: {
    marginLeft: 16,
    marginTop: 8,
  },
  workItemText: {
    fontSize: 14,
    color: '#374151',
    paddingVertical: 4,
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
