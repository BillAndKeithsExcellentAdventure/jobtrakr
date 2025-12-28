import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useTableValue,
  useUpdateRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditWorkCategory = () => {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const applyWorkCategoryUpdates = useUpdateRowCallback('categories');
  const status = useTableValue('categories', categoryId, 'status');
  const name = useTableValue('categories', categoryId, 'name');
  const [newName, setNewName] = useState(name);
  const code = useTableValue('categories', categoryId, 'code');
  const [newCode, setNewCode] = useState(code);

  useEffect(() => {
    setNewCode(code);
  }, [code]);

  useEffect(() => {
    setNewName(name);
  }, [name]);

  const colors = useColors();

  const handleBlur = useCallback(() => {
    if (newName.length && newCode.length) {
      applyWorkCategoryUpdates(categoryId, {
        id: categoryId,
        code: newCode,
        name: newName,
        status,
      });
    } else {
      if (newName.length === 0) setNewName(name);
      if (newCode.length === 0) setNewCode(code);
    }
  }, [newName, newCode, categoryId, status, applyWorkCategoryUpdates, name, code]);

  if (!name || !code) {
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
          title: 'Edit Cost Category',
        }}
      />

      <View style={styles.container}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Name"
          value={newName}
          onChangeText={setNewName}
          onBlur={handleBlur}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
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

export default EditWorkCategory;
