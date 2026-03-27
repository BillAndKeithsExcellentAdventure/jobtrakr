import { Alert, Platform, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/src/components/Themed';
import { CostItemPicker } from '@/src/components/CostItemPicker';
import { TextField } from '@/src/components/TextField';
import { NumericInputField } from '@/src/components/NumericInputField';
import { useColors } from '@/src/context/ColorsContext';
import {
  ChangeOrderItem,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { ActionButton } from '@/src/components/ActionButton';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';

const EditChangeOrderItem = () => {
  const { projectId, changeOrderId, changeOrderItemId } = useLocalSearchParams<{
    projectId: string;
    changeOrderId: string;
    changeOrderItemId: string;
  }>();

  const colors = useColors();
  const router = useRouter();
  const allChangeOrderItems = useAllRows(projectId, 'changeOrderItems');
  const updateChangeOrderItem = useUpdateRowCallback(projectId, 'changeOrderItems');

  const [amount, setAmount] = useState<number>(0);
  const [label, setLabel] = useState<string>('');

  const [newChangeOrderItem, setNewChangeOrderItem] = useState<ChangeOrderItem>({
    id: '',
    changeOrderId: changeOrderId,
    label: '',
    amount: 0,
    workItemId: '',
  });

  useEffect(() => {
    if (changeOrderItemId) {
      const item = allChangeOrderItems.find((item) => item.id === changeOrderItemId);
      if (item) {
        setNewChangeOrderItem(item);
        setAmount(item.amount);
        setLabel(item.label);
      }
    }
  }, [newChangeOrderItem, allChangeOrderItems, changeOrderItemId]);

  const handleAddItemCancel = () => {
    setNewChangeOrderItem({
      id: '',
      changeOrderId: changeOrderId,
      label: '',
      amount: 0,
      workItemId: '',
    });
    router.back();
  };

  const handleUpdateItemOk = () => {
    if (!label || !amount || !newChangeOrderItem.workItemId) {
      Alert.alert('Error', 'Please fill in all item fields.');
      return;
    }
    updateChangeOrderItem(changeOrderItemId, {
      ...newChangeOrderItem,
      label,
      amount,
    });
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Change Order Item',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <SafeAreaView edges={['bottom']} style={[styles.safeArea]}>
        <View style={styles.container}>
          <View style={{ alignItems: 'center' }}>
            <Text txtSize="title">Edit Change Order Item</Text>
          </View>
          <TextField
            style={[styles.input, { borderColor: colors.transparent }]}
            value={label}
            onChangeText={(text) => setLabel(text)}
            placeholder="Item Description"
            label="Item Description"
            numberOfLines={2}
          />
          <NumericInputField
            label="Bid Amount"
            maxDecimals={2}
            decimals={2}
            value={amount}
            onChangeNumber={(value) => setAmount(value ?? 0)}
            placeholder="Amount"
          />
          <View>
            <CostItemPicker
              label="Cost Item"
              style={{ marginBottom: 10 }}
              projectId={projectId}
              value={newChangeOrderItem.workItemId}
              onValueChange={(workItemId) => {
                setNewChangeOrderItem((prev) => ({
                  ...prev,
                  workItemId,
                }));
              }}
              placeholder="Select Cost Item"
              modalTitle="Select Cost Item"
            />
          </View>
          <View style={styles.saveButtonRow}>
            <ActionButton style={styles.saveButton} onPress={handleUpdateItemOk} type="ok" title="Save" />
            <ActionButton
              style={styles.cancelButton}
              onPress={handleAddItemCancel}
              type="cancel"
              title="Cancel"
            />
          </View>
        </View>
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

export default EditChangeOrderItem;

const styles = StyleSheet.create({
  saveButtonRow: {
    marginTop: 10,
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
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 0,
  },
  label: { marginBottom: 2, fontSize: 12 },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  container: {
    paddingHorizontal: 20,
    width: '100%',
    gap: 8,
  },
});
