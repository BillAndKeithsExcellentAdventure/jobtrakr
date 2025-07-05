import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, View } from '@/src/components/Themed';

import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ChangeOrder,
  ChangeOrderItem,
  useAddRowCallback,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/src/context/ColorsContext';
import { ActionButton } from '@/src/components/ActionButton';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddChangeOrder() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const colors = useColors();
  const router = useRouter();
  const addChangeOrder = useAddRowCallback(projectId, 'changeOrders');
  const addChangeOrderItem = useAddRowCallback(projectId, 'changeOrderItems');
  const [canAdd, setCanAdd] = useState(false);
  const [newChangeOrder, setChangeOrder] = useState<ChangeOrder>({
    id: '',
    title: '',
    description: '',
    bidAmount: 0,
    dateCreated: Date.now(),
    status: 'draft',
  });

  useEffect(() => {
    setCanAdd(newChangeOrder.bidAmount > 0 && !!newChangeOrder.title && !!newChangeOrder.description);
  }, [newChangeOrder]);

  const handleChange = (name: keyof ChangeOrder, value: string) => {
    setChangeOrder((prev) => ({
      ...prev,
      [name]: name === 'bidAmount' ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    if (!newChangeOrder.title || !newChangeOrder.description || !newChangeOrder.bidAmount) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const result = addChangeOrder(newChangeOrder);

    router.back();
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Add Receipt', headerShown: true }} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={newChangeOrder.title}
          onChangeText={(text) => handleChange('title', text)}
          placeholder="Title"
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={newChangeOrder.description}
          onChangeText={(text) => handleChange('description', text)}
          placeholder="Description"
          numberOfLines={4}
          multiline
        />
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={newChangeOrder.bidAmount ? String(newChangeOrder.bidAmount) : ''}
          onChangeText={(text) => handleChange('bidAmount', text)}
          placeholder="Amount"
          keyboardType="numeric"
        />
        <View style={styles.saveButtonRow}>
          <ActionButton
            style={styles.saveButton}
            onPress={handleSubmit}
            type={canAdd ? 'ok' : 'disabled'}
            title="Save"
          />

          <ActionButton
            style={styles.cancelButton}
            onPress={() => {
              router.back();
            }}
            type={'cancel'}
            title="Cancel"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  saveButtonRow: {
    marginVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});
