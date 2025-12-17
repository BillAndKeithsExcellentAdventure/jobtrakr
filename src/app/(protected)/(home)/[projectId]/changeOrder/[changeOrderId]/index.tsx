import { ActionButton } from '@/src/components/ActionButton';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import CostItemPickerModal from '@/src/components/CostItemPickerModal';
import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { NumberInputField } from '@/src/components/NumberInputField';
import { OptionEntry } from '@/src/components/OptionList';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import SwipeableChangeOrderItem from '@/src/components/SwipeableChangeOrderItem';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
import { API_BASE_URL } from '@/src/constants/app-constants';
import { useColors } from '@/src/context/ColorsContext';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import {
  ChangeOrder,
  ChangeOrderItem,
  useAddRowCallback,
  useAllRows,
  useUpdateRowCallback,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { createApiWithToken } from '@/src/utils/apiWithTokenRefresh';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { loadTemplateHtmlAssetFileToString } from '@/src/utils/htmlFileGenerator';
import { ChangeOrderData, renderChangeOrderTemplate } from '@/src/utils/renderChangeOrderTemplate';
import { useAuth } from '@clerk/clerk-expo';
import { AntDesign, Entypo, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, StyleSheet, TouchableOpacity } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SendPdfParams {
  userId: string;
  htmlPdf: string;
  htmlBody: string;
  toEmail: string;
  fromEmail: string;
  fromName: string;
  changeOrderId: string;
  projectId: string;
  expirationDate: string;
  ownerEmail: string;
  subject: string;
}

const generateAndSendPdf = async (
  params: SendPdfParams,
  changeOrderId: string,
  getToken: () => Promise<string | null>,
): Promise<string | null> => {
  try {
    const apiFetch = createApiWithToken(getToken);
    const response = await apiFetch(`${API_BASE_URL}/sendChangeOrderEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
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
  const updateChangeOrder = useUpdateRowCallback(projectId, 'changeOrders');
  const allChangeOrderItems = useAllRows(projectId, 'changeOrderItems');
  const addChangeOrderItem = useAddRowCallback(projectId, 'changeOrderItems');
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [changeOrderItems, setChangeOrderItems] = useState<ChangeOrderItem[]>([]);
  const [changeOrderBidAmount, setChangeOrderBidAmount] = useState<number>(0);
  const appSettings = useAppSettings();
  const projectData = useProject(projectId);
  const auth = useAuth();
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [newChangeOrderItem, setNewChangeOrderItem] = useState<ChangeOrderItem>({
    id: '',
    changeOrderId: changeOrderId,
    label: '',
    amount: 0,
    workItemId: '',
  });

  useEffect(() => {
    if (allChangeOrders) {
      const foundChangeOrder = allChangeOrders.find((co) => co.id === changeOrderId);
      if (foundChangeOrder) {
        setChangeOrder(foundChangeOrder);
      }
    }
  }, [allChangeOrders, changeOrderId]);

  useEffect(() => {
    if (changeOrder) {
      const items = allChangeOrderItems.filter((item) => item.changeOrderId === changeOrder.id);
      setChangeOrderItems(items);
    }
  }, [changeOrder, allChangeOrderItems]);

  useEffect(() => {
    setChangeOrderBidAmount(changeOrderItems.reduce((total, item) => total + item.amount, 0));
  }, [changeOrderItems]);

  useEffect(() => {
    if (changeOrder && changeOrder.bidAmount !== changeOrderBidAmount) {
      const updatedChangeOrder = { ...changeOrder, bidAmount: changeOrderBidAmount };
      updateChangeOrder(changeOrder.id, updatedChangeOrder);
    }
  }, [changeOrder, changeOrderBidAmount, updateChangeOrder]);

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
        logo: appSettings.companyLogo ?? '',
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
  }, [changeOrder, projectData, appSettings, changeOrderItems]);

  const handleSendForApproval = useCallback(async () => {
    if (!changeOrderData) return;

    // Validate required settings
    if (!appSettings?.ownerName || !appSettings?.email || !appSettings?.companyName) {
      Alert.alert('Missing Settings', 'Please configure your company settings before sending change orders.');
      return;
    }

    if (!projectData?.ownerEmail) {
      Alert.alert('Missing Client Email', 'The project does not have a client email address specified.');
      return;
    }

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
      try {
        const userId = auth.userId;
        if (!userId) {
          Alert.alert('Error', 'User ID not found.');
          return;
        }

        // Calculate hash and expiration (48 hours from now in seconds since Jan 1, 2000)
        const expirationDate = Math.floor(
          (Date.now() + 48 * 60 * 60 * 1000 - Date.UTC(2000, 0, 1, 0, 0, 0, 0)) / 1000,
        );

        // Generate the acceptance URL - points to a landing page instead of direct API
        const acceptUrl = `https://staticwebpages.pages.dev/AcceptChangeOrder.html?projectId=${encodeURIComponent(
          projectId,
        )}&changeOrderId=${encodeURIComponent(
          changeOrderId,
        )}&expirationDate=${expirationDate}&email=${encodeURIComponent(projectData?.ownerEmail ?? '')}`;

        // Create HTML email body with inline styles for better email client compatibility
        const msgBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f4f4f4;
      padding: 20px;
      text-align: center;
      border-bottom: 3px solid #007bff;
    }
    .content {
      padding: 20px;
      background-color: #ffffff;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      margin: 20px 0;
      background-color: #007bff;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #dddddd;
      font-size: 12px;
      color: #666666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${appSettings.companyName}</h1>
  </div>
  <div class="content">
    <p>Dear ${projectData?.ownerName ?? 'Client'},</p>
    
    <p>Please review the attached change order titled <strong>"${
      changeOrder?.title || 'unknown'
    }"</strong>.</p>
    
    <p><strong>Project:</strong> ${projectData?.name ?? 'Unknown Project'}</p>
    <p><strong>Change Order Amount:</strong> ${formatCurrency(changeOrder?.bidAmount ?? 0, true)}</p>
    
    <p>To accept this change order, please click the button below:</p>
    
    <p style="text-align: center;">
      <a href="<[AcceptURL]>" class="button">Accept Change Order</a>
    </p>
    
    <p style="margin-top: 30px;">
      Best regards,<br/>
      <strong>${appSettings.ownerName}</strong><br/>
      ${appSettings.companyName}<br/>
      ${appSettings.phone ? `Phone: ${appSettings.phone}<br/>` : ''}
      ${appSettings.email ? `Email: ${appSettings.email}` : ''}
    </p>
  </div>
  <div class="footer">
    <p>This is an automated email. Please do not reply directly to this message.</p>
    <p>If you have any questions, please contact us at ${appSettings.email ?? 'our office'}.</p>
  </div>
</body>
</html>
      `.trim();

        // Generate and send PDF with HTML email body
        const pdfFilePath = await generateAndSendPdf(
          {
            userId: userId,
            htmlPdf: htmlOutput,
            htmlBody: msgBody,
            toEmail: projectData?.ownerEmail ?? '',
            fromEmail: appSettings.email ?? '',
            fromName: appSettings.ownerName ?? '',
            changeOrderId: changeOrder?.id ?? '',
            projectId: projectId,
            expirationDate: expirationDate.toString(),
            ownerEmail: projectData?.ownerEmail ?? '',
            subject: `${appSettings.companyName} : Please review and accept change order "${
              changeOrder?.title || 'unknown'
            }"`,
          },
          changeOrder?.id || 'unknown',
          auth.getToken,
        );

        if (pdfFilePath) {
          Alert.alert('Success', 'Change order sent successfully!');
        }
      } catch (error) {
        const errorMessage =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message
            : 'Failed to send change order';
        Alert.alert('Error', errorMessage);
      }
    }
  }, [changeOrderData, changeOrder, appSettings, projectData, auth, projectId, changeOrderId]);

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      ...(changeOrder?.status !== 'cancelled'
        ? [
            {
              icon: <FontAwesome name="edit" size={28} color={colors.iconColor} />,
              label: 'Edit Change Order Info',
              onPress: () => {
                router.push({
                  pathname: '/[projectId]/changeOrder/[changeOrderId]/edit',
                  params: { projectId, changeOrderId },
                });
                setHeaderMenuModalVisible(false);
              },
            },
            {
              icon: <Entypo name="plus" size={28} color={colors.iconColor} />,
              label: 'Add Change Order Item',
              onPress: () => {
                setHeaderMenuModalVisible(false);
                setShowAddItemModal(true);
              },
            },
          ]
        : []),
      {
        icon: <AntDesign name="check" size={28} color={colors.iconColor} />,
        label: 'Set Change Order Status',
        onPress: () => {
          router.push({
            pathname: '/[projectId]/changeOrder/[changeOrderId]/setStatus',
            params: { projectId, changeOrderId },
          });
          setHeaderMenuModalVisible(false);
        },
      },
    ],
    [colors, router, changeOrder, projectId, changeOrderId],
  );

  const [itemWorkItemEntry, setItemWorkItemEntry] = useState<OptionEntry>({
    label: '',
    value: '',
  });

  const [showCostItemPicker, setShowCostItemPicker] = useState(false);

  const handleShowCostItemPicker = () => {
    Keyboard.dismiss();
    setShowCostItemPicker(true);
  };

  const handleAddItemCancel = () => {
    setShowAddItemModal(false);
    setNewChangeOrderItem({
      id: '',
      changeOrderId: changeOrderId,
      label: '',
      amount: 0,
      workItemId: '',
    });
  };

  const handleAddItemOk = () => {
    if (!newChangeOrderItem.label || !newChangeOrderItem.amount || !itemWorkItemEntry.value) {
      Alert.alert('Error', 'Please fill in all item fields.');
      return;
    }
    addChangeOrderItem({ ...newChangeOrderItem, workItemId: itemWorkItemEntry.value, changeOrderId });
    setShowAddItemModal(false);
    setNewChangeOrderItem({
      id: '',
      changeOrderId: changeOrderId,
      label: '',
      amount: 0,
      workItemId: '',
    });
    setItemWorkItemEntry({
      label: 'Select Cost Item',
      value: '',
    });
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
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Change Order Details',
          headerRight: () => (
            <View style={{ marginRight: 0 }}>
              <Pressable
                style={{ marginRight: 0 }}
                onPress={() => {
                  setHeaderMenuModalVisible(!headerMenuModalVisible);
                }}
              >
                {({ pressed }) => (
                  <MaterialCommunityIcons
                    name="menu"
                    size={28}
                    color={colors.iconColor}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </View>
          ),
        }}
      />
      <View style={{ flex: 1 }}>
        {changeOrder && (
          <View style={{ padding: 10, marginBottom: 10 }}>
            {changeOrder.status === 'draft' && (
              <View style={{ marginBottom: 10 }}>
                <ActionButton title="Send for Approval" type="action" onPress={handleSendForApproval} />
              </View>
            )}
            <View style={{ padding: 10, gap: 6, flexDirection: 'row', alignItems: 'center' }}>
              {changeOrder.status === 'draft' && (
                <View style={{ width: 30, paddingRight: 5, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={colors.iconColor} />
                </View>
              )}
              {changeOrder.status === 'approval-pending' && (
                <View style={{ width: 30, paddingRight: 5, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="glasses" size={24} color={colors.iconColor} />
                </View>
              )}
              {changeOrder.status === 'approved' && (
                <View style={{ width: 30, paddingRight: 5, alignItems: 'center' }}>
                  <AntDesign name="check" size={24} color={colors.iconColor} />
                </View>
              )}
              {changeOrder.status === 'cancelled' && (
                <View style={{ width: 30, paddingRight: 5, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="cancel" size={24} color={colors.iconColor} />
                </View>
              )}
              <View style={{ gap: 6 }}>
                <Text text={changeOrder?.title} txtSize="title" />
                {changeOrder?.description && <Text text={changeOrder?.description} />}
              </View>
            </View>
          </View>
        )}
        <FlatList
          style={{ backgroundColor: colors.background }}
          data={changeOrderItems}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => <SwipeableChangeOrderItem projectId={projectId} item={item} />}
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
                  text={formatCurrency(changeOrderBidAmount, true, true)}
                />
              </View>
            </View>
          )}
        />
      </View>
      {/* Modal for adding ChangeOrderItem */}
      {showAddItemModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <ModalScreenContainer
            onSave={handleAddItemOk}
            onCancel={handleAddItemCancel}
            canSave={!!newChangeOrderItem.label && !!newChangeOrderItem.amount && !!itemWorkItemEntry.value}
            saveButtonTitle="Add Item"
          >
            <Text style={styles.modalTitle}>Add Change Order Item</Text>
            <TextField
              style={[styles.input, { borderColor: colors.transparent, maxHeight: 80 }]}
              value={newChangeOrderItem.label}
              onChangeText={(text) =>
                setNewChangeOrderItem((prev) => ({
                  ...prev,
                  label: text,
                }))
              }
              placeholder="Item Description"
              label="Item Description"
            />
            <NumberInputField
              label="Amount"
              style={styles.numberInput}
              value={newChangeOrderItem.amount}
              onChange={(value) =>
                setNewChangeOrderItem((prev) => ({
                  ...prev,
                  amount: value,
                }))
              }
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
          </ModalScreenContainer>
          {showCostItemPicker && (
            <CostItemPickerModal
              isVisible={showCostItemPicker}
              onClose={() => setShowCostItemPicker(false)}
              projectId={projectId}
              handleCostItemOptionSelected={onCostItemOptionSelected}
            />
          )}
        </View>
      )}

      {headerMenuModalVisible && (
        <RightHeaderMenu
          modalVisible={headerMenuModalVisible}
          setModalVisible={setHeaderMenuModalVisible}
          buttons={rightHeaderMenuButtons}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
    gap: 8,
  },
});

export default DefineChangeOrderScreen;
