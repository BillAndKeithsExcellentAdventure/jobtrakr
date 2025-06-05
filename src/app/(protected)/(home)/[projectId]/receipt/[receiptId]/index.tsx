import { ActionButton } from '@/src/components/ActionButton';
import { ReceiptSummary } from '@/src/components/ReceiptSummary';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  ReceiptData,
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

const ReceiptDetailsPage = () => {
  const defaultDate = new Date();
  const { projectId, receiptId } = useLocalSearchParams<{ projectId: string; receiptId: string }>();
  const allProjectReceipts = useAllRows(projectId, 'receipts');
  const updateReceipt = useUpdateRowCallback(projectId, 'receipts');
  const addReceiptImage = useAddImageCallback();

  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  useCostUpdater(projectId);
  const auth = useAuth();
  const { orgId } = auth;
  const getImage = useGetImageCallback();

  const [allReceiptLineItems, setAllReceiptLineItems] = useState<WorkItemCostEntry[]>([]);

  useEffect(() => {
    const receipts = allCostItems.filter((item) => item.parentId === receiptId);
    setAllReceiptLineItems(receipts);
  }, [allCostItems, receiptId]);

  const [receipt, setReceipt] = useState<ReceiptData>({
    id: '',
    vendor: '',
    description: '',
    amount: 0,
    numLineItems: 0,
    thumbnail: '',
    receiptDate: defaultDate.getTime(),
    pictureDate: defaultDate.getTime(),
    imageId: '',
    notes: '',
    markedComplete: false,
  });

  useEffect(() => {
    const match = allProjectReceipts.find((r) => r.id === receiptId);
    if (match) {
      // console.log('ReceiptDetailsPage - match:', match);
      setReceipt({ ...match });
    }
  }, [receiptId, allProjectReceipts]);

  const [itemsTotalCost, setItemsTotalCost] = useState(0);
  const router = useRouter();

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
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const cameraResponse = await ImagePicker.launchCameraAsync({ quality: 1.0 });

    if (!cameraResponse.canceled) {
      const asset = cameraResponse.assets[0];
      if (!cameraResponse.assets || cameraResponse.assets.length === 0 || !asset) return;

      // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
      const imageAddResult = await addReceiptImage(asset.uri, projectId, 'receipt');
      if (imageAddResult.status !== 'Success') {
        alert(`Unable to add receipt image: ${JSON.stringify(imageAddResult)}`);
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
        alert(`Unable to add receipt image - ${JSON.stringify(response)}`);
      }
    }
  }, [projectId, addReceiptImage, updateReceipt, receipt]);

  const showReceipt = useCallback(
    async (imageId: string) => {
      if (!!!imageId) {
        handleAddReceiptPhoto();
        return;
      }
      const uri = buildLocalImageUri(orgId!, projectId, imageId, 'receipt');
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
            const result = await getImage(projectId, imageId, 'receipt');
            if (result.result.status === 'Success') {
              imageFileExist = true;
            } else {
              alert(
                `Error retrieving receipt image: ${result.result.msg}. This may be due to no internet connectivity. Please try again later.`,
              );
            }
          }
        });
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
  }, [projectId, receiptId, receipt.imageId]);

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
      <Stack.Screen options={{ title: 'Receipt Details', headerShown: true }} />
      {containerHeight > 0 && (
        <>
          <View style={[styles.itemContainer, { borderColor: colors.border }]}>
            {orgId && (
              <ReceiptSummary item={receipt} onShowDetails={editDetails} onShowReceipt={showReceipt} />
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
              {allReceiptLineItems.length === 0 && !!receipt.imageId && (
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
                text={`Total for ${allReceiptLineItems.length} line ${
                  allReceiptLineItems.length?.toString() === '1' ? 'item' : 'items'
                }`}
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default ReceiptDetailsPage;

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
function addReceiptImage(uri: any, projectId: string, arg2: string) {
  throw new Error('Function not implemented.');
}
