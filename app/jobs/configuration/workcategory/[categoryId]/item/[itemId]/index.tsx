import OkayCancelButtons from '@/components/OkayCancelButtons';
import { Text, TextInput, View } from '@/components/Themed';
import { WorkCategoryItemData } from '@/models/types';
// import { useWorkCategoryItemDataStore } from '@/stores/categoryItemDataStore';
import {
  useAddWorkItemCallback,
  useUpdateWorkItemCallback,
  useWorkItemValue,
} from '@/tbStores/CategoriesStore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditWorkItem = () => {
  const { categoryId, itemId } = useLocalSearchParams();
  const applyWorkItemUpdates = useUpdateWorkItemCallback();
  const router = useRouter();
  const [name, setName] = useWorkItemValue(itemId as string, 'name');
  const [newName, setNewName] = useState(name);
  const [code, setCode] = useWorkItemValue(itemId as string, 'code');
  const [status] = useWorkItemValue(itemId as string, 'status');
  const [newCode, setNewCode] = useState(code);

  const handleSave = () => {
    if (newName && newCode) {
      applyWorkItemUpdates(itemId as string, {
        _id: itemId as string,
        categoryId: categoryId as string,
        code: newCode,
        name: newName,
        status,
      });

      // Go back to the categories list screen
      router.back();
    }
  };

  if (!name || !code) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!itemId) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Edit Work Item',
          }}
        />

        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Work Item',
        }}
      />

      <View style={styles.container}>
        <TextInput style={styles.input} placeholder="Name" value={newName} onChangeText={setNewName} />
        <TextInput
          style={styles.input}
          placeholder="Code"
          keyboardType="number-pad"
          value={newCode}
          onChangeText={setNewCode}
        />
        <OkayCancelButtons okTitle="Save" isOkEnabled={!!newName && !!newCode} onOkPress={handleSave} />
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
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default EditWorkItem;
