import { ModalScreenContainerWithList } from '@/src/components/ModalScreenContainerWithList';
import { TextField } from '@/src/components/TextField';
import { Text, View } from '@/src/components/Themed';
import { SeedProjectWorkItems } from '@/src/constants/seedWorkItems';
import { useColors } from '@/src/context/ColorsContext';
import { useAddRowCallback } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';

export interface ProjectTypesPickerEntry {
  projectType: string;
  description: string;
}

const SeedWorkItemSelectorPage = () => {
  const router = useRouter();
  const addWorkCategory = useAddRowCallback('categories');
  const addWorkItem = useAddRowCallback('workItems');
  const [selectedProjectType, setSelectedProjectType] = useState<string>('None');
  const projectTypes = useMemo(() => {
    const types: ProjectTypesPickerEntry[] = [];
    types.push({ projectType: 'None', description: 'No Project Type' });
    types.push(
      ...SeedProjectWorkItems.map((i) => ({ projectType: i.projectType, description: i.description })),
    );
    return types;
  }, []);

  const colors = useColors();

  const handleSave = () => {
    if (!selectedProjectType || selectedProjectType === 'None') {
      return;
    }

    const selectedProjectTypeData = SeedProjectWorkItems.find(
      (item) => item.projectType === selectedProjectType,
    );
    if (!selectedProjectTypeData) {
      return;
    }
    Alert.alert('Add Multiple Categories and WorkItems ', 'Are you sure you want to continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        onPress: () => {
          for (const category of selectedProjectTypeData.categories) {
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

          // Go back to the categories list screen
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainerWithList
        onSave={handleSave}
        onCancel={() => router.back()}
        canSave={!!selectedProjectType && selectedProjectType !== 'None'}
        saveButtonTitle="Save"
      >
        <Text style={styles.modalTitle}>Choose Work Category Set</Text>
        <TextField
          label="Selected Project Type"
          style={[{ borderColor: colors.neutral200 }]}
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
            />
          </View>
        </View>
      </ModalScreenContainerWithList>
    </View>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default SeedWorkItemSelectorPage;
