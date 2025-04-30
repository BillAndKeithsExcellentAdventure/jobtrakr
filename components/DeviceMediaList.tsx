import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { ActionButton } from '@/components/ActionButton';
import * as MediaLibrary from 'expo-media-library';
import { MediaAssetsHelper } from '@/utils/mediaAssetsHelper';
import { MediaEntryData, useAddRowCallback } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useProject } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import { useRouter } from 'expo-router';
import { useAddImageCallback } from '@/utils/images';
import { createThumbnail } from '@/utils/thumbnailUtils';

export type AssetsItem = {
  _id: string;
  selected: boolean;
  asset: MediaLibrary.Asset;
};

interface DeviceMediaListProps {
  onClose: () => void;
  projectId: string;
  projectName: string;
  useProjectLocation: boolean;
  allProjectMedia: MediaEntryData[];
  playVideo: (videoUri: string) => void;
  setUseProjectLocation: (useLocation: boolean) => void;
}

let gAssetItems: AssetsItem[] = [];

export const DeviceMediaList = ({
  onClose,
  projectId,
  projectName,
  useProjectLocation,
  allProjectMedia,
  playVideo,
  setUseProjectLocation,
}: DeviceMediaListProps) => {
  const mediaTools = useRef<MediaAssetsHelper | null>(null);

  useEffect(() => {
    if (mediaTools.current === null) {
      mediaTools.current = new MediaAssetsHelper();
    }
  }, []);

  const [loadingNearest, setLoadingNearest] = useState<boolean>(false);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  const [deviceMediaAssets, setDeviceMediaAssets] = useState<AssetsItem[] | undefined>(undefined);
  const [hasSelectedDeviceAssets, setHasSelectedDeviceAssets] = useState<boolean>(false);
  const currentProject = useProject(projectId);
  const router = useRouter();
  const addPhotoImage = useAddImageCallback();
  const addPhotoData = useAddRowCallback(projectId, 'mediaEntries');

  useEffect(() => {
    onLoadPhotosClicked(useProjectLocation);
  }, [useProjectLocation]);

  const onStatusUpdate = useCallback(
    (status: string) => {
      setFetchStatus(status);
    },
    [setFetchStatus],
  );

  const loadPhotosNearestToProject = useCallback(async () => {
    Alert.alert(
      'Find Pictures Near Project',
      "Press Ok to find pictures near the designated project's location. This may take a few minutes to process.",
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: async () => {
            setUseProjectLocation(false);
          },
        },
        {
          text: 'Ok',
          onPress: async () => {
            try {
              setLoadingNearest(true);
              const lat = currentProject?.latitude;
              const long = currentProject?.longitude;
              if (lat != 0 && long != 0) {
                const foundAssets: MediaLibrary.Asset[] | undefined =
                  await mediaTools.current?.getAllAssetsNearLocation(
                    long!,
                    lat!,
                    100, // Need to make this configurable
                    onStatusUpdate,
                  );

                if (foundAssets) {
                  // Filter out assets that are already in projectAssets
                  const filteredAssets = foundAssets.filter(
                    (foundAsset) =>
                      !allProjectMedia?.some((projectAsset) => projectAsset.assetId === foundAsset.id),
                  );

                  const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
                    _id: asset.id ?? '',
                    selected: true,
                    asset: asset,
                  }));

                  gAssetItems.length = 0;
                  gAssetItems = gAssetItems.concat(selectionList);
                  setDeviceMediaAssets(gAssetItems);

                  const filteredStatus = `Set ${filteredAssets.length} assets into assetItems`;
                  onStatusUpdate(filteredStatus);
                }
              }
              setLoadingNearest(false);
            } catch (err) {
              alert('An error while finding pictures.');
            }
          },
        },
      ],
    );
  }, [allProjectMedia, currentProject]);

  const LoadAllPhotos = useCallback(async () => {
    const foundAssets: MediaLibrary.Asset[] | undefined = await mediaTools.current?.getFirstAssetPage(100);
    console.log(`Found ${foundAssets?.length} assets`);

    if (foundAssets) {
      // Filter out assets that are already in projectAssets
      const filteredAssets = foundAssets.filter(
        (foundAsset) => !allProjectMedia?.some((projectAsset) => projectAsset.assetId === foundAsset.id),
      );

      const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
        _id: asset.id ?? '',
        selected: false,
        asset: asset,
      }));

      gAssetItems.length = 0;
      gAssetItems = gAssetItems.concat(selectionList);
      setDeviceMediaAssets(gAssetItems);

      const filteredStatus = `Set ${filteredAssets.length} assets into assetItems`;
      onStatusUpdate(filteredStatus);
    }
  }, [allProjectMedia, deviceMediaAssets]);

  const onLoadPhotosClicked = useCallback(
    async (useNewProjectLocation: boolean) => {
      if (useNewProjectLocation) {
        await loadPhotosNearestToProject();
      } else {
        await LoadAllPhotos();
      }
    },
    [loadPhotosNearestToProject, LoadAllPhotos],
  );

  const handleLoadDevicePhotos = useCallback(
    async (useNewProjectLocation: boolean) => {
      if (useNewProjectLocation) {
        await loadPhotosNearestToProject();
      } else {
        await LoadAllPhotos();
      }
    },
    [loadPhotosNearestToProject, LoadAllPhotos],
  );

  const handleLoadMore = useCallback(async () => {
    const foundAssets: MediaLibrary.Asset[] | undefined = await mediaTools.current?.getNextAssetPage();

    if (foundAssets) {
      // Filter out assets that are already in projectAssets
      const filteredAssets = foundAssets.filter(
        (foundAsset) => !allProjectMedia?.some((projectAsset) => projectAsset.assetId === foundAsset.id),
      );

      const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
        _id: asset.id ?? '',
        selected: false,
        asset: asset,
      }));

      gAssetItems = gAssetItems.concat(selectionList);
      setDeviceMediaAssets(gAssetItems);
      const filteredStatus = `Added ${filteredAssets.length} assets into assetItems`;
      onStatusUpdate(filteredStatus);
    }
  }, [allProjectMedia, deviceMediaAssets]);

  const importDeviceAssetToProject = useCallback(async () => {
    if (deviceMediaAssets) {
      for (const asset of deviceMediaAssets) {
        if (!hasSelectedDeviceAssets || asset.selected) {
          console.log('Adding a new Photo.', asset.asset.uri);
          // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
          const imageAddResult = await addPhotoImage(asset.asset.uri, projectId, 'photo');
          console.log('Finished adding Photo.', imageAddResult);
          if (imageAddResult.status === 'Success') {
            let tn = '';
            if (imageAddResult.uri) {
              let tn = await createThumbnail(imageAddResult?.uri, projectName);
            }
            if (asset.asset.mediaType === 'photo' || asset.asset.mediaType === 'video') {
              const newPhoto: MediaEntryData = {
                id: '',
                assetId: imageAddResult.id ?? '',
                deviceName: 'Device Name', // TODO: Get the device name
                mediaType: asset.asset.mediaType,
                mediaUri: imageAddResult.uri ?? '',
                thumbnail: tn,
                creationDate: Date.now(),
              };

              const status = addPhotoData(newPhoto);
            }
          }
        }
      }

      handleDeviceMediaClose();
    }
  }, [deviceMediaAssets, projectId, hasSelectedDeviceAssets]);

  const handleDeviceMediaClose = useCallback(() => {
    gAssetItems.length = 0;
    setDeviceMediaAssets(gAssetItems);
    onClose();
  }, []);

  const handleDeviceAssetSelection = useCallback(async (assetId: string) => {
    setDeviceMediaAssets((prevAssets) =>
      prevAssets?.map((item) => (item.asset.id === assetId ? { ...item, selected: !item.selected } : item)),
    );
  }, []);

  useEffect(() => {
    if (deviceMediaAssets) {
      setHasSelectedDeviceAssets(deviceMediaAssets.some((item) => item.selected));
    } else {
      setHasSelectedDeviceAssets(false);
    }
  }, [deviceMediaAssets]);

  const getAddButtonTitle = useCallback(() => {
    if (!deviceMediaAssets) return 'Add All';
    const hasSelectedAssets = deviceMediaAssets.some((item) => item.selected);
    return hasSelectedAssets ? 'Add Selected' : 'Add All';
  }, [deviceMediaAssets]);

  const handleSelectClearAllDeviceAssets = useCallback(async () => {
    if (hasSelectedDeviceAssets) {
      setDeviceMediaAssets((prevAssets) =>
        prevAssets?.map((item) => ({ ...item, selected: false } as AssetsItem)),
      );
    } else {
      setDeviceMediaAssets((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: true })));
    }
  }, [deviceMediaAssets, hasSelectedDeviceAssets]);

  const handleImageLongPress = useCallback((uri: string, type: 'video' | 'photo', photoDate: string) => {
    if (type === 'video') {
      playVideo(uri);
    } else if (type === 'photo') {
      console.log(`photoDate=${photoDate}`);
      const dateString = photoDate ?? 'No Date Info Available';
      router.push(
        `/projects/${projectId}/photos/showImage/?uri=${uri}&projectName=${encodeURIComponent(
          projectName,
        )}&photoDate=${dateString}`,
      );
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AssetsItem }) => {
      const photoDate = new Date(item.asset.creationTime * 1).toLocaleString();
      return (
        <View style={styles.assetContainer}>
          <TouchableOpacity
            style={[styles.imageContainer, item.selected && styles.imageSelected]}
            onPress={() => handleDeviceAssetSelection(item.asset.id)}
            onLongPress={() =>
              handleImageLongPress(item.asset.uri, item.asset.mediaType as 'photo' | 'video', photoDate)
            }
          >
            <View>
              <Image source={{ uri: item.asset.uri }} style={styles.thumbnail} />
              <Text style={styles.dateOverlay}>{photoDate}</Text>
              {item.asset.mediaType === 'video' && (
                <View style={styles.playButtonOverlay}>
                  <Ionicons name="play" size={30} color="white" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [handleDeviceAssetSelection, handleImageLongPress],
  );

  const renderFooter = useCallback(
    () => (
      <View style={styles.footer}>
        {!useProjectLocation && <ActionButton title="Load More" onPress={handleLoadMore} type="action" />}
      </View>
    ),
    [useProjectLocation, handleLoadMore],
  );

  return (
    <View style={styles.listColumn}>
      <Text style={styles.listTitle}>Photos</Text>
      {loadingNearest ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...{fetchStatus}</Text>
          <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
        </View>
      ) : (
        <>
          <View style={styles.selectRow}>
            <TouchableOpacity onPress={handleSelectClearAllDeviceAssets}>
              <Ionicons
                name={hasSelectedDeviceAssets ? 'ellipse-sharp' : 'ellipse-outline'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
            {hasSelectedDeviceAssets && (
              <Text>{deviceMediaAssets?.filter((asset) => asset.selected).length} selected</Text>
            )}
          </View>

          <FlashList
            data={deviceMediaAssets}
            estimatedItemSize={200}
            ListFooterComponent={renderFooter}
            renderItem={renderItem}
          />

          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              {(useProjectLocation || (!useProjectLocation && hasSelectedDeviceAssets)) && (
                <View style={styles.buttonWrapper}>
                  <ActionButton
                    type="action"
                    title={getAddButtonTitle()}
                    onPress={importDeviceAssetToProject}
                  />
                </View>
              )}
              <View style={styles.buttonWrapper}>
                <ActionButton title="Close" onPress={onClose} type="action" />
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listTitle: {
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
  selectRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonWrapper: {
    flex: 1,
  },
  assetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  imageSelected: {
    borderColor: '#007AFF',
  },
  listColumn: {
    flex: 1,
    padding: 10,
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
    borderWidth: 3,
    borderColor: 'transparent',
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
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 10,
  },
});
