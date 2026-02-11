import { ActionButton } from '@/src/components/ActionButton';
import { ReceiptSummary } from '@/src/components/ReceiptSummary';
import SwipeableLineItem from '@/src/components/SwipeableLineItem';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { useAllRows as useAllConfigurationRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  ReceiptData,
  useAllRows,
  useCostUpdater,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { formatCurrency } from '@/src/utils/formatters';
import { buildLocalMediaUri, useAddImageCallback, useGetImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import { addReceiptToQuickBooks, QBBillLineItem } from '@/src/utils/quickbooksAPI';
import { getReceiptSyncHash } from '@/src/utils/quickbooksSyncHash';
import { useAuth } from '@clerk/clerk-expo';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, LayoutChangeEvent, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ReceiptDetailsPage = () => {
  const defaultDate = new Date();
  const { projectId, receiptId } = useLocalSearchParams<{ projectId: string; receiptId: string }>();
  const allProjectReceipts = useAllRows(projectId, 'receipts');
  const updateReceipt = useUpdateRowCallback(projectId, 'receipts');
  const addReceiptImage = useAddImageCallback();
  const appSettings = useAppSettings();
  const { isConnectedToQuickBooks } = useNetwork();
  const project = useProject(projectId);
  const projectAbbr = project?.abbreviation ?? '';
  const projectName = project?.name ?? '';
  const allAccounts = useAllConfigurationRows('accounts');

  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  useCostUpdater(projectId);
  const auth = useAuth();
  const { userId, orgId, getToken } = auth;
  const getImage = useGetImageCallback();

  const [allReceiptLineItems, setAllReceiptLineItems] = useState<WorkItemCostEntry[]>([]);

  useEffect(() => {
    const receipts = allCostItems.filter((item) => item.parentId === receiptId);
    setAllReceiptLineItems(receipts);
  }, [allCostItems, receiptId]);

  const [receipt, setReceipt] = useState<ReceiptData>({
    id: '',
    vendor: '',
    vendorId: '',
    paymentAccountId: '',
    description: '',
    amount: 0,
    thumbnail: '',
    receiptDate: defaultDate.getTime(),
    pictureDate: defaultDate.getTime(),
    imageId: '',
    notes: '',
    accountingId: '',
    markedComplete: false,
    purchaseId: '',
    qbSyncHash: '',
  });

  useEffect(() => {
    const match = allProjectReceipts.find((r) => r.id === receiptId);
    if (match) {
      // console.log('ReceiptDetailsPage - match:', match);
      setReceipt({ ...match });
    }
  }, [receiptId, allProjectReceipts]);

  const [itemsTotalCost, setItemsTotalCost] = useState(0);
  const [isSavingToQuickBooks, setIsSavingToQuickBooks] = useState(false);
  const router = useRouter();

  const [currentSyncHash, setCurrentSyncHash] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const computeSyncHash = async () => {
      try {
        const hash = await getReceiptSyncHash(receipt, allReceiptLineItems);
        if (isActive) {
          setCurrentSyncHash(hash);
        }
      } catch (error) {
        console.error('Failed to compute receipt sync hash:', error);
        if (isActive) {
          setCurrentSyncHash(null);
        }
      }
    };

    computeSyncHash();

    return () => {
      isActive = false;
    };
  }, [receipt, allReceiptLineItems]);

  const isReceiptOutOfSync =
    !!receipt.purchaseId && currentSyncHash !== null && receipt.qbSyncHash !== currentSyncHash;
  const isReceiptUpToDate = !!receipt.purchaseId && currentSyncHash !== null && !isReceiptOutOfSync;

  useEffect(() => {
    setItemsTotalCost(allReceiptLineItems.reduce((acc, item) => acc + item.amount, 0));
  }, [allReceiptLineItems]);

  const editDetails = useCallback(
    (item: ReceiptData) => {
      router.push({ pathname: '/[projectId]/receipt/[receiptId]/edit', params: { projectId, receiptId } });
    },
    [projectId, router, receiptId],
  );

  const handleAddReceiptPhoto = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Info', "You've refused to allow this app to access your camera!");
      return;
    }

    const cameraResponse = await ImagePicker.launchCameraAsync({ quality: 1.0 });

    if (!cameraResponse.canceled) {
      const asset = cameraResponse.assets[0];
      if (!cameraResponse.assets || cameraResponse.assets.length === 0 || !asset) return;

      // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
      const imageAddResult = await addReceiptImage(asset.uri, projectId, 'photo', 'receipt');
      if (imageAddResult.status !== 'Success') {
        Alert.alert('Error', `Unable to add receipt image: ${JSON.stringify(imageAddResult)}`);
        return;
      }

      console.log('Finished adding Receipt Image.', imageAddResult.id);
      const thumbnail = await createThumbnail(asset.uri);

      const updatedReceipt = {
        ...receipt,
        thumbnail: thumbnail ?? '',
        imageId: imageAddResult.id,
        pictureDate: new Date().getTime(),
      };

      const response = updateReceipt(updatedReceipt.id, updatedReceipt);
      if (response?.status !== 'Success') {
        Alert.alert('Error', `Unable to add receipt image - ${JSON.stringify(response)}`);
        return;
      }

      // Delete the photo from the camera roll after successfully copying to app directory and updating receipt
      if (asset.assetId) {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.deleteAssetsAsync([asset.assetId]);
            console.log('Successfully deleted photo from camera roll:', asset.assetId);
          } else {
            console.log('Media library permissions not granted, photo remains in camera roll');
          }
        } catch (error) {
          console.error('Error deleting photo from camera roll:', error);
          // Don't alert user - the image is already saved to app directory
        }
      }
    }
  }, [projectId, addReceiptImage, updateReceipt, receipt]);

  const showReceipt = useCallback(
    async (imageId: string) => {
      if (!!!imageId) {
        handleAddReceiptPhoto();
        return;
      }
      const uri = buildLocalMediaUri(orgId!, projectId, imageId, 'photo', 'receipt');
      let imageFileExist = false;

      const file = new File(uri);
      if (file.exists) {
        imageFileExist = true;
      } else {
        // File does not exist, so we need to call our backend to retrieve it.
        console.log('*** File does not exist. Need to retrieve from backend.');
        // Call your backend API to retrieve the file and save it locally
        // After retrieving the file, you can navigate to the image viewer
        const result = await getImage(projectId, imageId, 'receipt');
        if (result.result.status === 'Success') {
          imageFileExist = true;
        } else {
          Alert.alert(
            'Error',
            `Error retrieving receipt image: ${result.result.msg}. This may be due to no internet connectivity. Please try again later.`,
          );
        }
      }

      if (!imageFileExist) return;

      router.push({
        pathname: '/[projectId]/receipt/[receiptId]/showImage',
        params: {
          projectId,
          receiptId,
          uri,
        },
      });
    },
    [projectId, receiptId, orgId, router, handleAddReceiptPhoto, getImage],
  );

  const colors = useColors();
  const addLineItem = useCallback(() => {
    router.push({
      pathname: '/[projectId]/receipt/[receiptId]/addLineItem',
      params: { projectId, receiptId },
    });
  }, [projectId, receiptId, router]);

  const requestAIProcessing = useCallback(() => {
    console.log(
      `requestAIProcessing - route = /${projectId}/receipt/${receiptId}/requestAIProcessing?imageId=${receipt.imageId}`,
    );
    router.push({
      pathname: '/[projectId]/receipt/[receiptId]/requestAIProcessing',
      params: {
        projectId,
        receiptId,
        imageId: receipt.imageId,
      },
    });
  }, [projectId, receiptId, receipt.imageId, router]);

  const [containerHeight, setContainerHeight] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  const canSyncToQuickBooks =
    isConnectedToQuickBooks &&
    allReceiptLineItems.length > 0 &&
    receipt.amount > 0 &&
    !!receipt.paymentAccountId &&
    !!receipt.vendorId &&
    !!userId &&
    !!orgId &&
    !!projectAbbr;

  const handleSyncToQuickBooks = useCallback(async () => {
    if (!canSyncToQuickBooks || isSavingToQuickBooks) return;

    setIsSavingToQuickBooks(true);

    try {
      const qbLineItems: QBBillLineItem[] = [];
      const skippedLineItems: string[] = [];
      const qbExpenseAccountId = appSettings.quickBooksExpenseAccountId;

      for (const lineItem of allReceiptLineItems) {
        if (qbExpenseAccountId) {
          qbLineItems.push({
            amount: lineItem.amount,
            description: lineItem.label,
            accountRef: qbExpenseAccountId,
          });
        } else {
          skippedLineItems.push(lineItem.label);
          console.warn(
            `Skipping line item ${lineItem.id} - no valid account reference found for work item ${lineItem.workItemId}`,
          );
        }
      }

      if (qbLineItems.length === 0) {
        console.warn('No valid line items with account references - skipping QuickBooks sync');
        if (skippedLineItems.length > 0) {
          Alert.alert(
            'QuickBooks Sync Skipped',
            `Cannot sync to QuickBooks: ${skippedLineItems.length} line item(s) missing account references.`,
          );
        }
        return;
      }

      if (skippedLineItems.length > 0) {
        console.warn(
          `Warning: ${skippedLineItems.length} line item(s) were not synced to QuickBooks due to missing account references: ${skippedLineItems.join(', ')}`,
        );
      }

      const paymentAccountSubType = allAccounts.find(
        (acc) => acc.accountingId === receipt.paymentAccountId,
      )?.accountSubType;

      const receiptData = {
        userId,
        orgId,
        projectId,
        projectAbbr,
        projectName,
        imageId: receipt.imageId || '',
        addAttachment: !!receipt.imageId,
        qbPurchaseData: {
          vendorRef: receipt.vendorId,
          lineItems: qbLineItems,
          privateNote: receipt.notes || receipt.description || '',
          txnDate: new Date(receipt.receiptDate).toISOString().split('T')[0],
          paymentAccount: {
            paymentAccountRef: receipt.paymentAccountId,
            paymentType: paymentAccountSubType,
            checkNumber: paymentAccountSubType === 'Checking' ? receipt.notes : undefined, // Using 'notes' field to store check number if applicable
          },
        },
      };

      if (receipt.purchaseId) {
        Alert.alert(
          'Confirm Update',
          'This receipt is already in QuickBooks. Do you want to update the existing record?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsSavingToQuickBooks(false) },
            {
              text: 'Update',
              onPress: async () => {
                /*
                Once we support updating existing Bills in QuickBooks, we can implement that logic here.
                We will also need to recalculate the qbSyncHash after the update and save it to our local receipt record,
               just like we do after creating a new Bill.
                */
              },
            },
          ],
        );
        return;
      }

      // Create new Bill in QuickBooks
      const response = await addReceiptToQuickBooks(receiptData, getToken);
      console.log('Receipt successfully synced to QuickBooks:', response);

      const updates: ReceiptData = { ...receipt };
      if (response.data?.Purchase?.DocNumber) {
        updates.accountingId = response.data.Purchase.DocNumber;
        console.log('Updating local receipt with accountingId:', response.data?.Purchase?.DocNumber);
      }
      if (response.data?.Purchase?.Id) {
        updates.purchaseId = response.data.Purchase?.Id ?? '';
        console.log('Updating local receipt with purchaseId:', response.data.Purchase.Id);
      }

      const newHash = await getReceiptSyncHash(updates, allReceiptLineItems);
      updates.qbSyncHash = newHash;
      // console.log('Updating local receipt with:', updates);
      updateReceipt(receipt.id, updates);
    } catch (error) {
      console.error('Error syncing receipt to QuickBooks:', error);
    } finally {
      setIsSavingToQuickBooks(false);
    }
  }, [
    canSyncToQuickBooks,
    isSavingToQuickBooks,
    appSettings.quickBooksExpenseAccountId,
    allReceiptLineItems,
    receipt,
    userId,
    orgId,
    projectId,
    projectAbbr,
    projectName,
    getToken,
    updateReceipt,
    allAccounts,
  ]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Receipt Details' }} />
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <View style={{ flex: 1, width: '100%' }} onLayout={onLayout}>
          {containerHeight > 0 && (
            <>
              <View style={[styles.itemContainer, { borderColor: colors.border }]}>
                {orgId && (
                  <ReceiptSummary item={receipt} onShowDetails={editDetails} onShowReceipt={showReceipt} />
                )}
              </View>

              <View style={styles.container}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 10,
                    paddingHorizontal: 10,
                  }}
                >
                  <ActionButton
                    style={styles.leftButton}
                    onPress={addLineItem}
                    type={'action'}
                    title="Add Line Item"
                  />
                  {allReceiptLineItems.length === 0 && !!receipt.imageId && (
                    <ActionButton
                      style={styles.rightButton}
                      onPress={requestAIProcessing}
                      type={'action'}
                      title="Load from Photo"
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      width: '100%',
                      height: 40,
                      alignItems: 'center',
                      borderBottomColor: colors.separatorColor,
                      borderBottomWidth: 2,
                    }}
                  >
                    <Text
                      style={{ width: 90, textAlign: 'center', fontWeight: '600' }}
                      txtSize="standard"
                      text="Amount"
                    />
                    <Text
                      style={{ flex: 1, marginHorizontal: 20, textAlign: 'center', fontWeight: '600' }}
                      txtSize="standard"
                      text="Description"
                    />
                    <Text style={{ width: 40, fontWeight: '600' }} txtSize="standard" text="" />
                  </View>

                  <View style={{ maxHeight: containerHeight - 290 }}>
                    <FlatList
                      showsVerticalScrollIndicator={Platform.OS === 'web'}
                      data={allReceiptLineItems}
                      renderItem={({ item }) => <SwipeableLineItem lineItem={item} projectId={projectId} />}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      width: '100%',
                      height: 40,
                      alignItems: 'center',
                      marginLeft: 10,
                      borderTopColor: colors.separatorColor,
                      borderTopWidth: 2,
                    }}
                  >
                    <Text
                      style={{ width: 100, textAlign: 'right', fontWeight: '600' }}
                      text={itemsTotalCost ? formatCurrency(itemsTotalCost, true, true) : '$0.00'}
                    />
                    <Text
                      style={{ flex: 1, marginHorizontal: 10, marginLeft: 30, fontWeight: '600' }}
                      text={`Total for ${allReceiptLineItems.length} line ${
                        allReceiptLineItems.length?.toString() === '1' ? 'item' : 'items'
                      }`}
                    />
                  </View>
                  {canSyncToQuickBooks ? (
                    <View style={styles.syncButtonRow}>
                      {isSavingToQuickBooks ? (
                        <View style={styles.savingRow}>
                          <ActivityIndicator />
                          <Text
                            txtSize="standard"
                            style={styles.savingText}
                            text="Saving Receipt to QuickBooks"
                          />
                        </View>
                      ) : isReceiptUpToDate ? (
                        <></>
                      ) : (
                        <ActionButton
                          onPress={handleSyncToQuickBooks}
                          type="action"
                          title={
                            isReceiptOutOfSync ? 'Update Receipt in QuickBooks' : 'Save Receipt to QuickBooks'
                          }
                        />
                      )}
                    </View>
                  ) : isConnectedToQuickBooks ? (
                    <View style={styles.syncButtonRow}>
                      <Text
                        txtSize="xs"
                        style={{ ...styles.quickBooksWarning, color: colors.error }}
                        text="Please Edit Receipt to complete data required by QuickBooks"
                      />
                      <ActionButton onPress={() => editDetails(receipt)} type="cancel" title="Edit" />
                    </View>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </>
  );
};

export default ReceiptDetailsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  itemContainer: {
    flexDirection: 'row',
    borderRadius: 15,
    marginBottom: 10,
    marginRight: 5,
    padding: 10,
    height: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  leftButton: {
    flex: 1,
  },
  rightButton: {
    flex: 1,
  },
  syncButtonRow: {
    marginTop: 10,
    height: 60,
    paddingHorizontal: 10,
  },
  savingRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    marginLeft: 10,
  },
  quickBooksWarning: {
    textAlign: 'center',
    marginBottom: 8,
  },
  upToDateBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  upToDateText: {
    fontWeight: '600',
  },
});
