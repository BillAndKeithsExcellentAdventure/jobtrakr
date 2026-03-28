import { ActionButton } from '@/src/components/ActionButton';
import { CostItemPicker } from '@/src/components/CostItemPicker';
import { NumericInputField } from '@/src/components/NumericInputField';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  useAllRows,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditLineItemPage = () => {
  const { projectId, lineItemId } = useLocalSearchParams<{
    projectId: string;
    invoiceId: string;
    lineItemId: string;
  }>();

  const colors = useColors();
  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  const updateLineItem = useUpdateRowCallback(projectId, 'workItemCostEntries');
  const [itemizedEntry, setItemizedEntry] = useState<WorkItemCostEntry>({
    id: '',
    label: '',
    amount: 0,
    workItemId: '',
    parentId: '',
    documentationType: 'invoice',
  });

  useEffect(() => {
    if (lineItemId) {
      const existingItem = allCostItems.find((item) => item.id === lineItemId);
      if (existingItem) {
        setItemizedEntry(existingItem);
      }
    }
  }, [allCostItems, lineItemId]);

  const handleOkPress = useCallback(async () => {
    const entryToSave = { ...itemizedEntry };
    if (!entryToSave.label || !entryToSave.amount || !entryToSave.workItemId) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    const updatedItemizedEntry: WorkItemCostEntry = {
      ...entryToSave,
      workItemId: entryToSave.workItemId,
    };
    const result = updateLineItem(updatedItemizedEntry.id, updatedItemizedEntry);
    if (result.status !== 'Success') {
      Alert.alert('Error', 'Failed to add line item.');
      return;
    }
    router.back();
  }, [itemizedEntry, updateLineItem]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Edit Bill Line Item',
          headerShown: true,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <View style={[styles.container, { borderColor: colors.border }]}>
        <NumericInputField
          labelStyle={{ marginBottom: 0 }}
          inputStyle={{ paddingHorizontal: 10 }}
          containerStyle={styles.inputContainer}
          label="Amount"
          maxDecimals={2}
          decimals={2}
          value={itemizedEntry.amount}
          onChangeNumber={(value: number | null): void => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              amount: value ?? 0,
            }));
          }}
        />
        <TextField
          containerStyle={styles.inputContainer}
          placeholder="Description"
          label="Description"
          value={itemizedEntry.label}
          onChangeText={(text): void => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              label: text,
            }));
          }}
        />
        <CostItemPicker
          style={styles.inputContainer}
          projectId={projectId}
          value={itemizedEntry.workItemId}
          onValueChange={(workItemId) => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              workItemId,
            }));
          }}
          label="Cost Item Type"
          placeholder="Cost Item Type"
          modalTitle="Select Cost Item Type"
          modalHeight="80%"
        />

        <View style={styles.saveButtonRow}>
          <ActionButton
            style={styles.saveButton}
            onPress={handleOkPress}
            type={
              !itemizedEntry.label || !itemizedEntry.amount || !itemizedEntry.workItemId ? 'disabled' : 'ok'
            }
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
      </View>
    </SafeAreaView>
  );
};

export default EditLineItemPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    width: '100%',
  },
  inputContainer: {
    marginTop: 6,
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
