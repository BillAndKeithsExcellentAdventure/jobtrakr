import { ActionButton } from '@/components/ActionButton';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { useReceiptDataStore } from '@/stores/receiptDataStore';
import { FlashList } from '@shopify/flash-list';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { ReceiptBucketData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';

import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReceiptSummary } from '@/components/ReceiptSummary';
import { useWorkCategoryDataStore } from '@/stores/categoryDataStore';
import { useAuth } from '@clerk/clerk-expo';
import { randomUUID } from 'expo-crypto';
import { useAddImageCallback } from '@/utils/images';

function isReceiptEntry(actionContext: any): actionContext is { PictureUri: string } {
  return actionContext && typeof actionContext.PictureUri === 'string';
}

interface SwipeableItemProps {
  item: ReceiptBucketData;
  onDelete: (id: string) => void;
  onShowPicture: (uri: string) => void;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ item, onDelete, onShowPicture }) => {
  const router = useRouter();
  const translateX = useSharedValue(0); // Shared value for horizontal translation

  const [isSwiped, setIsSwiped] = useState(false); // Track if item is swiped for delete

  const onShowDetails = useCallback((item: ReceiptBucketData) => {
    router.push(`/jobs/${item.JobId}/receipt/${item._id}`);
  }, []);

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
      [{ text: 'Cancel' }, { text: 'Delete', onPress: () => onDelete(item._id!) }],
      { cancelable: true },
    );
  };

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            deleteColor: Colors.dark.angry500,
            separatorColor: Colors.dark.separatorColor,
            listBackground: Colors.dark.listBackground,
            itemBackground: Colors.dark.itemBackground,
            shadowColor: Colors.dark.shadowColor,
            boxShadow: Colors.dark.boxShadow,
            borderColor: Colors.dark.borderColor,
          }
        : {
            deleteColor: Colors.dark.angry500,
            iconColor: Colors.light.iconColor,
            separatorColor: Colors.light.separatorColor,
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            shadowColor: Colors.light.shadowColor,
            boxShadow: Colors.light.boxShadow,
            borderColor: Colors.light.borderColor,
          },
    [colorScheme],
  );

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
          <ReceiptSummary item={item} onShowPicture={onShowPicture} onShowDetails={onShowDetails} />
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

const JobReceiptsPage = () => {
  const router = useRouter();
  const { jobId, receiptId, jobName } = useLocalSearchParams<{
    jobId: string;
    receiptId: string;
    jobName: string;
  }>();
  const { jobDbHost } = useJobDb();
  const { allJobReceipts, addReceiptData, removeReceiptData, setReceiptData } = useReceiptDataStore();
  const { allWorkCategories: allJobCategories, setWorkCategories: setJobCategories } =
    useWorkCategoryDataStore();
  const auth = useAuth();
  const addReceiptImage = useAddImageCallback();

  const fetchReceipts = useCallback(async () => {
    try {
      const response = await jobDbHost?.GetReceiptBucketDB().FetchJobReceipts(jobId);

      if (!response) return;

      if (response.status === 'Success' && response.data) {
        setReceiptData(response.data);
      }
    } catch (err) {
      alert('An error occurred while fetching the receipts');
      console.log('An error occurred while fetching the receipts', err);
    }
  }, [jobId, jobDbHost, setReceiptData]);

  // Fetch receipts for the given job and user
  useEffect(() => {
    fetchReceipts();
  }, []);

  // Fetch receipts for the given job and user
  /*
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await jobDbHost?.GetCategoryDB().FetchAllCategories();

        if (!response) return;

        if (response.status === 'Success' && response.data) {
          setReceiptData(response.data);
        }
      } catch (err) {
        alert('An error occurred while fetching the receipts');
        console.log('An error occurred while fetching the receipts', err);
      }
    };

    fetchReceipts();
  }, [jobId, jobDbHost, setJobCategories]);
  */

  const showPicture = useCallback((uri: string) => {
    router.push(`/jobs/${jobId}/receipt/${receiptId}/showImage/?uri=${uri}`);
  }, []);

  const handleRemoveReceipt = useCallback(
    async (id: string | undefined) => {
      if (id !== undefined) {
        const strId = id;
        const response = await jobDbHost?.GetReceiptBucketDB().DeleteReceipt(strId);
        if (response === 'Success') removeReceiptData(strId);
      }
    },
    [removeReceiptData],
  );

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            deleteColor: Colors.dark.angry500,
            iconColor: Colors.dark.iconColor,
            separatorColor: Colors.dark.separatorColor,
            listBackground: Colors.dark.listBackground,
            shadowColor: Colors.dark.shadowColor,
            boxShadow: Colors.dark.boxShadow,
            borderColor: Colors.dark.borderColor,
            screenBackground: Colors.dark.background,
          }
        : {
            deleteColor: Colors.dark.angry500,
            iconColor: Colors.light.iconColor,
            separatorColor: Colors.light.separatorColor,
            listBackground: Colors.light.listBackground,
            shadowColor: Colors.light.shadowColor,
            boxShadow: Colors.light.boxShadow,
            borderColor: Colors.light.borderColor,
            screenBackground: Colors.light.background,
          },
    [colorScheme],
  );

  const handleAddPhotoReceipt = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const cameraResponse = await ImagePicker.launchCameraAsync();

    if (!cameraResponse.canceled) {
      const asset = cameraResponse.assets[0];
      if (!cameraResponse.assets || cameraResponse.assets.length === 0 || !asset) return;

      const newReceipt: ReceiptBucketData = {
        PictureUri: asset.uri,
        AssetId: asset.assetId ?? undefined,
      };

      console.log('Adding a new Receipt.', newReceipt);
      // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
      const imageAddResult = await addReceiptImage(asset.uri, jobId, 'receipt');
      console.log('Finished adding Receipt.', imageAddResult);

      const response = await jobDbHost?.GetReceiptBucketDB().InsertReceipt(jobId, newReceipt);
      if (response?.status === 'Success') {
        newReceipt._id = response.id;
        newReceipt.JobId = jobId;
        addReceiptData(newReceipt);
        console.log('Job receipt successfully added:', newReceipt);
      } else {
        alert(`Unable to inset Job receipt: ${JSON.stringify(newReceipt)}`);
      }
    }
  }, []);

  const handleAddReceipt = useCallback(() => {
    router.push(`/jobs/${jobId}/receipt/add/?jobName=${jobName}`);
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <Stack.Screen options={{ title: `${jobName}`, headerShown: true }} />
      <View style={styles.viewCenteringContainer}>
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
          {allJobReceipts.length === 0 ? (
            <View style={{ alignItems: 'center', margin: 40 }}>
              <Text txtSize="xl" text="No receipts found." />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, width: '100%', backgroundColor: colors.listBackground }}>
                <FlashList
                  estimatedItemSize={150}
                  data={allJobReceipts}
                  keyExtractor={(item, index) => item._id ?? index.toString()}
                  renderItem={({ item }) => (
                    <SwipeableItem item={item} onDelete={handleRemoveReceipt} onShowPicture={showPicture} />
                  )}
                />
              </View>
            </View>
          )}
        </View>
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

export default JobReceiptsPage;
