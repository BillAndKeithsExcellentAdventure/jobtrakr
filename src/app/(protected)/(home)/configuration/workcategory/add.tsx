import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAddRowCallback,
  WorkCategoryData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

const AddWorkCategoryModal = () => {
  const router = useRouter();
  const colors = useColors();
  const addWorkCategory = useAddRowCallback('categories');
  const [category, setCategory] = useState<WorkCategoryData>({
    id: '',
    name: '',
    code: '',
    status: '',
  });

  const handleInputChange = useCallback(
    (name: keyof WorkCategoryData, value: string) => {
      if (category) {
        setCategory({
          ...category,
          [name]: value,
        });
      }
    },
    [category],
  );

  const handleSave = useCallback(() => {
    if (category.name && category.code) {
      const status = addWorkCategory(category);
      if (status && status.status === 'Success') {
        router.back();
      } else {
        console.log('Error adding category:', status?.msg);
      }
    }
  }, [category, addWorkCategory, router]);

  const canSave = category.name.length > 0 && category.code.length > 0;

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        title="Add Cost Category"
        onSave={handleSave}
        onCancel={() => router.back()}
        canSave={canSave}
      >
        <Text txtSize="title" style={styles.modalTitle} text="Category Details" />

        <View style={{ flexDirection: 'row', gap: 8 }}>
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
              style={[styles.input, { backgroundColor: colors.neutral200 }]}
              placeholder="Name"
              value={category.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />
          </View>
        </View>
      </ModalScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 4,
  },
});

export default AddWorkCategoryModal;
