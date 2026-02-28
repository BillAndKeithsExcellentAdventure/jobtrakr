import { Alert, Keyboard, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, View } from '@/src/components/Themed';
import CostItemPickerModal from '@/src/components/CostItemPickerModal';
import { TextField } from '@/src/components/TextField';
import { NumericInputField } from '@/src/components/NumericInputField';
import { useColors } from '@/src/context/ColorsContext';
import {
  ChangeOrderItem,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { ActionButton } from '@/src/components/ActionButton';
import { OptionEntry } from '@/src/components/OptionList';
import {
  useAllRows as useAllConfigurationRows,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
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
  const allWorkItemCostSummaries = useAllRows(projectId, 'workItemSummaries');
  const allWorkItems = useAllConfigurationRows('workItems', WorkItemDataCodeCompareAsNumber);

  const allWorkCategories = useAllConfigurationRows('categories', WorkCategoryCodeCompareAsNumber);

  const allAvailableCostItemOptions: OptionEntry[] = useMemo(() => {
    const uniqueWorkItemIds = allWorkItemCostSummaries.map((item) => item.workItemId);
    const uniqueWorkItems = allWorkItems.filter((item) => uniqueWorkItemIds.includes(item.id));
    const uniqueCostItems = uniqueWorkItems.map((item) => {
      const category = allWorkCategories.find((o) => o.id === item.categoryId);
      const categoryCode = category ? `${category.code}.` : '';
      return {
        sortValue1: Number.parseFloat(item.code),
        sortValue2: Number.parseFloat(category ? category.code : '0'),
        label: `${categoryCode}${item.code} - ${item.name}`,
        value: item.id,
      };
    });

    return uniqueCostItems
      .sort((a, b) => a.sortValue1 - b.sortValue1)
      .sort((a, b) => a.sortValue2 - b.sortValue2)
      .map((i) => ({ label: i.label, value: i.value }));
  }, [allWorkItemCostSummaries, allWorkItems, allWorkCategories]);

  const [amount, setAmount] = useState<number>(0);
  const [label, setLabel] = useState<string>('');

  const [itemWorkItemEntry, setItemWorkItemEntry] = useState<OptionEntry>({
    label: '',
    value: '',
  });

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
        const option = allAvailableCostItemOptions.find((opt) => opt.value === item.workItemId);
        if (option) setItemWorkItemEntry(option);
      }
    }
  }, [newChangeOrderItem, allChangeOrderItems, allAvailableCostItemOptions, changeOrderItemId]);

  const [showCostItemPicker, setShowCostItemPicker] = useState(false);

  const handleShowCostItemPicker = () => {
    Keyboard.dismiss();
    setShowCostItemPicker(true);
  };

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
    if (!label || !amount || !itemWorkItemEntry.value) {
      Alert.alert('Error', 'Please fill in all item fields.');
      return;
    }
    updateChangeOrderItem(changeOrderItemId, {
      ...newChangeOrderItem,
      workItemId: itemWorkItemEntry.value,
      label,
      amount,
    });
    router.back();
  };

  const onCostItemOptionSelected = useCallback((costItemEntry: OptionEntry | undefined) => {
    if (costItemEntry) {
      setItemWorkItemEntry({
        label: costItemEntry.label,
        value: costItemEntry.value,
      });
    }
    setShowCostItemPicker(false);
  }, []);

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
            label="Amount"
            value={amount}
            onChangeNumber={(value) => setAmount(value ?? 0)}
            placeholder="Amount"
          />
          <View>
            <Text style={styles.label}>Cost Item</Text>
            <TouchableOpacity activeOpacity={1} onPress={handleShowCostItemPicker}>
              <View style={{ marginBottom: 10 }}>
                <TextInput
                  style={styles.input}
                  value={itemWorkItemEntry.label ?? null}
                  readOnly={true}
                  placeholder="Select Cost Item"
                  onPressIn={handleShowCostItemPicker}
                />
              </View>
            </TouchableOpacity>
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
      {showCostItemPicker && (
        <CostItemPickerModal
          isVisible={showCostItemPicker}
          onClose={() => setShowCostItemPicker(false)}
          projectId={projectId}
          handleCostItemOptionSelected={onCostItemOptionSelected}
        />
      )}
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
