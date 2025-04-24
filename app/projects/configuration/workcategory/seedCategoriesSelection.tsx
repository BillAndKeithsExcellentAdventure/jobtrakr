import OkayCancelButtons from '@/components/OkayCancelButtons';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useTableValue, useUpdateRowCallback } from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SeedProjectWorkItems } from '@/constants/seedWorkItems';
import { TextField } from '@/components/TextField';

export interface ProjectTypesPickerEntry {
  projectType: string;
  description: string;
}

const SeedWorkItemSelectorPage = () => {
  const router = useRouter();
  const [selectedProjectType, setSelectedProjectType] = useState<string>('');
  const colorScheme = useColorScheme();
  const projectTypes = useMemo(() => {
    const types: ProjectTypesPickerEntry[] = [];
    types.push({ projectType: 'None', description: 'No Project Type' });
    types.push(
      ...SeedProjectWorkItems.map((i) => ({ projectType: i.projectType, description: i.description })),
    );
    return types;
  }, []);

  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            neutral200: Colors.dark.neutral200,
            listBackground: Colors.dark.listBackground,
          }
        : {
            neutral200: Colors.light.neutral200,
            listBackground: Colors.light.listBackground,
          },
    [colorScheme],
  );

  const handleSave = () => {
    //TODO: Implement the save logic

    // Go back to the categories list screen
    router.back();
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Choose Work Category Set',
        }}
      />
      <View style={styles.container}>
        <TextField
          label="Select Project Type"
          style={[styles.input, { borderColor: colors.neutral200 }]}
          value={selectedProjectType}
          readOnly
          placeholder="Select a Project Type from list below"
          placeholderTextColor={colors.neutral200}
        />
        <View style={{ marginTop: 10 }}>
          <Text>Available Project Types</Text>

          <View style={{ marginTop: 10, backgroundColor: colors.listBackground, width: '100%', padding: 10 }}>
            <FlatList
              data={projectTypes}
              keyExtractor={(item) => item.projectType}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedProjectType(item.projectType);
                  }}
                >
                  <View
                    style={{
                      padding: 16,
                      marginBlock: 5,
                      borderColor: colors.neutral200,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{item.projectType}</Text>
                    <Text style={{ fontSize: 14 }}>{item.description}</Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={() => (
                <View
                  style={{
                    padding: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text txtSize="title" text="No work categories found." />
                  <Text text="Use the '+' in the upper right to add one." />
                </View>
              )}
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <OkayCancelButtons
            okTitle="Save"
            isOkEnabled={!!selectedProjectType && selectedProjectType !== 'None'}
            onOkPress={handleSave}
          />
        </View>
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

export default SeedWorkItemSelectorPage;
