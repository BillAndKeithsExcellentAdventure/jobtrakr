import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Keyboard,
  Platform,
  TouchableOpacity,
} from 'react-native';
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
import { formatCurrency } from '@/src/utils/formatters';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import CostItemPickerModal from '@/src/components/CostItemPickerModal';
import { OptionEntry } from '@/src/components/OptionList';
import { ProposedChangeOrderItem } from '@/src/models/types';
import SwipeableChangeOrderItem from '@/src/components/SwipeableChangeOrderItem';

export default function AddChangeOrder() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const colors = useColors();
  const router = useRouter();
  const addChangeOrder = useAddRowCallback(projectId, 'changeOrders');
  const addChangeOrderItem = useAddRowCallback(projectId, 'changeOrderItems');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [items, setItems] = useState<ProposedChangeOrderItem[]>([]);
  const [canAdd, setCanAdd] = useState(false);
  const [newChangeOrder, setChangeOrder] = useState<ChangeOrder>({
    id: '',
    title: '',
    description: '',
    bidAmount: 0,
    dateCreated: Date.now(),
    status: 'draft',
  });

  // State for modal ChangeItem fields
  const [itemLabel, setItemLabel] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemWorkItemEntry, setItemWorkItemEntry] = useState<OptionEntry>({
    label: '',
    value: '',
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

  const [showCostItemPicker, setShowCostItemPicker] = useState(false);

  const onCostItemOptionSelected = useCallback((costItemEntry: OptionEntry | undefined) => {
    if (costItemEntry) {
      const label = costItemEntry.label;
      const workItemId = costItemEntry.value ?? '';
      setItemWorkItemEntry({
        label: costItemEntry.label,
        value: costItemEntry.value,
      });
    }
    setShowCostItemPicker(false);
  }, []);

  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    // set total cost by summing the amount of each item in items array
    if (items && items.length === 0) setTotalCost(0);
    else setTotalCost(items.reduce((total, item) => total + item.amount, 0));
  }, [items]);

  return (
    <>
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Add Change Order', headerShown: true }} />

        <View style={[styles.container, { gap: 8 }]}>
          <View style={{ gap: 8, padding: 16, backgroundColor: colors.listBackground }}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background }]}
              value={newChangeOrder.title}
              onChangeText={(text) => handleChange('title', text)}
              placeholder="Title"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, maxHeight: 80 }]}
              value={newChangeOrder.description}
              onChangeText={(text) => handleChange('description', text)}
              placeholder="Detailed Description"
              numberOfLines={4}
              multiline
            />
          </View>

          <View style={[styles.saveButtonRow, { gap: 10, paddingHorizontal: 10 }]}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text text="Change Order Items" txtSize="sub-title" />
            </View>
            <ActionButton
              style={styles.addButton}
              onPress={() => {
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
              <SwipeableChangeOrderItem
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
                    text={formatCurrency(totalCost, true)}
                  />
                </View>
              </View>
            )}
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
        </View>
      </SafeAreaView>
      {/* Modal for adding ChangeItem */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleAddItemCancel}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.opaqueModalOverlayBackgroundColor }]}>
          <SafeAreaView
            edges={['top']}
            style={[styles.modalSafeArea, Platform.OS === 'ios' && { marginTop: 60 }]}
          >
            <View style={styles.modalContent}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text txtSize="title">Add Change Order Item</Text>
              </View>
              <Text style={styles.label}>Item Description</Text>
              <TextInput
                style={styles.input}
                value={itemLabel}
                onChangeText={setItemLabel}
                placeholder="Item Description"
              />
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={itemAmount}
                onChangeText={setItemAmount}
                placeholder="Amount"
                keyboardType="numeric"
              />
              <Text style={styles.label}>Cost Item</Text>
              <TouchableOpacity activeOpacity={1} onPress={() => setShowCostItemPicker(true)}>
                <View style={{ marginBottom: 10 }}>
                  <TextInput
                    style={styles.input}
                    value={itemWorkItemEntry.label ?? null}
                    readOnly={true}
                    placeholder="Select Cost Item"
                    onPressIn={() => setShowCostItemPicker(true)}
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.saveButtonRow}>
                <ActionButton style={styles.saveButton} onPress={handleAddItemOk} type="ok" title="OK" />
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
        </View>
        {Platform.OS === 'ios' && <KeyboardToolbar />}
      </Modal>

      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  addButton: {
    maxWidth: 100,
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
  },
  modalSafeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    width: '100%',
    elevation: 5,
  },
});
