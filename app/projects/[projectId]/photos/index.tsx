import { ProjectCameraView } from '@/app/(modals)/CameraView';
import { ActionButton } from '@/components/ActionButton';
import { ActionButtonProps } from '@/components/ButtonBar';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { Switch } from '@/components/Switch';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { Colors } from '@/constants/Colors';
import { useProjectValue } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import { useAddImageCallback } from '@/utils/images';
import { ShareFiles } from '@/utils/sharing';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as MediaLibrary from 'expo-media-library';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsStoreAvailableCallback } from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useActiveProjectIds } from '@/context/ActiveProjectIdsContext';

export type PhotoCapturedCallback = (asset: MediaLibrary.Asset) => void;

type AssetsItem = {
  _id: string;
  selected: boolean;
  asset: MediaLibrary.Asset;
};

let gAssetItems: AssetsItem[] = [];
let gProjectAssetItems: AssetsItem[] = [];

const ProjectPhotosPage = () => {
  /*
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const [projectAssets, setProjectAssets] = useState<AssetsItem[] | undefined>(undefined);
  const [assetItems, setAssetItems] = useState<AssetsItem[] | undefined>(undefined);
  const mediaTools = useRef<MediaAssets | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  const [useProjectLocation, setUseProjectLocation] = useState<boolean>(false);
  const [showAssetItems, setShowAssetItems] = useState<boolean>(false);
  const [loadingNearest, setLoadingNearest] = useState<boolean>(false);
  const colorScheme = useColorScheme();
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [hasSelectedAssets, setHasSelectedAssets] = useState<boolean>(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [, setThumbnail] = useProjectValue(projectId, 'thumbnail');
  const addPhotoImage = useAddImageCallback();

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

  useEffect(() => {
    const checkPermissions = async () => {
      console.info('Checking media permissions');
      if (permissionResponse) {
        console.info(`Permission status: ${permissionResponse.status}`);
        if (permissionResponse.status !== 'granted') {
          console.info('Requesting media permissions...');
          await requestPermission();
          console.info('Media permissions requested');
        }
      }
    };

    checkPermissions();
  }, [permissionResponse]);

  useEffect(() => {
    async function loadMediaAssetsObj() {
      if (mediaTools.current === null) {
        mediaTools.current = new MediaAssets();
        console.log('   instantiated MediaAssets object');
      }
    }

    loadMediaAssetsObj();
  }, []);

  useEffect(() => {
    async function loadMedia(projectId: string) {
      setProjectAssets(undefined);
      gProjectAssetItems.length = 0;

      const result = await jobDbHost?.GetPictureBucketDB().FetchProjectAssets(projectId);
      console.log(
        `Fetched ${result?.assets?.length}:${
          result?.assets?.at(0)?.asset?.creationTime
        } assets for project ${projectName}`,
      );
      console.log('   result:', result);
      if (result?.status === 'Success' && result && result.assets && result.assets.length > 0) {
        gProjectAssetItems = result.assets.map((asset) => ({
          _id: asset._id!,
          selected: false,
          asset: asset.asset!,
        }));
        setProjectAssets(gProjectAssetItems);
      }
    }

    loadMedia(projectId);
  }, [projectId, jobDbHost]);

  const OnStatusUpdate = useCallback(
    (status: string) => {
      setFetchStatus(status);
    },
    [setFetchStatus],
  );

  const LoadPhotosNearestToProject = useCallback(async () => {
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
              const location = await jobDbHost?.GetProjectDB().FetchProjectLocation(projectId);
              if (location) {
                setShowAssetItems(true); // Show the panel when assets are loaded
                const foundAssets: MediaLibrary.Asset[] | undefined =
                  await mediaTools.current?.getAllAssetsNearLocation(
                    location.longitude,
                    location.latitude,
                    100, // Need to make this configurable
                    OnStatusUpdate,
                  );

                if (foundAssets) {
                  // Filter out assets that are already in projectAssets
                  const filteredAssets = foundAssets.filter(
                    (foundAsset) => !projectAssets?.some((projectAsset) => projectAsset.asset.id === foundAsset.id),
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
                  OnStatusUpdate(filteredStatus);
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
  }, [projectAssets]);

  const LoadAllPhotos = useCallback(async () => {
    setShowAssetItems(true); // Show the panel when assets are loaded

    const foundAssets: MediaLibrary.Asset[] | undefined = await mediaTools.current?.getFirstAssetPage(100);
    console.log('Found x assets:', foundAssets?.length);

    if (foundAssets) {
      // Filter out assets that are already in projectAssets
      const filteredAssets = foundAssets.filter(
        (foundAsset) => !projectAssets?.some((projectAsset) => projectAsset.asset.id === foundAsset.id),
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
      OnStatusUpdate(filteredStatus);
    }
  }, [projectAssets, assetItems]);

  const createPictureBucketDataArray = (assets: AssetsItem[]) => {
    return assets
      .filter((asset) => asset.selected)
      .map((asset) => ({
        _id: asset._id,
        asset: asset.asset,
      }));
  };

  const OnShareProjectPhotosClicked = useCallback(async () => {
    if (projectAssets) {
      const assets = createPictureBucketDataArray(projectAssets);
      try {
        const paths = assets.map((asset) => asset.asset.uri);
        await ShareFiles(paths);
      } catch (error) {
        await logError(`Error creating/sharing file: ${error}`);
      }
    }
  }, [projectAssets]);

  const OnSetThumbnailClicked = useCallback(async () => {
    if (projectAssets) {
      const asset = projectAssets.find((asset) => asset.selected);
      if (asset) {
        const tn = await mediaTools.current?.createThumbnail(asset.asset.uri, projectName, 100, 100);

        if (tn) {
          setThumbnail(tn);
        }
      }
    }
  }, [projectAssets]);

  const OnLoadPhotosClicked = useCallback(
    async (useNewProjectLocation: boolean) => {
      if (useNewProjectLocation) {
        await LoadPhotosNearestToProject();
      } else {
        await LoadAllPhotos();
      }
    },
    [LoadPhotosNearestToProject, LoadAllPhotos],
  );

  const LoadMore = useCallback(async () => {
    const foundAssets: MediaLibrary.Asset[] | undefined = await mediaTools.current?.getNextAssetPage();

    if (foundAssets) {
      // Filter out assets that are already in projectAssets
      const filteredAssets = foundAssets.filter(
        (foundAsset) => !projectAssets?.some((projectAsset) => projectAsset._id === foundAsset.id),
      );

      const selectionList: AssetsItem[] = filteredAssets.map((asset) => ({
        _id: asset.id ?? '',
        selected: false,
        asset: asset,
      }));

      gAssetItems = gAssetItems.concat(selectionList);
      setAssetItems(gAssetItems);
      const filteredStatus = `Added ${filteredAssets.length} assets into assetItems`;
      OnStatusUpdate(filteredStatus);
    }
  }, [assetItems]);

  const OnAddToProjectClicked = useCallback(async () => {
    if (assetItems) {
      for (const asset of assetItems) {
        if (!hasSelectedAssets || asset.selected) {
          console.log('Adding a new Photo.', asset.asset.uri);
          // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
          const imageAddResult = await addPhotoImage(asset.asset.uri, projectId, 'photo');
          console.log('Finished adding Photo.', imageAddResult);

          const status = await jobDbHost?.GetPictureBucketDB().InsertPicture(projectId, asset.asset);
          if (status?.status === 'Success') {
            gProjectAssetItems = gProjectAssetItems?.concat({ _id: status.id, selected: false, asset: asset.asset });
            setProjectAssets(gProjectAssetItems);
          }
        }
      }

      setShowAssetItems(false); // Hide the panel after adding
      assetItems.length = 0; // Clear the assets
    }
  }, [assetItems, projectId, jobDbHost, hasSelectedAssets]);

  const OnRemoveFromProjectClicked = useCallback(async () => {
    Alert.alert('Remove Photos', 'Are you sure you want to remove these photos from this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: async () => {
          if (projectAssets) {
            for (const asset of projectAssets) {
              if (asset.selected) {
                await jobDbHost?.GetPictureBucketDB().RemovePicture(asset._id);
                gProjectAssetItems = gProjectAssetItems?.filter((item) => item._id !== asset._id);
                setProjectAssets(gProjectAssetItems);
              }
            }

            setShowAssetItems(false); // Hide the panel after adding
          }
        },
      },
    ]);
  }, [projectAssets, projectId, jobDbHost]);

  const handleClose = useCallback(() => {
    setShowAssetItems(false);
    gAssetItems.length = 0;
    setAssetItems(gAssetItems);
  }, []);

  const handleAssetSelection = useCallback(async (assetId: string) => {
    setAssetItems((prevAssets) =>
      prevAssets?.map((item) => (item.asset.id === assetId ? { ...item, selected: !item.selected } : item)),
    );
  }, []);

  const handleProjectAssetSelection = useCallback(async (assetId: string) => {
    setProjectAssets((prevAssets) =>
      prevAssets?.map((item) => (item.asset.id === assetId ? { ...item, selected: !item.selected } : item)),
    );
  }, []);

  useEffect(() => {
    if (assetItems) {
      setHasSelectedAssets(assetItems.some((item) => item.selected));
    } else {
      setHasSelectedAssets(false);
    }
  }, [assetItems]);

  const [numSelectedProjectAssets, setNumSelectedProjectAssets] = useState<number>(0);

  useEffect(() => {
    if (projectAssets) {
      const num = projectAssets?.filter((item) => item.selected === true).length;
      setNumSelectedProjectAssets(num ? num : 0);
    } else {
      setNumSelectedProjectAssets(0);
    }
  }, [projectAssets]);

  const getAddButtonTitle = useCallback(() => {
    if (!assetItems) return 'Add All';
    const hasSelectedAssets = assetItems.some((item) => item.selected);
    return hasSelectedAssets ? 'Add Selected' : 'Add All';
  }, [assetItems]);

  const renderFooter = () => {
    return (
      <View style={styles.footer}>
        {!useProjectLocation && <Button title="Load More" onPress={LoadMore}></Button>}
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

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <Entypo name="plus" size={28} color={colors.iconColor} />,
        label: 'Add Photos',
        onPress: () => {
          handleMenuItemPress('AddPhotos');
        },
      },
    ],
    [colors],
  );

  const handleMenuItemPress = useCallback(
    (item: string) => {
      if (item === 'AddPhotos') {
        setUseProjectLocation(false);
        OnLoadPhotosClicked(false);
      }
      setHeaderMenuModalVisible(false);
    },
    [useProjectLocation, OnLoadPhotosClicked],
  );

  const playVideo = (videoUri: string) => {
    setSelectedVideo(videoUri);
    setIsVideoPlayerVisible(true);
  };

  const handleImagePress = useCallback(
    (uri: string, type: MediaLibrary.MediaTypeValue, photoDate?: string) => {
      if (type === 'video') {
        playVideo(uri);
      } else if (type === 'photo') {
        console.log(`photoDate=${photoDate}`);
        const dateString = photoDate ?? 'No Date Info Available';
        router.push(`/projects/${projectId}/photos/showImage/?uri=${uri}&projectName=${projectName}&photoDate=${dateString}`);
      }
    },
    [],
  );

  const onSwitchValueChanged = useCallback(() => {
    const newValue = !useProjectLocation;
    setUseProjectLocation(newValue);
    OnLoadPhotosClicked(newValue);
  }, [useProjectLocation, OnLoadPhotosClicked]);

  const onProjectAllOrClearChanged = useCallback(async () => {
    if (numSelectedProjectAssets > 0) {
      setProjectAssets((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: false } as AssetsItem)));
    } else {
      setProjectAssets((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: true })));
    }
  }, [projectAssets, setProjectAssets]);

  const handlePhotoCaptured: PhotoCapturedCallback = async (asset) => {
    if (asset) {
      const status = await jobDbHost?.GetPictureBucketDB().InsertPicture(projectId, asset);
      if (status?.status === 'Success') {
        console.log();
        gProjectAssetItems = gProjectAssetItems?.concat({ _id: status.id, selected: false, asset: asset });
        setProjectAssets(gProjectAssetItems);
      }
    }
  };

  const onCameraClosed = useCallback(async () => {
    setIsCameraVisible(false);
  }, [isCameraVisible]);

  const OnTakePictureClicked = useCallback(async () => {
    setIsCameraVisible(true);
  }, [isCameraVisible]);

  const onAssetAllOrClearChanged = useCallback(async () => {
    if (hasSelectedAssets) {
      setAssetItems((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: false } as AssetsItem)));
    } else {
      setAssetItems((prevAssets) => prevAssets?.map((item) => ({ ...item, selected: true })));
    }
  }, [assetItems, hasSelectedAssets]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: projectName,
          headerRight: () => (
            <Pressable
              onPress={() => {
                setHeaderMenuModalVisible(!headerMenuModalVisible);
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
      {!projectIsReady ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <View style={styles.headerInfo}>
            {!showAssetItems && (
              <ActionButton
                style={{ alignSelf: 'stretch', marginTop: 5 }}
                type={'action'}
                title={'Take Picture / Video'}
                onPress={OnTakePictureClicked}
              />
            )}
            {showAssetItems && (
              <View
                style={{
                  marginTop: 5,
                  marginBottom: 5,
                  alignSelf: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                }}
              >
                <Text text="Filter:" txtSize="standard" style={{ marginRight: 10 }} />
                <Text text="All" txtSize="standard" style={{ marginRight: 10 }} />
                <Switch value={useProjectLocation} onValueChange={onSwitchValueChanged} size="large" />
                <Text text="Near Project" txtSize="standard" style={{ marginLeft: 10 }} />
              </View>
            )}
          </View>
          <View style={styles.listsContainer}>
            <View style={styles.listColumn}>
              <View style={{ alignItems: 'center' }}>
                <Text txtSize="title" style={styles.listTitle}>
                  Project Photos
                </Text>
                <Text txtSize="sub-title" style={{ marginLeft: 10 }}>
                  {`Project contains ${projectAssets ? projectAssets?.length : 0} pictures.`}
                </Text>
              </View>
              {!projectAssets ? (
                <View style={{ alignItems: 'center' }}>
                  <Text>Use menu button to add photos.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.selectRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Pressable
                        onPress={() => {
                          onProjectAllOrClearChanged();
                        }}
                      >
                        {({ pressed }) => (
                          <Ionicons
                            name={numSelectedProjectAssets > 0 ? 'ellipse-sharp' : 'ellipse-outline'}
                            size={24}
                            color={colors.iconColor}
                            style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                          />
                        )}
                      </Pressable>
                      <Text>
                        {!showAssetItems ? (numSelectedProjectAssets > 0 ? 'Clear Selection' : 'Select All') : ''}
                      </Text>
                    </View>
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      {numSelectedProjectAssets > 0 && (
                        <Text style={{ alignSelf: 'center' }}>
                          {projectAssets?.filter((asset) => asset.selected).length} selected
                        </Text>
                      )}
                    </View>
                  </View>
                  <FlashList
                    numColumns={showAssetItems ? 1 : 2}
                    data={projectAssets}
                    estimatedItemSize={200}
                    renderItem={({ item }) => {
                      const photoDate = new Date(item.asset.creationTime * 1).toLocaleString();
                      return (
                        <View style={styles.imageContainer}>
                          <TouchableOpacity
                            style={[styles.imageContainer, item.selected && styles.imageSelected]}
                            onPress={() => handleProjectAssetSelection(item.asset.id)}
                            onLongPress={() =>
                              handleImagePress(item.asset.uri, item.asset.mediaType, photoDate)
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
                    }}
                  />
                  <View style={styles.buttonContainer}>
                    {numSelectedProjectAssets > 0 && (
                      <View style={styles.buttonRow}>
                        <View style={styles.buttonWrapper}>
                          <ActionButton title="Remove" onPress={OnRemoveFromProjectClicked} type={'action'} />
                        </View>
                        <View style={styles.buttonWrapper}>
                          <ActionButton title="Share" onPress={OnShareProjectPhotosClicked} type={'action'} />
                        </View>
                        {numSelectedProjectAssets === 1 && (
                          <View style={styles.buttonWrapper}>
                            <ActionButton
                              title="Thumbnail"
                              style={{ paddingHorizontal: 1 }}
                              onPress={OnSetThumbnailClicked}
                              type={'action'}
                            />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>

            {showAssetItems && (
              <>
                <View style={styles.separator} />
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
                        <Pressable
                          onPress={() => {
                            onAssetAllOrClearChanged();
                          }}
                        >
                          {({ pressed }) => (
                            <Ionicons
                              name={hasSelectedAssets ? 'ellipse-sharp' : 'ellipse-outline'}
                              size={24}
                              color={colors.iconColor}
                              style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                            />
                          )}
                        </Pressable>

                        {hasSelectedAssets && (
                          <Text style={{ alignSelf: 'center' }}>
                            {assetItems?.filter((asset) => asset.selected).length} selected
                          </Text>
                        )}
                      </View>
                      <FlashList
                        data={assetItems}
                        estimatedItemSize={200}
                        ListFooterComponent={renderFooter}
                        renderItem={({ item }) => {
                          const photoDate = new Date(item.asset.creationTime * 1).toLocaleString();
                          return (
                            <View style={styles.assetContainer}>
                              <TouchableOpacity
                                style={[styles.imageContainer, item.selected && styles.imageSelected]}
                                onPress={() => handleAssetSelection(item.asset.id)}
                                onLongPress={() =>
                                  handleImagePress(item.asset.uri, item.asset.mediaType, photoDate)
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
                        }}
                      />
                      <View style={styles.buttonContainer}>
                        <View style={styles.buttonRow}>
                          {(useProjectLocation || (!useProjectLocation && hasSelectedAssets)) && (
                            <View style={styles.buttonWrapper}>
                              <ActionButton
                                type={'action'}
                                title={getAddButtonTitle()}
                                onPress={OnAddToProjectClicked}
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
            {headerMenuModalVisible && (
              <RightHeaderMenu
                modalVisible={headerMenuModalVisible}
                setModalVisible={setHeaderMenuModalVisible}
                buttons={rightHeaderMenuButtons}
              />
            )}
          </View>
          {selectedVideo && (
            <VideoPlayerModal
              isVisible={isVideoPlayerVisible}
              videoUri={selectedVideo}
              onClose={() => setIsVideoPlayerVisible(false)}
            />
          )}
          {isCameraVisible && (
            <ProjectCameraView
              visible={isCameraVisible}
              projectName={projectName}
              onMediaCaptured={handlePhotoCaptured}
              onClose={onCameraClosed}
              showPreview={false}
            ></ProjectCameraView>
          )}
        </>
      )}
    </SafeAreaView>
  );
  */
  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={[styles.container]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Project Photos',
        }}
      />
      <View style={styles.headerInfo}>
        <Text>Project Photos Page - Under Construction</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  listsContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
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

export default ProjectPhotosPage;
