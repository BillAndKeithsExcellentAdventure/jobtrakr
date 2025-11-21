import { ActionButton } from '@/src/components/ActionButton';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import CostItemPickerModal from '@/src/components/CostItemPickerModal';
import { NumberInputField } from '@/src/components/NumberInputField';
import { OptionEntry } from '@/src/components/OptionList';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import SwipeableChangeOrderItem from '@/src/components/SwipeableChangeOrderItem';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
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
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { loadTemplateHtmlAssetFileToString } from '@/src/utils/htmlFileGenerator';
import { ChangeOrderData, renderChangeOrderTemplate } from '@/src/utils/renderChangeOrderTemplate';
import { useAuth } from '@clerk/clerk-expo';
import { AntDesign, Entypo, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Modal, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateHash } from '@/src/utils/calculateHash';

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

    // Set 'now' to 48 hours in the future from the current time, measured in seconds since Jan 1, 2000 UTC
    const now = Math.floor((Date.now() + 48 * 60 * 60 * 1000 - Date.UTC(2000, 0, 1, 0, 0, 0, 0)) / 1000);
    const hash = await calculateHash(projectId, changeOrder?.id || '', now);

    console.log('Sending change order for approval:', changeOrderData);
    console.log('Change Order ID:', changeOrder?.id);
    console.log('Project ID:', projectId);
    console.log('Hash:', hash);
    console.log('Now:', now);

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
        const errorMessage =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message
            : 'Failed to generate PDF';
        Alert.alert('Error', errorMessage);
      }
    }
  }, [changeOrderData, changeOrder?.id, auth]);

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
    addChangeOrderItem({ ...newChangeOrderItem, changeOrderId });
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
