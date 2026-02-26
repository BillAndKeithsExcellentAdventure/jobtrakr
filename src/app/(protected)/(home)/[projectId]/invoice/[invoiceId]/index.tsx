import { ActionButton } from '@/src/components/ActionButton';
import { InvoiceSummary } from '@/src/components/InvoiceSummary';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { useAllRows as useAllConfigurationRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import {
  InvoiceData,
  useAllRows,
  useCostUpdater,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';

import { formatCurrency } from '@/src/utils/formatters';
import { addBill, updateBill, AddBillRequest, UpdateBillRequest } from '@/src/utils/quickbooksAPI';
import { getBillSyncHash } from '@/src/utils/quickbooksSyncHash';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, LayoutChangeEvent, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { File } from 'expo-file-system';
import SwipeableLineItem from '@/src/components/SwipeableLineItem';
import { useAuth } from '@clerk/clerk-expo';
import { buildLocalMediaUri, useAddImageCallback, useGetImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

const InvoiceDetailsPage = () => {
  const defaultDate = new Date();
  const { projectId, invoiceId } = useLocalSearchParams<{ projectId: string; invoiceId: string }>();
  const allProjectInvoices = useAllRows(projectId, 'invoices');
  const updateInvoice = useUpdateRowCallback(projectId, 'invoices');
  const addInvoiceImage = useAddImageCallback();

  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  useCostUpdater(projectId);
  const appSettings = useAppSettings();
  const { isConnectedToQuickBooks } = useNetwork();
  const project = useProject(projectId);
  const allVendors = useAllConfigurationRows('vendors');
  const auth = useAuth();
  const { orgId, userId, getToken } = auth;
  const getImage = useGetImageCallback();

  const [allInvoiceLineItems, setAllInvoiceLineItems] = useState<WorkItemCostEntry[]>([]);

  useEffect(() => {
    const invoices = allCostItems.filter((item) => item.parentId === invoiceId);
    setAllInvoiceLineItems(invoices);
  }, [allCostItems, invoiceId]);

  const [invoice, setInvoice] = useState<InvoiceData>({
    id: '',
    invoiceNumber: '',
    vendor: '',
    vendorId: '',
    description: '',
    amount: 0,
    thumbnail: '',
    invoiceDate: defaultDate.getTime(),
    pictureDate: defaultDate.getTime(),
    imageId: '',
    notes: '',
    accountingId: '',
    markedComplete: false,
    paymentAccountId: '',
    billId: '',
    qbSyncHash: '',
  });

  useEffect(() => {
    const match = allProjectInvoices.find((r) => r.id === invoiceId);
    if (match) {
      setInvoice({ ...match });
    }
  }, [invoiceId, allProjectInvoices]);

  const [itemsTotalCost, setItemsTotalCost] = useState(0);
  const [isSavingToQuickBooks, setIsSavingToQuickBooks] = useState(false);
  const router = useRouter();

  const [currentSyncHash, setCurrentSyncHash] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const computeSyncHash = async () => {
      try {
        const hash = await getBillSyncHash(invoice, allInvoiceLineItems);
        if (isActive) {
          setCurrentSyncHash(hash);
        }
      } catch (error) {
        console.error('Failed to compute bill sync hash:', error);
        if (isActive) {
          setCurrentSyncHash(null);
        }
      }
    };

    computeSyncHash();

    return () => {
      isActive = false;
    };
  }, [invoice, allInvoiceLineItems]);

  const isInvoiceOutOfSync =
    !!invoice.billId && currentSyncHash !== null && invoice.qbSyncHash !== currentSyncHash;
  const isInvoiceUpToDate = !!invoice.billId && currentSyncHash !== null && !isInvoiceOutOfSync;

  useEffect(() => {
    setItemsTotalCost(allInvoiceLineItems.reduce((acc, item) => acc + item.amount, 0));
  }, [allInvoiceLineItems]);

  const hasItemWithNoWorkItemId = useMemo(
    () => allInvoiceLineItems.some((item) => !item.workItemId),
    [allInvoiceLineItems],
  );

  const amountsMatch = useMemo(
    () => parseFloat(invoice.amount.toFixed(2)) === parseFloat(itemsTotalCost.toFixed(2)),
    [invoice.amount, itemsTotalCost],
  );

  const canSyncToQuickBooks =
    isConnectedToQuickBooks &&
    allInvoiceLineItems.length > 0 &&
    invoice.amount > 0 &&
    !!invoice.vendorId &&
    !!userId &&
    !!orgId &&
    !hasItemWithNoWorkItemId &&
    amountsMatch;

  const editDetails = useCallback(
    (item: InvoiceData) => {
      router.push({ pathname: '/[projectId]/invoice/[invoiceId]/edit', params: { projectId, invoiceId } });
    },
    [projectId, router, invoiceId],
  );

  const handleSyncToQuickBooks = useCallback(async () => {
    if (!canSyncToQuickBooks || isSavingToQuickBooks) return;

    setIsSavingToQuickBooks(true);

    const qbExpenseAccountId = appSettings.quickBooksExpenseAccountId;
    const vendorQbId = allVendors.find((v) => v.id === invoice.vendorId)?.accountingId;

    const qbLineItems = allInvoiceLineItems.map((item) => ({
      amount: item.amount,
      description: item.label,
      accountRef: qbExpenseAccountId,
    }));

    try {
      if (invoice.billId) {
        const qbBill: UpdateBillRequest = {
          projectId,
          projectAbbr: project?.abbreviation ?? '',
          projectName: project?.name ?? '',
          billId: invoice.billId,
          addAttachment: !!invoice.imageId,
          imageId: invoice.imageId,
          qbBillData: {
            vendorRef: vendorQbId ?? '',
            dueDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
            lineItems: qbLineItems,
          },
        };
        const response = await updateBill(orgId!, userId!, qbBill, getToken);
        console.log('Bill successfully synced to QuickBooks:', response);
        const hash = await getBillSyncHash(invoice, allInvoiceLineItems);
        const updatedInvoice: InvoiceData = {
          ...invoice,
          qbSyncHash: hash,
        };
        updateInvoice(invoice.id, updatedInvoice);
      } else {
        const qbBill: AddBillRequest = {
          projectId,
          projectAbbr: project?.abbreviation ?? '',
          projectName: project?.name ?? '',
          addAttachment: !!invoice.imageId,
          imageId: invoice.imageId,
          qbBillData: {
            vendorRef: vendorQbId ?? '',
            dueDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
            lineItems: qbLineItems,
          },
        };

        const response = await addBill(orgId!, userId!, qbBill, getToken);
        console.log('Bill successfully synced to QuickBooks:', response);

        const hash = await getBillSyncHash(invoice, allInvoiceLineItems);
        const updatedInvoice: InvoiceData = {
          ...invoice,
          billId: response.data?.Bill?.Id ?? '',
          accountingId: response.data?.Bill?.DocNumber ?? '',
          qbSyncHash: hash,
        };
        updateInvoice(invoice.id, updatedInvoice);
      }
    } catch (error) {
      console.error('Error syncing invoice to QuickBooks:', error);
      Alert.alert(
        'QuickBooks Sync Failed',
        'Unable to sync invoice to QuickBooks. Please check your connection and try again.',
      );
    } finally {
      setIsSavingToQuickBooks(false);
    }
  }, [
    canSyncToQuickBooks,
    isSavingToQuickBooks,
    appSettings,
    allVendors,
    invoice,
    allInvoiceLineItems,
    projectId,
    project,
    orgId,
    userId,
    getToken,
    updateInvoice,
  ]);

  const handleAddInvoicePhoto = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const cameraResponse = await ImagePicker.launchCameraAsync({ quality: 0.25 });

    if (!cameraResponse.canceled) {
      const asset = cameraResponse.assets[0];
      if (!cameraResponse.assets || cameraResponse.assets.length === 0 || !asset) return;

      // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
      const imageAddResult = await addInvoiceImage(asset.uri, projectId, 'photo', 'invoice');
      if (imageAddResult.status !== 'Success') {
        alert(`Unable to add invoice image: ${JSON.stringify(imageAddResult)}`);
        return;
      }

      console.log('Finished adding Invoice Image.', imageAddResult.id);
      const thumbnail = await createThumbnail(asset.uri);

      const updatedInvoice = {
        ...invoice,
        thumbnail: thumbnail ?? '',
        imageId: imageAddResult.id,
        pictureDate: new Date().getTime(),
      };

      const response = updateInvoice(updatedInvoice.id, updatedInvoice);
      if (response?.status !== 'Success') {
        alert(`Unable to add invoice image - ${JSON.stringify(response)}`);
        return;
      }

      // Delete the photo from the camera roll after successfully copying to app directory and updating invoice
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
  }, [projectId, addInvoiceImage, updateInvoice, invoice]);

  const showInvoice = useCallback(
    async (imageId: string) => {
      if (!!!imageId) {
        handleAddInvoicePhoto();
        return;
      }
      const uri = buildLocalMediaUri(orgId!, projectId, imageId, 'photo', 'invoice');
      let imageFileExist = false;

      const file = new File(uri);
      if (file.exists) {
        imageFileExist = true;
      } else {
        // File does not exist, so we need to call our backend to retrieve it.
        console.log('*** File does not exist. Need to retrieve from backend.');
        // Call your backend API to retrieve the file and save it locally
        // After retrieving the file, you can navigate to the image viewer
        const result = await getImage(projectId, imageId, 'invoice');
        if (result.result.status === 'Success') {
          imageFileExist = true;
        } else {
          alert(
            `Error retrieving invoice image: ${result.result.msg}. This may be due to no internet connectivity. Please try again later.`,
          );
        }
      }

      if (!imageFileExist) return;

      router.push({
        pathname: '/[projectId]/invoice/[invoiceId]/showImage',
        params: {
          projectId,
          invoiceId,
          uri,
        },
      });
    },
    [projectId, invoiceId, orgId, router, handleAddInvoicePhoto, getImage],
  );

  const colors = useColors();
  const addLineItem = useCallback(() => {
    router.push({
      pathname: '/[projectId]/invoice/[invoiceId]/addLineItem',
      params: { projectId, invoiceId },
    });
  }, [projectId, invoiceId, router]);

  const requestAIProcessing = useCallback(() => {
    console.log(
      `requestAIProcessing - route = /${projectId}/invoice/${invoiceId}/requestAIProcessing?imageId=${invoice.imageId}`,
    );
    router.push({
      pathname: '/[projectId]/invoice/[invoiceId]/requestAIProcessing',
      params: {
        projectId,
        invoiceId,
        imageId: invoice.imageId,
      },
    });
  }, [projectId, invoiceId, invoice.imageId, router]);

  const [containerHeight, setContainerHeight] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  return (
    <SafeAreaView onLayout={onLayout} edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Bill Details',
          headerShown: true,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      {containerHeight > 0 && (
        <>
          <View style={[styles.itemContainer, { borderColor: colors.border }]}>
            {orgId && (
              <InvoiceSummary item={invoice} onShowDetails={editDetails} onShowInvoice={showInvoice} />
            )}
          </View>

          <View style={styles.container}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}
            >
              <ActionButton
                style={styles.leftButton}
                onPress={addLineItem}
                type={'action'}
                title="Add Line Item"
              />
              {allInvoiceLineItems.length === 0 && !!invoice.imageId && (
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
                  data={allInvoiceLineItems}
                  renderItem={({ item }) => <SwipeableLineItem lineItem={item} projectId={projectId} />}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  height: 40,
                  alignItems: 'center',
                  borderTopColor: colors.separatorColor,
                  borderTopWidth: 2,
                }}
              >
                <Text
                  style={{ width: 110, textAlign: 'right', fontWeight: '600' }}
                  text={itemsTotalCost ? formatCurrency(itemsTotalCost, true, true) : '$0.00'}
                />
                <Text
                  style={{ flex: 1, marginHorizontal: 10, marginLeft: 30, fontWeight: '600' }}
                  text={`Total for ${allInvoiceLineItems.length} line ${
                    allInvoiceLineItems.length?.toString() === '1' ? 'item' : 'items'
                  }`}
                />
              </View>
              {isConnectedToQuickBooks && hasItemWithNoWorkItemId && (
                <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                  <Text
                    txtSize="xs"
                    style={{ color: colors.error, textAlign: 'center' }}
                    text="All line items must be fully specified with a cost code before syncing to QuickBooks"
                  />
                </View>
              )}
              {canSyncToQuickBooks ? (
                <View style={styles.syncButtonRow}>
                  {isSavingToQuickBooks ? (
                    <View style={styles.savingRow}>
                      <ActivityIndicator />
                      <Text txtSize="standard" style={styles.savingText} text="Saving Bill to QuickBooks" />
                    </View>
                  ) : isInvoiceUpToDate ? (
                    <></>
                  ) : (
                    <>
                      {isInvoiceOutOfSync && (
                        <Text
                          txtSize="xs"
                          style={{ ...styles.quickBooksWarning, color: colors.error }}
                          text="Bill was modified after syncing to QuickBooks"
                        />
                      )}
                      <ActionButton
                        onPress={handleSyncToQuickBooks}
                        type="action"
                        title={invoice.billId ? 'Update Bill in QuickBooks' : 'Add Bill to QuickBooks'}
                      />
                    </>
                  )}
                </View>
              ) : isConnectedToQuickBooks && allInvoiceLineItems.length > 0 ? (
                <View style={styles.syncButtonRow}>
                  {!amountsMatch ? (
                    <>
                      <Text
                        txtSize="xs"
                        style={{ ...styles.quickBooksWarning, color: colors.error }}
                        text="Bill amount must match line item total"
                      />
                      <ActionButton onPress={() => editDetails(invoice)} type="cancel" title="Edit" />
                    </>
                  ) : (
                    <>
                      <Text
                        txtSize="xs"
                        style={{ ...styles.quickBooksWarning, color: colors.error }}
                        text="Please Edit Bill to complete data required by QuickBooks"
                      />
                      <ActionButton onPress={() => editDetails(invoice)} type="cancel" title="Edit" />
                    </>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default InvoiceDetailsPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    flex: 1,
    width: '100%',
  },
  itemContainer: {
    flexDirection: 'row',
    margin: 10,
    borderRadius: 15,
    padding: 10,
    height: 100,
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
});
