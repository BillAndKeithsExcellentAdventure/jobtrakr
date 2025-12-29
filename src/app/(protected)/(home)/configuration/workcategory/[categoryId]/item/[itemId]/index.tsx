// OkayCancelButtons removed — updates applied on input blur
import { Text, TextInput, View } from '@/src/components/Themed';
// import { useWorkCategoryItemDataStore } from '@/stores/categoryItemDataStore';
import {
  useTableValue,
  useUpdateRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditWorkItem = () => {
  const { categoryId, itemId } = useLocalSearchParams<{ categoryId: string; itemId: string }>();
  const applyWorkItemUpdates = useUpdateRowCallback('workItems');
  const name = useTableValue('workItems', itemId, 'name');
  const [newName, setNewName] = useState(name);
  const code = useTableValue('workItems', itemId, 'code');
  const status = useTableValue('workItems', itemId, 'status');
  const [newCode, setNewCode] = useState(code);

  const handleBlur = useCallback(() => {
    if (!itemId) return;
    if (newName.length && newCode.length) {
      applyWorkItemUpdates(itemId, {
        id: itemId,
        categoryId: categoryId,
        code: newCode,
        name: newName,
        status,
      });
    } else {
      if (newName.length === 0) setNewName(name);
      if (newCode.length === 0) setNewCode(code);
    }
  }, [itemId, newName, newCode, categoryId, status, applyWorkItemUpdates, name, code]);

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
            title: 'Edit Cost Item',
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
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={newName}
          onChangeText={setNewName}
          onBlur={handleBlur}
        />
        <TextInput
          style={styles.input}
          placeholder="Code"
          keyboardType="number-pad"
          value={newCode}
          onChangeText={setNewCode}
          onBlur={handleBlur}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default EditWorkItem;
