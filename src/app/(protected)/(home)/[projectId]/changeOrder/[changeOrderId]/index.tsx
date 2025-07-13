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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@clerk/clerk-expo';

const generateAndSavePdf = async (
  htmlContent: string,
  changeOrderId: string,
  userId: string,
  token: string,
): Promise<string | null> => {
  try {
    // RESTful API call to generate PDF
    const response = await fetch('https://projecthoundbackend.keith-m-bertram.workers.dev/generatePdf', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle PDF response as blob
    const pdfBlob = await response.blob();

    // Convert blob to base64 for React Native
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;

          // Save PDF to cache directory
          const fileName = `change_order_${changeOrderId}_${Date.now()}.pdf`;
          const filePath = `${FileSystem.cacheDirectory}${fileName}`;

          // Remove the data:application/pdf;base64, prefix if present
          const base64Content = base64data.split(',')[1] || base64data;

          await FileSystem.writeAsStringAsync(filePath, base64Content, {
            encoding: FileSystem.EncodingType.Base64,
          });

          console.log('PDF saved to cache:', filePath);
          resolve(filePath);
        } catch (fileError) {
          console.error('Error saving PDF file:', fileError);
          reject(new Error('Failed to save PDF file'));
        }
      };

      reader.onerror = () => {
        console.error('Error reading PDF blob');
        reject(new Error('Failed to process PDF response'));
      };

      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

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
  const auth = useAuth();

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
        phone: appSettings.phone,
        email: appSettings.email,
        contact: appSettings.ownerName,
      },
      client: {
        name: projectData?.ownerName ?? '',
        address: [
          projectData?.ownerAddress ?? '',
          projectData?.ownerAddress2 ?? '',
          `${projectData?.ownerCity ?? ''}${projectData?.ownerCity ? ',' : ''} ${
            projectData?.ownerState ?? ''
          } ${projectData?.ownerZip ?? ''}`,
        ],
        phone: projectData?.ownerPhone ?? '',
        email: projectData?.ownerEmail ?? '',
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

      try {
        const userId = auth.userId;
        if (!userId) {
          Alert.alert('Error', 'User ID not found.');
          return;
        }

        const token = (await auth.getToken()) ?? '';
        // Generate and save PDF using the new function
        const pdfFilePath = await generateAndSavePdf(htmlOutput, changeOrder?.id || 'unknown', userId, token);

        if (pdfFilePath) {
          // Show success alert with sharing option
          Alert.alert('PDF Generated Successfully', 'Would you like to share the PDF?', [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Share',
              onPress: async () => {
                try {
                  await Sharing.shareAsync(pdfFilePath, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Share Change Order PDF',
                  });
                } catch (shareError) {
                  console.error('Error sharing PDF:', shareError);
                  Alert.alert('Error', 'Failed to share PDF');
                }
              },
            },
          ]);
        }
      } catch (error) {
        Alert.alert('Error', error.message || 'Failed to generate PDF');
      }
    }
  }, [changeOrderData, changeOrder?.id]);

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
