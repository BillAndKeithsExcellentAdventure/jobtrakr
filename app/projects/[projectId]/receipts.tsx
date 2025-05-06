import { ActionButton } from '@/components/ActionButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useColors } from '@/context/ColorsContext';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';
import { FlashList } from '@shopify/flash-list';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

import { ReceiptSummary } from '@/components/ReceiptSummary';
import {
  ReceiptData,
  useAddRowCallback,
  useAllRows,
  useDeleteRowCallback,
  useIsStoreAvailableCallback,
  useSeedWorkItemsIfNecessary,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAddImageCallback } from '@/utils/images';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createThumbnail } from '@/utils/thumbnailUtils';

function isReceiptEntry(actionContext: any): actionContext is { PictureUri: string } {
  return actionContext && typeof actionContext.PictureUri === 'string';
}

interface SwipeableItemProps {
  orgId: string;
  projectId: string;
  item: ReceiptData;
  onDelete: (id: string) => void;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ orgId, projectId, item, onDelete }) => {
  const router = useRouter();
  const translateX = useSharedValue(0); // Shared value for horizontal translation

  const [isSwiped, setIsSwiped] = useState(false); // Track if item is swiped for delete

  const onShowPicture = useCallback(
    (uri: string) => {
      // in this component we want any presses to the receipt details page not show the image
      router.push(`/projects/${projectId}/receipt/${item.id}`);
    },
    [projectId, item.id],
  );

  const onShowDetails = useCallback(
    (item: ReceiptData) => {
      router.push(`/projects/${projectId}/receipt/${item.id}`);
    },
    [projectId, item.id],
  );

  // Gesture handler for the swipe action
  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    translateX.value = event.nativeEvent.translationX; // Update translation during gesture
  };

  // Handler for gesture state change (when the swipe ends)
  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === 5) {
      // Gesture end
      if (event.nativeEvent.translationX < -150) {
        // Trigger delete when swiped beyond threshold
        setIsSwiped(true);
        translateX.value = withSpring(-100); // Animate to the delete position
      } else {
        // Reset position if swipe isn't enough
        translateX.value = withSpring(0);
        setIsSwiped(false);
      }
    }
  };

  // Use animated style to apply the translateX value to the component's transform
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Handle delete confirmation
  const handleDelete = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [{ text: 'Cancel' }, { text: 'Delete', onPress: () => onDelete(item.id!) }],
      { cancelable: true },
    );
  };

  const colorScheme = useColorScheme();
  const colors = useColors();

  const boxShadow = Platform.OS === 'web' ? colors.boxShadow : undefined;

  return (
    <View
      style={[
        styles.itemContainer,
        { backgroundColor: colors.itemBackground },
        { backgroundColor: colors.itemBackground, shadowColor: colors.shadowColor, boxShadow },
      ]}
    >
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]} // Used to allow vertical scrolling to not be blocked when checking for horizontal swiping
      >
        <Animated.View
          style={[animatedStyle, { width: '100%' }]} // Apply animated style here
        >
          <ReceiptSummary
            orgId={orgId}
            projectId={projectId}
            item={item}
            onShowPicture={onShowPicture}
            onShowDetails={onShowDetails}
          />
        </Animated.View>
      </PanGestureHandler>
      {isSwiped && (
        <TouchableWithoutFeedback onPress={handleDelete}>
          <View style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

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
  }, [projectId]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);
  useSeedWorkItemsIfNecessary(projectId);

  const auth = useAuth();
  const allReceipts = useAllRows(projectId, 'receipts');
  const addReceiptImage = useAddImageCallback();
  const addReceipt = useAddRowCallback(projectId, 'receipts');
  const deleteReceipt = useDeleteRowCallback(projectId, 'receipts');

  const handleRemoveReceipt = useCallback(
    async (id: string | undefined) => {
      if (id !== undefined) {
        const strId = id;
        const response = await deleteReceipt(strId);
        //  if (response.status === 'Success') removeReceiptData(strId);
      }
    },
    [deleteReceipt],
  );

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
  }, [projectId, addReceiptImage, addReceipt]);

  const handleAddReceipt = useCallback(() => {
    router.push(`/projects/${projectId}/receipt/add/?projectName=${projectName}`);
  }, [projectId, projectName]);

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
                  marginHorizontal: 10,
                  marginTop: 10,
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
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
              {allReceipts.length === 0 ? (
                <View style={{ alignItems: 'center', margin: 40 }}>
                  <Text txtSize="xl" text="No receipts found." />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <View style={{ flex: 1, width: '100%', backgroundColor: colors.listBackground }}>
                    <FlashList
                      estimatedItemSize={150}
                      data={allReceipts}
                      keyExtractor={(item, index) => item.id ?? index.toString()}
                      renderItem={({ item }) => (
                        <SwipeableItem
                          orgId={auth.orgId!!}
                          projectId={projectId}
                          item={item}
                          onDelete={handleRemoveReceipt}
                        />
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
