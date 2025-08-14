import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  ChangeOrder,
  ChangeOrderItem,
  useAddRowCallback,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const allChangeOrderItems = useAllRows(projectId, 'changeOrderItems');
  const [changeOrderItems, setChangeOrderItems] = useState<ChangeOrderItem[]>([]);

  useEffect(() => {
    if (allChangeOrders) {
      const foundChangeOrder = allChangeOrders.find((co) => co.id === changeOrderId);
      if (foundChangeOrder) {
        setChangeOrder(foundChangeOrder);
      }
    }
  }, [allChangeOrders]);

  useEffect(() => {
    if (changeOrder) {
      const items = allChangeOrderItems.filter((item) => item.changeOrderId === changeOrder.id);
      setChangeOrderItems(items);
    }
  }, [changeOrder, allChangeOrderItems]);

  const allWorkItemSummaries = useAllRows(projectId, 'workItemSummaries');
  const updateBidEstimate = useUpdateRowCallback(projectId, 'workItemSummaries');
  const addWorkItemSummary = useAddRowCallback(projectId, 'workItemSummaries');
  const [isStatusPickerVisible, setIsStatusPickerVisible] = useState<boolean>(false);
  const [currentStatusOption, setCurrentStatusOption] = useState<OptionEntry | undefined>(undefined);
  const [pickedStatusOption, setPickedStatusOption] = useState<OptionEntry | undefined>(undefined);

  const allStatusOptions = useMemo(() => {
    return [
      { label: 'Draft', value: 'draft' },
      { label: 'Pending', value: 'approval-pending' },
      { label: 'Approved', value: 'approved' },
      { label: 'Cancelled', value: 'cancelled' },
    ];
  }, []);

  const mergeChangeOrderCostItems = useCallback(
    (isAdding = true) => {
      changeOrderItems.forEach((item) => {
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
    if (changeOrder && pickedStatusOption) {
      if (pickedStatusOption?.value === currentStatusOption?.value) {
        router.back();
        return;
      }

      if (currentStatusOption?.value !== 'approved' && pickedStatusOption?.value === 'approval-pending') {
        updateChangeOrder(changeOrderId, { ...changeOrder, status: pickedStatusOption.value });
        router.back();
        return;
      }

      if (currentStatusOption?.value !== 'approved' && pickedStatusOption?.value === 'draft') {
        updateChangeOrder(changeOrderId, { ...changeOrder, status: pickedStatusOption.value });
        router.back();
        return;
      }

      if (currentStatusOption?.value !== 'approved' && pickedStatusOption?.value === 'approved') {
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
                  status: pickedStatusOption.value,
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

      if (pickedStatusOption?.value === 'cancelled' && currentStatusOption?.value !== 'approved') {
        Alert.alert('Cancel Change Order', 'Please confirm that the Change Order should be canceled.', [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              updateChangeOrder(changeOrderId, { ...changeOrder, status: pickedStatusOption.value });
              router.back();
            },
          },
        ]);
        return;
      }

      if (pickedStatusOption?.value === 'cancelled' && currentStatusOption?.value === 'approved') {
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
                  status: pickedStatusOption.value,
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

  useEffect(() => {
    if (changeOrder) {
      const matchingStatus = allStatusOptions.find((c) => c.value === changeOrder?.status);
      if (matchingStatus) {
        handleStatusChange(matchingStatus);
        setCurrentStatusOption(matchingStatus);
      }
    }
  }, [changeOrder]);

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
        }}
      />

      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        {changeOrder && (
          <View style={{ padding: 10, gap: 6 }}>
            <TextField
              inputWrapperStyle={{ borderColor: colors.transparent }}
              style={[styles.input, { borderColor: colors.transparent }]}
              label="Change Order"
              placeholder="Title"
              readOnly
              value={changeOrder.title}
              onChangeText={(text) => setChangeOrder({ ...changeOrder, title: text })}
            />
            <TextField
              inputWrapperStyle={{ borderColor: colors.transparent }}
              containerStyle={styles.inputContainer}
              readOnly
              style={[styles.input, { borderColor: colors.transparent }]}
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
          />
        </BottomSheetContainer>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items at the top vertically
    alignItems: 'center', // Center horizontally
    width: '100%',
    paddingTop: 10,
  },
  dateContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    maxWidth: 460,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 0, // use gap instead
  },
  inputLabel: {
    marginTop: 0, // use gap instead
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    alignContent: 'stretch',
    justifyContent: 'center',
    borderRadius: 5,
  },
  dateInput: {
    borderWidth: 1,
    alignContent: 'stretch',
    justifyContent: 'center',
    borderRadius: 5,
    paddingHorizontal: 8,
    height: 40,
    paddingVertical: 0,
  },
  gpsButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  gpsButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10, // Rounded edges
  },
  gpsButtonLeft: {
    marginRight: 10, // Add margin between the two buttons
  },
  gpsButtonRight: {
    marginLeft: 10, // Add margin between the two buttons
  },
  gpsButtonText: {
    fontSize: 16,
    fontWeight: 'semibold',
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
