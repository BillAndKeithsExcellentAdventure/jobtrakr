import { ActionButton } from '@/src/components/ActionButton';
import { TextField } from '@/src/components/TextField';
import { View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  ChangeOrder,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  useEffect(() => {
    if (allChangeOrders) {
      const foundChangeOrder = allChangeOrders.find((co) => co.id === changeOrderId);
      if (foundChangeOrder) {
        setChangeOrder(foundChangeOrder);
      }
    }
  }, [allChangeOrders, changeOrderId]);

  const handleSubmit = useCallback(async () => {
    if (changeOrder) {
      updateChangeOrder(changeOrderId, changeOrder);
      router.back();
    }
  }, [changeOrder, changeOrderId, router, updateChangeOrder]);

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
          <View style={{ gap: 6, padding: 10 }}>
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

export default EditChangeOrder;
