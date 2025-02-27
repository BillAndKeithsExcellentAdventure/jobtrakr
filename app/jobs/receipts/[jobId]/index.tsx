import AddReceiptModalScreen from '@/app/(modals)/AddReceipt';
import { ActionButton } from '@/components/ActionButton';
import { ModalImageViewer } from '@/components/ModalImageViewer';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { useReceiptDataStore } from '@/stores/receiptDataStore';
import { formatCurrency } from '@/utils/formatters';
import { FlashList } from '@shopify/flash-list';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ReceiptBucketData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet } from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function isReceiptEntry(actionContext: any): actionContext is { PictureUri: string } {
  return actionContext && typeof actionContext.PictureUri === 'string';
}

interface SwipeableItemProps {
  item: ReceiptBucketData;
  onDelete: (id: string) => void;
  onShowPicture: (uri: string) => void;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ item, onDelete, onShowPicture }) => {
  const translateX = useSharedValue(0); // Shared value for horizontal translation

  const [isSwiped, setIsSwiped] = useState(false); // Track if item is swiped for delete

  const onShowDetails = useCallback((item: ReceiptBucketData) => {
    router.push(`/jobs/receipts/[jobId]/details/${item._id}`);
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
        translateX.value = withSpring(-200); // Animate to the delete position
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

  if (Platform.OS === 'android') {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.imageContentContainer}>
          {item.PictureUri ? (
            <Pressable onPress={() => onShowPicture(item.PictureUri!)}>
              <Image source={{ uri: item.PictureUri }} style={{ height: 80, width: 120 }} />
            </Pressable>
          ) : (
            <Text txtSize="sub-title">No Image</Text>
          )}
        </View>
        <View style={[styles.detailsContentContainer, !!!item.Amount && { alignItems: 'center' }]}>
          <Pressable onPress={() => onShowDetails(item)}>
            {item.Amount ? (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text>Amount: {formatCurrency(item.Amount)}</Text>
                <Text>Vendor: {item.Vendor}</Text>
                <Text>Description: {item.Description}</Text>
                {item.Notes && <Text>Notes: {item.Notes}</Text>}
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text txtSize="sub-title">No details</Text>
              </View>
            )}
          </Pressable>
        </View>
        {isSwiped && (
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={[-10, 10]} // Used to allow vertical scrolling to not be blocked when checking for horizontal swiping
    >
      <Animated.View
        style={[animatedStyle]} // Apply animated style here
      >
        <View style={styles.itemContainer}>
          <View style={styles.imageContentContainer}>
            {item.PictureUri ? (
              <Pressable onPress={() => onShowPicture(item.PictureUri!)}>
                <Image source={{ uri: item.PictureUri }} style={{ height: 80, width: 120 }} />
              </Pressable>
            ) : (
              <Text txtSize="sub-title">No Image</Text>
            )}
          </View>
          <View style={[styles.detailsContentContainer, !!!item.Amount && { alignItems: 'center' }]}>
            <Pressable onPress={() => onShowDetails(item)}>
              {item.Amount ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text>Amount: {formatCurrency(item.Amount)}</Text>
                  <Text>Vendor: {item.Vendor}</Text>
                  <Text>Description: {item.Description}</Text>
                  {item.Notes && <Text>Notes: {item.Notes}</Text>}
                </View>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text txtSize="sub-title">No details</Text>
                </View>
              )}
            </Pressable>
          </View>
          {isSwiped && (
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const JobReceiptsPage = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const { jobDbHost } = useJobDb();
  const { receiptData, removeReceiptData, setReceiptData } = useReceiptDataStore();

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

  const handleAddReceipt = useCallback(() => {
    setIsAddModalVisible(true);
  }, []);

  const hideAddModal = useCallback(
    (success: boolean): void => {
      setIsAddModalVisible(false);
      if (success) fetchReceipts();
    },
    [fetchReceipts],
  );

  const showPicture = useCallback((uri: string) => {
    setSelectedImage(uri);
    setIsImageViewerVisible(true);
  }, []);

  const addPicture = useCallback((_id: string | undefined) => {
    // TODO
  }, []);

  const handleRemoveReceipt = useCallback(
    async (id: string | undefined) => {
      if (id !== undefined) {
        const strId = id.toString(); // Keith is returning number not string
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
          }
        : {
            deleteColor: Colors.dark.angry500,
            iconColor: Colors.light.iconColor,
            separatorColor: Colors.light.separatorColor,
          },
    [colorScheme],
  );

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <Stack.Screen options={{ title: `${jobName}`, headerShown: true }} />
      <View style={styles.viewCenteringContainer}>
        <View style={styles.viewContentContainer}>
          <View style={{ marginHorizontal: 10, marginBottom: 20 }}>
            <ActionButton onPress={handleAddReceipt} type={'action'} title="Add Receipt" />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text text="Job Receipts" txtSize="title" />
          </View>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, width: '100%' }}>
              {receiptData.length === 0 ? (
                <View style={{ alignItems: 'center' }}>
                  <Text>No receipts found.</Text>
                </View>
              ) : (
                <FlashList
                  estimatedItemSize={150}
                  data={receiptData}
                  keyExtractor={(item, index) => item._id ?? index.toString()}
                  renderItem={({ item }) => (
                    <SwipeableItem item={item} onDelete={handleRemoveReceipt} onShowPicture={showPicture} />
                  )}
                />
              )}
            </View>
          </GestureHandlerRootView>
          <>
            {isAddModalVisible && (
              <AddReceiptModalScreen jobId={jobId} visible={isAddModalVisible} hideModal={hideAddModal} />
            )}
            {selectedImage && !isAddModalVisible && (
              <ModalImageViewer
                isVisible={isImageViewerVisible}
                imageUri={selectedImage}
                onClose={() => setIsImageViewerVisible(false)}
              />
            )}
          </>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewCenteringContainer: {
    flex: 1,
  },
  viewContentContainer: {
    padding: 0,
    flex: 1,
    maxWidth: 550,
  },
  imageContentContainer: {
    marginRight: 10,
    width: 120,
    maxHeight: 110,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContentContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  itemContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 15,
    elevation: 4, // Adds shadow effect for Android
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
    width: 100,
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 10,
    bottom: 0,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
});

export default JobReceiptsPage;
