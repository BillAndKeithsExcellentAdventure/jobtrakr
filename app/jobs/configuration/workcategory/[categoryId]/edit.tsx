import OkayCancelButtons from '@/components/OkayCancelButtons';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useTableValue, useUpdateRowCallback } from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditWorkCategory = () => {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const applyWorkCategoryUpdates = useUpdateRowCallback('categories');
  const router = useRouter();
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

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            neutral200: Colors.dark.neutral200,
          }
        : {
            neutral200: Colors.light.neutral200,
          },
    [colorScheme],
  );

  const handleSave = () => {
    if (newName && newCode) {
      applyWorkCategoryUpdates(categoryId, {
        id: categoryId,
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

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Work Category',
        }}
      />

      <View style={styles.container}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Name"
          value={newName}
          onChangeText={setNewName}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
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

export default EditWorkCategory;
