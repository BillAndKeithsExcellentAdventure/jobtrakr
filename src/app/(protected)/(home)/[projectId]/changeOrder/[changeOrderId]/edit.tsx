import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useColors } from '@/src/context/ColorsContext';
import {
  ChangeOrder,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native-gesture-handler';
import { Text, View } from '@/src/components/Themed';
import { TextField } from '@/src/components/TextField';
import { StyleSheet } from 'react-native';
import { ActionButton } from '@/src/components/ActionButton';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { useMediaLibraryPermissions } from 'expo-image-picker';

const EditChangeOrder = () => {
  const { projectId, changeOrderId } = useLocalSearchParams<{
    projectId: string;
    changeOrderId: string;
  }>();

  const colors = useColors();
  const router = useRouter();
  const allChangeOrders = useAllRows(projectId, 'changeOrders');
  const updateChangeOrder = useUpdateRowCallback(projectId, 'changeOrders');
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);

  useEffect(() => {
    if (allChangeOrders) {
      const foundChangeOrder = allChangeOrders.find((co) => co.id === changeOrderId);
      if (foundChangeOrder) {
        setChangeOrder(foundChangeOrder);
      }
    }
  }, [allChangeOrders, changeOrderId]);

  const allStatusOptions = useMemo(() => {
    return [
      { label: 'Draft', value: 'draft' },
      { label: 'Pending', value: 'approval-pending' },
      { label: 'Cancelled', value: 'cancelled' },
      { label: 'Approved', value: 'approved' },
    ];
  }, []);

  const handleSubmit = useCallback(async () => {
    if (changeOrder) {
      updateChangeOrder(changeOrderId, changeOrder);
      router.back();
    }
  }, [changeOrder, changeOrderId, router, updateChangeOrder]);

  const [isStatusPickerVisible, setIsStatusPickerVisible] = useState<boolean>(false);
  const [pickedStatusOption, setPickedStatusOption] = useState<OptionEntry | undefined>(undefined);

  const handleStatusChange = useCallback((selectedStatus: OptionEntry) => {
    setPickedStatusOption(selectedStatus);
  }, []);

  useEffect(() => {
    if (changeOrder) {
      const matchingStatus = allStatusOptions.find((c) => c.value === changeOrder?.status);
      if (matchingStatus) handleStatusChange(matchingStatus);
    }
  }, [changeOrder]);

  const handleStatusOptionChange = (option: OptionEntry) => {
    if (option) {
      handleStatusChange(option);
      if (changeOrder) setChangeOrder({ ...changeOrder, status: option.value });
    }
    setIsStatusPickerVisible(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Order Details',
        }}
      />

      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        {changeOrder && (
          <View style={{ padding: 10, gap: 6 }}>
            <TextField
              style={[styles.input, { borderColor: colors.transparent }]}
              label="Title"
              placeholder="Title"
              value={changeOrder.title}
              onChangeText={(text) => setChangeOrder({ ...changeOrder, title: text })}
            />
            <TextField
              containerStyle={styles.inputContainer}
              style={[styles.input, { borderColor: colors.transparent }]}
              placeholder="Description"
              label="Description"
              value={changeOrder.description}
              onChangeText={(text) => setChangeOrder({ ...changeOrder, description: text })}
            />
            <OptionPickerItem
              containerStyle={styles.inputContainer}
              optionLabel={pickedStatusOption?.label}
              label="Status"
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

export default EditChangeOrder;
