import {
  StyleSheet,
  Image,
  Button,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
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

type AssetsItem = {
  selected: boolean;
  asset: MediaLibrary.Asset;
};

let gAssetItems: AssetsItem[] = [];
let gJobAssetItems: AssetsItem[] = [];

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
          selected: false,
          asset: asset,
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
          (foundAsset) => !jobAssets?.some((jobAsset) => jobAsset.id === foundAsset.id),
        );

        const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
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
  }, [jobAssets]);

  const LoadAllPhotos = useCallback(async () => {
    setShowAssetItems(true); // Show the panel when assets are loaded

    console.log(`Loading all photos ${mediaTools.current}`);
    const foundAssets: MediaLibrary.Asset[] | undefined = await mediaTools.current?.getFirstAssetPage(10);
    console.log(`Found ${foundAssets ? foundAssets?.length : 0} pictures`);

    if (foundAssets) {
      // Filter out assets that are already in jobAssets
      const filteredAssets = foundAssets.filter(
        (foundAsset) => !jobAssets?.some((jobAsset) => jobAsset.id === foundAsset.id),
      );

      const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
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

  const OnAddToJobClicked = useCallback(async () => {
    if (assetItems) {
      const hasSelectedAssets = assetItems.some((item) => item.selected);
      for (const asset of assetItems) {
        if (!hasSelectedAssets || asset.selected) {
          await jobDbHost?.GetPictureBucketDB().InsertPicture(jobId, asset.asset);
          gJobAssetItems = gJobAssetItems?.concat({ selected: false, asset: asset.asset });
          setJobAssets(gJobAssetItems);
        }
      }

      setShowAssetItems(false); // Hide the panel after adding
      assetItems.length = 0; // Clear the assets
    }
  }, [assetItems, jobId, jobDbHost]);

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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Job Photos`, headerShown: true }} />
      <View style={styles.headerInfo}>
        <Text>{jobName}</Text>
        <View style={{ marginHorizontal: 10, marginBottom: 20, alignSelf: 'center', flexDirection: 'row' }}>
          <Text text="Filter:" txtSize="standard" style={{ marginRight: 10 }} />
          <Text text="All" txtSize="standard" style={{ marginRight: 10 }} />
          <Switch value={useJobLocation} onValueChange={setUseJobLocation} />
          <Text text="Near Job" txtSize="standard" style={{ marginLeft: 10 }} />
        </View>

        <Button title="Add Photos" onPress={OnLoadPhotosClicked} />
      </View>
      <View style={styles.listsContainer}>
        {/* Left side - Job Assets */}
        <View style={styles.listColumn}>
          <Text style={styles.listTitle}>Job Photos</Text>
          {!jobAssets ? (
            <Text>No photos in job</Text>
          ) : (
            <FlashList
              data={jobAssets}
              estimatedItemSize={200}
              renderItem={(item) => (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.item.asset.uri }} style={styles.thumbnail} />
                  <Text style={styles.dateOverlay}>
                    {new Date(item.item.asset.creationTime * 1).toLocaleString()}
                  </Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Right side - Only show when showAssetItems is true.                      */}
        {showAssetItems && (
          <>
            <View style={styles.separator} />
            <View style={styles.listColumn}>
              <Text style={styles.listTitle}>Photos</Text>
              {!assetItems ? (
                <View style={styles.loadingContainer}>
                  <Text>Loading...{fetchStatus}</Text>
                  <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
                </View>
              ) : (
                <>
                  <FlashList
                    data={assetItems}
                    estimatedItemSize={200}
                    ListFooterComponent={renderFooter}
                    renderItem={({ item }) => (
                      <View style={styles.assetContainer}>
                        <TouchableOpacity
                          style={styles.checkboxContainer}
                          onPress={() => handleAssetSelection(item.asset.id)}
                        >
                          <View style={[styles.checkbox, item.selected && styles.checkboxSelected]}>
                            {item.selected && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                        </TouchableOpacity>
                        <View style={styles.imageContainer}>
                          <Image source={{ uri: item.asset.uri }} style={styles.thumbnail} />
                          <Text style={styles.dateOverlay}>
                            {new Date(item.asset.creationTime * 1).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  />
                  <View style={styles.buttonContainer}>
                    <View style={styles.buttonRow}>
                      <View style={styles.buttonWrapper}>
                        <Button title={getAddButtonTitle()} onPress={OnAddToJobClicked} />
                      </View>
                      <View style={styles.buttonWrapper}>
                        <Button title="Close" onPress={handleClose} />
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </>
        )}
      </View>
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
});

export default JobPhotosPage;
