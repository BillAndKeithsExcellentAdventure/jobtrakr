import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from '@/src/components/Themed';
import { ActionButton } from '@/src/components/ActionButton';
import * as MediaLibrary from 'expo-media-library';
import { MediaAssetsHelper, resolveMediaLibraryUriForDisplay } from '@/src/utils/mediaAssetsHelper';
import { MediaEntryData, useAddRowCallback } from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useProject } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useRouter } from 'expo-router';
import { useAddImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import { useColors } from '../context/ColorsContext';
import {
  PHOTO_LIMIT_PER_PROJECT_BY_TIER,
  useEffectiveSubscriptionTier,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';

export type AssetsItem = {
  _id: string;
  selected: boolean;
  asset: MediaLibrary.Asset;
  displayUri: string;
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

export const DeviceMediaList = ({
  onClose,
  projectId,
  projectName,
  allProjectMedia,
  playVideo,
  useProjectLocation,
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
  const [deviceMediaAssets, setDeviceMediaAssets] = useState<AssetsItem[]>([]);
  const [hasSelectedDeviceAssets, setHasSelectedDeviceAssets] = useState<boolean>(false);
  const [pagingCursor, setPagingCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const currentProject = useProject(projectId);
  const router = useRouter();
  const addPhotoImage = useAddImageCallback();
  const addPhotoData = useAddRowCallback(projectId, 'mediaEntries');
  const effectiveSubscriptionTier = useEffectiveSubscriptionTier();
  const photoLimitPerProject = PHOTO_LIMIT_PER_PROJECT_BY_TIER[effectiveSubscriptionTier];
  const colors = useColors();
  const onStatusUpdate = useCallback((status: string) => {
    setFetchStatus(status);
  }, []);

  const resolveAssetDisplayUri = useCallback(async (asset: MediaLibrary.Asset): Promise<string> => {
    return resolveMediaLibraryUriForDisplay(asset.uri, asset.id);
  }, []);

  const createSelectionList = useCallback(
    async (assets: MediaLibrary.Asset[], defaultSelected: boolean): Promise<AssetsItem[]> => {
      const resolved = await Promise.all(
        assets.map(async (asset) => ({
          _id: asset.id ?? '',
          selected: defaultSelected,
          asset,
          displayUri: await resolveAssetDisplayUri(asset),
        })),
      );

      return resolved;
    },
    [resolveAssetDisplayUri],
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
            const startedAt = Date.now();
            try {
              console.log('[DeviceMediaList] Starting nearest photo fetch', {
                projectId,
                projectName,
                useProjectLocation,
              });
              setFetchStatus('Starting nearest-photos search...');
              setLoadingNearest(true);
              const lat = currentProject?.latitude;
              const long = currentProject?.longitude;
              if (lat === 0 || long === 0 || lat === undefined || long === undefined) {
                console.warn('[DeviceMediaList] Nearest photo fetch skipped: missing project location', {
                  lat,
                  long,
                });
                setFetchStatus('Project location is not set. Showing all photos instead.');
                setUseProjectLocation(false);
                return;
              }

              const page = await mediaTools.current?.getAssetsNearLocationWithInfo(
                long,
                lat,
                100, // Need to make this configurable
                {
                  pageSize: 100,
                  statusFunction: onStatusUpdate,
                },
              );

              if (page) {
                // Filter out assets that are already in projectAssets
                const filteredAssets = page.assets.filter(
                  (foundAsset) =>
                    !allProjectMedia?.some((projectAsset) => projectAsset.assetId === foundAsset.id),
                );

                const selectionList = await createSelectionList(filteredAssets, true);

                setDeviceMediaAssets(selectionList);
                setPagingCursor(page.endCursor);
                setHasNextPage(page.hasNextPage);

                const filteredStatus = `Set ${filteredAssets.length} assets into assetItems`;
                onStatusUpdate(filteredStatus);

                console.log('[DeviceMediaList] Completed nearest photo fetch', {
                  totalFetched: page.assets.length,
                  totalFiltered: filteredAssets.length,
                  elapsedMs: Date.now() - startedAt,
                });
              } else {
                console.warn('[DeviceMediaList] Nearest photo fetch returned no page', {
                  elapsedMs: Date.now() - startedAt,
                });
              }
            } catch (error) {
              console.error('[DeviceMediaList] Error while finding nearest pictures', error);
              alert('An error while finding pictures.');
            } finally {
              setLoadingNearest(false);
            }
          },
        },
      ],
    );
  }, [
    allProjectMedia,
    createSelectionList,
    currentProject,
    onStatusUpdate,
    projectId,
    projectName,
    setUseProjectLocation,
    useProjectLocation,
  ]);

  const LoadAllPhotos = useCallback(async () => {
    if (!mediaTools.current) return;
    const page = await mediaTools.current.getAssetPageWithInfo({ pageSize: 100 });
    // Filter out assets that are already in projectAssets
    const filteredAssets = page.assets.filter(
      (foundAsset) => !allProjectMedia?.some((projectAsset) => projectAsset.assetId === foundAsset.id),
    );
    const selectionList = await createSelectionList(filteredAssets, false);
    setDeviceMediaAssets(selectionList);
    setPagingCursor(page.endCursor);
    setHasNextPage(page.hasNextPage);

    const filteredStatus = `Set ${filteredAssets.length} assets into assetItems`;
    onStatusUpdate(filteredStatus);
  }, [allProjectMedia, onStatusUpdate, createSelectionList]);

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

  useEffect(() => {
    onLoadPhotosClicked(useProjectLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useProjectLocation]);

  const handleLoadMore = useCallback(async () => {
    if (!mediaTools.current || !hasNextPage) return;
    const page = await mediaTools.current.getAssetPageWithInfo({
      pageSize: 100,
      after: pagingCursor,
    });
    // Filter out assets that are already in projectAssets
    const filteredAssets = page.assets.filter(
      (foundAsset) => !allProjectMedia?.some((projectAsset) => projectAsset.assetId === foundAsset.id),
    );
    const selectionList = await createSelectionList(filteredAssets, false);
    setDeviceMediaAssets((prev) => [...prev, ...selectionList]);
    setPagingCursor(page.endCursor);
    setHasNextPage(page.hasNextPage);

    const filteredStatus = `Added ${filteredAssets.length} assets into assetItems`;
    onStatusUpdate(filteredStatus);
  }, [allProjectMedia, onStatusUpdate, pagingCursor, hasNextPage, createSelectionList]);

  const importDeviceAssetToProject = useCallback(async () => {
    if (deviceMediaAssets) {
      const selectedAssets = deviceMediaAssets.filter((asset) => !hasSelectedDeviceAssets || asset.selected);
      const remainingPhotoCapacity = photoLimitPerProject - allProjectMedia.length;

      if (remainingPhotoCapacity <= 0) {
        Alert.alert(
          'Photo limit reached',
          `Your ${effectiveSubscriptionTier} tier allows up to ${photoLimitPerProject} photos per project.`,
        );
        return;
      }

      if (selectedAssets.length > remainingPhotoCapacity) {
        Alert.alert(
          'Photo limit exceeded',
          `You can add ${remainingPhotoCapacity} more photo(s) on the ${effectiveSubscriptionTier} tier for this project.`,
        );
        return;
      }

      const addedAssetIds: string[] = [];

      for (const asset of selectedAssets) {
        // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
        const imageAddResult = await addPhotoImage(asset.asset.uri, projectId, 'photo', 'photo');
        if (imageAddResult.status === 'Success') {
          let tn;
          if (imageAddResult.uri) {
            tn = await createThumbnail(imageAddResult?.uri);
          }
          if (asset.asset.mediaType === 'photo' || asset.asset.mediaType === 'video') {
            const newPhoto: MediaEntryData = {
              id: '',
              assetId: asset.asset.id,
              deviceName: 'Device Name', // TODO: Get the device name
              mediaType: asset.asset.mediaType,
              imageId: imageAddResult.id,
              thumbnail: tn ?? '',
              creationDate: Date.now(),
              isPublic: false,
              caption: '', // Default empty caption, can be edited later in the image viewing screen.
            };

            addPhotoData(newPhoto);
            addedAssetIds.push(asset.asset.id);
          }
        }
      }

      // Remove successfully added assets from the device media list
      setDeviceMediaAssets((prevAssets) =>
        prevAssets.filter((asset) => !addedAssetIds.includes(asset.asset.id)),
      );
    }
  }, [
    deviceMediaAssets,
    hasSelectedDeviceAssets,
    photoLimitPerProject,
    allProjectMedia.length,
    effectiveSubscriptionTier,
    projectId,
    addPhotoImage,
    addPhotoData,
  ]);

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
        prevAssets?.map((item) => ({ ...item, selected: false }) as AssetsItem),
      );
    } else {
      setDeviceMediaAssets((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: true })));
    }
  }, [hasSelectedDeviceAssets]);

  const handleClosePress = useCallback(() => {
    const selectedCount = deviceMediaAssets.filter((asset) => asset.selected).length;
    console.log('[DeviceMediaList] Close pressed', {
      loadingNearest,
      hasSelectedDeviceAssets,
      selectedCount,
      totalAssets: deviceMediaAssets.length,
      hasNextPage,
      pagingCursor,
    });

    try {
      onClose();
      console.log('[DeviceMediaList] onClose callback completed');
    } catch (error) {
      console.error('[DeviceMediaList] onClose callback threw an error', error);
    }
  }, [deviceMediaAssets, hasSelectedDeviceAssets, hasNextPage, loadingNearest, onClose, pagingCursor]);

  const handleImageLongPress = useCallback(
    (uri: string, type: 'video' | 'photo', photoDate: string) => {
      if (type === 'video') {
        playVideo(uri);
      } else if (type === 'photo') {
        const dateString = photoDate ?? 'No Date Info Available';
        router.push({
          pathname: '/[projectId]/photos/showImage',
          params: {
            uri,
            projectId,
            projectName,
            photoDate: dateString,
          },
        });
      }
    },
    [playVideo, router, projectId, projectName],
  );

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
            <View style={{ borderRadius: 8 }}>
              <Image source={{ uri: item.displayUri }} style={styles.thumbnail} />
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
        {!useProjectLocation && hasNextPage && (
          <ActionButton title="Load More" onPress={handleLoadMore} type="action" />
        )}
      </View>
    ),
    [useProjectLocation, handleLoadMore, hasNextPage],
  );

  return (
    <View style={styles.listColumn}>
      <Text style={styles.listTitle}>Photos</Text>
      {loadingNearest ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...{fetchStatus}</Text>
          <ActivityIndicator size="large" color={colors.tint} style={styles.loadingIndicator} />
          <View style={styles.loadingActions}>
            <ActionButton title="Close" onPress={handleClosePress} type="action" />
          </View>
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

          <FlashList data={deviceMediaAssets} ListFooterComponent={renderFooter} renderItem={renderItem} />

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
                <ActionButton title="Close" onPress={handleClosePress} type="action" />
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
    borderRadius: 8,
    borderWidth: 3,
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
  loadingActions: {
    width: '100%',
    marginTop: 16,
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
    borderRadius: 8,
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
    borderRadius: 8,
    padding: 10,
  },
});
