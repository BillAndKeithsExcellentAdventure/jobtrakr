import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  ChangeOrderItem,
  useAddRowCallback,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SetChangeOrderStatus = () => {
  const { projectId, changeOrderId } = useLocalSearchParams<{
    projectId: string;
    changeOrderId: string;
  }>();

  const colors = useColors();
  const router = useRouter();
  const allChangeOrders = useAllRows(projectId, 'changeOrders');
  const updateChangeOrder = useUpdateRowCallback(projectId, 'changeOrders');
  const allChangeOrderItems = useAllRows(projectId, 'changeOrderItems');
  const changeOrder = useMemo(
    () => allChangeOrders.find((co) => co.id === changeOrderId) ?? null,
    [allChangeOrders, changeOrderId],
  );
  const changeOrderItems = useMemo<ChangeOrderItem[]>(
    () => allChangeOrderItems.filter((item) => item.changeOrderId === changeOrderId),
    [allChangeOrderItems, changeOrderId],
  );

  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const updateBidEstimate = useUpdateRowCallback(projectId, 'workItemSummaries');
  const addWorkItemSummary = useAddRowCallback(projectId, 'workItemSummaries');
  const [isStatusPickerVisible, setIsStatusPickerVisible] = useState<boolean>(false);
  const [pickedStatusOption, setPickedStatusOption] = useState<OptionEntry | undefined>(undefined);

  const allStatusOptions = useMemo(() => {
    return [
      { label: 'Draft', value: 'draft' },
      { label: 'Pending', value: 'approval-pending' },
      { label: 'Approved', value: 'approved' },
      { label: 'Cancelled', value: 'cancelled' },
    ];
  }, []);

  const currentStatusOption = useMemo(
    () => allStatusOptions.find((c) => c.value === changeOrder?.status),
    [allStatusOptions, changeOrder?.status],
  );

  const mergeChangeOrderCostItems = useCallback(
    (isAdding = true) => {
      // create a new array of changeOrderItemsToPost by combining the amount of each changeOrderItems that has a matching workItemId
      const changeOrderItemsToPost: ChangeOrderItem[] = changeOrderItems.reduce((acc, item) => {
        const existingItem = acc.find((i) => i.workItemId === item.workItemId);
        if (existingItem) {
          existingItem.amount += item.amount;
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, [] as ChangeOrderItem[]);

      changeOrderItemsToPost.forEach((item) => {
        const match = allWorkItemSummaries.find((s) => s.workItemId === item.workItemId);
        if (match) {
          // update existing item
          const updatedDatedBidAmount = isAdding
            ? match.bidAmount + item.amount
            : match.bidAmount - item.amount;
          updateBidEstimate(match.id, { bidAmount: updatedDatedBidAmount });
        } else {
          if (isAdding) {
            addWorkItemSummary({
              id: '',
              workItemId: item.workItemId,
              bidAmount: item.amount,
              complete: false,
            });
          }
        }
      });
    },
    [changeOrderItems, addWorkItemSummary, updateBidEstimate, allWorkItemSummaries],
  );

  const handleSubmit = useCallback(async () => {
    if (changeOrder) {
      const nextStatus = pickedStatusOption ?? currentStatusOption;
      if (!nextStatus) {
        router.back();
        return;
      }

      if (nextStatus.value === currentStatusOption?.value) {
        router.back();
        return;
      }

      if (currentStatusOption?.value !== 'approved' && nextStatus.value === 'approval-pending') {
        updateChangeOrder(changeOrderId, { ...changeOrder, status: nextStatus.value });
        router.back();
        return;
      }

      if (currentStatusOption?.value !== 'approved' && nextStatus.value === 'draft') {
        updateChangeOrder(changeOrderId, { ...changeOrder, status: nextStatus.value });
        router.back();
        return;
      }

      if (currentStatusOption?.value !== 'approved' && nextStatus.value === 'approved') {
        Alert.alert(
          'Approve Change Order',
          "Press 'Approve' button to confirm that the customer has approved the work items and related cost of the Change Order.",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Approve',
              onPress: () => {
                const result = updateChangeOrder(changeOrderId, {
                  ...changeOrder,
                  status: nextStatus.value,
                });
                if (result.status === 'Success') {
                  mergeChangeOrderCostItems(true);
                }
                router.back();
              },
            },
          ],
        );
        return;
      }

      if (nextStatus.value === 'cancelled' && currentStatusOption?.value !== 'approved') {
        Alert.alert('Cancel Change Order', 'Please confirm that the Change Order should be canceled.', [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              updateChangeOrder(changeOrderId, { ...changeOrder, status: nextStatus.value });
              router.back();
            },
          },
        ]);
        return;
      }

      if (nextStatus.value === 'cancelled' && currentStatusOption?.value === 'approved') {
        Alert.alert(
          'Cancel Change Order',
          'Please confirm that the Change Order should be canceled. This will remove the associated cost from the project.',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes',
              onPress: () => {
                const result = updateChangeOrder(changeOrderId, {
                  ...changeOrder,
                  status: nextStatus.value,
                });
                if (result.status === 'Success') {
                  mergeChangeOrderCostItems(false);
                }
                router.back();
              },
            },
          ],
        );
        return;
      }
    }
  }, [
    changeOrder,
    changeOrderId,
    pickedStatusOption,
    currentStatusOption,
    updateChangeOrder,
    router,
    mergeChangeOrderCostItems,
  ]);

  const handleStatusChange = useCallback((selectedStatus: OptionEntry) => {
    setPickedStatusOption(selectedStatus);
  }, []);

  const handleStatusOptionChange = (option: OptionEntry) => {
    if (option) {
      handleStatusChange(option);
    }
    setIsStatusPickerVisible(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Set Change Order Status',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        {changeOrder && (
          <View style={{ padding: 10, gap: 6 }}>
            <TextField
              inputStyle={[styles.input, { borderColor: colors.transparent }]}
              label="Change Order"
              placeholder="Title"
              readOnly
              value={changeOrder.title}
              onChangeText={(text) => setChangeOrder({ ...changeOrder, title: text })}
            />
            <TextField
              containerStyle={styles.inputContainer}
              readOnly
              inputStyle={[styles.input, { borderColor: colors.transparent }]}
              placeholder="Unknown Status"
              label="Current Status"
              value={currentStatusOption?.label}
            />
            <OptionPickerItem
              containerStyle={styles.inputContainer}
              optionLabel={pickedStatusOption?.label}
              label="New Status"
              placeholder="Select Status"
              editable={false}
              onPickerButtonPress={() => setIsStatusPickerVisible(true)}
            />

            <View style={styles.saveButtonRow}>
              <ActionButton style={styles.saveButton} onPress={handleSubmit} type={'ok'} title="Save" />

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
        )}
      </SafeAreaView>

      {isStatusPickerVisible && (
        <BottomSheetContainer
          isVisible={isStatusPickerVisible}
          onClose={() => setIsStatusPickerVisible(false)}
        >
          <OptionList
            options={allStatusOptions}
            onSelect={(option) => handleStatusOptionChange(option)}
            selectedOption={pickedStatusOption}
            enableSearch={allStatusOptions.length > 15}
          />
        </BottomSheetContainer>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 0, // use gap instead
  },
  input: {
    borderWidth: 1,
    alignContent: 'stretch',
    justifyContent: 'center',
    borderRadius: 5,
  },
  saveButtonRow: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
});

export default SetChangeOrderStatus;
