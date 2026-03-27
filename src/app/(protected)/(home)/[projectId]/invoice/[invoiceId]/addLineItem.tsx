import { CostItemPicker } from '@/src/components/CostItemPicker';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumericInputField } from '@/src/components/NumericInputField';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useAddRowCallback, WorkItemCostEntry } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

const AddInvoiceLineItemPage = () => {
  const router = useRouter();
  const { projectId, invoiceId } = useLocalSearchParams<{ projectId: string; invoiceId: string }>();
  const addLineItem = useAddRowCallback(projectId, 'workItemCostEntries');
  const [pickedCostItemId, setPickedCostItemId] = useState<string | undefined>(undefined);

  const initItemizedEntry: WorkItemCostEntry = {
    id: '',
    label: '',
    amount: 0,
    workItemId: '',
    parentId: invoiceId,
    documentationType: 'invoice',
  };

  const [itemizedEntry, setItemizedEntry] = useState<WorkItemCostEntry>(initItemizedEntry);

  const handleOkPress = useCallback(async () => {
    if (!itemizedEntry.label || !itemizedEntry.amount) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    const newItemizedEntry: WorkItemCostEntry = {
      ...itemizedEntry,
      workItemId: pickedCostItemId ?? '',
    };
    const result = addLineItem(newItemizedEntry);
    if (result.status !== 'Success') {
      Alert.alert('Error', 'Failed to add line item.');
      return;
    }
    router.back();
  }, [itemizedEntry, pickedCostItemId, addLineItem, router]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer
        title="Add Bill Line Item"
        onSave={handleOkPress}
        onCancel={() => router.back()}
        canSave={!!itemizedEntry.label && !!itemizedEntry.amount}
      >
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
          value={pickedCostItemId}
          onValueChange={setPickedCostItemId}
          label="Cost Item Type"
          placeholder="Cost Item Type"
          modalTitle="Select Cost Item Type"
          modalHeight="80%"
        />
      </ModalScreenContainer>
    </View>
  );
};

export default AddInvoiceLineItemPage;

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 6,
  },
});
