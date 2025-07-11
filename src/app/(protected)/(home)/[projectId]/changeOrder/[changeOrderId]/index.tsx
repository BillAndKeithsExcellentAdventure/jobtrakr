import React, { useState, useEffect, use, useCallback, useMemo } from 'react';
import { ActionButton } from '@/src/components/ActionButton';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  ChangeOrder,
  ChangeOrderItem,
  useAddRowCallback,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { Alert, Button, Platform, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { FlatList } from 'react-native-gesture-handler';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { ChangeOrderData, renderChangeOrderTemplate } from '@/src/utils/renderChangeOrderTemplate';
import { loadTemplateHtmlAssetFileToString } from '@/src/utils/htmlFileGenerator';

const DefineChangeOrderScreen = () => {
  const { projectId, changeOrderId } = useLocalSearchParams<{ projectId: string; changeOrderId: string }>();
  const colors = useColors();
  const router = useRouter();
  const allChangeOrders = useAllRows(projectId, 'changeOrders');
  const addChangeOrder = useAddRowCallback(projectId, 'changeOrders');
  const updateChangeOrder = useUpdateRowCallback(projectId, 'changeOrders');
  const allChangeOrderItems = useAllRows(projectId, 'changeOrderItems');
  const addChangeOrderItem = useAddRowCallback(projectId, 'changeOrderItems');
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [changeOrderItems, setChangeOrderItems] = useState<ChangeOrderItem[]>([]);
  const appSettings = useAppSettings();
  const projectData = useProject(projectId);

  useEffect(() => {
    if (allChangeOrders) {
      const foundChangeOrder = allChangeOrders.find((co) => co.id === changeOrderId);
      if (foundChangeOrder) {
        setChangeOrder(foundChangeOrder);
      }
    }
  }, [allChangeOrders, allChangeOrderItems]);

  useEffect(() => {
    if (changeOrder) {
      const items = allChangeOrderItems.filter((item) => item.changeOrderId === changeOrder.id);
      setChangeOrderItems(items);
    }
  }, [changeOrder, allChangeOrderItems]);

  const changeOrderData = useMemo<ChangeOrderData | null>(() => {
    if (!changeOrder) return null;

    // create changeItems array by mapping properties from changeOrderItems
    const changeItemArray = changeOrderItems.map((item) => ({
      description: item.label,
      cost: item.amount,
      formattedCost: '', // auto generated
    }));

    return {
      company: {
        project: projectData?.name ?? 'unknown',
        name: appSettings.companyName,
        address: [
          appSettings.address,
          appSettings.address2,
          `${appSettings.city}, ${appSettings.state} ${appSettings.zip}`,
        ],
        formattedAddress: '',
        phone: appSettings.phone,
        email: appSettings.email,
        contact: appSettings.ownerName,
      },
      client: {
        name: projectData?.ownerName,
        formattedAddress: '',
      },
      project: projectData?.name ?? 'unknown',
      date: formatDate(new Date()),
      changeSummary: changeOrder.description,
      formattedTotal: formatCurrency(changeOrder.bidAmount, true),
      changeItems: changeItemArray,
    };
  }, [changeOrder, projectData, appSettings]);

  const handleSendForApproval = useCallback(async () => {
    if (!changeOrderData) return;

    // Define your HTML template string here or import it from another file
    // Load the HTML template from the file system
    let templateHTMLString: string;
    try {
      templateHTMLString = await loadTemplateHtmlAssetFileToString();
    } catch (err) {
      console.error('Failed to load template HTML:', err);
      Alert.alert('Error', 'Could not load change order template.');
      return;
    }

    const htmlOutput = renderChangeOrderTemplate(templateHTMLString, changeOrderData);
    if (htmlOutput) {
      console.log(htmlOutput);
      //shareHtmlFile = async (filePath: string, dialogTitle: string): Promise<void> => {
    }
    /* TODO
    try {
      // Update the change order status to 'approval-pending'
      const updatedChangeOrder: ChangeOrder = { ...changeOrder, status: 'approval-pending' };
      updateChangeOrder(updatedChangeOrder.id, updatedChangeOrder);
      setChangeOrder(updatedChangeOrder);

      // Optionally, navigate to a different screen or show a success message
      Alert.alert('Success', 'Change order sent for approval.');
      router.back();
    } catch (error) {
      console.error('Error sending change order for approval:', error);
      Alert.alert('Error', 'Failed to send change order for approval.');
    }
      */
  }, [changeOrderData]); //, updateChangeOrder, router

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Change Order Details',
        }}
      />
      <View style={{ flex: 1 }}>
        {changeOrder && (
          <View style={{ padding: 10 }}>
            {changeOrder.status === 'draft' && (
              <ActionButton title="Send for Approval" type="action" onPress={handleSendForApproval} />
            )}
            <Text text={changeOrder?.title} txtSize="title" />
            {changeOrder?.description && <Text text={changeOrder?.description} />}
            <Text text={formatCurrency(changeOrder.bidAmount, true)} txtSize="title" />
          </View>
        )}
        {changeOrderItems.length > 0 && (
          <FlatList
            data={changeOrderItems}
            renderItem={({ item }) => (
              <View style={{ padding: 10, borderBottomWidth: 1, borderColor: colors.border }}>
                <Text text={item.label} />
                <Text text={formatCurrency(item.amount, true)} />
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 16,
  },
  modalContainer: {
    maxWidth: 460,
    width: '100%',
  },
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
});

export default DefineChangeOrderScreen;
