import {
  StyleSheet,
  Image,
  Button,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { JobCategoryEntry } from '@/models/jobCategoryEntry';
import { Text, View } from '@/components/Themed';
import * as MediaLibrary from 'expo-media-library';
import { MediaAssets } from 'jobmedia';
import { useJobDb } from '@/context/DatabaseContext';
import { JobData } from 'jobdb';
import * as Location from 'expo-location';
import { FlashList } from '@shopify/flash-list';
import { HorizontalLoadingIndicator } from '@/components/HorizontalActivityIndicator';
import { Switch } from '@/components/Switch';
import { ActionButton } from '@/components/ActionButton';
import * as FileSystem from 'expo-file-system';
import { ShareFile } from '@/utils/sharing';
import { CreateMediaZip } from '@/utils/zip';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ImageViewerModal } from '@/components/ImageViewerModal';

type AssetsItem = {
  _id: string;
  selected: boolean;
  asset: MediaLibrary.Asset;
};

let gAssetItems: AssetsItem[] = [];
let gJobAssetItems: AssetsItem[] = [];

function HomeScreenModalMenu({
  modalVisible,
  setModalVisible,
  onMenuItemPress,
}: {
  modalVisible: boolean;
  setModalVisible: (val: boolean) => void;
  onMenuItemPress: (item: string) => void;
}) {
  const handleMenuItemPress = (item: string): void => {
    console.log(`${item} pressed`);
    setModalVisible(false); // Close the modal after selecting an item
    onMenuItemPress(item);
  };

  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            screenBackground: Colors.dark.background,
            separatorColor: Colors.dark.separatorColor,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
          }
        : {
            screenBackground: Colors.light.background,
            separatorColor: Colors.light.separatorColor,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
          },
    [colorScheme],
  );

  const topMargin = Platform.OS === 'ios' ? 110 : 50;

  return (
    <SafeAreaView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close on back press
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.screenBackground, marginTop: topMargin },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleMenuItemPress('AddPhotos')}
                style={[styles.menuItem, { borderBottomColor: colors.separatorColor }]}
              >
                <Text style={styles.menuText}>Add Photos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const JobPhotosPage = () => {
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const [jobAssets, setJobAssets] = useState<AssetsItem[] | undefined>(undefined);
  const [assetItems, setAssetItems] = useState<AssetsItem[] | undefined>(undefined);
  // const [mediaAssets, setMediaAssets] = useState<MediaAssets | null>(null);
  const mediaTools = useRef<MediaAssets | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  const { jobDbHost } = useJobDb();
  const [useJobLocation, setUseJobLocation] = useState<boolean>(false);
  const [showAssetItems, setShowAssetItems] = useState<boolean>(false);
  const [loadingNearest, setLoadingNearest] = useState<boolean>(false);
  const colorScheme = useColorScheme();
  const [menuModalVisible, setMenuModalVisible] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

  useEffect(() => {
    async function loadMediaAssetsObj() {
      console.log(`Loading MediaAssets object ${mediaTools.current}`);
      if (mediaTools.current === null) {
        mediaTools.current = new MediaAssets();
        console.log('   instaniated MediaAssets object');
      }
    }

    loadMediaAssetsObj();
  }, []);

  useEffect(() => {
    async function loadMedia(jobId: string) {
      const result = await jobDbHost?.GetPictureBucketDB().FetchJobAssets(jobId);
      console.log(`Fetched ${result?.assets?.length} assets for job ${jobName}`);
      if (result?.status === 'Success' && result && result.assets && result.assets.length > 0) {
        gJobAssetItems = result.assets.map((asset) => ({
          _id: asset._id!,
          selected: false,
          asset: asset.asset!,
        }));
        setJobAssets(gJobAssetItems);
      }
    }

    loadMedia(jobId);
  }, [jobId, jobDbHost]);

  useEffect(() => {
    async function getPermissions() {
      console.info('Initializing Media...');
      const response = await MediaLibrary.requestPermissionsAsync(true);
      if (response.status !== 'granted') {
        console.error('Permission to access media library was denied');
        return null;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return null;
      }
    }

    getPermissions();
  }, []);

  const OnStatusUpdate = useCallback(
    (status: string) => {
      setFetchStatus(status);
    },
    [setFetchStatus],
  );

  const LoadPhotosNearestToJob = useCallback(async () => {
    setLoadingNearest(true);
    const location = await jobDbHost?.GetJobDB().FetchJobLocation(jobId);
    if (location) {
      setShowAssetItems(true); // Show the panel when assets are loaded
      console.log(`Current location: ${location.latitude}, ${location.longitude}`);
      const foundAssets: MediaLibrary.Asset[] | undefined =
        await mediaTools.current?.getAllAssetsNearLocation(
          location.longitude,
          location.latitude,
          100, // Need to make this configurable
          OnStatusUpdate,
        );

      console.log(`Found ${foundAssets ? foundAssets?.length : 0} pictures`);

      if (foundAssets) {
        // Filter out assets that are already in jobAssets
        const filteredAssets = foundAssets.filter(
          (foundAsset) => !jobAssets?.some((jobAsset) => jobAsset.asset.id === foundAsset.id),
        );

        const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
          _id: asset.id ?? '',
          selected: true,
          asset: asset,
        }));

        gAssetItems.length = 0;
        gAssetItems = gAssetItems.concat(selectionList);
        setAssetItems(gAssetItems);

        const filteredStatus = `Set ${filteredAssets.length} assets into assetItems`;
        console.log(filteredStatus);
        OnStatusUpdate(filteredStatus);
      }
    }
    setLoadingNearest(false);
  }, [jobAssets]);

  const LoadAllPhotos = useCallback(async () => {
    setShowAssetItems(true); // Show the panel when assets are loaded

    console.log(`Loading all photos ${mediaTools.current}`);
    const foundAssets: MediaLibrary.Asset[] | undefined = await mediaTools.current?.getFirstAssetPage(100);
    console.log(`Found ${foundAssets ? foundAssets?.length : 0} pictures`);

    if (foundAssets) {
      // Filter out assets that are already in jobAssets
      const filteredAssets = foundAssets.filter(
        (foundAsset) => !jobAssets?.some((jobAsset) => jobAsset.asset.id === foundAsset.id),
      );

      const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
        _id: asset.id ?? '',
        selected: false,
        asset: asset,
      }));

      gAssetItems.length = 0;
      gAssetItems = gAssetItems.concat(selectionList);
      setAssetItems(gAssetItems);

      const filteredStatus = `Set ${filteredAssets.length} assets into assetItems`;
      console.log(filteredStatus);
      OnStatusUpdate(filteredStatus);
    }
  }, [jobAssets, assetItems]);

  const createPictureBucketDataArray = (assets: AssetsItem[]) => {
    return assets
      .filter((asset) => asset.selected)
      .map((asset) => ({
        _id: asset._id,
        asset: asset.asset,
      }));
  };

  const OnShareJobPhotosClicked = useCallback(async () => {
    if (jobAssets) {
      console.log(`Sharing ${jobAssets.length} photos`);
      const zipFileName = `job_${jobName}_photos`;
      const zipPath = `${FileSystem.documentDirectory}${zipFileName}.zip`;
      const assets = createPictureBucketDataArray(jobAssets);
      try {
        await CreateMediaZip(assets, zipFileName);
        await ShareFile(zipPath);
      } catch (error) {
        console.error('Error creating/sharing zip file:', error);
      }
    }
  }, [jobAssets]);

  const OnLoadPhotosClicked = useCallback(async () => {
    if (useJobLocation === true) {
      await LoadPhotosNearestToJob();
    } else {
      await LoadAllPhotos();
    }
  }, [useJobLocation]);

  const LoadMore = useCallback(async () => {
    const foundAssets: MediaLibrary.Asset[] | undefined = await mediaTools.current?.getNextAssetPage();

    if (foundAssets) {
      // Filter out assets that are already in jobAssets
      const filteredAssets = foundAssets.filter(
        (foundAsset) => !jobAssets?.some((jobAsset) => jobAsset.id === foundAsset.id),
      );

      const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
        _id: asset.id ?? '',
        selected: false,
        asset: asset,
      }));

      gAssetItems = gAssetItems.concat(selectionList);
      setAssetItems(gAssetItems);
      const filteredStatus = `Added ${filteredAssets.length} assets into assetItems`;
      console.log(filteredStatus);
      OnStatusUpdate(filteredStatus);
    }
  }, [assetItems]);

  const HasSelectedAssets = (): boolean => {
    if (!assetItems) return false;

    const list = assetItems.some((item) => item.selected);

    return list.valueOf();
  };

  const HasSelectedJobAssets = (): boolean => {
    if (!jobAssets) return false;

    const list = jobAssets.some((item) => item.selected);

    return list.valueOf();
  };

  const OnAddToJobClicked = useCallback(async () => {
    if (assetItems) {
      const hasSelectedAssets = HasSelectedAssets();
      for (const asset of assetItems) {
        if (!hasSelectedAssets || asset.selected) {
          const status = await jobDbHost?.GetPictureBucketDB().InsertPicture(jobId, asset.asset);
          if (status?.status === 'Success') {
            gJobAssetItems = gJobAssetItems?.concat({ _id: status.id, selected: false, asset: asset.asset });
            setJobAssets(gJobAssetItems);
          }
        }
      }

      setShowAssetItems(false); // Hide the panel after adding
      assetItems.length = 0; // Clear the assets
    }
  }, [assetItems, jobId, jobDbHost]);

  const OnRemoveFromJobClicked = useCallback(async () => {
    Alert.alert('Remove Photos', 'Are you sure you want to remove these photos from this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: async () => {
          if (jobAssets) {
            for (const asset of jobAssets) {
              if (asset.selected) {
                console.log(`Removing asset ${asset._id}`);
                await jobDbHost?.GetPictureBucketDB().RemovePicture(asset._id);
                gJobAssetItems = gJobAssetItems?.filter((item) => item._id !== asset._id);
                setJobAssets(gJobAssetItems);
              }
            }

            setShowAssetItems(false); // Hide the panel after adding
          }
        },
      },
    ]);
  }, [jobAssets, jobId, jobDbHost]);

  const handleClose = useCallback(() => {
    setShowAssetItems(false);
    gAssetItems.length = 0;
    setAssetItems(gAssetItems);
  }, []);

  const handleAssetSelection = useCallback((assetId: string) => {
    console.log(`Toggling asset ${assetId}`);
    setAssetItems((prevAssets) =>
      prevAssets?.map((item) => (item.asset.id === assetId ? { ...item, selected: !item.selected } : item)),
    );
  }, []);

  const handleJobAssetSelection = useCallback((assetId: string) => {
    console.log(`Toggling job asset ${assetId}`);
    setJobAssets((prevAssets) =>
      prevAssets?.map((item) => (item.asset.id === assetId ? { ...item, selected: !item.selected } : item)),
    );
  }, []);

  const getAddButtonTitle = useCallback(() => {
    if (!assetItems) return 'Add All';
    const hasSelectedAssets = assetItems.some((item) => item.selected);
    return hasSelectedAssets ? 'Add Selected' : 'Add All';
  }, [assetItems]);

  const renderFooter = () => {
    return (
      <View style={styles.footer}>
        {!useJobLocation && <Button title="Load More" onPress={LoadMore}></Button>}
      </View>
    );
  };

  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            screenBackground: Colors.dark.background,
            listBackground: Colors.dark.listBackground,
            itemBackground: Colors.dark.itemBackground,
            iconColor: Colors.dark.iconColor,
            shadowColor: Colors.dark.shadowColor,
            bottomSheetBackground: Colors.dark.bottomSheetBackground,
            text: Colors.dark.text,
          }
        : {
            screenBackground: Colors.light.background,
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            iconColor: Colors.light.iconColor,
            shadowColor: Colors.light.shadowColor,
            bottomSheetBackground: Colors.light.bottomSheetBackground,
            text: Colors.light.text,
          },
    [colorScheme],
  );

  const handleMenuItemPress = useCallback((item: string) => {
    if (item === 'AddPhotos') OnLoadPhotosClicked();
  }, []);

  const handleImagePress = useCallback((uri: string) => {
    setSelectedImage(uri);
    setIsImageViewerVisible(true);
  }, []);

  const onSwitchValueChanged = useCallback(() => {
    setUseJobLocation(!useJobLocation);
    OnLoadPhotosClicked();
  }, [setUseJobLocation, useJobLocation]);

  const onJobAllOrClearChanged = useCallback(() => {
    if (HasSelectedJobAssets()) {
      console.log('Clearing all job assets');
      setJobAssets((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: false } as AssetsItem)));
    } else {
      console.log('Selecting all job pictures');
      setJobAssets((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: true })));
    }
  }, [jobAssets, setJobAssets]);

  const onAssetAllOrClearChanged = useCallback(() => {
    if (HasSelectedAssets()) {
      console.log('Clearing all assets');
      setAssetItems((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: false } as AssetsItem)));
    } else {
      console.log('Selecting all pictures');
      setAssetItems((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: true })));
    }
  }, [assetItems, setAssetItems]);

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' ? (
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => (
              <ScreenHeader
                title="Job Photos"
                headerLeft={() => (
                  <Pressable
                    onPress={() => {
                      router.back();
                    }}
                  >
                    {({ pressed }) => (
                      <Ionicons
                        name="chevron-back"
                        size={24}
                        color={colors.iconColor}
                        style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                      />
                    )}
                  </Pressable>
                )}
                headerRight={() => (
                  <Pressable
                    onPress={() => {
                      setMenuModalVisible(!menuModalVisible);
                    }}
                  >
                    {({ pressed }) => (
                      <Ionicons
                        name="menu-outline"
                        size={24}
                        color={colors.iconColor}
                        style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                      />
                    )}
                  </Pressable>
                )}
              />
            ),
          }}
        />
      ) : (
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Jobs',
            headerRight: () => (
              <Pressable
                onPress={() => {
                  setMenuModalVisible(!menuModalVisible);
                }}
              >
                {({ pressed }) => (
                  <Ionicons
                    name="menu-outline"
                    size={24}
                    color={colors.iconColor}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            ),
          }}
        />
      )}

      <View style={styles.headerInfo}>
        <Text>{jobName}</Text>
        <View
          style={{
            marginHorizontal: 10,
            marginBottom: 20,
            alignSelf: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          }}
        >
          {showAssetItems && (
            <>
              <Text text="Filter:" txtSize="standard" style={{ marginRight: 10 }} />
              <Text text="All" txtSize="standard" style={{ marginRight: 10 }} />
              <Switch value={useJobLocation} onValueChange={onSwitchValueChanged} size="large" />
              <Text text="Near Job" txtSize="standard" style={{ marginLeft: 10 }} />
            </>
          )}
        </View>

        <Text txtSize="standard" style={{ marginLeft: 10 }}>
          {' '}
          {`Job contains ${jobAssets?.length} pictures.`}{' '}
        </Text>
      </View>
      <View style={styles.listsContainer}>
        {/* Left side - Job Assets */}
        <View style={styles.listColumn}>
          <Text style={styles.listTitle}>Job Photos</Text>
          {HasSelectedJobAssets() && (
            <Text style={{ alignSelf: 'center' }}>
              {jobAssets?.filter((asset) => asset.selected).length} selected
            </Text>
          )}
          {!jobAssets ? (
            <Text>No photos in job</Text>
          ) : (
            <>
              {' '}
              <Pressable
                onPress={() => {
                  onJobAllOrClearChanged();
                }}
              >
                {({ pressed }) => (
                  <Ionicons
                    name={HasSelectedJobAssets() ? 'checkbox' : 'checkbox-outline'}
                    size={24}
                    color={colors.iconColor}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
              <FlashList
                numColumns={showAssetItems ? 1 : 2}
                data={jobAssets}
                estimatedItemSize={200}
                renderItem={({ item }) => (
                  <View style={styles.imageContainer}>
                    <TouchableOpacity
                      style={[styles.imageContainer, item.selected && styles.imageSelected]}
                      onPress={() => handleJobAssetSelection(item.asset.id)}
                      onLongPress={() => handleImagePress(item.asset.uri)}
                    >
                      <View>
                        <Image source={{ uri: item.asset.uri }} style={styles.thumbnail} />
                        <Text style={styles.dateOverlay}>
                          {new Date(item.asset.creationTime * 1).toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              />
              <View style={styles.buttonContainer}>
                {HasSelectedJobAssets() && (
                  <View style={styles.buttonRow}>
                    <View style={styles.buttonWrapper}>
                      <ActionButton title="Remove" onPress={OnRemoveFromJobClicked} type={'action'} />
                    </View>
                    <View style={styles.buttonWrapper}>
                      <ActionButton title="Share Photos" onPress={OnShareJobPhotosClicked} type={'action'} />
                    </View>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Right side - Only show when showAssetItems is true.                      */}
        {showAssetItems && (
          <>
            <View style={styles.separator} />
            <View style={styles.listColumn}>
              <Text style={styles.listTitle}>Photos</Text>
              {HasSelectedAssets() && (
                <Text style={{ alignSelf: 'center' }}>
                  {assetItems?.filter((asset) => asset.selected).length} selected
                </Text>
              )}
              {loadingNearest ? (
                <View style={styles.loadingContainer}>
                  <Text>Loading...{fetchStatus}</Text>
                  <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      onAssetAllOrClearChanged();
                    }}
                  >
                    {({ pressed }) => (
                      <Ionicons
                        name={HasSelectedAssets() ? 'checkbox' : 'checkbox-outline'}
                        size={24}
                        color={colors.iconColor}
                        style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                      />
                    )}
                  </Pressable>
                  <FlashList
                    data={assetItems}
                    estimatedItemSize={200}
                    ListFooterComponent={renderFooter}
                    renderItem={({ item }) => (
                      <View style={styles.assetContainer}>
                        <TouchableOpacity
                          style={[styles.imageContainer, item.selected && styles.imageSelected]}
                          onPress={() => handleAssetSelection(item.asset.id)}
                          onLongPress={() => handleImagePress(item.asset.uri)}
                        >
                          <View>
                            <Image source={{ uri: item.asset.uri }} style={styles.thumbnail} />
                            <Text style={styles.dateOverlay}>
                              {new Date(item.asset.creationTime * 1).toLocaleString()}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  <View style={styles.buttonContainer}>
                    <View style={styles.buttonRow}>
                      {(useJobLocation || (!useJobLocation && HasSelectedAssets())) && (
                        <View style={styles.buttonWrapper}>
                          <ActionButton
                            type={'action'}
                            title={getAddButtonTitle()}
                            onPress={OnAddToJobClicked}
                          />
                        </View>
                      )}
                      <View style={styles.buttonWrapper}>
                        <ActionButton title="Close" onPress={handleClose} type={'action'} />
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </>
        )}
        <HomeScreenModalMenu
          modalVisible={menuModalVisible}
          setModalVisible={setMenuModalVisible}
          onMenuItemPress={handleMenuItemPress}
        />
      </View>
      {selectedImage && (
        <ImageViewerModal
          isVisible={isImageViewerVisible}
          imageUri={selectedImage}
          onClose={() => setIsImageViewerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    padding: 10,
    alignItems: 'center',
  },
  listsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
  },
  listColumn: {
    flex: 1,
    padding: 10,
  },
  separator: {
    width: 1,
    backgroundColor: '#ccc',
    marginHorizontal: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  thumbnail: {
    flex: 1,
    height: 200,
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonWrapper: {
    flex: 1, // This makes both buttons take up equal space
  },
  assetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxContainer: {
    marginRight: 10,
    borderWidth: 2,
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
  },
  imageSelected: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  footer: {
    padding: 10,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    flex: 1,
    marginBottom: 10,
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: 5,
    borderRadius: 4,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  modalContent: {
    marginRight: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    width: 150,
    elevation: 5, // To give the modal a slight shadow
  },
  menuItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 16,
  },
});

export default JobPhotosPage;
