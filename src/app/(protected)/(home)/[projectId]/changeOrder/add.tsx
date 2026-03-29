import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Alert, Modal, FlatList, Keyboard, Platform } from 'react-native';
import { Text, TextInput, View } from '@/src/components/Themed';

import {
  ChangeOrder,
  ChangeOrderItem,
  useAddRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/src/context/ColorsContext';
import { ActionButton } from '@/src/components/ActionButton';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency } from '@/src/utils/formatters';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { CostItemPicker } from '@/src/components/CostItemPicker';
import { OptionEntry } from '@/src/components/OptionList';
import { ProposedChangeOrderItem } from '@/src/models/types';
import SwipeableProposedChangeOrderItem from '@/src/components/SwipeableProposedChangeOrderItem';
import { ModalScreenContainerWithList } from '@/src/components/ModalScreenContainerWithList';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { NumericInputField } from '@/src/components/NumericInputField';
import { TextField } from '@/src/components/TextField';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';

export default function AddChangeOrder() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { allAvailableCostItemOptions } = useProjectWorkItems(projectId);

  const colors = useColors();
  const router = useRouter();
  const addChangeOrder = useAddRowCallback(projectId, 'changeOrders');
  const addChangeOrderItem = useAddRowCallback(projectId, 'changeOrderItems');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [items, setItems] = useState<ProposedChangeOrderItem[]>([]);
  const [canAdd, setCanAdd] = useState(false);
  const [newChangeOrder, setNewChangeOrder] = useState<ChangeOrder>({
    id: '',
    title: '',
    description: '',
    bidAmount: 0,
    quotedPrice: undefined, // default to undefined so placeholder shows in NumericInputField. Set to 0 when user enters a value or on submit if still undefined
    dateCreated: Date.now(),
    status: 'draft',
    accountingId: '',
  });

  // State for modal ChangeItem fields
  const [itemLabel, setItemLabel] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemWorkItemEntry, setItemWorkItemEntry] = useState<OptionEntry>({
    label: '',
    value: '',
  });

  useEffect(() => {
    // set total cost by summing the amount of each item in items array
    if (items && items.length === 0) handleAmountChange(0);
    else handleAmountChange(items.reduce((total, item) => total + item.amount, 0));
  }, [items]);

  useEffect(() => {
    setCanAdd(
      newChangeOrder.bidAmount > 0 &&
        (newChangeOrder.quotedPrice ?? 0) > 0 &&
        !!newChangeOrder.title &&
        !!newChangeOrder.description,
    );
  }, [newChangeOrder]);

  const handleAmountChange = (value: number) => {
    setNewChangeOrder((prev) => ({
      ...prev,
      bidAmount: value,
    }));
  };

  const handleQuotedPriceChange = (value: number) => {
    setNewChangeOrder((prev) => ({
      ...prev,
      quotedPrice: value,
    }));
  };

  const handleSubmit = () => {
    if (
      !newChangeOrder.title ||
      !newChangeOrder.description ||
      !(newChangeOrder.bidAmount > 0) ||
      !((newChangeOrder.quotedPrice ?? 0) > 0)
    ) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const result = addChangeOrder(newChangeOrder);
    if (result.status === 'Success') {
      const coId = result.id;
      items.forEach((entry) => {
        const newItem: ChangeOrderItem = {
          id: '',
          label: entry.label,
          workItemId: entry.workItemEntry.value,
          amount: entry.amount,
          changeOrderId: coId,
        };
        const addItemResult = addChangeOrderItem(newItem);
        if (addItemResult.status === 'Error') {
          console.log(`Error inserting change order items - ${addItemResult.msg}`);
        }
      });
    }

    router.back();
  };

  const handleAddItemOk = () => {
    if (!itemLabel || !itemAmount || !itemWorkItemEntry.value) {
      Alert.alert('Error', 'Please fill in all item fields.');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        label: itemLabel,
        amount: Number(itemAmount),
        workItemEntry: itemWorkItemEntry,
      },
    ]);
    setShowAddItemModal(false);
    setItemLabel('');
    setItemAmount('');
    setItemWorkItemEntry({
      label: 'Select Cost Item',
      value: '',
    });
  };

  const handleAddItemCancel = () => {
    setShowAddItemModal(false);
    setItemLabel('');
    setItemAmount('');
    setItemWorkItemEntry({
      label: 'Select Cost Item',
      value: '',
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, width: '100%' }}>
        <ModalScreenContainerWithList
          onSave={handleSubmit}
          onCancel={() => router.back()}
          canSave={canAdd}
          saveButtonTitle="Add"
        >
          <Text style={styles.modalTitle}>Add Change Order</Text>

          <View style={{ gap: 8, padding: 8 }}>
            <TextInput
              style={{ ...styles.input, backgroundColor: colors.neutral200, maxHeight: 80 }}
              value={newChangeOrder.title}
              onChangeText={(text) =>
                setNewChangeOrder((prev) => ({
                  ...prev,
                  title: text,
                }))
              }
              placeholder="Title"
            />
            <TextInput
              style={{ ...styles.input, backgroundColor: colors.neutral200, maxHeight: 80 }}
              value={newChangeOrder.description}
              onChangeText={(text) =>
                setNewChangeOrder((prev) => ({
                  ...prev,
                  description: text,
                }))
              }
              placeholder="Detailed Description"
              numberOfLines={4}
              multiline
            />
            <NumericInputField
              inputStyle={{ borderColor: colors.border }}
              value={newChangeOrder.quotedPrice ?? null}
              onChangeNumber={(value) => handleQuotedPriceChange(value ?? 0)}
              placeholder="Customer Quoted Price"
            />
          </View>

          <View style={[styles.saveButtonRow, { gap: 10, paddingHorizontal: 10 }]}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text text="Change Order Items" txtSize="sub-title" />
            </View>
            <ActionButton
              style={{ marginVertical: 5 }}
              onPress={() => {
                Keyboard.dismiss();
                setShowAddItemModal(true);
              }}
              type={'action'}
              title="Add"
            />
          </View>
          <FlatList
            style={{ backgroundColor: colors.background }}
            data={items}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <SwipeableProposedChangeOrderItem
                item={item}
                removeItem={(item) => {
                  setItems((prev) => prev.filter((i) => i !== item));
                }}
              />
            )}
            ListEmptyComponent={
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text>No items defined</Text>
              </View>
            }
            ListHeaderComponent={() => (
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: colors.listBackground,
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 5,
                }}
              >
                <View style={{ flex: 1, backgroundColor: colors.listBackground }}>
                  <Text style={{ fontWeight: '600' }}>Item</Text>
                </View>

                <View style={{ width: 120, backgroundColor: colors.listBackground }}>
                  <Text style={{ textAlign: 'right', fontWeight: '600', paddingRight: 20 }}>Cost</Text>
                </View>
              </View>
            )}
            ListFooterComponent={() => (
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: colors.listBackground,
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 5,
                }}
              >
                <View style={{ flex: 1, backgroundColor: colors.listBackground }}>
                  <Text style={{ fontWeight: '600' }}>Total</Text>
                </View>
                <View style={{ width: 120, backgroundColor: colors.listBackground }}>
                  <Text
                    style={{ textAlign: 'right', fontWeight: '600' }}
                    text={formatCurrency(newChangeOrder.bidAmount, true)}
                  />
                </View>
              </View>
            )}
          />
        </ModalScreenContainerWithList>
      </View>
      {/* Modal for adding ChangeItem */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleAddItemCancel}
      >
        <SafeAreaProvider>
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
            <SafeAreaView edges={['top']} style={[styles.modalSafeArea]}>
              <View style={styles.modalContent}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text txtSize="title">Add Change Order Item</Text>
                </View>
                <TextField
                  label="Item Description"
                  value={itemLabel}
                  onChangeText={setItemLabel}
                  placeholder="Item Description"
                />
                <TextField
                  label="Amount"
                  value={itemAmount}
                  onChangeText={setItemAmount}
                  placeholder="Amount"
                  keyboardType="numeric"
                />
                <View style={{ marginBottom: 10 }}>
                  <CostItemPicker
                    style={{ marginTop: 2 }}
                    projectId={projectId}
                    value={itemWorkItemEntry.value}
                    onValueChange={(workItemId) => {
                      const selectedEntry = allAvailableCostItemOptions.find(
                        (option) => option.value === workItemId,
                      );
                      setItemWorkItemEntry({
                        label: selectedEntry?.label ?? '',
                        value: workItemId,
                      });
                    }}
                    placeholder="Select Cost Item"
                    modalTitle="Select Cost Item"
                  />
                </View>
                <View style={styles.saveButtonRow}>
                  <ActionButton
                    style={styles.saveButton}
                    onPress={handleAddItemOk}
                    type="ok"
                    title="Add Item"
                  />
                  <ActionButton
                    style={styles.cancelButton}
                    onPress={handleAddItemCancel}
                    type="cancel"
                    title="Cancel"
                  />
                </View>
              </View>
            </SafeAreaView>
          </View>
        </SafeAreaProvider>
        {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  container: {
    flexGrow: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  saveButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  modalSafeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    padding: 10,
    width: '100%',
    elevation: 5,
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
});
