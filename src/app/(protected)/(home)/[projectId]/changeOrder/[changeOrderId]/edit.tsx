import { NumericInputField } from '@/src/components/NumericInputField';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
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
    }
  }, [changeOrder, changeOrderId, updateChangeOrder]);

  const handleBackPress = () => {
    router.back();
  };

  const handleQuotedPriceChange = (value: number) => {
    if (changeOrder) {
      updateChangeOrder(changeOrderId, { ...changeOrder, quotedPrice: value });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Order Details',
          gestureEnabled: false,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
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
              onBlur={handleSubmit}
              focusManagerId="TITLE"
            />
            <TextField
              containerStyle={styles.inputContainer}
              style={[styles.input, { borderColor: colors.transparent }]}
              placeholder="Description"
              label="Description"
              value={changeOrder.description}
              onChangeText={(text) => setChangeOrder({ ...changeOrder, description: text })}
              multiline={true}
              numberOfLines={4}
              focusManagerId="DESCRIPTION"
              onBlur={handleSubmit}
            />
            <NumericInputField
              label="Customer Quoted Price"
              inputStyle={{ paddingHorizontal: 10 }}
              labelStyle={{ marginBottom: 0 }}
              value={changeOrder.quotedPrice ?? 0}
              onChangeNumber={(value) => handleQuotedPriceChange(value ?? 0)}
              placeholder="Customer Quoted Price"
            />
          </View>
        )}
      </SafeAreaView>
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
