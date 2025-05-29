import { ActionButton } from '@/src/components/ActionButton';
import { Text, View } from '@/src/components/Themed';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { FlashList } from '@shopify/flash-list';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import {
  ReceiptData,
  RecentReceiptDateCompare,
  useAddRowCallback,
  useAllRows,
  useIsStoreAvailableCallback,
  useSeedWorkItemsIfNecessary,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAddImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import { useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableReceiptItem, { ITEM_HEIGHT } from './SwipeableReceiptItem';

function isReceiptEntry(actionContext: any): actionContext is { PictureUri: string } {
  return actionContext && typeof actionContext.PictureUri === 'string';
}

const ProjectReceiptsPage = () => {
  const router = useRouter();
  const { projectId, receiptId, projectName } = useLocalSearchParams<{
    projectId: string;
    receiptId: string;
    projectName: string;
  }>();

  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);
  useSeedWorkItemsIfNecessary(projectId);

  const auth = useAuth();
  const allReceipts = useAllRows(projectId, 'receipts', RecentReceiptDateCompare);
  const addReceiptImage = useAddImageCallback();
  const addReceipt = useAddRowCallback(projectId, 'receipts');

  const colors = useColors();

  const handleAddPhotoReceipt = useCallback(async () => {
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
      const imageAddResult = await addReceiptImage(asset.uri, projectId, 'receipt');
      if (imageAddResult.status !== 'Success') {
        alert(`Unable to add receipt image: ${JSON.stringify(imageAddResult)}`);
        return;
      }

      console.log('Finished adding Receipt Image.', imageAddResult.id);
      const thumbnail = await createThumbnail(asset.uri);

      const newReceipt: ReceiptData = {
        id: '',
        vendor: '',
        description: '',
        amount: 0,
        numLineItems: 0,
        thumbnail: thumbnail ?? '',
        receiptDate: new Date().getTime(),
        notes: '',
        markedComplete: false,
        imageId: imageAddResult.id,
        pictureDate: new Date().getTime(),
      };

      console.log('Adding a new Receipt.', newReceipt);

      const response = addReceipt(newReceipt);
      if (response?.status === 'Success') {
        newReceipt.id = response.id;
        console.log('Project receipt successfully added:', newReceipt);
      } else {
        alert(
          `Unable to insert Project receipt: ${JSON.stringify(newReceipt.imageId)} - ${JSON.stringify(
            response,
          )}`,
        );
      }
    }
  }, [projectId, addReceiptImage, addReceipt, projectName]);

  const handleAddReceipt = useCallback(() => {
    router.push({
      pathname: '/[projectId]/receipt/add',
      params: {
        projectId,
        projectName,
      },
    });
  }, [projectId, projectName, router]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <Stack.Screen options={{ title: `${projectName}`, headerShown: true }} />
      <View style={styles.viewCenteringContainer}>
        {!projectIsReady ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <View style={styles.viewContentContainer}>
              <View
                style={{
                  backgroundColor: colors.listBackground,
                  padding: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    padding: 5,
                    borderRadius: 5,
                    gap: 10,
                  }}
                >
                  <ActionButton
                    style={{ flex: 1 }}
                    onPress={handleAddPhotoReceipt}
                    type={'action'}
                    title="Add Photo"
                  />
                  <ActionButton
                    style={{ flex: 1 }}
                    onPress={handleAddReceipt}
                    type={'action'}
                    title="Add Manual"
                  />
                </View>
              </View>
              <View style={{ alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth }}>
                <Text txtSize="title" style={{ marginVertical: 5 }}>
                  Project Receipts
                </Text>
              </View>

              {allReceipts.length === 0 ? (
                <View style={{ alignItems: 'center', margin: 40 }}>
                  <Text txtSize="xl" text="No receipts found." />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flex: 1,
                      width: '100%',
                      backgroundColor: colors.listBackground,
                    }}
                  >
                    <FlashList
                      estimatedItemSize={ITEM_HEIGHT}
                      data={allReceipts}
                      keyExtractor={(item, index) => item.id ?? index.toString()}
                      renderItem={({ item }) => (
                        <SwipeableReceiptItem orgId={auth.orgId!!} projectId={projectId} item={item} />
                      )}
                    />
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewCenteringContainer: {
    flex: 1,
    alignItems: 'center',
  },
  viewContentContainer: {
    padding: 0,
    flex: 1,
    width: '100%',
    maxWidth: 550,
  },
  itemContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 15,
    elevation: 20, // Adds shadow effect for Android
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    padding: 10,
    height: 100,
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
    position: 'absolute',
    right: 10,
    elevation: 100,
    zIndex: 20,
    top: 10,
    bottom: 0,
    borderRadius: 10,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProjectReceiptsPage;
