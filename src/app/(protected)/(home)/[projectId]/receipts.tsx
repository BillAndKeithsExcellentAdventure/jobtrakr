import { ActionButton } from '@/src/components/ActionButton';
import SwipeableReceiptItem from '@/src/components/SwipeableReceiptItem';
import { Text, View } from '@/src/components/Themed';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { useAllRows as useAllRowsConfiguration } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  ClassifiedReceiptData,
  ReceiptData,
  RecentReceiptDateCompare,
  useAddRowCallback,
  useAllRows,
  useCostUpdater,
  useIsStoreAvailableCallback,
  useSeedWorkItemsIfNecessary,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAddImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import { useAuth } from '@clerk/clerk-expo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';
import { KeyboardAvoidingView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProjectReceiptsPage = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    receiptId: string;
    projectName: string;
  }>();
  const listRef = useRef<any>(null);
  const previousReceiptCount = useRef(0);
  const [projectIsReady, setProjectIsReady] = useState(false);
  const [vendorFilter, setVendorFilter] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();
  const auth = useAuth();

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);
  useSeedWorkItemsIfNecessary(projectId);

  const allReceipts = useAllRows(projectId, 'receipts', RecentReceiptDateCompare);
  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  const addReceiptImage = useAddImageCallback();
  const addReceipt = useAddRowCallback(projectId, 'receipts');
  const allWorkItems = useAllRowsConfiguration('workItems');

  useCostUpdater(projectId);

  // return ClassifiedReceiptData array using allReceipts where fullyClassified is true if
  // all cost items for this receipt have a valid work item id
  const classifiedReceipts: ClassifiedReceiptData[] = useMemo(() => {
    const receipts = allReceipts.map((receipt) => {
      // get all cost items for this receipt
      const receiptCostItems = allCostItems.filter((item) => item.parentId === receipt.id);
      // check if all cost items have a valid work item id
      const fullyClassified =
        receiptCostItems.length > 0 &&
        receiptCostItems.every(
          (item) =>
            item.workItemId &&
            item.workItemId.length > 0 &&
            allWorkItems.find((wi) => wi.id === item.workItemId) !== undefined,
        );

      return {
        ...receipt,
        fullyClassified,
      };
    });

    // Filter by vendor if filter text exists
    if (vendorFilter.trim()) {
      return receipts.filter((receipt) => receipt.vendor.toLowerCase().includes(vendorFilter.toLowerCase()));
    }

    return receipts;
  }, [allReceipts, allCostItems, allWorkItems, vendorFilter]);

  const colors = useColors();

  const processReceiptImage = useCallback(
    async (assetUri: string) => {
      try {
        // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
        const imageAddResult = await addReceiptImage(assetUri, projectId, 'photo', 'receipt');
        if (imageAddResult.status !== 'Success') {
          Alert.alert('Error', `Unable to add receipt image: ${JSON.stringify(imageAddResult)}`);
          return;
        }

        console.log('Finished adding Receipt Image.', imageAddResult.id);
        const thumbnail = await createThumbnail(assetUri);

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

        //console.log('Adding a new Receipt.', newReceipt);

        const response = addReceipt(newReceipt);
        if (response?.status === 'Success') {
          newReceipt.id = response.id;
          console.log('Project receipt successfully added:', newReceipt.imageId);
        } else {
          Alert.alert(
            'Error',
            `Unable to insert Project receipt: ${JSON.stringify(newReceipt.imageId)} - ${JSON.stringify(
              response,
            )}`,
          );
        }
      } finally {
        setIsProcessingImage(false);
      }
    },
    [projectId, addReceiptImage, addReceipt],
  );

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
      setIsProcessingImage(true);

      // Use requestAnimationFrame to ensure React renders the ActivityIndicator before starting heavy operations
      requestAnimationFrame(() => processReceiptImage(asset.uri));
    }
  }, [processReceiptImage]);

  const handleAddReceipt = useCallback(() => {
    router.push({
      pathname: '/[projectId]/receipt/add',
      params: {
        projectId,
        projectName,
      },
    });
  }, [projectId, projectName, router]);

  // Scroll to top when new receipts are added
  useEffect(() => {
    if (classifiedReceipts.length > previousReceiptCount.current && previousReceiptCount.current > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
    previousReceiptCount.current = classifiedReceipts.length;
  }, [classifiedReceipts.length]);

  return (
    <>
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
                      type="action"
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
                <View
                  style={{
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text txtSize="title" style={{ marginVertical: 5 }}>
                    Project Receipts
                  </Text>
                </View>

                {isProcessingImage && (
                  <View style={{ padding: 10, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.text} />
                    <Text
                      text="Processing receipt image, this should only take a moment..."
                      style={{ marginTop: 10 }}
                    />
                  </View>
                )}

                <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={100}>
                  <View style={{ backgroundColor: colors.listBackground, padding: 5 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderRadius: 8,
                        borderColor: colors.border,
                        paddingLeft: 10,
                        paddingRight: 5,
                        justifyContent: 'space-between',
                      }}
                    >
                      <TextInput
                        style={[
                          styles.filterInput,
                          {
                            backgroundColor: colors.background,
                            color: colors.text,
                          },
                        ]}
                        placeholder="Filter by vendor..."
                        placeholderTextColor={colors.textPlaceholder}
                        value={vendorFilter}
                        onChangeText={setVendorFilter}
                      />
                      <Pressable onPress={() => setVendorFilter('')}>
                        <MaterialIcons name="clear" size={24} color={colors.iconColor} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={{ flex: 1, paddingHorizontal: 5 }}>
                    <View
                      style={{
                        flex: 1,
                        width: '100%',
                      }}
                    >
                      <FlatList
                        ref={listRef}
                        data={classifiedReceipts}
                        keyExtractor={(item, index) => item.id ?? index.toString()}
                        renderItem={({ item }) => (
                          <SwipeableReceiptItem orgId={auth.orgId!} projectId={projectId} item={item} />
                        )}
                        ListEmptyComponent={
                          <View style={{ alignItems: 'center', margin: 20 }}>
                            <Text txtSize="title" text="No receipts found." />
                          </View>
                        }
                      />
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
      <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />
    </>
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
  filterInput: {
    height: 40,
    fontSize: 16,
  },
});

export default ProjectReceiptsPage;
