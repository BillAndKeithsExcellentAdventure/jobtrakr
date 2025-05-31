import { ActionButton } from '@/src/components/ActionButton';
import { InvoiceSummary } from '@/src/components/InvoiceSummary';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  InvoiceData,
  useAllRows,
  useCostUpdater,
  useUpdateRowCallback,
  WorkItemCostEntry,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, LayoutChangeEvent, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import SwipeableLineItem from '@/src/components/SwipeableLineItem';
import { useAuth } from '@clerk/clerk-expo';
import { buildLocalImageUri, useAddImageCallback, useGetImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import * as ImagePicker from 'expo-image-picker';

const InvoiceDetailsPage = () => {
  const defaultDate = new Date();
  const { projectId, invoiceId } = useLocalSearchParams<{ projectId: string; invoiceId: string }>();
  const allProjectInvoices = useAllRows(projectId, 'invoices');
  const updateInvoice = useUpdateRowCallback(projectId, 'invoices');
  const addInvoiceImage = useAddImageCallback();

  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  useCostUpdater(projectId);
  const auth = useAuth();
  const { orgId } = auth;
  const getImage = useGetImageCallback();

  const [allInvoiceLineItems, setAllInvoiceLineItems] = useState<WorkItemCostEntry[]>([]);

  useEffect(() => {
    const invoices = allCostItems.filter((item) => item.parentId === invoiceId);
    setAllInvoiceLineItems(invoices);
  }, [allCostItems, invoiceId]);

  const [invoice, setInvoice] = useState<InvoiceData>({
    id: '',
    vendor: '',
    description: '',
    amount: 0,
    numLineItems: 0,
    thumbnail: '',
    invoiceDate: defaultDate.getTime(),
    pictureDate: defaultDate.getTime(),
    imageId: '',
    notes: '',
    markedComplete: false,
  });

  useEffect(() => {
    const match = allProjectInvoices.find((r) => r.id === invoiceId);
    if (match) {
      console.log('InvoiceDetailsPage - match:', match);
      setInvoice({ ...match });
    }
  }, [invoiceId, allProjectInvoices]);

  const [itemsTotalCost, setItemsTotalCost] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setItemsTotalCost(allInvoiceLineItems.reduce((acc, item) => acc + item.amount, 0));
  }, [allInvoiceLineItems]);

  const editDetails = useCallback(
    (item: InvoiceData) => {
      router.push({ pathname: '/[projectId]/invoice/[invoiceId]/edit', params: { projectId, invoiceId } });
    },
    [projectId, router, invoiceId],
  );

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
      const imageAddResult = await addInvoiceImage(asset.uri, projectId, 'invoice');
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
      }
    }
  }, [projectId, addInvoiceImage, updateInvoice, invoice]);

  const showInvoice = useCallback(
    async (imageId: string) => {
      if (!!!imageId) {
        handleAddInvoicePhoto();
        return;
      }
      const uri = buildLocalImageUri(orgId!, projectId, imageId, 'invoice');
      let imageFileExist = false;

      if (uri.startsWith('file://')) {
        // This is a local file. We need to check if it exists.
        const fileUri = uri.replace('file://', '');
        console.log('*** File URI:', fileUri);
        // Check if the file exists

        await FileSystem.getInfoAsync(fileUri).then(async (fileInfo) => {
          if (fileInfo.exists) {
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
        });
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
  }, [projectId, invoiceId, invoice.imageId]);

  const [containerHeight, setContainerHeight] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  return (
    <SafeAreaView
      onLayout={onLayout}
      edges={['right', 'bottom', 'left']}
      style={{ flex: 1, overflowY: 'hidden' }}
    >
      <Stack.Screen options={{ title: 'Invoice Details', headerShown: true }} />
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
                style={{ width: 90, textAlign: 'right', fontWeight: '600' }}
                txtSize="standard"
                text={itemsTotalCost ? formatCurrency(itemsTotalCost, true, true) : '$0.00'}
              />
              <Text
                style={{ flex: 1, marginHorizontal: 10, textAlign: 'center', fontWeight: '600' }}
                txtSize="standard"
                text={`Total for ${allInvoiceLineItems.length} line ${
                  allInvoiceLineItems.length?.toString() === '1' ? 'item' : 'items'
                }`}
              />
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
  inputContainer: {
    marginTop: 6,
  },
  itemContainer: {
    flexDirection: 'row',
    margin: 10,
    borderRadius: 15,
    padding: 10,
    height: 100,
  },

  amountColumn: {
    width: 90,
  },

  leftButton: {
    flex: 1,
  },
  rightButton: {
    flex: 1,
  },
});
function addInvoiceImage(uri: any, projectId: string, arg2: string) {
  throw new Error('Function not implemented.');
}
